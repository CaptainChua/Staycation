import { NextRequest } from "next/server";
import { getAnalyticsSummary } from "@/backend/controller/analyticsController";

<<<<<<< HEAD
export async function GET(request: NextRequest) {
  return getAnalyticsSummary(request);
}
=======
export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAnalyticsSummary(request);
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
