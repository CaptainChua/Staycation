import { NextRequest } from "next/server";
import { getRevenueByRoom } from "@/backend/controller/analyticsController";

<<<<<<< HEAD
export async function GET(request: NextRequest) {
  return getRevenueByRoom(request);
}
=======
export async function GET(request: NextRequest): Promise<NextResponse> {
  return getRevenueByRoom(request);
}
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
