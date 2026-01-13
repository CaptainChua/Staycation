import { NextRequest, NextResponse } from "next/server";
import { getActivityStats } from "@/backend/controller/activityLogController";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getActivityStats(request);
}
