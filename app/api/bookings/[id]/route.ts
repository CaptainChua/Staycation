import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/backend/controller/bookingController";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  await context.params; // Just await it, we don't need to extract it
  return getBookingById(request);
}