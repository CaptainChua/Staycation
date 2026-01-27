import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";

export interface Booking {
  id?: string;
  booking_id: string;
  user_id?: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "confirmed"
    | "checked-in"
    | "completed"
    | "cancelled";
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

// CREATE Booking
export const createBooking = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    console.log("📥 createBooking body:", JSON.stringify(body));
    const {
      booking_id,
      user_id,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      facebook_link,
      valid_id,
      additional_guests,
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      payment_method,
      payment_proof,
      room_rate,
      security_deposit,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
      add_ons,
    } = body;

    // Validate required fields with clearer error messages
    const missingFields: string[] = [];
    if (!booking_id) missingFields.push('booking_id');
    if (!room_name) missingFields.push('room_name');
    if (!check_in_date) missingFields.push('check_in_date');
    if (!check_out_date) missingFields.push('check_out_date');
    if (!check_in_time) missingFields.push('check_in_time');
    if (!check_out_time) missingFields.push('check_out_time');
    if (!guest_first_name) missingFields.push('guest_first_name');
    if (!guest_last_name) missingFields.push('guest_last_name');
    if (!guest_email) missingFields.push('guest_email');
    if (!guest_phone) missingFields.push('guest_phone');

    if (missingFields.length > 0) {
      const msg = `Missing required fields: ${missingFields.join(', ')}`;
      console.warn("⚠️ createBooking validation failed:", msg);
      return NextResponse.json(
        {
          success: false,
          error: msg,
        },
        { status: 400 }
      );
    }

    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Insert into booking table (using 'booking' singular as per actual DB schema)
      const bookingQuery = `
        INSERT INTO booking (
          booking_id, user_id, room_name, check_in_date, check_out_date, 
          check_in_time, check_out_time, adults, children, infants, status,
          guest_first_name, guest_last_name, guest_email, guest_phone,
          guest_age, guest_gender, valid_id_url, facebook_link,
          payment_method, payment_proof_url, room_rate, security_deposit,
          add_ons_total, total_amount, down_payment, remaining_balance, add_ons
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        RETURNING *
      `;

      const bookingValues = [
        booking_id,
        user_id || null,
        room_name,
        check_in_date,
        check_out_date,
        check_in_time,
        check_out_time,
        adults || 1,
        children || 0,
        infants || 0,
        "pending",
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_age || null,
        guest_gender || null,
        valid_id || null,
        facebook_link || null,
        payment_method || null,
        payment_proof || null,
        room_rate || 0,
        security_deposit || 0,
        add_ons_total || 0,
        total_amount || 0,
        down_payment || 0,
        remaining_balance || 0,
        add_ons || null,
      ];

      const bookingResult = await client.query(bookingQuery, bookingValues);
      const newBooking = bookingResult.rows[0];
      console.log("✅ Booking created:", newBooking.id);

      await client.query('COMMIT');
      console.log("✅ Booking and Guest Info Created:", newBooking);

      return NextResponse.json(
        {
          success: true,
          data: newBooking,
          message: "Booking created successfully. Waiting for admin approval.",
        },
        { status: 201 }
      );
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('❌ DB transaction error in createBooking:', error.stack || error.message || error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Database transaction failed',
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.log("❌ Error creating booking:", error.stack || error.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create booking",
      },
      { status: 500 }
    );
  }
};

// GET All Bookings
export const getAllBookings = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `
      SELECT * FROM booking
    `;
    
    let values: any[] = [];

    if (status) {
      query += " WHERE status = $1";
      values.push(status);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.log("❌ Error getting bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get bookings",
      },
      { status: 500 }
    );
  }
};

// GET Booking by ID
export const getBookingById = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT * FROM booking
      WHERE id = $1 OR booking_id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Retrieved booking ${id}`);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.log("❌ Error getting booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get booking",
      },
      { status: 500 }
    );
  }
};

// UPDATE Booking Status (Approve/Reject)
export const updateBookingStatus = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { id, status, rejection_reason } = body;

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID and status are required",
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "approved",
      "rejected",
      "confirmed",
      "checked-in",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status",
        },
        { status: 400 }
      );
    }

    const query = `
      UPDATE booking
      SET status = $1, rejection_reason = $2, updated_at = NOW()
      WHERE id = $3 OR booking_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [
      status,
      rejection_reason || null,
      id,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    console.log("✅ Booking status updated:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: `Booking ${status} successfully`,
    });
  } catch (error: any) {
    console.log("❌ Error updating booking status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update booking status",
      },
      { status: 500 }
    );
  }
};

// DELETE Booking
export const deleteBooking = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID is required",
        },
        { status: 400 }
      );
    }

    const query = `DELETE FROM booking WHERE id = $1 OR booking_id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 }
      );
    }

    console.log("✅ Booking deleted:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    console.log("❌ Error deleting booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete booking",
      },
      { status: 500 }
    );
  }
};

// GET User's Bookings
export const getUserBookings = async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> => {
  const { userId } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `
      SELECT * FROM booking
      WHERE user_id = $1
    `;

    const values: any[] = [userId];

    if (status && status !== "all") {
      if (status === "upcoming") {
        query += ` AND status IN ('pending', 'approved', 'confirmed') AND check_in_date >= CURRENT_DATE`;
      } else if (status === "past") {
        query += ` AND (status = 'completed' OR check_out_date < CURRENT_DATE)`;
      } else if (status === "cancelled") {
        query += ` AND status = 'cancelled'`;
      } else {
        query += ` AND status = $2`;
        values.push(status);
      }
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.log("❌ Error fetching user bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch user bookings",
      },
      { status: 500 }
    );
  }
};

// GET Room/Haven Bookings (for checking availability)
export const getRoomBookings = async (
  req: NextRequest,
  { params }: { params: Promise<{ havenId: string }> }
): Promise<NextResponse> => {
  const { havenId } = await params;

  try {
    // First, get the room name from havens table using havenId
    const havenQuery = `SELECT haven_name FROM havens WHERE uuid_id = $1`;
    const havenResult = await pool.query(havenQuery, [havenId]);

    if (havenResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Haven not found",
      }, { status: 404 });
    }

    const roomName = havenResult.rows[0].haven_name.trim();

    // Get all active bookings for this room (exclude cancelled and rejected)
    const query = `
      SELECT
        id,
        booking_id,
        check_in_date,
        check_out_date,
        status,
        room_name
      FROM booking
      WHERE TRIM(room_name) = $1
        AND status NOT IN ('cancelled', 'rejected')
      ORDER BY check_in_date ASC
    `;

    const result = await pool.query(query, [roomName]);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.log("❌ Error fetching room bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch room bookings",
      },
      { status: 500 }
    );
  }
};