import { NextRequest, NextResponse } from "next/server";
import { getRoomBookings } from "@/backend/controller/bookingController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ havenId: string }> }): Promise<NextResponse> {
  return getRoomBookings(request, { params });
}
