import { NextRequest, NextResponse } from "next/server";
import { getUserBookings } from "@/backend/controller/bookingController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
  return getUserBookings(request, { params });
}
