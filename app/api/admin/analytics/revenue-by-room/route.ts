import { NextRequest, NextResponse } from "next/server";
import { getRevenueByRoom } from "@/backend/controller/analyticsController";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getRevenueByRoom(request);
}
