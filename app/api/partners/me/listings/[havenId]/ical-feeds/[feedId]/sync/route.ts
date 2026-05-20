import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";
import { syncOneFeed } from "@/backend/utils/icalSync";

// node-ical + pg need Node runtime + live DB; skip build-time static analysis.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/partners/me/listings/[havenId]/ical-feeds/[feedId]/sync
// Manual sync trigger — partner clicks "Sync now" on a feed.
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ havenId: string; feedId: string }> }
) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId, feedId } = await ctx.params;

    const feed = await pool.query<{ id: string; haven_id: string; source: string; url: string }>(
      `SELECT f.id::text, f.haven_id::text, f.source, f.url
       FROM haven_ical_feeds f
       JOIN havens h ON h.uuid_id = f.haven_id
       WHERE f.id = $1 AND f.haven_id = $2 AND h.partner_id = $3 AND f.is_active = TRUE`,
      [feedId, havenId, partnerId]
    );
    if (feed.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const result = await syncOneFeed(feed.rows[0]);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[ical-feeds sync POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
