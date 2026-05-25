import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { upload_file } from "@/backend/utils/cloudinary";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-payouts
//   ?status=pending|processing|paid|failed|cancelled|all
//   ?partner_id=<uuid>
// Returns enriched payout rows with partner context and line items.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "all").toLowerCase();
    const partnerId = url.searchParams.get("partner_id");

    const params: (string | number)[] = [];
    const where: string[] = [];

    if (status !== "all") {
      params.push(status);
      where.push(`p.status = $${params.length}`);
    }
    if (partnerId) {
      params.push(partnerId);
      where.push(`p.partner_id = $${params.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
         p.id::text,
         p.partner_id::text,
         pi.partner_fullname,
         pa.partner_email,
         p.cycle_start::text, p.cycle_end::text,
         p.scheduled_date::text, p.paid_at,
         p.gross_amount, p.commission_amount, p.processing_fee,
         p.deductions_total, p.deductions,
         p.net_amount,
         p.payment_method, p.payment_destination,
         p.reference_number, p.proof_of_payment_url,
         p.status, p.notes, p.reviewer_notes,
         p.created_at, p.updated_at,
         (
           SELECT COUNT(*)::int FROM partner_payout_items WHERE payout_id = p.id
         ) AS item_count
       FROM partner_payouts p
       LEFT JOIN partners_account pa ON pa.id = p.partner_id
       LEFT JOIN partners_information pi ON pi.partner_id = p.partner_id
       ${whereClause}
       ORDER BY
         CASE p.status
           WHEN 'pending' THEN 1
           WHEN 'processing' THEN 2
           WHEN 'paid' THEN 3
           ELSE 4
         END,
         p.created_at DESC
       LIMIT 200`,
      params
    );

    const counts = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM partner_payouts GROUP BY status`
    );
    const countMap: Record<string, number> = {};
    counts.rows.forEach((r: { status: string; count: number }) => {
      countMap[r.status] = r.count;
    });

    return NextResponse.json({ success: true, data: result.rows, counts: countMap });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [], counts: {} });
    }
    const msg = err instanceof Error ? err.message : "Failed to load payouts";
    console.error("[admin/partner-payouts GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/partner-payouts
//
// Standalone direct-payment record. NOT derived from bookings. Just logs that
// the owner sent `amount` to the partner on `payment_date` via the given
// method/destination, with optional reference + receipt image.
//
// Body: {
//   partner_id, amount, payment_date (YYYY-MM-DD),
//   payment_method?, payment_destination?, reference_number?,
//   proof_data_url?, notes?
// }
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const client = await pool.connect();
  try {
    const body = await req.json();
    const partnerId: string = body.partner_id;
    const amountRaw = body.amount;
    const amount = typeof amountRaw === "number" ? amountRaw : parseFloat(String(amountRaw));
    const paymentDate: string =
      body.payment_date && String(body.payment_date).trim()
        ? body.payment_date
        : new Date().toISOString().slice(0, 10);
    const paymentMethod: string | null = body.payment_method || null;
    const paymentDestination: string | null = body.payment_destination || null;
    const referenceNumber: string | null = body.reference_number || null;
    const proofDataUrl: string | null = body.proof_data_url || null;
    const notes: string | null = body.notes || null;

    if (!partnerId) {
      return NextResponse.json(
        { success: false, error: "partner_id is required" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    // Find the reviewer/admin id from the session email
    const reviewerLookup = await client.query<{ id: string }>(
      `SELECT id FROM employees WHERE email = $1 LIMIT 1`,
      [guard.session.user.email]
    );
    const reviewerId = reviewerLookup.rows[0]?.id || null;

    // Optional: upload the primary receipt to Cloudinary.
    let proofUrl: string | null = null;
    if (proofDataUrl && proofDataUrl.startsWith("data:")) {
      try {
        const uploaded = await upload_file(proofDataUrl, `payout-evidence/${partnerId}`);
        proofUrl = uploaded.url;
      } catch (cloudErr) {
        console.warn(
          "[admin/partner-payouts POST] proof upload failed:",
          cloudErr instanceof Error ? cloudErr.message : cloudErr
        );
      }
    }

    // Insert as a standalone, paid payment. The legacy schema requires cycle_*
    // / gross_amount / commission_amount NOT NULL — we satisfy those with the
    // payment date and a flat amount=net. No bookings touched, no line items.
    const payout = await client.query(
      `INSERT INTO partner_payouts
         (partner_id, cycle_start, cycle_end, scheduled_date, paid_at,
          gross_amount, commission_amount, processing_fee,
          deductions_total, deductions, net_amount,
          payment_method, payment_destination, reference_number,
          proof_of_payment_url, status, notes, created_by)
       VALUES ($1, $2, $2, $2, NOW(),
               $3, 0, 0,
               0, '[]'::jsonb, $3,
               $4, $5, $6,
               $7, 'paid', $8, $9)
       RETURNING id::text, partner_id::text, cycle_start::text, cycle_end::text,
                 scheduled_date::text, paid_at,
                 gross_amount, commission_amount, processing_fee, deductions_total,
                 deductions, net_amount, payment_method, payment_destination,
                 reference_number, proof_of_payment_url, status, notes, created_at`,
      [
        partnerId,
        paymentDate,
        round2(amount),
        paymentMethod,
        paymentDestination,
        referenceNumber,
        proofUrl,
        notes,
        reviewerId,
      ]
    );

    return NextResponse.json({
      success: true,
      data: { ...payout.rows[0], item_count: 0 },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record payout";
    console.error("[admin/partner-payouts POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;
