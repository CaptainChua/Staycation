import { NextRequest, NextResponse } from "next/server";
import { getUserBookings } from "@/backend/controller/bookingController";

interface RouteContext {
  params: Promise<{
    userId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId } = await params;
  return getUserBookings(request, { params: Promise.resolve({ userId }) });
}
