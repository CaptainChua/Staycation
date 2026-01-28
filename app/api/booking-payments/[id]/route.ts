import { NextRequest, NextResponse } from "next/server";
import {
  getBookingPaymentById,
  updateBookingPayment,
  deleteBookingPayment,
} from "@/backend/controller/bookingPaymentsController";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Item routes for booking payments
 *
 * GET    /api/booking-payments/:id   -> getBookingPaymentById
 * PUT    /api/booking-payments/:id   -> updateBookingPayment
 * PATCH  /api/booking-payments/:id   -> updateBookingPayment
 * DELETE /api/booking-payments/:id   -> deleteBookingPayment
 *
 * The controller functions parse the id from the request URL, so we simply
 * ensure `params` is awaited to conform with the route handler signature.
 */

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  await params;
  return getBookingPaymentById(request);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  await params;
  return updateBookingPayment(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  await params;
  return updateBookingPayment(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  await params;
  return deleteBookingPayment(request);
}
