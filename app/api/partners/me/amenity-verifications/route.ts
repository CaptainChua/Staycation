import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/amenity-verifications?haven_id=<uuid>
// Lists all verification rows for ONE of the partner's havens, OR all the partner's
// verifications across every haven if haven_id is omitted.
export async function GET(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const havenId = url.searchParams.get("haven_id");

    // Restrict to havens that belong to this partner (defense in depth)
    const params: (string | null)[] = [partnerId];
    let where = `h.partner_id = $1`;
    if (havenId) {
      params.push(havenId);
      where += ` AND h.uuid_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         av.id,
         av.haven_id,
         h.haven_name,
         av.amenity_key,
         av.amenity_label,
         av.amenity_icon_key,
         av.amenity_icon_url,
         av.category,
         av.status,
         av.notes,
         av.reviewer_notes,
         av.rejection_reason,
         av.media,
         av.reviewed_at,
         av.reverify_at,
         av.created_at,
         av.updated_at
       FROM haven_amenity_verifications av
       JOIN havens h ON h.uuid_id = av.haven_id
       WHERE ${where}
       ORDER BY av.created_at DESC`,
      params
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (err: unknown) {
    // Graceful fallback: missing table → return empty so the UI doesn't break
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [] });
    }
    const msg = err instanceof Error ? err.message : "Failed to load amenity verifications";
    console.error("[partners/me/amenity-verifications GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
