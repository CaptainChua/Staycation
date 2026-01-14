import { NextRequest, NextResponse } from "next/server";
import { getBookingById, updateBookingStatus, deleteBooking } from "@/backend/controller/bookingController";

<<<<<<< HEAD
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
  return getBookingById(request);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
  return updateBookingStatus(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
=======
interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
  return getBookingById(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
  return updateBookingStatus(request);
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { id: _id } = await params;
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
  return deleteBooking(request);
}
