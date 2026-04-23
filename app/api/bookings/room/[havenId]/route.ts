import { NextRequest, NextResponse } from "next/server";
import { getRoomBookings } from "@/backend/controller/bookingController";

interface RouteContext {
  params: Promise<{
    havenId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { havenId } = await params;
  return getRoomBookings(request, { params: Promise.resolve({ havenId }) });
}
