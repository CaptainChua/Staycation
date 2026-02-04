import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const query = `
      SELECT 
        bc.id::text as cleaning_id,
        b.booking_id,
        b.room_name as haven,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        b.check_in_date,
        b.check_in_time,
        b.check_out_date,
        b.check_out_time,
        bc.cleaning_status,
        bc.assigned_to::text as assigned_cleaner_id,
        e.first_name as cleaner_first_name,
        e.last_name as cleaner_last_name,
        e.employment_id as cleaner_employment_id,
        bc.cleaning_time_in,
        bc.cleaning_time_out,
        bc.cleaned_at,
        bc.inspected_at
      FROM booking_cleaning bc
      INNER JOIN booking b ON bc.booking_id = b.id
      LEFT JOIN booking_guests bg ON bg.booking_id = b.id
      LEFT JOIN employees e ON bc.assigned_to::text = e.id::text
      WHERE b.booking_id = $1
      ORDER BY bc.id
      LIMIT 1
    `;

    const result = await pool.query(query, [bookingId]);

    if (result.rows.length === 0) {
      // If no cleaning task exists, create one for this booking
      console.log("No cleaning task found, creating one for booking:", bookingId);
      
      // First get the booking ID (UUID) from the booking identifier
      const bookingQuery = `
        SELECT id FROM booking WHERE booking_id = $1
      `;
      const bookingResult = await pool.query(bookingQuery, [bookingId]);
      
      if (bookingResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: "Booking not found" },
          { status: 404 }
        );
      }

      const bookingUuid = bookingResult.rows[0].id;
      
      // Create the cleaning task
      const insertQuery = `
        INSERT INTO booking_cleaning (booking_id, cleaning_status)
        VALUES ($1, 'pending')
        RETURNING *
      `;
      
      const insertResult = await pool.query(insertQuery, [bookingUuid]);
      
      // Get the full cleaning task data
      const fullQuery = `
        SELECT 
          bc.id::text as cleaning_id,
          b.booking_id,
          b.room_name as haven,
          bg.first_name as guest_first_name,
          bg.last_name as guest_last_name,
          bg.email as guest_email,
          bg.phone as guest_phone,
          b.check_in_date,
          b.check_in_time,
          b.check_out_date,
          b.check_out_time,
          bc.cleaning_status,
          bc.assigned_to::text as assigned_cleaner_id,
          e.first_name as cleaner_first_name,
          e.last_name as cleaner_last_name,
          e.employment_id as cleaner_employment_id,
          bc.cleaning_time_in,
          bc.cleaning_time_out,
          bc.cleaned_at,
          bc.inspected_at
        FROM booking_cleaning bc
        INNER JOIN booking b ON bc.booking_id = b.id
        LEFT JOIN booking_guests bg ON bg.booking_id = b.id
        LEFT JOIN employees e ON bc.assigned_to::text = e.id::text
        WHERE bc.id = $1
        ORDER BY bc.id
        LIMIT 1
      `;
      
      const fullResult = await pool.query(fullQuery, [insertResult.rows[0].id]);
      
      return NextResponse.json({
        success: true,
        data: fullResult.rows[0],
      });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.log("❌ Error getting cleaning task by booking ID:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get cleaning task",
      },
      { status: 500 }
    );
  }
}
