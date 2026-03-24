import { NextRequest, NextResponse } from "next/server";
import { syncCalendarBookings } from "@/backend/controller/bookingController";

// POST /api/bookings/sync-calendar
// Finds all bookings without a google_event_id and creates calendar events for them
export async function POST(req: NextRequest) {
  return syncCalendarBookings(req);
}
