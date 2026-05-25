import { NextRequest, NextResponse } from "next/server";
import { syncBookingsToSheet } from "@/backend/utils/googleSheets";
import { requireAdmin } from "@/backend/utils/requireAdmin";

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function POST(req: NextRequest) {
  try {
    // Allow either a valid cron bearer token OR an admin (Owner/CSR) session.
    // CSR triggers a manual sync from the BookingPage; cron triggers it on a
    // schedule. Previously, if CRON_SECRET was unset the route was wide open.
    const cronSecret = process.env.CRON_SECRET;
    const auth = req.headers.get("authorization") || "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
    const isCronCall = !!cronSecret && token === cronSecret;

    if (!isCronCall) {
      const guard = await requireAdmin();
      if (!guard.ok) return guard.response;
    }

    const result = await syncBookingsToSheet();

    if (result.success) {
      return NextResponse.json({ 
        ...result,
        message: `Synced bookings to Google Sheets. Appended: ${result.appended}, Skipped: ${result.skipped}, Total in DB: ${result.totalInDb}.`,
      });
    } else {
      return NextResponse.json(
        { ...result },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Sync API Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Internal Server Error" 
      },
      { status: 500 }
    );
  }
}
