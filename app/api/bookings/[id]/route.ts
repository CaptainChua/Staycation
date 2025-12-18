"use server";

import { NextRequest, NextResponse } from "next/server";
import { getBookingById, updateBookingStatus, deleteBooking } from "@/backend/controller/bookingController";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getBookingById(request);
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  return updateBookingStatus(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  return deleteBooking(request);
}
