import { NextRequest, NextResponse } from "next/server";
import { updateCleaningStatus } from "@/backend/controller/bookingController";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  await params;
  return updateCleaningStatus(request);
}
