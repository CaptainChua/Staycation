import { NextRequest, NextResponse } from "next/server";
import { getBookingById, updateBookingStatus, deleteBooking } from "@/backend/controller/bookingController";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  await params;
  return getBookingById(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  await params;
  return updateBookingStatus(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cleaning_status, assigned_to } = body;

    if (!id || !cleaning_status) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID and cleaning_status are required",
        },
        { status: 400 }
      );
    }

    const validStatuses = ["pending", "in-progress", "cleaned", "inspected"];
    if (!validStatuses.includes(cleaning_status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cleaning status",
        },
        { status: 400 }
      );
    }

    let query: string;
    let params_arr: any[];

    if (assigned_to !== undefined) {
      query = `
        UPDATE bookings
        SET cleaning_status = $1, assigned_to = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;
      params_arr = [cleaning_status, assigned_to, id];
    } else {
      query = `
        UPDATE bookings
        SET cleaning_status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      params_arr = [cleaning_status, id];
    }

    const result = await pool.query(query, params_arr);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating cleaning status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update cleaning status",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  await params;
  return deleteBooking(request);
}
