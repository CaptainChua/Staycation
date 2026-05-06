import { NextRequest } from "next/server";
import { getRoleAwareDashboard } from "@/backend/controller/analyticsController";

export async function GET(req: NextRequest) {
  return getRoleAwareDashboard(req);
}
