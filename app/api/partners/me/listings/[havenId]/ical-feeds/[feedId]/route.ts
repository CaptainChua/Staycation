import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// DELETE: remove a feed (and cascade-delete all its imported blocks for cleanliness)
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ havenId: string; feedId: string }> }
) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId, feedId } = await ctx.params;
    const check = await pool.query<{ source: string }>(
      `SELECT f.source
       FROM haven_ical_feeds f
       JOIN havens h ON h.uuid_id = f.haven_id
       WHERE f.id = $1 AND f.haven_id = $2 AND h.partner_id = $3`,
      [feedId, havenId, partnerId]
    );
    if (check.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    // Remove blocks imported by this feed before deleting the feed itself
    await pool.query(
      `DELETE FROM blocked_dates
       WHERE haven_id = $1 AND external_source = $2`,
      [havenId, check.rows[0].source]
    );
    await pool.query(`DELETE FROM haven_ical_feeds WHERE id = $1`, [feedId]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete feed";
    console.error("[ical-feeds DELETE] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
