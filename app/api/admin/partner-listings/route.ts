import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partner-listings?status=all|approved|pending|rejected
// All partner-submitted havens across every partner, with partner info attached
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const conditions: string[] = ["h.partner_id IS NOT NULL"];
    const values: unknown[] = [];

    if (status !== "all") {
      values.push(status);
      conditions.push(`COALESCE(pa.status, 'pending') = $${values.length}`);
    }

    const query = `
      SELECT
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
        h.bathrooms,
        h.property_type,
        h.cleaning_fee,
        h.security_deposit,
        h.extra_pax_fee,
        h.house_rules,
        h.smoking_policy,
        h.pet_policy,
        h.cancellation_policy,
        h.google_map_address,
        h.virtual_tour_url,
        h.listing_status,
        h.listing_status_reason,
        h.created_at,
        h.partner_id,
        COALESCE(pa.status, 'pending') AS status,
        pa.reason AS rejection_reason,
        pa.reviewer_notes,
        partner.partner_email,
        partner.status AS partner_status,
        partner.created_at AS partner_joined_at,
        pi.partner_fullname AS partner_name,
        pi.partner_phone,
        pi.partner_address,
        pi.commission_rate,
        pi.total_earnings AS partner_total_earnings,
        (
          SELECT COUNT(*)::int
          FROM booking b
          WHERE b.room_name = h.haven_name
        ) AS bookings_count,
        (
          SELECT image_url FROM haven_images
          WHERE haven_id = h.uuid_id
          ORDER BY display_order ASC, uploaded_at ASC
          LIMIT 1
        ) AS image_url,
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
        ) AS photo_tour
      FROM havens h
      INNER JOIN partners_account partner ON partner.id = h.partner_id
      LEFT JOIN partners_information pi ON pi.partner_id = partner.id
      LEFT JOIN property_approval pa ON pa.haven_id = h.uuid_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY h.created_at DESC
    `;

    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load partner listings";
    console.error("[admin/partner-listings] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
