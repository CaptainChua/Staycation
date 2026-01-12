import { NextRequest } from "next/server";
import { getAnalyticsSummary } from "@/backend/controller/analyticsController";

export async function GET(request: NextRequest) {
  return getAnalyticsSummary(request);
}