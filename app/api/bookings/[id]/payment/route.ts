import { NextRequest, NextResponse } from "next/server";
import { processBookingPayment } from "@/backend/controller/bookingController";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id } = await params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const merged = { ...(body || {}), id };
  const forwarded = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(merged),
  });
  return processBookingPayment(forwarded);
}
