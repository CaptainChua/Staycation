import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";

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

    // Step 1: Create main booking record
    const bookingQuery = `
      INSERT INTO booking (
        booking_id, user_id, room_name, check_in_date, check_out_date, 
        check_in_time, check_out_time, adults, children, infants, status,
        has_security_deposit, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, NOW(), NOW())
      RETURNING id
    `;

    const bookingValues = [
      booking_id,
      user_id || null, // NULL for guest bookings
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      security_deposit > 0, // has_security_deposit flag
    ];

    const bookingResult = await client.query(bookingQuery, bookingValues);
    const bookingId = bookingResult.rows[0].id;

    // Step 2: Create main guest record
    let validIdUrl = null;
    if (valid_id) {
      const uploadResult = await upload_file(
        valid_id,
        "staycation-haven/valid-ids"
      );
      validIdUrl = uploadResult.url;
    }

    const mainGuestQuery = `
      INSERT INTO booking_guests (
        booking_id, first_name, last_name, email, phone, facebook_link, valid_id_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const mainGuestValues = [
      bookingId,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      facebook_link || null,
      validIdUrl,
    ];

    await client.query(mainGuestQuery, mainGuestValues);

    // Step 3: Create additional guests records
    if (additional_guests && additional_guests.length > 0) {
      for (const guest of additional_guests) {
        let guestIdUrl = null;
        if (guest.validId) {
          const uploadResult = await upload_file(
            guest.validId,
            "staycation-haven/valid-ids"
          );
          guestIdUrl = uploadResult.url;
        }

        const additionalGuestQuery = `
          INSERT INTO booking_guests (
            booking_id, first_name, last_name, email, phone, facebook_link, valid_id_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        const additionalGuestValues = [
          bookingId,
          guest.firstName,
          guest.lastName,
          guest.email || guest_email, // Use main guest email if not provided
          guest.phone || guest_phone, // Use main guest phone if not provided
          null, // Facebook link for additional guests
          guestIdUrl,
        ];

        await client.query(additionalGuestQuery, additionalGuestValues);
      }
    }

    // Step 4: Create payment record (without security deposit)
    let paymentProofUrl = null;
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs"
      );
      paymentProofUrl = uploadResult.url;
    }

    // Calculate payment amounts (security deposit is handled separately during checkout)
    const paymentTotalAmount = total_amount; // Full amount during booking (security deposit handled at checkout)
    const paymentRemainingBalance = paymentTotalAmount - down_payment;

    const paymentQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url, room_rate, 
        add_ons_total, total_amount, down_payment, remaining_balance
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const paymentValues = [
      bookingId,
      payment_method,
      paymentProofUrl,
      room_rate,
      add_ons_total,
      paymentTotalAmount,
      down_payment,
      paymentRemainingBalance,
    ];

    await client.query(paymentQuery, paymentValues);

    // Step 4.5: Create security deposit record (always create with 0 amount during booking)
    const depositQuery = `
      INSERT INTO booking_security_deposits (
        booking_id, amount, deposit_status, held_at
      )
      VALUES ($1, 0, 'pending', NOW())
    `;

    const depositValues = [
      bookingId
    ];

    await client.query(depositQuery, depositValues);

    // Step 5: Create add-ons records
    if (add_ons && Object.keys(add_ons).length > 0) {
      for (const [name, quantity] of Object.entries(add_ons)) {
        const quantityNum = Number(quantity);
        if (quantityNum > 0) {
          const addOnPrice = ADD_ON_PRICES[name as keyof typeof ADD_ON_PRICES] || 0;
          
          const addOnQuery = `
            INSERT INTO booking_add_ons (booking_id, name, price, quantity)
            VALUES ($1, $2, $3, $4)
          `;

          const addOnValues = [
            bookingId,
            name,
            addOnPrice,
            quantityNum,
          ];

          await client.query(addOnQuery, addOnValues);
        }
      }
    }

    // Step 6: Create cleaning record
    const cleaningQuery = `
      INSERT INTO booking_cleaning (booking_id, cleaning_status)
      VALUES ($1, 'pending')
    `;

    await client.query(cleaningQuery, [bookingId]);

    await client.query('COMMIT');

    // Get the complete booking data for response
    const completeBookingQuery = `
      SELECT 
        b.*,
        bg.first_name,
        bg.last_name,
        bg.email,
        bg.phone,
        bg.valid_id_url,
        bp.payment_method,
        bp.total_amount,
        bp.down_payment
      FROM booking b
      JOIN booking_guests bg ON b.id = bg.booking_id
      JOIN booking_payments bp ON b.id = bp.booking_id
      WHERE b.id = $1
      LIMIT 1
    `;

    const completeResult = await client.query(completeBookingQuery, [bookingId]);
    console.log("✅ Booking Created with separated tables:", completeResult.rows[0]);

    // Send pending approval email to guest
    try {
      const booking = completeResult.rows[0];

      const emailData = {
        firstName: booking.first_name,
        lastName: booking.last_name,
        email: booking.email,
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
        console.log('✅ Pending approval email sent to:', booking.email);
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        data: completeResult.rows[0],
        message: "Booking created successfully. Waiting for admin approval.",
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.log("❌ Error creating booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
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

    let query = `
      SELECT 
        b.*,
        bg.first_name,
        bg.last_name,
        bg.email,
        bg.phone,
        bg.valid_id_url,
        bp.payment_method,
        bp.total_amount,
        bp.down_payment,
        bc.cleaning_status
      FROM booking b
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN booking_cleaning bc ON b.id = bc.booking_id
      WHERE bg.id = (
        SELECT MIN(id) FROM booking_guests WHERE booking_id = b.id
      )
    `;
    const values: string[] = [];

    if (status) {
      query += " AND b.status = $1";
      values.push(status);
    }

    query += " ORDER BY b.created_at DESC";

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings from separated tables`);

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
        h.uuid_id as haven_id,
        bp.total_amount,
        bp.down_payment,
        bp.remaining_balance,
        bp.payment_method,
        bp.room_rate,
        bp.add_ons_total,
        COALESCE(bd.amount, 0) as security_deposit,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'name', ba.name,
                'price', ba.price,
                'quantity', ba.quantity
              ) ORDER BY ba.id
            ),
            '[]'
          ) as add_ons
          FROM booking_add_ons ba 
          WHERE ba.booking_id = b.id
        ) as add_ons,
        COALESCE(
          json_agg(hi.image_url ORDER BY hi.display_order)
          FILTER (WHERE hi.id IS NOT NULL),
          '[]'
        ) as room_images
      FROM booking b
      LEFT JOIN havens h ON b.room_name = h.haven_name
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN booking_security_deposits bd ON b.id = bd.booking_id
      WHERE b.id = $1
      GROUP BY b.id, h.tower, h.uuid_id, bp.total_amount, bp.down_payment, bp.remaining_balance, bp.payment_method, bp.room_rate, bp.add_ons_total, bg.first_name, bg.last_name, bg.email, bg.phone, bd.amount
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
      SET status = $1, rejection_reason = $2, updated_at = NOW()
      WHERE id = $3
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

    // Get booking details with guest info for email
    const bookingDetailsQuery = `
      SELECT 
        b.*,
        bg.first_name,
        bg.last_name,
        bg.email,
        bg.valid_id_url,
        bp.payment_method,
        bp.total_amount,
        bp.down_payment
      FROM booking b
      JOIN booking_guests bg ON b.id = bg.booking_id
      JOIN booking_payments bp ON b.id = bp.booking_id
      WHERE b.id = $1 AND bg.id = (
        SELECT MIN(id) FROM booking_guests WHERE booking_id = b.id
      )
      LIMIT 1
    `;

    const bookingDetailsResult = await pool.query(bookingDetailsQuery, [id]);

    // Send confirmation email when booking is approved
    if (status === 'approved' && bookingDetailsResult.rows.length > 0) {
      try {
        const booking = bookingDetailsResult.rows[0];

        // Prepare email data
        const emailData = {
          firstName: booking.first_name,
          lastName: booking.last_name,
          email: booking.email,
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
          console.log('✅ Confirmation email sent to:', booking.email);
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
        h.uuid_id as haven_id,
        bp.total_amount,
        bp.down_payment,
        bp.remaining_balance,
        bp.payment_method,
        bp.room_rate,
        bp.add_ons_total,
        COALESCE(bd.amount, 0) as security_deposit,
        EXISTS(SELECT 1 FROM reviews r WHERE r.booking_id = b.id) as has_reviewed,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        COALESCE(
          json_agg(hi.image_url ORDER BY hi.display_order)
          FILTER (WHERE hi.id IS NOT NULL),
          '[]'
        ) as room_images
      FROM booking b
      LEFT JOIN havens h ON b.room_name = h.haven_name
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN booking_security_deposits bd ON b.id = bd.booking_id
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

    query += ` GROUP BY b.id, h.tower, h.uuid_id, bp.total_amount, bp.down_payment, bp.remaining_balance, bp.payment_method, bp.room_rate, bp.add_ons_total, bg.first_name, bg.last_name, bg.email, bd.amount ORDER BY b.created_at DESC`;

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

    // Update the cleaning status in the booking_cleaning table
    const cleaningQuery = `
      UPDATE booking_cleaning
      SET cleaning_status = $1,
          cleaned_at = CASE WHEN $1 = 'cleaned' THEN NOW() ELSE cleaned_at END,
          inspected_at = CASE WHEN $1 = 'inspected' THEN NOW() ELSE inspected_at END
      WHERE booking_id = $2
      RETURNING *
    `;

    const cleaningResult = await pool.query(cleaningQuery, [cleaning_status, id]);

    if (cleaningResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking cleaning record not found" },
        { status: 404 }
      );
    }

    // Get the complete booking data for response
    const bookingQuery = `
      SELECT 
        b.*,
        bg.first_name,
        bg.last_name,
        bg.email,
        bg.phone,
        bg.valid_id_url,
        bp.payment_method,
        bp.total_amount,
        bc.cleaning_status
      FROM booking b
      JOIN booking_guests bg ON b.id = bg.booking_id
      JOIN booking_payments bp ON b.id = bp.booking_id
      JOIN booking_cleaning bc ON b.id = bc.booking_id
      WHERE b.id = $1 AND bg.id = (
        SELECT MIN(id) FROM booking_guests WHERE booking_id = b.id
      )
      LIMIT 1
    `;

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
      FROM booking
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
