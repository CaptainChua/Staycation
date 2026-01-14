import { NextRequest, NextResponse } from "next/server";
import { getUserBookings } from "@/backend/controller/bookingController";

<<<<<<< HEAD
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }): Promise<NextResponse> {
  return getUserBookings(request, { params });
=======
interface RouteContext {
  params: Promise<{
    userId: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId } = await params;
  return getUserBookings(request, { params: Promise.resolve({ userId }) });
>>>>>>> e76881a6da5d5c249ef50ec8e0488629d91e765c
}
