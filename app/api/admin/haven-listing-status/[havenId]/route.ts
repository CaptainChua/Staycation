import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { logAudit } from "@/backend/utils/auditLog";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// PATCH /api/admin/haven-listing-status/[havenId]
// Body: { listing_status: 'active' | 'disabled' | 'suspended', reason?: string }
//
// Superadmin override that takes a listing off the public marketplace without
// rejecting the partner's approval status. Separate from property_approval so
// approve→reject and active→disabled are two independent levers.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const session = guard.session;
    const reviewerLookup = await pool.query<{ id: string }>(
      `SELECT id FROM employees WHERE email = $1 LIMIT 1`,
      [session.user!.email]
    );
    const reviewerId = reviewerLookup.rows[0]?.id || null;

    const { havenId } = await ctx.params;
    const body = await req.json();
    const status = String(body.listing_status || "").toLowerCase();
    const reason: string | null = typeof body.reason === "string" ? body.reason : null;

    if (!["active", "disabled", "suspended"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "listing_status must be 'active', 'disabled', or 'suspended'" },
        { status: 400 }
      );
    }
    if ((status === "disabled" || status === "suspended") && !reason) {
      return NextResponse.json(
        { success: false, error: "A reason is required when disabling or suspending a listing" },
        { status: 400 }
      );
    }

    const cur = await pool.query<{ listing_status: string }>(
      `SELECT listing_status FROM havens WHERE uuid_id = $1`,
      [havenId]
    );
    if (cur.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Haven not found" }, { status: 404 });
    }
    const prevStatus = cur.rows[0].listing_status;

    const result = await pool.query(
      `UPDATE havens
         SET listing_status = $1,
             listing_status_reason = $2,
             listing_status_changed_at = NOW(),
             listing_status_changed_by = $3,
             updated_at = NOW()
       WHERE uuid_id = $4
       RETURNING uuid_id::text, haven_name, listing_status, listing_status_reason, listing_status_changed_at`,
      [status, reason, reviewerId, havenId]
    );

    await logAudit({
      action: `haven.listing_${status}`,
      entity_type: "haven",
      entity_id: havenId,
      actor_type: "admin",
      actor_id: reviewerId,
      actor_email: session.user!.email,
      metadata: {
        from_status: prevStatus,
        to_status: status,
        reason: reason || undefined,
        haven_name: result.rows[0]?.haven_name,
      },
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update listing status";
    console.error("[admin/haven-listing-status PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
