import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";

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
  add_ons?: any;
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
        additional_guests.map(async (guest: any) => {
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
      INSERT INTO bookings (
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
  } catch (error: any) {
    console.log("❌ Error creating booking:", error);
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

    let query = "SELECT * FROM bookings";
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

    const query = `SELECT * FROM bookings WHERE id = $1 LIMIT 1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

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
      UPDATE bookings
      SET status = $1, rejection_reason = $2, updated_at = NOW()
      WHERE id = $3
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

    const query = `DELETE FROM bookings WHERE id = $1 RETURNING *`;
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
