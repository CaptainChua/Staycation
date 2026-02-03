import { NextRequest, NextResponse } from "next/server";
import { getBookingById, updateBookingDetails, updateBookingStatus, deleteBooking } from "@/backend/controller/bookingController";
import pool from "@/backend/config/db";

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  await context.params; // Just await it, we don't need to extract it
  return getBookingById(request);
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  await params;
  const peek = await request.clone().json().catch(() => ({} as any));
  const isDetailsUpdate =
    peek &&
    typeof peek === "object" &&
    ("room_name" in peek ||
      "check_in_date" in peek ||
      "check_out_date" in peek ||
      "guest_first_name" in peek ||
      "guest_last_name" in peek ||
      "guest_email" in peek ||
      "guest_phone" in peek ||
      "payment_method" in peek ||
      "add_ons" in peek);

  return isDetailsUpdate ? updateBookingDetails(request) : updateBookingStatus(request);
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { cleaning_status, assigned_to, cleaned_at, inspected_at, cleaning_time_in } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID is required",
        },
        { status: 400 }
      );
    }

    // If cleaning_status is provided, validate it
    if (cleaning_status) {
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
    }

    // Update the booking_cleaning table instead of bookings
    let query = `
      UPDATE booking_cleaning
      SET
    `;
    const updateFields: string[] = [];
    const params_arr: string[] = [];
    let paramCount = 1;

    if (cleaning_status !== undefined) {
      updateFields.push(`cleaning_status = $${paramCount}`);
      params_arr.push(cleaning_status);
      paramCount++;
    }

    if (assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramCount}`);
      params_arr.push(assigned_to);
      paramCount++;
    }

    if (cleaning_time_in !== undefined) {
      updateFields.push(`cleaning_time_in = $${paramCount}`);
      params_arr.push(cleaning_time_in);
      paramCount++;
    }

    if (cleaned_at !== undefined) {
      updateFields.push(`cleaned_at = $${paramCount}`);
      params_arr.push(cleaned_at);
      paramCount++;
    }

    if (inspected_at !== undefined) {
      updateFields.push(`inspected_at = $${paramCount}`);
      params_arr.push(inspected_at);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No fields to update",
        },
        { status: 400 }
      );
    }

    query += updateFields.join(", ");
    query += ` WHERE booking_id = $${paramCount}
      RETURNING *
    `;
    params_arr.push(id);

    console.log("Executing query:", query);
    console.log("With params:", params_arr);

    const result = await pool.query(query, params_arr);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cleaning record not found for this booking",
        },
        { status: 404 }
      );
    }

    console.log("Update successful:", result.rows[0]);

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating cleaning record:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update cleaning record",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  await params;
  return deleteBooking(request);
}
