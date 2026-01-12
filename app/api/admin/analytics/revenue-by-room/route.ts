import { NextRequest } from "next/server";
import { getRevenueByRoom } from "@/backend/controller/analyticsController";

export async function GET(request: NextRequest) {
  return getRevenueByRoom(request);
}