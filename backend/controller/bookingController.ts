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
  has_security_deposit?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(base64Data: string, folder: string): Promise<string | null> {
  try {
    if (!base64Data) return null;
    
    // If it's already a URL, return it
    if (base64Data.startsWith('http')) return base64Data;
    
    const result = await upload_file(base64Data, folder);
    return result.url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

// CREATE Booking with all related tables
export const createBooking = async (req: NextRequest): Promise<NextResponse> => {
  const client = await pool.connect();
  
  try {
    const body = await req.json();
    console.log("📥 createBooking body received");

    const {
      booking_id,
      user_id,
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      // Main guest info
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      guest_age,
      guest_gender,
      facebook_link,
      valid_id, // base64
      // Additional guests
      additional_guests = [],
      // Payment info
      payment_method,
      payment_proof, // base64
      room_rate,
      security_deposit,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
      // Add-ons
      addOns = {},
    } = body;

    // Validate required fields
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
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // 1. Upload images to Cloudinary
    console.log("📤 Uploading images to Cloudinary...");
    const validIdUrl = valid_id ? await uploadToCloudinary(valid_id, 'booking_ids') : null;
    const paymentProofUrl = payment_proof ? await uploadToCloudinary(payment_proof, 'payment_proofs') : null;

    // 2. Insert main booking record
    const bookingQuery = `
      INSERT INTO booking (
        booking_id, user_id, room_name, 
        check_in_date, check_out_date, check_in_time, check_out_time,
        adults, children, infants, 
        status, has_security_deposit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      'pending',
      security_deposit > 0,
    ];

    const bookingResult = await client.query(bookingQuery, bookingValues);
    const newBooking = bookingResult.rows[0];
    console.log("✅ Booking created with ID:", newBooking.id);

    // 3. Insert main guest into booking_guests
    const mainGuestQuery = `
      INSERT INTO booking_guests (
        booking_id, first_name, last_name, email, phone, 
        facebook_link, valid_id_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const mainGuestValues = [
      newBooking.id,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      facebook_link || null,
      validIdUrl,
    ];

    await client.query(mainGuestQuery, mainGuestValues);
    console.log("✅ Main guest added");

    // 4. Insert additional guests
    if (additional_guests && additional_guests.length > 0) {
      for (const guest of additional_guests) {
        // Upload guest's valid ID if exists
        const guestIdUrl = guest.validId 
          ? await uploadToCloudinary(guest.validId, 'booking_ids') 
          : null;

        const additionalGuestQuery = `
          INSERT INTO booking_guests (
            booking_id, first_name, last_name, email, phone, valid_id_url
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        await client.query(additionalGuestQuery, [
          newBooking.id,
          guest.firstName || guest.first_name,
          guest.lastName || guest.last_name,
          guest_email, // Use main guest's email for additional guests
          guest_phone, // Use main guest's phone for additional guests
          guestIdUrl,
        ]);
      }
      console.log(`✅ ${additional_guests.length} additional guest(s) added`);
    }

    // 5. Insert payment record
    const paymentQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url,
        room_rate, add_ons_total, total_amount,
        down_payment, remaining_balance, payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const paymentValues = [
      newBooking.id,
      payment_method || 'gcash',
      paymentProofUrl,
      room_rate || 0,
      add_ons_total || 0,
      total_amount || 0,
      down_payment || 0,
      remaining_balance || 0,
      'pending',
    ];

    await client.query(paymentQuery, paymentValues);
    console.log("✅ Payment record created");

    // 6. Insert security deposit if applicable
    if (security_deposit > 0) {
      const depositQuery = `
        INSERT INTO booking_security_deposits (
          booking_id, amount, deposit_status,
          payment_method, payment_proof_url
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      await client.query(depositQuery, [
        newBooking.id,
        security_deposit,
        'pending',
        payment_method || 'gcash',
        paymentProofUrl,
      ]);
      console.log("✅ Security deposit record created");
    }

    // 7. Insert add-ons
    const addOnMapping: Record<string, string> = {
      poolPass: 'Pool Pass',
      towels: 'Towels',
      bathRobe: 'Bath Robe',
      extraComforter: 'Extra Comforter',
      guestKit: 'Guest Kit',
      extraSlippers: 'Extra Slippers',
    };

    const addOnPrices: Record<string, number> = {
      poolPass: 100,
      towels: 50,
      bathRobe: 150,
      extraComforter: 100,
      guestKit: 75,
      extraSlippers: 30,
    };

    if (addOns && typeof addOns === 'object') {
      for (const [key, quantity] of Object.entries(addOns)) {
        if (quantity && typeof quantity === 'number' && quantity > 0) {
          const addOnName = addOnMapping[key] || key;
          const price = addOnPrices[key] || 0;

          const addOnQuery = `
            INSERT INTO booking_add_ons (
              booking_id, name, price, quantity, status
            )
            VALUES ($1, $2, $3, $4, $5)
          `;

          await client.query(addOnQuery, [
            newBooking.id,
            addOnName,
            price,
            quantity,
            'pending',
          ]);
        }
      }
      console.log("✅ Add-ons inserted");
    }

    // 8. Initialize cleaning record
    const cleaningQuery = `
      INSERT INTO booking_cleaning (
        booking_id, cleaning_status
      )
      VALUES ($1, $2)
    `;

    await client.query(cleaningQuery, [newBooking.id, 'pending']);
    console.log("✅ Cleaning record initialized");

    await client.query('COMMIT');
    console.log("✅ Transaction completed successfully");

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
    console.error('❌ Error in createBooking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create booking',
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
};

// GET All Bookings with related data
export const getAllBookings = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `
      SELECT 
        b.*,
        -- Get main guest info (first guest record)
        (SELECT first_name FROM booking_guests WHERE booking_id = b.id LIMIT 1) as guest_first_name,
        (SELECT last_name FROM booking_guests WHERE booking_id = b.id LIMIT 1) as guest_last_name,
        (SELECT email FROM booking_guests WHERE booking_id = b.id LIMIT 1) as guest_email,
        (SELECT phone FROM booking_guests WHERE booking_id = b.id LIMIT 1) as guest_phone,
        -- Payment info
        p.total_amount,
        p.remaining_balance,
        p.payment_status,
        -- Add-ons count
        (SELECT COUNT(*) FROM booking_add_ons WHERE booking_id = b.id) as add_ons_count
      FROM booking b
      LEFT JOIN booking_payments p ON b.id = p.booking_id
    `;
    
    let values: any[] = [];

    if (status) {
      query += " WHERE b.status = $1";
      values.push(status);
    }

    query += " ORDER BY b.created_at DESC";

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error("❌ Error getting bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get bookings",
      },
      { status: 500 }
    );
  }
};

// GET Booking by ID with ALL related data
export const getBookingById = async (req: NextRequest): Promise<NextResponse> => {
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

    // ✅ FIXED: Added ::uuid casting
    const bookingQuery = `
      SELECT * FROM booking
      WHERE id::text = $1 OR booking_id = $1
      LIMIT 1
    `;
    const bookingResult = await pool.query(bookingQuery, [id]);

    if (bookingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = bookingResult.rows[0];

    // Get all guests
    const guestsQuery = `
      SELECT * FROM booking_guests
      WHERE booking_id = $1
      ORDER BY created_at ASC
    `;
    const guestsResult = await pool.query(guestsQuery, [booking.id]);

    // Get payment info
    const paymentQuery = `
      SELECT * FROM booking_payments
      WHERE booking_id = $1
      LIMIT 1
    `;
    const paymentResult = await pool.query(paymentQuery, [booking.id]);

    // Get security deposit
    const depositQuery = `
      SELECT * FROM booking_security_deposits
      WHERE booking_id = $1
      LIMIT 1
    `;
    const depositResult = await pool.query(depositQuery, [booking.id]);

    // Get add-ons
    const addOnsQuery = `
      SELECT * FROM booking_add_ons
      WHERE booking_id = $1
      ORDER BY name ASC
    `;
    const addOnsResult = await pool.query(addOnsQuery, [booking.id]);

    // Get cleaning info
    const cleaningQuery = `
      SELECT * FROM booking_cleaning
      WHERE booking_id = $1
      LIMIT 1
    `;
    const cleaningResult = await pool.query(cleaningQuery, [booking.id]);

    // Combine all data
    const completeBooking = {
      ...booking,
      guests: guestsResult.rows,
      main_guest: guestsResult.rows[0] || null,
      additional_guests: guestsResult.rows.slice(1),
      payment: paymentResult.rows[0] || null,
      security_deposit: depositResult.rows[0] || null,
      add_ons: addOnsResult.rows,
      cleaning: cleaningResult.rows[0] || null,
    };

    console.log(`✅ Retrieved complete booking data for ${id}`);

    return NextResponse.json({
      success: true,
      data: completeBooking,
    });
  } catch (error: any) {
    console.error("❌ Error getting booking:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get booking" },
      { status: 500 }
    );
  }
};

// UPDATE Booking Status
export const updateBookingStatus = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { id, status, rejection_reason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Booking ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending", "approved", "rejected", "confirmed",
      "checked-in", "completed", "cancelled",
    ];
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Added ::uuid casting
    const query = `
      UPDATE booking
      SET status = $1, rejection_reason = $2, updated_at = NOW()
      WHERE id::text = $3 OR booking_id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [status, rejection_reason || null, id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
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
    console.error("❌ Error updating booking status:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update booking status" },
      { status: 500 }
    );
  }
};

// DELETE Booking (cascades to all related tables)
export const deleteBooking = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // ✅ FIXED: Added ::uuid casting
    const query = `
      DELETE FROM booking 
      WHERE id::text = $1 OR booking_id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    console.log("✅ Booking deleted (cascade):", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting booking:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete booking" },
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

    // ✅ FIXED: Added ::uuid casting
    let query = `
      SELECT 
        b.*,
        (SELECT first_name FROM booking_guests WHERE booking_id = b.id LIMIT 1) as guest_first_name,
        (SELECT last_name FROM booking_guests WHERE booking_id = b.id LIMIT 1) as guest_last_name,
        p.total_amount,
        p.remaining_balance
      FROM booking b
      LEFT JOIN booking_payments p ON b.id = p.booking_id
      WHERE b.user_id = $1::uuid
    `;

    const values: any[] = [userId];

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

    query += ` ORDER BY b.created_at DESC`;

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} bookings for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error("❌ Error fetching user bookings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user bookings" },
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

    // Get all active bookings for this room
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
    console.error("❌ Error fetching room bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch room bookings",
      },
      { status: 500 }
    );
  }
};