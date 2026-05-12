import { NextRequest } from "next/server";
import { syncCalendarBookings } from "@/backend/controller/bookingController";

// POST /api/bookings/sync-calendar-colors
// Updates the colorId of all existing Google Calendar events to match current booking status
export async function POST(req: NextRequest) {
  return syncCalendarBookings(req);
}
