import { NextRequest, NextResponse } from "next/server";
import { getBookingById, updateBookingStatus, deleteBooking } from "@/backend/controller/bookingController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return getBookingById(request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return updateBookingStatus(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return deleteBooking(request);
}
