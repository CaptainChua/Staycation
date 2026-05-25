import { NextRequest, NextResponse } from "next/server";
import { getActivityStats } from "@/backend/controller/activityLogController";
import { requireAdmin } from "@/backend/utils/requireAdmin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return getActivityStats();
}