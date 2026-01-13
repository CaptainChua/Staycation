import { NextRequest, NextResponse } from "next/server";
import { getBookingById, updateBookingStatus, deleteBooking } from "@/backend/controller/bookingController";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return getBookingById(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return updateBookingStatus(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id } = await params;
  return deleteBooking(request);
}
