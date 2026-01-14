import { NextRequest, NextResponse } from "next/server";
import { createBooking, getAllBookings } from "@/backend/controller/bookingController";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createBooking(request);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllBookings(request);
}
