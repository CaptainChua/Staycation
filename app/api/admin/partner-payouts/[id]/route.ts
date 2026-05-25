import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { upload_file } from "@/backend/utils/cloudinary";
import { logAudit } from "@/backend/utils/auditLog";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-payouts/[id] — detail incl. line items
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const payout = await pool.query(
      `SELECT
         p.id::text, p.partner_id::text,
         pi.partner_fullname, pa.partner_email,
         p.cycle_start::text, p.cycle_end::text,
         p.scheduled_date::text, p.paid_at,
         p.gross_amount, p.commission_amount, p.processing_fee,
         p.deductions_total, p.deductions, p.net_amount,
         p.payment_method, p.payment_destination, p.reference_number,
         p.proof_of_payment_url, p.status, p.notes, p.reviewer_notes,
         p.created_at, p.updated_at
       FROM partner_payouts p
       LEFT JOIN partners_account pa ON pa.id = p.partner_id
       LEFT JOIN partners_information pi ON pi.partner_id = p.partner_id
       WHERE p.id = $1`,
      [id]
    );
    if (payout.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    const items = await pool.query(
      `SELECT id::text, booking_id, haven_name, guest_name,
              check_in_date::text, check_out_date::text, nights,
              gross, cleaning_fee, platform_share, partner_share,
              processing_fee, commission_type, notes
       FROM partner_payout_items
       WHERE payout_id = $1
       ORDER BY check_in_date ASC NULLS LAST`,
      [id]
    );
    return NextResponse.json({
      success: true,
      data: { ...payout.rows[0], items: items.rows },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    console.error("[admin/partner-payouts/[id] GET]", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/partner-payouts/[id]
// Body: { action: 'mark_processing' | 'mark_paid' | 'mark_failed' | 'cancel',
//         proof_data_url?, reference_number?, reviewer_notes?, scheduled_date? }
// Used by admin to advance the payout through its state machine + attach proof.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const action = String(body.action || "").toLowerCase();

    const NEXT_STATUS: Record<string, string> = {
      mark_processing: "processing",
      mark_paid: "paid",
      mark_failed: "failed",
      cancel: "cancelled",
    };
    const nextStatus = NEXT_STATUS[action];
    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: "action must be one of: mark_processing, mark_paid, mark_failed, cancel" },
        { status: 400 }
      );
    }

    let proofUrl: string | null = null;
    if (body.proof_data_url) {
      try {
        const uploaded = await upload_file(
          body.proof_data_url,
          `staycation-haven/payout-proofs/${id}`
        );
        proofUrl = uploaded.url;
      } catch (uploadErr) {
        console.error("[partner-payouts PATCH] proof upload failed:", uploadErr);
        return NextResponse.json(
          { success: false, error: "Could not upload proof image" },
          { status: 500 }
        );
      }
    }

    // Marking paid requires a proof_of_payment OR an existing one
    if (nextStatus === "paid") {
      const existing = await pool.query<{ proof_of_payment_url: string | null }>(
        `SELECT proof_of_payment_url FROM partner_payouts WHERE id = $1`,
        [id]
      );
      if (!proofUrl && !existing.rows[0]?.proof_of_payment_url) {
        return NextResponse.json(
          { success: false, error: "Upload proof of payment before marking as paid." },
          { status: 400 }
        );
      }
    }

    const updated = await pool.query(
      `UPDATE partner_payouts
         SET status = $1,
             paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END,
             proof_of_payment_url = COALESCE($2, proof_of_payment_url),
             reference_number = COALESCE($3, reference_number),
             reviewer_notes = COALESCE($4, reviewer_notes),
             scheduled_date = COALESCE($5::date, scheduled_date),
             updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        nextStatus,
        proofUrl,
        body.reference_number ?? null,
        body.reviewer_notes ?? null,
        body.scheduled_date ?? null,
        id,
      ]
    );

    if (updated.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    // Bump the partner's running total_paid when marking paid
    if (nextStatus === "paid") {
      await pool.query(
        `UPDATE partners_information
            SET total_paid = COALESCE(total_paid, 0) + $1,
                updated_at = NOW()
          WHERE partner_id = (SELECT partner_id FROM partner_payouts WHERE id = $2)`,
        [Number(updated.rows[0].net_amount) || 0, id]
      );
    }

    await logAudit({
      action: `payout.${action}`,
      entity_type: "payout",
      entity_id: id,
      actor_type: "admin",
      actor_email: guard.session.user.email || null,
      metadata: {
        to_status: nextStatus,
        net_amount: Number(updated.rows[0].net_amount) || 0,
        reference_number: body.reference_number || undefined,
        partner_id: updated.rows[0].partner_id,
      },
    });

    return NextResponse.json({ success: true, data: updated.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    console.error("[admin/partner-payouts/[id] PATCH]", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
