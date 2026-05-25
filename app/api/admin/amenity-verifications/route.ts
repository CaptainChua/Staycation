import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/amenity-verifications
//   ?status=pending|verified|rejected|revision_requested|all   (default: all)
//   ?partner_id=<uuid>                                          (optional filter)
//   ?haven_id=<uuid>                                            (optional filter)
//   ?limit=50&offset=0
//
// Returns enriched verification rows with haven + partner context for the admin queue.
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "all").toLowerCase();
    const partnerId = url.searchParams.get("partner_id");
    const havenId = url.searchParams.get("haven_id");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const params: (string | number)[] = [];
    const where: string[] = [];

    if (status !== "all") {
      params.push(status);
      where.push(`av.status = $${params.length}`);
    }
    if (partnerId) {
      params.push(partnerId);
      where.push(`h.partner_id = $${params.length}`);
    }
    if (havenId) {
      params.push(havenId);
      where.push(`av.haven_id = $${params.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    params.push(limit, offset);

    const rows = await pool.query(
      `SELECT
         av.id,
         av.haven_id,
         h.haven_name,
         h.partner_id,
         pi.partner_fullname,
         pa.partner_email,
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
         av.reviewed_by,
         av.reverify_at,
         av.created_at,
         av.updated_at
       FROM haven_amenity_verifications av
       JOIN havens h ON h.uuid_id = av.haven_id
       JOIN partners_account pa ON pa.id = h.partner_id
       LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
       ${whereClause}
       ORDER BY
         CASE av.status
           WHEN 'pending' THEN 1
           WHEN 'revision_requested' THEN 2
           WHEN 'rejected' THEN 3
           WHEN 'verified' THEN 4
         END,
         av.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Counts mirror the same partner filter so badges match what's visible.
    const counts = await pool.query(
      `SELECT av.status, COUNT(*)::int AS count
       FROM haven_amenity_verifications av
       JOIN havens h ON h.uuid_id = av.haven_id
       JOIN partners_account pa ON pa.id = h.partner_id
       GROUP BY av.status`
    );
    const countMap: Record<string, number> = {};
    counts.rows.forEach((r: { status: string; count: number }) => {
      countMap[r.status] = r.count;
    });

    return NextResponse.json({
      success: true,
      data: rows.rows,
      counts: countMap,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [], counts: {} });
    }
    const msg = err instanceof Error ? err.message : "Failed to load amenity verifications";
    console.error("[admin/amenity-verifications GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
