import { NextRequest } from "next/server";
import { getActivityStats } from "@/backend/controller/activityLogController";

export async function GET(request: NextRequest) {
  return getActivityStats(request);
}