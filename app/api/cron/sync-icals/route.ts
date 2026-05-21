import { NextRequest, NextResponse } from "next/server";
import { syncAllActiveFeeds } from "@/backend/utils/icalSync";

// node-ical + pg are Node-only and require live DB access; skip static analysis.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/sync-icals
 *
 * Triggered by Vercel Cron every 15 minutes (see vercel.json).
 * Iterates every active haven_ical_feed and pulls its iCal calendar,
 * upserting events into blocked_dates and pruning removed ones.
 *
 * Protected by the CRON_SECRET env var when running in production —
 * Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: NextRequest) {
  // In production, only Vercel Cron (or anyone with the secret) should hit this.
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const startedAt = Date.now();
    const results = await syncAllActiveFeeds();
    const ok = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    const imported = results.reduce((s, r) => s + r.events_imported, 0);
    const removed = results.reduce((s, r) => s + r.events_removed, 0);

    return NextResponse.json({
      success: true,
      summary: {
        feeds_total: results.length,
        feeds_ok: ok,
        feeds_failed: failed,
        events_imported: imported,
        events_removed: removed,
        duration_ms: Date.now() - startedAt,
      },
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    console.error("[cron/sync-icals] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
