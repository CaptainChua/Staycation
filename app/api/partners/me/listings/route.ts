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
        h.weekday_rate,
        h.weekend_rate,
        h.ten_hour_rate,
        h.six_hour_rate,
        h.status,
        h.created_at,
        h.updated_at,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', i.id,
                'image_url', i.image_url,
                'is_main', i.is_main
              )
              ORDER BY i.is_main DESC NULLS LAST, i.created_at ASC
            )
            FROM haven_images i
            WHERE i.haven_id = h.uuid_id
          ),
          '[]'::json
        ) AS images,
        (
          SELECT COUNT(*)::int
          FROM booking b
          WHERE b.room_name = h.haven_name
        ) AS bookings_count
      FROM havens h
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
