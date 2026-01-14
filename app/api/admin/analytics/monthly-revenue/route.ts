import { NextRequest } from "next/server";
import { getMonthlyRevenue } from "@/backend/controller/analyticsController";

<<<<<<< HEAD
export async function GET(request: NextRequest) {
  return getMonthlyRevenue(request);
}
=======
export async function GET(request: NextRequest): Promise<NextResponse> {
  return getMonthlyRevenue(request);
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
