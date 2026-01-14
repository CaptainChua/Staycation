import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/backend/controller/analyticsController";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAnalyticsSummary(request);
}