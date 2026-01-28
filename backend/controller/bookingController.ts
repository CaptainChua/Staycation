import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";

const BOOKING_TABLE = (() => {
  const raw = (process.env.BOOKING_TABLE_NAME || "booking").trim();
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) return raw;
  console.warn("Invalid BOOKING_TABLE_NAME, defaulting to 'booking'");
  return "booking";
})();

// Add-on prices
const ADD_ON_PRICES = {
  poolPass: 100,
  towels: 50,
  bathRobe: 150,
  extraComforter: 100,
  guestKit: 75,
  extraSlippers: 30,
};

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

 let ensureBookingsColumnsPromise: Promise<void> | null = null;

 const ensureBookingsColumns = async (): Promise<void> => {
   if (ensureBookingsColumnsPromise) return ensureBookingsColumnsPromise;
   ensureBookingsColumnsPromise = (async () => {
    await pool.query(`ALTER TABLE ${BOOKING_TABLE} ADD COLUMN IF NOT EXISTS guest_age INTEGER`);
    await pool.query(`ALTER TABLE ${BOOKING_TABLE} ADD COLUMN IF NOT EXISTS guest_gender VARCHAR(20)`);
    await pool.query(`ALTER TABLE ${BOOKING_TABLE} ADD COLUMN IF NOT EXISTS valid_id_url TEXT`);
    await pool.query(`ALTER TABLE ${BOOKING_TABLE} ADD COLUMN IF NOT EXISTS additional_guests JSONB`);
  })();
   return ensureBookingsColumnsPromise;
 };

// CREATE Booking
export const createBooking = async (
  req: NextRequest
): Promise<NextResponse> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
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

    const missing: string[] = [];
    if (!booking_id) missing.push("booking_id");
    if (!guest_first_name) missing.push("guest_first_name");
    if (!guest_last_name) missing.push("guest_last_name");
    if (!guest_email) missing.push("guest_email");
    if (!guest_phone) missing.push("guest_phone");
    if (!check_in_date) missing.push("check_in_date");
    if (!check_out_date) missing.push("check_out_date");
    if (!check_in_time) missing.push("check_in_time");
    if (!check_out_time) missing.push("check_out_time");
    if (!payment_method) missing.push("payment_method");
    if (room_rate === null || typeof room_rate === "undefined") missing.push("room_rate");
    if (total_amount === null || typeof total_amount === "undefined") missing.push("total_amount");
    if (down_payment === null || typeof down_payment === "undefined") missing.push("down_payment");
    if (remaining_balance === null || typeof remaining_balance === "undefined") missing.push("remaining_balance");

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Create main booking record
    const bookingQuery = `
      INSERT INTO booking (
        booking_id, user_id, room_name, check_in_date, check_out_date,
        check_in_time, check_out_time, adults, children, infants,
        status, has_security_deposit, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const bookingValues = [
      booking_id,
      user_id || null, // NULL for guest bookings
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      typeof adults === "undefined" || adults === null ? 1 : adults,
      typeof children === "undefined" || children === null ? 0 : children,
      typeof infants === "undefined" || infants === null ? 0 : infants,
      "pending", // Default status
      typeof security_deposit === "undefined" || security_deposit === null ? false : security_deposit > 0,
    ];

    const bookingResult = await client.query(bookingQuery, bookingValues);
    const createdBooking = bookingResult.rows[0];

    // Upload payment proof to Cloudinary
    let paymentProofUrl = null;
    if (payment_proof) {
      try {
        const uploadResult = await upload_file(
          payment_proof,
          "staycation-haven/payment-proofs"
        );
        paymentProofUrl = uploadResult.url;
      } catch (err: unknown) {
        const e = err as { message?: string; http_code?: number; name?: string };
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload payment proof.",
            details: { message: e?.message, name: e?.name, http_code: e?.http_code },
          },
          { status: 500 }
        );
      }
    }

    // Create payment record
    const paymentQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url, room_rate, add_ons_total,
        total_amount, down_payment, remaining_balance, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

    const paymentValues = [
      createdBooking.id,
      payment_method,
      paymentProofUrl,
      room_rate,
      typeof add_ons_total === "undefined" || add_ons_total === null ? 0 : add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
    ];

    await client.query(paymentQuery, paymentValues);

    // Upload main guest valid ID to Cloudinary
    let validIdUrl = null;
    if (valid_id) {
      try {
        const uploadResult = await upload_file(
          valid_id,
          "staycation-haven/valid-ids"
        );
        validIdUrl = uploadResult.url;
      } catch (err: unknown) {
        const e = err as { message?: string; http_code?: number; name?: string };
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload valid ID.",
            details: { message: e?.message, name: e?.name, http_code: e?.http_code },
          },
          { status: 500 }
        );
      }
    }

    // Create main guest record
    const guestQuery = `
      INSERT INTO booking_guests (
        booking_id, first_name, last_name, email, phone, facebook_link, valid_id_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const guestValues = [
      createdBooking.id,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      facebook_link || null,
      validIdUrl,
    ];

    await client.query(guestQuery, guestValues);

    // Create additional guest records if any
    if (additional_guests && additional_guests.length > 0) {
      for (const guest of additional_guests) {
        let guestIdUrl = null;
        if (guest.validId) {
          try {
            const uploadResult = await upload_file(
              guest.validId,
              "staycation-haven/valid-ids"
            );
            guestIdUrl = uploadResult.url;
          } catch (err) {
            console.error("Failed to upload additional guest ID:", err);
          }
        }

        const additionalGuestQuery = `
          INSERT INTO booking_guests (
            booking_id, first_name, last_name, email, phone, valid_id_url
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(additionalGuestQuery, [
          createdBooking.id,
          guest.firstName,
          guest.lastName,
          guest.email || guest_email, // Use main guest email if not provided
          guest.phone || guest_phone, // Use main guest phone if not provided
          guestIdUrl,
        ]);
      }
    }

    // Create add-on records if any
    if (add_ons && typeof add_ons === 'object') {
      for (const [name, item] of Object.entries(add_ons)) {
        if (item && typeof item === 'object' && 'quantity' in item && (item as any).quantity > 0) {
          const addOnQuery = `
            INSERT INTO booking_add_ons (
              booking_id, name, price, quantity
            )
            VALUES ($1, $2, $3, $4)
          `;

          await client.query(addOnQuery, [
            createdBooking.id,
            name,
            (item as any).price || 0,
            (item as any).quantity || 1,
          ]);
        }
      }
    }

    // Create security deposit record if applicable
    if (security_deposit && security_deposit > 0) {
      const depositQuery = `
        INSERT INTO booking_security_deposits (
          booking_id, amount, deposit_status
        )
        VALUES ($1, $2, 'pending')
      `;

      await client.query(depositQuery, [
        createdBooking.id,
        security_deposit,
      ]);
    }

    await client.query('COMMIT');
    console.log("✅ Booking Created:", createdBooking);

    // Send pending approval email to guest
    try {
      const emailData = {
        firstName: guest_first_name,
        lastName: guest_last_name,
        email: guest_email,
        bookingId: booking_id,
        roomName: room_name,
        checkInDate: new Date(check_in_date).toLocaleDateString(),
        checkInTime: check_in_time,
        checkOutDate: new Date(check_out_date).toLocaleDateString(),
        checkOutTime: check_out_time,
        guests: `${adults} Adults, ${children || 0} Children, ${infants || 0} Infants`,
        paymentMethod: payment_method,
        downPayment: down_payment,
        totalAmount: total_amount,
      };

      const emailResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-pending-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send pending email:', await emailResponse.text());
      } else {
        console.log('✅ Pending approval email sent to:', guest_email);
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Booking created successfully!",
      data: createdBooking,
    });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error("❌ Booking Creation Error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking",
        details: errorMessage,
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
};

// GET All Bookings
export const getAllBookings = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `SELECT * FROM ${BOOKING_TABLE}`;
    const values: string[] = [];

    if (status && status !== "all") {
      query += " WHERE status = $1";
      values.push(status);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings from ${BOOKING_TABLE}`);

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

    const query = `SELECT * FROM ${BOOKING_TABLE} WHERE id = $1 LIMIT 1`;

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
    await ensureBookingsColumns();
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

    const idParamIndex = i++;
    values.push(id);

    const query = `
      UPDATE ${BOOKING_TABLE}
      SET ${updateFields.join(", ")}, updated_at = NOW()
      WHERE id = $${idParamIndex}
      RETURNING *
    `;

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

    const query = `DELETE FROM ${BOOKING_TABLE} WHERE id = $1 RETURNING *`;
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

    let query = `SELECT * FROM ${BOOKING_TABLE} WHERE user_id = $1`;

    const values: string[] = [userId];

    // Filter by status if provided
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
    console.log('Sample booking data with guest info:', result.rows[0]); // Debug: Log first booking to see structure

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
      UPDATE ${BOOKING_TABLE}
      SET cleaning_status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const cleaningResult = await pool.query(query, [cleaning_status, id]);

    if (cleaningResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking cleaning record not found" },
        { status: 404 }
      );
    }

    // Get the complete booking data for response
    const bookingQuery = `SELECT * FROM ${BOOKING_TABLE} WHERE id = $1 LIMIT 1`;
    const bookingResult = await pool.query(bookingQuery, [id]);

    console.log("✅ Cleaning status updated:", cleaningResult.rows[0]);

    return NextResponse.json({
      success: true,
      data: bookingResult.rows[0],
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

    // Get all active bookings for this room from the new booking table
    // Use TRIM to handle any whitespace issues in room_name
    // Only block dates for bookings with status: approved, confirmed, checked-in
    // Don't block dates for pending, rejected, cancelled, completed bookings
    const query = `
      SELECT
        id,
        booking_id,
        check_in_date,
        check_out_date,
        status,
        room_name
      FROM ${BOOKING_TABLE}
      WHERE TRIM(room_name) = $1
        AND status IN ('approved', 'confirmed', 'checked-in')
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
