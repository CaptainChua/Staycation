import { NextRequest, NextResponse } from "next/server";
import {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
} from "@/backend/controller/bookingController";

// GET /api/bookings
export async function GET(req: NextRequest) {
  return getAllBookings(req);
}

// POST /api/bookings
export async function POST(req: NextRequest) {
  return createBooking(req);
}

// PUT /api/bookings - THIS WAS MISSING!
export async function PUT(req: NextRequest) {
  return updateBookingStatus(req);
}

// DELETE /api/bookings
export async function DELETE(req: NextRequest) {
  return deleteBooking(req);
}