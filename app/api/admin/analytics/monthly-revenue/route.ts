import { NextRequest, NextResponse } from "next/server";
import { getMonthlyRevenue } from "@/backend/controller/analyticsController";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getMonthlyRevenue(request);
}
