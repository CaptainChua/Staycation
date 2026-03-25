import { NextRequest, NextResponse } from "next/server";
import {
  createBookingPayment,
  getAllBookingPayments,
} from "@/backend/controller/bookingPaymentsController";

/**
 * Collection routes for booking payments
 *
 * GET  /api/booking-payments      -> getAllBookingPayments (supports ?status=... & ?q=...)
 * POST /api/booking-payments      -> createBookingPayment
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  return getAllBookingPayments(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return createBookingPayment(request);
}
