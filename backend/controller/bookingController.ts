import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";

// Add-on item interface
interface AddOnItem {
  name: string;
  price: number;
  quantity?: number;
}

// Additional guest interface
interface AdditionalGuest {
  firstName: string;
  lastName: string;
  age?: number;
  gender?: string;
  validId?: string;
  validIdUrl?: string | null;
}

export interface Booking {
  id?: string;
  booking_id: string;
  user_id?: string; // NULL for guest bookings, UUID for logged-in users
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  room_name?: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  facebook_link?: string;
  payment_method: string;
  payment_proof_url?: string;
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "confirmed"
    | "checked-in"
    | "completed"
    | "cancelled";
  add_ons?: AddOnItem[];
  created_at?: string;
  updated_at?: string;
}

// CREATE Booking
export const createBooking = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const {
      booking_id,
      user_id, // Optional: null for guest, UUID for logged-in users
      guest_first_name,
      guest_last_name,
      guest_age,
      guest_gender,
      guest_email,
      guest_phone,
      valid_id, // base64 string for main guest ID
      additional_guests, // Array of additional guest objects
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      facebook_link,
      payment_method,
      payment_proof, // base64 string
      room_rate,
      security_deposit,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
      add_ons,
    } = body;

    // Validate required fields
    if (!check_in_date || check_in_date === "") {
      return NextResponse.json(
        { error: "Check-in date is required" },
        { status: 400 }
      );
    }
    if (!check_out_date || check_out_date === "") {
      return NextResponse.json(
        { error: "Check-out date is required" },
        { status: 400 }
      );
    }

    // Upload payment proof to Cloudinary
    let paymentProofUrl = null;
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs"
      );
      paymentProofUrl = uploadResult.url;
    }

    // Upload main guest valid ID to Cloudinary
    let validIdUrl = null;
    if (valid_id) {
      const uploadResult = await upload_file(
        valid_id,
        "staycation-haven/valid-ids"
      );
      validIdUrl = uploadResult.url;
    }

    // Upload additional guests' valid IDs to Cloudinary
    let additionalGuestsWithUrls = [];
    if (additional_guests && additional_guests.length > 0) {
      additionalGuestsWithUrls = await Promise.all(
        additional_guests.map(async (guest: AdditionalGuest) => {
          let guestIdUrl = null;
          if (guest.validId) {
            const uploadResult = await upload_file(
              guest.validId,
              "staycation-haven/valid-ids"
            );
            guestIdUrl = uploadResult.url;
          }
          return {
            firstName: guest.firstName,
            lastName: guest.lastName,
            age: guest.age,
            gender: guest.gender,
            validIdUrl: guestIdUrl,
          };
        })
      );
    }

    const query = `
      INSERT INTO booking (
        booking_id, user_id, guest_first_name, guest_last_name, guest_age, guest_gender,
        guest_email, guest_phone, valid_id_url, additional_guests,
        room_name, check_in_date, check_out_date, check_in_time, check_out_time,
        adults, children, infants, facebook_link, payment_method, payment_proof_url,
        room_rate, security_deposit, add_ons_total, total_amount, down_payment,
        remaining_balance, status, add_ons, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      booking_id,
      user_id || null, // NULL for guest bookings
      guest_first_name,
      guest_last_name,
      guest_age,
      guest_gender,
      guest_email,
      guest_phone,
      validIdUrl,
      JSON.stringify(additionalGuestsWithUrls),
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      facebook_link,
      payment_method,
      paymentProofUrl,
      room_rate,
      security_deposit,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
      "pending", // Default status
      JSON.stringify(add_ons),
    ];

    const result = await pool.query(query, values);
    console.log("✅ Booking Created:", result.rows[0]);

    // Send pending approval email to guest
    try {
      const booking = result.rows[0];

      const emailData = {
        firstName: booking.guest_first_name,
        lastName: booking.guest_last_name,
        email: booking.guest_email,
        bookingId: booking.booking_id,
        roomName: booking.room_name,
        checkInDate: new Date(booking.check_in_date).toLocaleDateString(),
        checkInTime: booking.check_in_time,
        checkOutDate: new Date(booking.check_out_date).toLocaleDateString(),
        checkOutTime: booking.check_out_time,
        guests: `${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants`,
        paymentMethod: booking.payment_method,
        downPayment: booking.down_payment,
        totalAmount: booking.total_amount,
      };

      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-pending-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      if (!emailResponse.ok) {
        console.error('❌ Failed to send pending approval email');
      } else {
        console.log('✅ Pending approval email sent to:', booking.guest_email);
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: "Booking created successfully. Waiting for admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("❌ Error creating booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
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

    let query = "SELECT * FROM booking";
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
  } catch (error) {
    console.log("❌ Error getting bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get bookings",
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
      SELECT
        b.*,
        h.tower,
        COALESCE(
          json_agg(hi.image_url ORDER BY hi.display_order)
          FILTER (WHERE hi.id IS NOT NULL),
          '[]'
        ) as room_images
      FROM booking b
      LEFT JOIN havens h ON b.room_name = h.haven_name
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      WHERE b.id = $1
      GROUP BY b.id, h.tower
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Retrieved booking ${id} with room images`);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.log("❌ Error getting booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get booking",
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
    const {
      id,
      status,
      rejection_reason,
      // editable fields (CSR edit modal)
      guest_first_name,
      guest_last_name,
      guest_age,
      guest_gender,
      guest_email,
      guest_phone,
      facebook_link,
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      payment_method,
      room_rate,
      security_deposit,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
      add_ons,
      additional_guests,
      payment_proof, // base64 (optional)
      valid_id, // base64 (optional)
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID is required",
        },
        { status: 400 }
      );
    }

    // If status is provided, validate it. (Edit modal may update without changing status.)
    const validStatuses = ["pending", "approved", "rejected", "confirmed", "checked-in", "completed", "cancelled"];
    if (typeof status !== "undefined" && status !== null) {
      if (typeof status !== "string" || !validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let i = 1;

    const pushField = (field: string, value: unknown) => {
      if (typeof value === "undefined") return;
      updateFields.push(`${field} = $${i++}`);
      values.push(value);
    };

    // Core editable fields
    pushField("guest_first_name", guest_first_name);
    pushField("guest_last_name", guest_last_name);
    pushField("guest_age", guest_age);
    pushField("guest_gender", guest_gender);
    pushField("guest_email", guest_email);
    pushField("guest_phone", guest_phone);
    pushField("facebook_link", facebook_link);
    pushField("room_name", room_name);
    pushField("check_in_date", check_in_date);
    pushField("check_out_date", check_out_date);
    pushField("check_in_time", check_in_time);
    pushField("check_out_time", check_out_time);
    pushField("adults", adults);
    pushField("children", children);
    pushField("infants", infants);
    pushField("payment_method", payment_method);
    pushField("room_rate", room_rate);
    pushField("security_deposit", security_deposit);
    pushField("add_ons_total", add_ons_total);
    pushField("total_amount", total_amount);
    pushField("down_payment", down_payment);
    pushField("remaining_balance", remaining_balance);
    pushField("add_ons", typeof add_ons === "undefined" ? undefined : JSON.stringify(add_ons));
    pushField("additional_guests", typeof additional_guests === "undefined" ? undefined : JSON.stringify(additional_guests));

    // Status/rejection reason
    pushField("status", status);
    pushField("rejection_reason", rejection_reason ?? null);

    // Optional uploads
    if (payment_proof) {
      const uploadResult = await upload_file(payment_proof, "staycation-haven/payment-proofs");
      pushField("payment_proof_url", uploadResult.url);
    }
    if (valid_id) {
      const uploadResult = await upload_file(valid_id, "staycation-haven/valid-ids");
      pushField("valid_id_url", uploadResult.url);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided to update" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE booking
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${i}
      RETURNING *
    `;

    values.push(id);
    const result = await pool.query(query, values);

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

    // Send confirmation email when booking is approved
    if (status === 'approved') {
      try {
        const booking = result.rows[0];

        // Prepare email data
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: new Date(booking.check_in_date).toLocaleDateString(),
          checkInTime: booking.check_in_time,
          checkOutDate: new Date(booking.check_out_date).toLocaleDateString(),
          checkOutTime: booking.check_out_time,
          guests: `${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants`,
          paymentMethod: booking.payment_method,
          downPayment: booking.down_payment,
          totalAmount: booking.total_amount,
        };

        // Send email via API route
        const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-booking-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          console.error('❌ Failed to send confirmation email');
        } else {
          console.log('✅ Confirmation email sent to:', booking.guest_email);
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: typeof status === "string" ? `Booking ${status} successfully` : "Booking updated successfully",
    });
  } catch (error) {
    console.log("❌ Error updating booking status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update booking status",
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

    const query = `DELETE FROM booking WHERE id = $1 RETURNING *`;
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
  } catch (error) {
    console.log("❌ Error deleting booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete booking",
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
    const status = searchParams.get("status"); // upcoming, past, cancelled, all

    let query = `
      SELECT
        b.*,
        h.tower,
        COALESCE(
          json_agg(hi.image_url ORDER BY hi.display_order)
          FILTER (WHERE hi.id IS NOT NULL),
          '[]'
        ) as room_images
      FROM booking b
      LEFT JOIN havens h ON b.room_name = h.haven_name
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      WHERE b.user_id = $1
    `;

    const values: string[] = [userId];

    // Filter by status if provided
    if (status && status !== "all") {
      if (status === "upcoming") {
        query += ` AND b.status IN ('pending', 'approved', 'confirmed') AND b.check_in_date >= CURRENT_DATE`;
      } else if (status === "past") {
        query += ` AND (b.status = 'completed' OR b.check_out_date < CURRENT_DATE)`;
      } else if (status === "cancelled") {
        query += ` AND b.status = 'cancelled'`;
      } else {
        query += ` AND b.status = $2`;
        values.push(status);
      }
    }

    query += ` GROUP BY b.id, h.tower ORDER BY b.created_at DESC`;

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("❌ Error fetching user bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user bookings",
      },
      { status: 500 }
    );
  }
};

// UPDATE Cleaning Status
export const updateCleaningStatus = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    // URL format: /api/bookings/[id]/cleaning
    const cleaningIndex = segments.indexOf("cleaning");
    const id = cleaningIndex > 0 ? segments[cleaningIndex - 1] : null;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { cleaning_status } = body;

    const validCleaningStatuses = ["pending", "in-progress", "cleaned", "inspected"];
    if (!cleaning_status || !validCleaningStatuses.includes(cleaning_status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid cleaning status. Must be one of: pending, in-progress, cleaned, inspected",
        },
        { status: 400 }
      );
    }

    const query = `
      UPDATE bookings
      SET cleaning_status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [cleaning_status, id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log("✅ Cleaning status updated:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: `Cleaning status updated to ${cleaning_status}`,
    });
  } catch (error) {
    console.log("❌ Error updating cleaning status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update cleaning status",
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
    // Use TRIM to handle any whitespace issues in room_name
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
  } catch (error) {
    console.log("❌ Error fetching room bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch room bookings",
      },
      { status: 500 }
    );
  }
};
