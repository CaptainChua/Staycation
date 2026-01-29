import { NextRequest, NextResponse } from "next/server";
import { syncBookingsToSheet } from "@/backend/utils/googleSheets";

export const dynamic = 'force-dynamic'; // Ensure this route is not cached

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const auth = req.headers.get("authorization") || "";
      const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
      if (token !== cronSecret) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
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
