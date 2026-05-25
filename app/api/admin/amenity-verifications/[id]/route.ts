import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { logAudit } from "@/backend/utils/auditLog";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// PATCH /api/admin/amenity-verifications/[id]
// Body:
//   action: 'verify' | 'reject' | 'request_revision'
//   reviewer_notes?: string   (internal — not shown to partner)
//   rejection_reason?: string (shown to partner on reject / revision)
//   reverify_at?: string      (ISO date — optional, when admin wants reverification)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const session = guard.session;
    // Resolve the reviewer's employee id from the session email
    const reviewerLookup = await pool.query<{ id: string }>(
      `SELECT id FROM employees WHERE email = $1 LIMIT 1`,
      [session.user!.email]
    );
    const reviewerId = reviewerLookup.rows[0]?.id || null;

    const { id } = await ctx.params;
    const body = await req.json();
    const action = String(body.action || "").toLowerCase();

    const STATUS_BY_ACTION: Record<string, string> = {
      verify: "verified",
      reject: "rejected",
      request_revision: "revision_requested",
    };
    const nextStatus = STATUS_BY_ACTION[action];
    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: "action must be one of: verify, reject, request_revision" },
        { status: 400 }
      );
    }

    const reviewerNotes: string | null = typeof body.reviewer_notes === "string" ? body.reviewer_notes : null;
    const rejectionReason: string | null = typeof body.rejection_reason === "string" ? body.rejection_reason : null;
    const reverifyAt: string | null = typeof body.reverify_at === "string" ? body.reverify_at : null;

    // For rejections and revision requests, require a reason so the partner knows what to fix
    if ((nextStatus === "rejected" || nextStatus === "revision_requested") && !rejectionReason) {
      return NextResponse.json(
        { success: false, error: "rejection_reason is required when rejecting or requesting revision" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE haven_amenity_verifications
         SET status = $1,
             reviewer_notes = $2,
             rejection_reason = CASE WHEN $1 = 'verified' THEN NULL ELSE $3 END,
             reverify_at = $4,
             reviewed_by = $5,
             reviewed_at = NOW(),
             updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [nextStatus, reviewerNotes, rejectionReason, reverifyAt, reviewerId, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await logAudit({
      action: `amenity.${action}`,
      entity_type: "amenity_verification",
      entity_id: id,
      actor_type: "admin",
      actor_id: reviewerId,
      actor_email: session.user!.email,
      metadata: {
        amenity_label: result.rows[0]?.amenity_label,
        haven_id: result.rows[0]?.haven_id,
        from_status: "pending",
        to_status: nextStatus,
        rejection_reason: rejectionReason || undefined,
      },
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update verification";
    console.error("[admin/amenity-verifications/[id] PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
