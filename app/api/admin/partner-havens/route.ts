import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-havens?status=pending
// Lists partner-submitted havens grouped by approval status (pending by default).
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const result = await pool.query(
      `SELECT
        h.uuid_id,
        h.haven_name,
        h.tower,
        h.floor,
        h.view_type,
        h.capacity,
        h.room_size,
        h.beds,
        h.description,
        h.youtube_url,
        h.weekday_rate,
        h.weekend_rate,
        h.ten_hour_rate,
        h.six_hour_rate,
        h.six_hour_check_in,
        h.six_hour_check_out,
        h.ten_hour_check_in,
        h.ten_hour_check_out,
        h.twenty_one_hour_check_in,
        h.twenty_one_hour_check_out,
        h.amenities,
        h.created_at,
        h.partner_id,
        pa.id AS approval_id,
        pa.status,
        pa.reason,
        pa.reviewer_notes,
        pa.approved_at,
        pa.approved_by,
        partner.partner_email AS partner_email,
        partner.created_at AS partner_joined_at,
        partner.status AS partner_status,
        pi.partner_fullname AS partner_name,
        pi.partner_phone AS partner_phone,
        pi.commission_rate AS partner_commission_rate,
        pi.total_earnings AS partner_total_earnings,
        pi.partner_address AS partner_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('id', i.id, 'image_url', i.image_url, 'is_main', (i.display_order = 0))
              ORDER BY i.display_order ASC, i.uploaded_at ASC
            )
            FROM haven_images i
            WHERE i.haven_id = h.uuid_id
          ),
          '[]'::json
        ) AS images,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('id', pt.id, 'category', pt.category, 'image_url', pt.image_url)
              ORDER BY pt.category ASC, pt.display_order ASC
            )
            FROM photo_tour_images pt
            WHERE pt.haven_id = h.uuid_id
          ),
          '[]'::json
        ) AS photo_tour,
        (
          SELECT COUNT(*)::int FROM havens h2 WHERE h2.partner_id = h.partner_id
        ) AS partner_total_havens,
        (
          SELECT COUNT(*)::int FROM havens h3
          JOIN property_approval pa2 ON pa2.haven_id = h3.uuid_id
          WHERE h3.partner_id = h.partner_id AND pa2.status = 'approved'
        ) AS partner_approved_havens,
        (
          SELECT COUNT(*)::int FROM havens h4
          JOIN property_approval pa3 ON pa3.haven_id = h4.uuid_id
          WHERE h4.partner_id = h.partner_id AND pa3.status = 'rejected'
        ) AS partner_rejected_havens
       FROM havens h
       INNER JOIN property_approval pa ON pa.haven_id = h.uuid_id
       INNER JOIN partners_account partner ON partner.id = h.partner_id
       LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
       WHERE h.partner_id IS NOT NULL
         AND pa.status = $1
       ORDER BY h.created_at DESC`,
      [status]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load partner havens";
    console.error("[admin/partner-havens GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH /api/admin/partner-havens
// Body: { haven_id, action: 'approve' | 'reject', reason?, reviewer_notes? }
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json();
    const { haven_id, action, reason, reviewer_notes } = body;

    if (!haven_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "haven_id and valid action are required" },
        { status: 400 }
      );
    }

    if (action === "reject" && !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const result = await pool.query(
      `UPDATE property_approval
       SET status = $2,
           reason = $3,
           reviewer_notes = $4,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE haven_id = $1
       RETURNING *`,
      [haven_id, newStatus, reason || null, reviewer_notes || null]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Approval row not found" }, { status: 404 });
    }

    // Notify the partner
    try {
      const havenInfo = await pool.query(
        `SELECT h.haven_name, h.partner_id FROM havens h WHERE h.uuid_id = $1`,
        [haven_id]
      );
      const haven = havenInfo.rows[0];
      if (haven?.partner_id) {
        const kind = action === "approve" ? "approved" : "rejected";
        const title =
          action === "approve"
            ? `${haven.haven_name} is now Live`
            : `${haven.haven_name} needs revision`;
        const notifBody =
          action === "approve"
            ? "Your listing has been approved and is now visible to guests."
            : reason || "Your listing was not approved. Please check the reviewer notes.";
        await pool.query(
          `INSERT INTO partner_notifications (partner_id, kind, title, body, related_haven_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [haven.partner_id, kind, title, notifBody, haven_id]
        );
      }
    } catch (notifErr) {
      console.error("Failed to send notification:", notifErr);
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update approval";
    console.error("[admin/partner-havens PATCH] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
