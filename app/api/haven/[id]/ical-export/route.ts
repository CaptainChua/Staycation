import { NextRequest, NextResponse } from "next/server";
import { buildHavenIcalExport } from "@/backend/utils/icalSync";

// Pulls in node-ical + pg; both need Node runtime and live DB. Skip static analysis.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/haven/[id]/ical-export
 *
 * Public iCal feed for ONE haven. Combines our internal bookings + manual blocks.
 * Partners paste this URL into Airbnb / Booking.com / Agoda calendar-sync settings
 * so those platforms block out the same dates that are taken on Staycation.
 *
 * Returns a text/calendar response so consumers can read it directly.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const ics = await buildHavenIcalExport(id);
    return new Response(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="haven-${id}.ics"`,
        "Cache-Control": "public, max-age=300", // 5 min cache for OTA pollers
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to export iCal";
    console.error("[haven/[id]/ical-export GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
