import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { logAudit } from "@/backend/utils/auditLog";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// PATCH /api/admin/partner-approvals/[id]
// Body: { action: 'approve' | 'reject' | 'suspend' | 'reactivate', reason? }
//
// Status transitions:
//   pending|rejected → 'active'     (approve)
//   pending|active   → 'rejected'   (reject — reason required)
//   active           → 'suspended'  (suspend — reason required)
//   suspended        → 'active'     (reactivate)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const session = guard.session;
    const reviewerLookup = await pool.query<{ id: string }>(
      `SELECT id FROM employees WHERE email = $1 LIMIT 1`,
      [session.user!.email]
    );
    const reviewerId = reviewerLookup.rows[0]?.id || null;

    const { id } = await ctx.params;
    const body = await req.json();
    const action = String(body.action || "").toLowerCase();
    const reason: string | null = typeof body.reason === "string" ? body.reason : null;

    if (!["approve", "reject", "suspend", "reactivate"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "action must be one of: approve, reject, suspend, reactivate" },
        { status: 400 }
      );
    }
    if ((action === "reject" || action === "suspend") && !reason) {
      return NextResponse.json(
        { success: false, error: "A reason is required when rejecting or suspending a partner" },
        { status: 400 }
      );
    }

    // Check current status to validate the transition
    const cur = await pool.query<{ status: string }>(
      `SELECT status FROM partners_account WHERE id = $1`,
      [id]
    );
    if (cur.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }
    const currentStatus = cur.rows[0].status;

    let nextStatus: string;
    if (action === "approve") {
      if (currentStatus === "active") {
        return NextResponse.json(
          { success: false, error: "Partner is already approved" },
          { status: 400 }
        );
      }
      nextStatus = "active";
    } else if (action === "reject") {
      nextStatus = "rejected";
    } else if (action === "suspend") {
      nextStatus = "suspended";
    } else {
      // reactivate
      if (currentStatus !== "suspended") {
        return NextResponse.json(
          { success: false, error: "Only suspended partners can be reactivated" },
          { status: 400 }
        );
      }
      nextStatus = "active";
    }

    const updated = await pool.query(
      `UPDATE partners_account
          SET status = $1,
              approved_at  = CASE WHEN $1 = 'active'    THEN NOW() ELSE approved_at  END,
              approved_by  = CASE WHEN $1 = 'active'    THEN $2    ELSE approved_by  END,
              rejected_at  = CASE WHEN $1 = 'rejected'  THEN NOW() ELSE rejected_at  END,
              rejected_by  = CASE WHEN $1 = 'rejected'  THEN $2    ELSE rejected_by  END,
              rejection_reason  = CASE WHEN $1 = 'rejected'  THEN $3 ELSE rejection_reason END,
              suspended_at = CASE WHEN $1 = 'suspended' THEN NOW() ELSE suspended_at END,
              suspension_reason = CASE WHEN $1 = 'suspended' THEN $3 ELSE suspension_reason END,
              updated_at = NOW()
        WHERE id = $4
        RETURNING id::text, partner_email, status, approved_at, rejected_at,
                  rejection_reason, suspended_at, suspension_reason`,
      [nextStatus, reviewerId, reason, id]
    );

    await logAudit({
      action: `partner.${action}`,    // partner.approve / partner.reject / etc.
      entity_type: "partner",
      entity_id: id,
      actor_type: "admin",
      actor_id: reviewerId,
      actor_email: session.user!.email,
      metadata: {
        from_status: currentStatus,
        to_status: nextStatus,
        reason: reason || undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update partner status";
    console.error("[admin/partner-approvals/[id] PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
