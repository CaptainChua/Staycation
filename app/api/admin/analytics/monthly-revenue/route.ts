import { NextRequest } from "next/server";
import { getMonthlyRevenue } from "@/backend/controller/analyticsController";

export async function GET(request: NextRequest) {
  return getMonthlyRevenue(request);
}