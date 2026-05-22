import { NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
        h.rates,
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
        h.commission_rate,
        h.house_rules,
        h.smoking_policy,
        h.pet_policy,
        h.cancellation_policy,
        h.google_map_address,
        h.virtual_tour_url,
        h.listing_status,
        -- Real status from property_approval (pending until owner approves)
        COALESCE(pa.status, 'pending') AS status,
        pa.reason AS rejection_reason,
        pa.reviewer_notes,
        h.created_at,
        h.updated_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', i.id,
                'image_url', i.image_url,
                'is_main', (i.display_order = 0)
              )
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
        ) AS photo_tours,
        (
          SELECT COUNT(*)::int
          FROM booking b
          WHERE b.room_name = h.haven_name
        ) AS bookings_count
      FROM havens h
      LEFT JOIN property_approval pa ON pa.haven_id = h.uuid_id
      WHERE h.partner_id = $1
      ORDER BY h.created_at DESC;
    `;

    const result = await pool.query(query, [partnerId]);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load listings";
    console.error("[partners/me/listings] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
