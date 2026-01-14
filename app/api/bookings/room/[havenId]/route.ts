import { NextRequest, NextResponse } from "next/server";
import { getRoomBookings } from "@/backend/controller/bookingController";

<<<<<<< HEAD
export async function GET(request: NextRequest, { params }: { params: Promise<{ havenId: string }> }): Promise<NextResponse> {
  return getRoomBookings(request, { params });
=======
interface RouteContext {
  params: Promise<{
    havenId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { havenId } = await params;
  return getRoomBookings(request, { params: Promise.resolve({ havenId }) });
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
}
