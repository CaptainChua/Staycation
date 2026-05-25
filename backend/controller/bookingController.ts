import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";
import { createCalendarEvent, createCalendarEventWithResult, CalendarEventData } from "../utils/googleCalendar";

// Add-on prices
const ADD_ON_PRICES = {
  poolPass: 100,
  towels: 50,
  bathRobe: 150,
  extraComforter: 100,
  guestKit: 75,
  extraSlippers: 30,
};

export const updateBookingDetails = async (
  req: NextRequest,
): Promise<NextResponse> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const body = await req.json();
    const {
      id,
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      adults,
      children,
      infants,
      status,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      guest_age,
      guest_gender,
      facebook_link,
      valid_id,
      valid_id_url,
      additional_guests,
      payment_method,
      payment_proof,
      room_rate,
      add_ons_total,
      total_amount,
      down_payment,
      add_ons,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 },
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
    if (typeof status !== "undefined" && status !== null) {
      if (typeof status !== "string" || !validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 },
        );
      }
    }

    await client.query(
      `
        UPDATE booking
        SET room_name = $1,
            check_in_date = $2,
            check_out_date = $3,
            check_in_time = $4,
            check_out_time = $5,
            adults = $6,
            children = $7,
            infants = $8,
            status = COALESCE($9, status),
            updated_at = NOW()
        WHERE id = $10
      `,
      [
        room_name,
        check_in_date,
        check_out_date,
        check_in_time,
        check_out_time,
        adults,
        children,
        infants,
        status ?? null,
        id,
      ],
    );

    let mainValidIdUrl: string | null = null;
    if (valid_id) {
      const uploadResult = await upload_file(
        valid_id,
        "staycation-haven/valid-ids",
      );
      mainValidIdUrl = uploadResult.url;
    } else if (typeof valid_id_url === "string" && valid_id_url.trim()) {
      mainValidIdUrl = valid_id_url;
    }

    const allGuests: any[] = [];
    allGuests.push({
      firstName: guest_first_name,
      lastName: guest_last_name,
      age: guest_age ?? null,
      gender: guest_gender ?? null,
      email: guest_email,
      phone: guest_phone,
      facebook_link: facebook_link || null,
      validId: null,
      valid_id_url: mainValidIdUrl,
    });
    if (Array.isArray(additional_guests)) {
      for (const g of additional_guests) {
        let guestIdUrl: string | null = null;
        if (g?.validId) {
          const uploadResult = await upload_file(
            g.validId,
            "staycation-haven/valid-ids",
          );
          guestIdUrl = uploadResult.url;
        } else if (
          typeof g?.valid_id_url === "string" &&
          g.valid_id_url.trim()
        ) {
          guestIdUrl = g.valid_id_url;
        }
        allGuests.push({
          firstName: g?.firstName,
          lastName: g?.lastName,
          age: (g?.age != null && g.age !== '' && Number(g.age) > 0) ? Number(g.age) : null,
          gender: g?.gender ?? null,
          email: g?.email || guest_email,
          phone: g?.phone || guest_phone,
          facebook_link: null,
          validId: null,
          valid_id_url: guestIdUrl,
        });
      }
    }

    await client.query(`DELETE FROM booking_guests WHERE booking_id = $1`, [
      id,
    ]);
    for (const g of allGuests) {
      await client.query(
        `
          INSERT INTO booking_guests (
            booking_id, first_name, last_name, age, gender, email, phone, facebook_link, valid_id_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          id,
          g.firstName,
          g.lastName,
          g.age ?? null,
          g.gender ?? null,
          g.email,
          g.phone,
          g.facebook_link,
          g.valid_id_url,
        ],
      );
    }

    let paymentProofUrl: string | null = null;
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs",
      );
      paymentProofUrl = uploadResult.url;
    }

    // Keep amount_paid consistent with the initial down payment.
    // remaining_balance is computed/managed by the DB schema in this project.
    const paymentAmountPaid = Number(down_payment ?? 0);

    const paymentUpdateRes = await client.query(
      `
        UPDATE booking_payments
        SET payment_method = $1,
            payment_proof_url = COALESCE($2, payment_proof_url),
            room_rate = $3,
            add_ons_total = $4,
            total_amount = $5,
            down_payment = $6,
            amount_paid = $7
        WHERE booking_id = $8
        RETURNING id
      `,
      [
        payment_method,
        paymentProofUrl,
        room_rate,
        add_ons_total,
        total_amount,
        down_payment,
        paymentAmountPaid,
        id,
      ],
    );

    if (paymentUpdateRes.rows.length === 0) {
      await client.query(
        `
          INSERT INTO booking_payments (
            booking_id, payment_method, payment_proof_url, room_rate,
            add_ons_total, total_amount, down_payment, amount_paid
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          id,
          payment_method,
          paymentProofUrl,
          room_rate,
          add_ons_total,
          total_amount,
          down_payment,
          paymentAmountPaid,
        ],
      );
    }

    await client.query(`DELETE FROM booking_add_ons WHERE booking_id = $1`, [
      id,
    ]);
    // Accept two shapes:
    //   1. Array<{ name, price, quantity }> — new per-haven rentable-items flow (price from the catalog).
    //   2. Record<string, number> — legacy hardcoded add-on keys, priced from ADD_ON_PRICES.
    if (Array.isArray(add_ons)) {
      for (const item of add_ons as Array<{ name?: string; price?: number | string; quantity?: number | string }>) {
        const quantityNum = Number(item?.quantity || 0);
        if (quantityNum > 0) {
          await client.query(
            `INSERT INTO booking_add_ons (booking_id, name, price, quantity)
             VALUES ($1, $2, $3, $4)`,
            [id, String(item.name || ""), Number(item.price || 0), quantityNum],
          );
        }
      }
    } else if (add_ons && typeof add_ons === "object") {
      for (const [name, quantity] of Object.entries(add_ons)) {
        const quantityNum = Number(quantity);
        if (quantityNum > 0) {
          const addOnPrice =
            ADD_ON_PRICES[name as keyof typeof ADD_ON_PRICES] || 0;
          await client.query(
            `
              INSERT INTO booking_add_ons (booking_id, name, price, quantity)
              VALUES ($1, $2, $3, $4)
            `,
            [id, name, addOnPrice, quantityNum],
          );
        }
      }
    }

    await client.query("COMMIT");

    const refreshed = await pool.query(
      `
        SELECT
          b.*,
          bg.first_name as guest_first_name,
          bg.last_name as guest_last_name,
          bg.email as guest_email,
          bg.phone as guest_phone,
          bg.valid_id_url,
          bp.total_amount,
          bp.down_payment,
          bp.amount_paid,
          bp.payment_method,
          bp.payment_proof_url,
          bp.room_rate,
          bp.add_ons_total
        FROM booking b
        LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        LEFT JOIN booking_payments bp ON b.id = bp.booking_id
        WHERE b.id = $1 AND bg.id = (
          SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
        )
        LIMIT 1
      `,
      [id],
    );

    return NextResponse.json({
      success: true,
      data: refreshed.rows[0],
      message: "Booking updated successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update booking",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
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
  add_ons?: AddOnItem[];
  created_at?: string;
  updated_at?: string;
}

// CREATE Booking
export const createBooking = async (
  req: NextRequest,
): Promise<NextResponse> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const body = await req.json();
    console.log("📥 [BOOKING] createBooking body received");
    console.log("📋 [BOOKING] Booking ID:", body.booking_id);
    console.log("📋 [BOOKING] Guest:", `${body.guest_first_name} ${body.guest_last_name}`);
    console.log("📋 [BOOKING] Dates:", `${body.check_in_date} to ${body.check_out_date}`);
    console.log("📋 [BOOKING] Room:", body.room_name);
    console.log("📋 [BOOKING] Amount:", body.total_amount);

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
      // Add-ons (frontend sends snake_case `add_ons`)
      add_ons: addOns = {},
    } = body;

    // --- GENERAL ROOM AVAILABILITY CHECK (time-aware) ---
    // '00:00' checkout means end-of-day midnight, so treat it as the start of the next day.
    // Only active bookings block a new one — completed, checked-out, rejected, cancelled, declined do not.
    const availabilityCheckQuery = `
      SELECT b.id, b.booking_id
      FROM booking b
      WHERE b.room_name = $1
        AND b.status IN ('pending', 'approved', 'confirmed', 'checked-in', 'on-going')
        AND (b.check_in_date::DATE + b.check_in_time::TIME) <
            CASE WHEN $5 = '00:00'
                 THEN ($4::DATE + INTERVAL '1 day')::TIMESTAMP
                 ELSE ($4::DATE + $5::TIME)::TIMESTAMP
            END
        AND (
            CASE WHEN b.check_out_time = '00:00'
                 THEN (b.check_out_date::DATE + INTERVAL '1 day')::TIMESTAMP
                 ELSE (b.check_out_date::DATE + b.check_out_time::TIME)::TIMESTAMP
            END
        ) > ($2::DATE + $3::TIME)::TIMESTAMP
      LIMIT 1
    `;

    const availabilityCheckValues = [
      room_name,
      check_in_date,
      check_in_time,
      check_out_date,
      check_out_time,
    ];

    const availabilityResult = await client.query(availabilityCheckQuery, availabilityCheckValues);

    if (availabilityResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          success: false,
          error: "This room is already booked during the selected time slot. Please choose a different date or time.",
        },
        { status: 400 }
      );
    }
    // --- END AVAILABILITY CHECK ---

    // --- BLOCKED-DATES CHECK ---
    // The availability check above only looks at Staycation bookings. Partners can
    // also block dates manually (renovation, leave) and iCal sync imports reservations
    // from Airbnb / Booking.com as blocked_dates rows with block_type='imported_external'.
    // Without this check, guests can book over external reservations and partner-blocked
    // windows. Skipped if haven_id is missing (e.g. legacy clients that send only
    // room_name) so we don't regress those callers.
    if (body.haven_id) {
      const blockedCheck = await client.query(
        `SELECT id, from_date, to_date, block_type, reason
         FROM blocked_dates
         WHERE haven_id = $1
           AND status = 'active'
           AND daterange(from_date, to_date, '[]')
               && daterange($2::date, $3::date, '[)')
         LIMIT 1`,
        [body.haven_id, check_in_date, check_out_date]
      );

      if (blockedCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            success: false,
            error: "This room is unavailable on the selected dates. Please choose different dates.",
          },
          { status: 400 }
        );
      }
    }
    // --- END BLOCKED-DATES CHECK ---

    // --- BOOKING WINDOW VALIDATION ---
    const { stay_type, haven_id } = body;
    if (stay_type && haven_id) {
      try {
        const bwResult = await client.query(
          `SELECT booking_windows FROM havens WHERE uuid_id = $1 LIMIT 1`,
          [haven_id]
        );
        const bw = bwResult.rows[0]?.booking_windows;
        const types: Array<{
          name: string; duration: number; available_days: string[];
          first_check_in: string; last_check_in: string;
        }> = bw?.types ?? [];
        const bType = types.find(t => t.name === stay_type);

        if (bType) {
          // Day-of-week check
          const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          const cinDay = DAY_ABBR[new Date(check_in_date + 'T12:00:00').getDay()];
          if (!bType.available_days.includes(cinDay)) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { success: false, error: `${stay_type} is not available on ${cinDay}` },
              { status: 400 }
            );
          }
          // Time window check
          const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
          const cinMins = toMins(check_in_time);
          const firstMins = toMins(bType.first_check_in);
          const lastMins = toMins(bType.last_check_in);
          const inWindow = firstMins <= lastMins
            ? cinMins >= firstMins && cinMins <= lastMins
            : cinMins >= firstMins || cinMins <= lastMins;
          if (!inWindow) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { success: false, error: `Check-in time must be between ${bType.first_check_in} and ${bType.last_check_in} for ${stay_type}` },
              { status: 400 }
            );
          }
        }
      } catch {
        // Booking window validation is advisory — don't block booking if check fails
      }
    }
    // --- END BOOKING WINDOW VALIDATION ---

    // --- IDENTITY-BASED OVERLAP CHECK ---
    // Only active bookings block a new one — completed, checked-out, rejected, cancelled, declined do not.
    const overlapCheckQuery = `
      SELECT b.id, b.booking_id, b.status, b.check_in_date, b.check_out_date
      FROM booking b
      JOIN booking_guests bg ON b.id = bg.booking_id
      WHERE b.room_name = $1
        AND b.status IN ('pending', 'approved', 'confirmed', 'checked-in', 'on-going')
        AND bg.first_name = $2
        AND bg.last_name = $3
        AND bg.email = $4
        AND bg.phone = $5
        AND (
          (b.check_in_date, b.check_out_date) OVERLAPS ($6::DATE, $7::DATE)
          OR b.check_in_date = $6::DATE
          OR b.check_out_date = $7::DATE
        )
      LIMIT 1
    `;

    const overlapCheckValues = [
      room_name,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
    ];

    const overlapResult = await client.query(overlapCheckQuery, overlapCheckValues);

    if (overlapResult.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          success: false,
          error: "You already have an existing booking for this room on the selected dates.",
        },
        { status: 400 }
      );
    }
    // --- END CHECK ---

    // Upload payment proof first to get the URL for calendar event
    let paymentProofUrl = null;
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs",
      );
      paymentProofUrl = uploadResult.url;
    }

    // Create Google Calendar event with payment proof URL
    const calendarEventData: CalendarEventData = {
      room_name,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      booking_id,
      status: "pending", // Default status for new bookings
      stay_type: body.stay_type,
      payment_method,
      payment_proof_url: paymentProofUrl ?? undefined,
      total_amount,
      down_payment,
      adults,
      children,
      infants,
    };
    console.log(`📅 [BOOKING] Creating calendar event for booking: ${booking_id}`);
    const googleEventId = await createCalendarEvent(calendarEventData);
    if (googleEventId) {
      console.log(`✅ [BOOKING] Calendar event created successfully. Event ID: ${googleEventId}`);
    } else {
      console.warn(`⚠️ [BOOKING] Calendar event creation returned null. Booking will proceed without calendar sync.`);
    }

    // Step 1: Create main booking record
    const bookingQuery = `
      INSERT INTO booking (
        booking_id, user_id, room_name, check_in_date, check_out_date,
        check_in_time, check_out_time, adults, children, infants, status,
        has_security_deposit, google_event_id, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
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
      "pending", // Ensure status matches "pending" default
      security_deposit > 0, // has_security_deposit flag
      googleEventId, // Added column for google calendar sync
    ];

    console.log("📝 [BOOKING] Inserting booking record...");
    const bookingResult = await client.query(bookingQuery, bookingValues);
    const bookingId = bookingResult.rows[0].id;
    console.log("✅ [BOOKING] Booking record created with ID:", bookingId);

    // Step 2: Create main guest record
    let validIdUrl = null;
    if (valid_id) {
      try {
        const uploadResult = await upload_file(
          valid_id,
          "staycation-haven/valid-ids",
        );
        validIdUrl = uploadResult.url;
      } catch (err: unknown) {
        const e = err as {
          message?: string;
          http_code?: number;
          name?: string;
        };
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload valid ID.",
            details: {
              message: e?.message,
              name: e?.name,
              http_code: e?.http_code,
            },
          },
          { status: 500 },
        );
      }
    }

    const mainGuestQuery = `
      INSERT INTO booking_guests (
        booking_id, first_name, last_name, age, gender, email, phone, facebook_link, valid_id_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const mainGuestValues = [
      bookingId,
      guest_first_name,
      guest_last_name,
      (guest_age != null && guest_age !== '' && Number(guest_age) > 0) ? Number(guest_age) : null,
      guest_gender || null,
      guest_email,
      guest_phone,
      facebook_link || null,
      validIdUrl,
    ];

    console.log("📝 [BOOKING] Inserting main guest record...");
    await client.query(mainGuestQuery, mainGuestValues);
    console.log("✅ [BOOKING] Main guest record created");

    // Step 3: Create additional guests records
    if (additional_guests && additional_guests.length > 0) {
      for (const guest of additional_guests) {
        let guestIdUrl = null;
        if (guest.validId) {
          const uploadResult = await upload_file(
            guest.validId,
            "staycation-haven/valid-ids",
          );
          guestIdUrl = uploadResult.url;
        }

        const additionalGuestQuery = `
          INSERT INTO booking_guests (
            booking_id, first_name, last_name, age, gender, email, phone, facebook_link, valid_id_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        const additionalGuestValues = [
          bookingId,
          guest.firstName,
          guest.lastName,
          (guest.age != null && guest.age !== '' && Number(guest.age) > 0) ? Number(guest.age) : null,
          guest.gender || null,
          guest.email || guest_email,
          guest.phone || guest_phone,
          null,
          guestIdUrl,
        ];

        await client.query(additionalGuestQuery, additionalGuestValues);
      }
    }

    // Step 4: Create payment record (without security deposit)
    // Note: paymentProofUrl was already uploaded earlier for calendar event

    // Calculate payment amounts (security deposit is handled separately during checkout)
    const paymentTotalAmount = Number(total_amount) || 0; // Full amount during booking
    const requestedDownPayment = Number(down_payment) || 0;
    // amount_paid must not exceed total_amount (booking_payments_amount_paid_check)
    const paymentAmountPaid = Math.min(requestedDownPayment, paymentTotalAmount);
    const paymentDownPayment = Math.min(requestedDownPayment, paymentTotalAmount);

    console.log("📋 [BOOKING] Payment computed:", {
      total_amount: paymentTotalAmount,
      down_payment: paymentDownPayment,
      amount_paid: paymentAmountPaid,
    });

    // Note: remaining_balance is a GENERATED column in the live DB
    // (computed as total_amount - amount_paid). Do not include it in INSERT.
    const paymentQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url, room_rate,
        add_ons_total, total_amount, down_payment, amount_paid
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
      paymentDownPayment,
      paymentAmountPaid,
    ];

    console.log("📝 [BOOKING] Inserting payment record...");
    await client.query(paymentQuery, paymentValues);
    console.log("✅ [BOOKING] Payment record created");

    // Step 4.5: Create security deposit record (always create with 0 amount during booking)
    const depositQuery = `
      INSERT INTO booking_security_deposits (
        booking_id, amount, deposit_status, held_at
      )
      VALUES ($1, 0, 'pending', NOW())
    `;

    const depositValues = [bookingId];

    await client.query(depositQuery, depositValues);

    // Step 5: Create add-ons records
    // Accepts array form (per-haven rentable-items: name+price+quantity from the catalog)
    // and legacy object form (hardcoded keys priced from ADD_ON_PRICES).
    if (Array.isArray(addOns)) {
      for (const item of addOns as Array<{ name?: string; price?: number | string; quantity?: number | string }>) {
        const quantityNum = Number(item?.quantity || 0);
        if (quantityNum > 0) {
          await client.query(
            `INSERT INTO booking_add_ons (booking_id, name, price, quantity)
             VALUES ($1, $2, $3, $4)`,
            [bookingId, String(item.name || ""), Number(item.price || 0), quantityNum],
          );
        }
      }
    } else if (addOns && Object.keys(addOns).length > 0) {
      for (const [name, quantity] of Object.entries(addOns)) {
        const quantityNum = Number(quantity);
        if (quantityNum > 0) {
          const addOnPrice =
            ADD_ON_PRICES[name as keyof typeof ADD_ON_PRICES] || 0;
          await client.query(
            `INSERT INTO booking_add_ons (booking_id, name, price, quantity)
             VALUES ($1, $2, $3, $4)`,
            [bookingId, name, addOnPrice, quantityNum],
          );
        }
      }
    }

    // Step 6: Create cleaning record
    const cleaningQuery = `
      INSERT INTO booking_cleaning (booking_id, cleaning_status)
      VALUES ($1, 'pending')
    `;

    console.log("📝 [BOOKING] Inserting cleaning record...");
    await client.query(cleaningQuery, [bookingId]);
    console.log("✅ [BOOKING] Cleaning record created");

    console.log("💾 [BOOKING] Committing database transaction...");
    await client.query("COMMIT");
    console.log("✅ [BOOKING] Database transaction committed successfully");

    // Get the complete booking data for response (include the booking payment object)
    const completeBookingQuery = `
    SELECT
      b.*,
      bg.first_name,
      bg.last_name,
      bg.email,
      bg.phone,
      bg.valid_id_url,
      json_build_object(
        'id', bp.id,
        'payment_method', bp.payment_method,
        'payment_proof_url', bp.payment_proof_url,
        'room_rate', bp.room_rate,
        'add_ons_total', bp.add_ons_total,
        'total_amount', bp.total_amount,
        'down_payment', bp.down_payment,
        'amount_paid', bp.amount_paid,
        'remaining_balance', bp.remaining_balance,
        'payment_status', bp.payment_status,
        'rejection_reason', bp.rejection_reason,
        'reviewed_by', bp.reviewed_by,
        'reviewed_at', bp.reviewed_at,
        'created_at', bp.created_at
      ) AS booking_payment
    FROM booking b
    JOIN booking_guests bg ON b.id = bg.booking_id
    JOIN booking_payments bp ON b.id = bp.booking_id
    WHERE b.id = $1
    LIMIT 1
  `;

    const completeResult = await client.query(completeBookingQuery, [
      bookingId,
    ]);

    if (completeResult.rows.length === 0) {
      console.error("❌ [BOOKING] CRITICAL: Booking was created but cannot be retrieved!");
      console.error("❌ [BOOKING] Booking ID:", bookingId);
      throw new Error(`Booking created but retrieval query returned no results`);
    }

    const createdBooking = completeResult.rows[0];
    console.log("✅ [BOOKING] Booking created and retrieved successfully");
    console.log("📋 [BOOKING] Booking ID in DB:", createdBooking.id);
    console.log("📋 [BOOKING] Google Event ID:", createdBooking.google_event_id);
    console.log("📋 [BOOKING] Status:", createdBooking.status);

    // Send pending approval email to guest
    try {
      const booking = completeResult.rows[0];

      // Fetch add-ons (formerly "rentable items") for this haven, grouped by
      // category. The pamphlet renders by category when this is provided.
      // Flat `rentableItems` is still passed for back-compat + as the bucket
      // for any uncategorized items.
      let rentableItems: { name: string; icon: string; price_per_night: number }[] = [];
      let addonCategories: {
        id: string;
        name: string;
        icon: string;
        items: { name: string; icon: string; price_per_night: number }[];
      }[] = [];
      try {
        // Categories with their items nested.
        const catRes = await pool.query(
          `SELECT
             c.id::text,
             c.name,
             c.icon,
             COALESCE(
               (
                 SELECT json_agg(
                   json_build_object('name', i.name, 'icon', i.icon, 'price_per_night', i.price_per_night)
                   ORDER BY i.id
                 )
                 FROM haven_rentable_items i
                 WHERE i.category_id = c.id AND i.is_active = true
               ),
               '[]'::json
             ) AS items
           FROM haven_addon_categories c
           INNER JOIN havens h ON h.uuid_id = c.haven_id
           WHERE h.haven_name = $1
           ORDER BY c.sort_order ASC, c.created_at ASC`,
          [booking.room_name],
        );
        addonCategories = catRes.rows.map((r) => ({
          id: r.id,
          name: r.name,
          icon: r.icon,
          items: r.items || [],
        }));

        // Uncategorized items (legacy or not yet grouped). Try with the new
        // column; fall back if the migration hasn't been run.
        try {
          const uncatRes = await pool.query(
            `SELECT ri.name, ri.icon, ri.price_per_night
             FROM haven_rentable_items ri
             INNER JOIN havens h ON h.uuid_id = ri.haven_id
             WHERE h.haven_name = $1 AND ri.is_active = true AND ri.category_id IS NULL
             ORDER BY ri.id ASC`,
            [booking.room_name],
          );
          rentableItems = uncatRes.rows;
        } catch {
          const allRes = await pool.query(
            `SELECT ri.name, ri.icon, ri.price_per_night
             FROM haven_rentable_items ri
             INNER JOIN havens h ON h.uuid_id = ri.haven_id
             WHERE h.haven_name = $1 AND ri.is_active = true
             ORDER BY ri.id ASC`,
            [booking.room_name],
          );
          rentableItems = allRes.rows;
        }
      } catch (rentErr) {
        console.error("⚠️ Could not fetch add-ons for pamphlet:", rentErr);
      }

      const emailData = {
        firstName: booking.first_name,
        lastName: booking.last_name,
        email: booking.email,
        phone: booking.phone,
        bookingId: booking.booking_id,
        roomName: booking.room_name,
        checkInDate: new Date(booking.check_in_date).toLocaleDateString(),
        checkInTime: booking.check_in_time,
        checkOutDate: new Date(booking.check_out_date).toLocaleDateString(),
        checkOutTime: booking.check_out_time,
        guests: `${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants`,
        paymentMethod: booking.booking_payment?.payment_method,
        downPayment: booking.booking_payment?.down_payment,
        totalAmount: booking.booking_payment?.total_amount,
        rentableItems,
        addonCategories,
      };

      const emailResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-pending-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        },
      );

      if (!emailResponse.ok) {
        console.error("❌ Failed to send pending approval email");
      } else {
        console.log("✅ Pending approval email sent to:", booking.email);
      }
    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
      // Don't fail the whole request if email fails
    }

    await client.query("COMMIT");

    console.log("🎉 [BOOKING] Booking creation complete - returning success response");
    console.log("📊 [BOOKING] Response includes:", {
      booking_id: completeResult.rows[0].booking_id,
      db_id: completeResult.rows[0].id,
      status: completeResult.rows[0].status,
      google_event_id: completeResult.rows[0].google_event_id,
    });

    return NextResponse.json(
      {
        success: true,
        data: completeResult.rows[0],
        message: "Booking created successfully. Waiting for admin approval.",
      },
      { status: 201 },
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("❌ [BOOKING] Error during rollback:", rollbackError);
    }

    console.error("❌ [BOOKING] Error creating booking:", error);

    const e = error as {
      message?: string;
      code?: string;
      detail?: string;
      constraint?: string;
      table?: string;
      column?: string;
    };

    // Provide detailed error information
    let errorMessage = "Failed to create booking";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("❌ [BOOKING] Error message:", error.message);
      console.error("❌ [BOOKING] Error stack:", error.stack);
    } else if (typeof error === "object" && error !== null) {
      if ("code" in error && error.code === "23505") {
        // Unique constraint violation
        errorMessage = `Booking already exists for this date/guest combination`;
        errorDetails = `Constraint: ${e.constraint || "unknown"}`;
      } else if ("code" in error && error.code === "23503") {
        // Foreign key constraint violation
        errorMessage = `Invalid reference in booking data`;
        errorDetails = `Table: ${e.table || "unknown"}, Column: ${e.column || "unknown"}`;
      } else if ("detail" in error) {
        errorMessage = e.detail || "Database error";
        errorDetails = JSON.stringify(error);
      } else {
        errorMessage = JSON.stringify(error);
      }
    }

    if (errorDetails) {
      console.error("📋 [BOOKING] Error details:", errorDetails);
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
};

// GET All Bookings
export const getAllBookings = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const raw = searchParams.get("raw");

    // If raw=true, return only the booking table columns (no joins)
    if (raw === "true") {
      let rawQuery = `
        SELECT
          id,
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
          status,
          rejection_reason,
          has_security_deposit,
          created_at,
          updated_at
        FROM booking
      `;

      const values: any[] = [];
      if (status) {
        rawQuery += " WHERE status = $1";
        values.push(status);
      }

      rawQuery += " ORDER BY created_at DESC";

      const result = await pool.query(rawQuery, values);
      return NextResponse.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    }

    // Default behavior: enriched booking data with joins
    let query = `
      SELECT
        b.*,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        bg.valid_id_url as valid_id_url,
        bg.age as guest_age,
        bg.gender as guest_gender,
        bg.facebook_link,
        bp.payment_method,
        bp.payment_proof_url,
        bp.payment_status,
        bp.room_rate,
        bp.add_ons_total,
        bp.total_amount,
        bp.down_payment,
        bp.remaining_balance,
        COALESCE(bd.amount, 0) as security_deposit,
        bd.deposit_status,
        bd.payment_method as security_deposit_payment_method,
        bd.payment_proof_url as security_deposit_payment_proof_url,
        bd.notes as security_deposit_notes,
        bc.cleaning_status
      FROM booking b
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      LEFT JOIN booking_security_deposits bd ON b.id = bd.booking_id
      LEFT JOIN booking_cleaning bc ON b.id = bc.booking_id
      WHERE bg.id = (
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
      )
    `;
    const values: string[] = [];

    if (status) {
      query += " AND b.status = $1";
      values.push(status);
    }

    query += " ORDER BY b.created_at DESC";

    const result = await pool.query(query, values);
    console.log(
      `✅ Retrieved ${result.rows.length} bookings from separated tables`,
    );

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
        error:
          error instanceof Error ? error.message : "Failed to get bookings",
      },
      { status: 500 },
    );
  }
};

// GET Booking by ID
export const getBookingById = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 },
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
        bp.payment_proof_url,
        bp.room_rate,
        bp.add_ons_total,
        COALESCE(bd.amount, 0) as security_deposit,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        bg.valid_id_url,
        bg.age as guest_age,
        bg.gender as guest_gender,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'firstName', g.first_name,
                'lastName', g.last_name,
                'age', g.age,
                'gender', g.gender,
                'email', g.email,
                'phone', g.phone,
                'facebook_link', g.facebook_link,
                'valid_id_url', g.valid_id_url
              ) ORDER BY g.id
            ),
            '[]'
          )
          FROM booking_guests g
          WHERE g.booking_id = b.id
        ) as guests,
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
      LEFT JOIN booking_guests bg ON bg.id = (
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY created_at ASC LIMIT 1
      )
      LEFT JOIN booking_security_deposits bd ON b.id = bd.booking_id
      WHERE b.id = $1
      GROUP BY b.id, h.tower, h.uuid_id, bp.total_amount, bp.down_payment, bp.remaining_balance, bp.payment_method, bp.payment_proof_url, bp.room_rate, bp.add_ons_total, bg.first_name, bg.last_name, bg.email, bg.phone, bg.valid_id_url, bg.age, bg.gender, bd.amount
      LIMIT 1
    `;
    const bookingResult = await pool.query(query, [id]);

    if (bookingResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const booking = bookingResult.rows[0];

    // Get all guests
    const guestsQuery = `
      SELECT * FROM booking_guests
      WHERE booking_id = $1
      ORDER BY created_at ASC
    `;
    const guestsResult = await pool.query(guestsQuery, [id]);

    // Get payment info
    const paymentQuery = `
      SELECT * FROM booking_payments
      WHERE booking_id = $1
      LIMIT 1
    `;
    const paymentResult = await pool.query(paymentQuery, [id]);

    // Get security deposit
    const depositQuery = `
      SELECT * FROM booking_security_deposits
      WHERE booking_id = $1
      LIMIT 1
    `;
    const depositResult = await pool.query(depositQuery, [id]);

    // Get add-ons
    const addOnsQuery = `
      SELECT * FROM booking_add_ons
      WHERE booking_id = $1
      ORDER BY name ASC
    `;
    const addOnsResult = await pool.query(addOnsQuery, [id]);

    // Get cleaning info
    const cleaningQuery = `
      SELECT * FROM booking_cleaning
      WHERE booking_id = $1
      LIMIT 1
    `;
    const cleaningResult = await pool.query(cleaningQuery, [id]);

    // Combine all data — always use guestsResult.rows[0] as the authoritative main guest
    const mainGuest = guestsResult.rows[0] || null;
    const completeBooking = {
      ...booking,
      guest_first_name: mainGuest?.first_name ?? booking.guest_first_name,
      guest_last_name: mainGuest?.last_name ?? booking.guest_last_name,
      guest_email: mainGuest?.email ?? booking.guest_email,
      guest_phone: mainGuest?.phone ?? booking.guest_phone,
      guest_age: mainGuest?.age ?? booking.guest_age,
      guest_gender: mainGuest?.gender ?? booking.guest_gender,
      valid_id_url: mainGuest?.valid_id_url ?? booking.valid_id_url,
      facebook_link: mainGuest?.facebook_link ?? booking.facebook_link,
      guests: guestsResult.rows,
      main_guest: mainGuest,
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
  } catch (error) {
    console.log("❌ Error getting booking:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get booking",
      },
      { status: 500 },
    );
  }
};

// UPDATE Booking Status (Approve/Reject)
export const updateBookingStatus = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { id, status, rejection_reason } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking ID is required",
        },
        { status: 400 },
      );
    }

    // If status is provided, validate it
    const validStatuses = [
      "pending", "approved", "rejected", "confirmed",
      "on-going", "checked-in", "completed", "cancelled",
    ];
    if (typeof status !== "undefined" && status !== null) {
      if (typeof status !== "string" || !validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 },
        );
      }
    }

    // ✅ FIXED: Added ::uuid casting
    const query = `
      UPDATE booking
      SET status = $1, rejection_reason = $2, updated_at = NOW()
      WHERE id::text = $3 OR booking_id = $3
      RETURNING *
    `;

    const values = [status, rejection_reason ?? null, id];
    const result = await pool.query(query, values);

    // If booking approved, also approve the down payment
    if (status === "approved" && result.rows.length > 0) {
      const bookingUuid = result.rows[0].id;
      await pool.query(
        `
        UPDATE booking_payments
        SET payment_status = 'approved_down_payment', reviewed_at = NOW()
        WHERE booking_id = $1 AND payment_status = 'pending_down_payment'
        `,
        [bookingUuid],
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found",
        },
        { status: 404 },
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
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
      )
      LIMIT 1
    `;

    const bookingDetailsResult = await pool.query(bookingDetailsQuery, [id]);

    // Send confirmation email when booking is approved
    if (status === "approved" && bookingDetailsResult.rows.length > 0) {
      try {
        const booking = bookingDetailsResult.rows[0];

        // Fetch add-ons (formerly "rentable items") for the pamphlet,
        // grouped by category. Falls back to flat list if migration missing.
        let rentableItems: { name: string; icon: string; price_per_night: number }[] = [];
        let addonCategories: {
          id: string;
          name: string;
          icon: string;
          items: { name: string; icon: string; price_per_night: number }[];
        }[] = [];
        try {
          const catRes = await pool.query(
            `SELECT
               c.id::text, c.name, c.icon,
               COALESCE(
                 (
                   SELECT json_agg(
                     json_build_object('name', i.name, 'icon', i.icon, 'price_per_night', i.price_per_night)
                     ORDER BY i.id
                   )
                   FROM haven_rentable_items i
                   WHERE i.category_id = c.id AND i.is_active = true
                 ),
                 '[]'::json
               ) AS items
             FROM haven_addon_categories c
             INNER JOIN havens h ON h.uuid_id = c.haven_id
             WHERE h.haven_name = $1
             ORDER BY c.sort_order ASC, c.created_at ASC`,
            [booking.room_name],
          );
          addonCategories = catRes.rows.map((r) => ({
            id: r.id,
            name: r.name,
            icon: r.icon,
            items: r.items || [],
          }));
          try {
            const uncatRes = await pool.query(
              `SELECT ri.name, ri.icon, ri.price_per_night
               FROM haven_rentable_items ri
               INNER JOIN havens h ON h.uuid_id = ri.haven_id
               WHERE h.haven_name = $1 AND ri.is_active = true AND ri.category_id IS NULL
               ORDER BY ri.id ASC`,
              [booking.room_name],
            );
            rentableItems = uncatRes.rows;
          } catch {
            const allRes = await pool.query(
              `SELECT ri.name, ri.icon, ri.price_per_night
               FROM haven_rentable_items ri
               INNER JOIN havens h ON h.uuid_id = ri.haven_id
               WHERE h.haven_name = $1 AND ri.is_active = true
               ORDER BY ri.id ASC`,
              [booking.room_name],
            );
            rentableItems = allRes.rows;
          }
        } catch (rentErr) {
          console.error("⚠️ Could not fetch add-ons for pamphlet:", rentErr);
        }

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
          rentableItems,
          addonCategories,
        };

        // Send email via API route
        const emailResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-booking-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailData),
          },
        );

        if (!emailResponse.ok) {
          console.error("❌ Failed to send confirmation email");
        } else {
          console.log("✅ Confirmation email sent to:", booking.email);
        }
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    // Send rejection email when booking is rejected
    if (status === "rejected" && bookingDetailsResult.rows.length > 0) {
      try {
        const booking = bookingDetailsResult.rows[0];

        const emailData = {
          firstName: booking.first_name,
          lastName: booking.last_name,
          email: booking.email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: booking.check_in_date
            ? new Date(booking.check_in_date).toLocaleDateString()
            : "",
          checkInTime: booking.check_in_time,
          checkOutDate: booking.check_out_date
            ? new Date(booking.check_out_date).toLocaleDateString()
            : "",
          checkOutTime: booking.check_out_time,
          rejectionReason: rejection_reason ?? booking.rejection_reason ?? "",
        };

        const emailResponse = await fetch(
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-rejection-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailData),
          },
        );

        if (!emailResponse.ok) {
          console.error("❌ Failed to send rejection email");
        } else {
          console.log("✅ Rejection email sent to:", booking.email);
        }
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message:
        typeof status === "string"
          ? `Booking ${status} successfully`
          : "Booking updated successfully",
    });
  } catch (error) {
    console.log("❌ Error updating booking status:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update booking status",
      },
      { status: 500 },
    );
  }
};

// DELETE Booking
export const deleteBooking = async (
  req: NextRequest,
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
        { status: 400 },
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
        { status: 404 },
      );
    }

    console.log("✅ Booking deleted (cascade):", result.rows[0]);

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
        error:
          error instanceof Error ? error.message : "Failed to delete booking",
      },
      { status: 500 },
    );
  }
};

// GET User's Bookings
export const getUserBookings = async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
): Promise<NextResponse> => {
  const { userId } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    // ✅ FIXED: Added ::uuid casting
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
    console.log(
      `✅ Retrieved ${result.rows.length} bookings for user ${userId}`,
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log("❌ Error fetching user bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch user bookings",
      },
      { status: 500 },
    );
  }
};

// UPDATE Cleaning Status
export const updateCleaningStatus = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const cleaningIndex = segments.indexOf("cleaning");
    const id = cleaningIndex > 0 ? segments[cleaningIndex - 1] : null;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Booking ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { cleaning_status } = body;

    const validCleaningStatuses = [
      "pending",
      "assigned",
      "in-progress",
      "cleaned",
      "inspected",
    ];
    if (!cleaning_status || !validCleaningStatuses.includes(cleaning_status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid cleaning status. Must be one of: pending, assigned, in-progress, cleaned, inspected",
        },
        { status: 400 },
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

    const cleaningResult = await pool.query(cleaningQuery, [
      cleaning_status,
      id,
    ]);

    if (cleaningResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking cleaning record not found" },
        { status: 404 },
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
        SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to update cleaning status",
      },
      { status: 500 },
    );
  }
};

// SYNC Bookings to Google Calendar (for bookings without google_event_id)
export const syncCalendarBookings = async (
  _req: NextRequest,
): Promise<NextResponse> => {
  try {
    // Find all bookings that have no google_event_id, joined with guest + payment data
    const unsyncedQuery = `
      SELECT
        b.id,
        b.booking_id,
        b.room_name,
        b.check_in_date,
        b.check_out_date,
        b.check_in_time,
        b.check_out_time,
        b.adults,
        b.children,
        b.infants,
        b.status,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone,
        bp.payment_method,
        bp.payment_proof_url,
        bp.total_amount,
        bp.down_payment
      FROM booking b
      LEFT JOIN booking_guests bg ON b.id = bg.booking_id
        AND bg.id = (SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1)
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      WHERE b.google_event_id IS NULL
      ORDER BY b.created_at ASC
    `;

    const unsyncedResult = await pool.query(unsyncedQuery);
    const bookings = unsyncedResult.rows;

    console.log(`📅 [SYNC] Found ${bookings.length} booking(s) without google_event_id`);

    if (bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All bookings are already synced to Google Calendar.",
        synced: 0,
        failed: 0,
        total: 0,
      });
    }

    // Check credentials early so we can fail fast with a clear message
    const missingEnvVars: string[] = [];
    if (!process.env.GOOGLE_CLIENT_EMAIL_CALENDAR) missingEnvVars.push("GOOGLE_CLIENT_EMAIL_CALENDAR");
    if (!process.env.GOOGLE_PRIVATE_KEY_CALENDAR) missingEnvVars.push("GOOGLE_PRIVATE_KEY_CALENDAR");
    if (!process.env.GOOGLE_CALENDAR_ID) missingEnvVars.push("GOOGLE_CALENDAR_ID");

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing environment variables: ${missingEnvVars.join(", ")}. Google Calendar sync cannot run without them.`,
          synced: 0,
          failed: bookings.length,
          total: bookings.length,
        },
        { status: 500 },
      );
    }

    let synced = 0;
    let failed = 0;
    const results: {
      booking_id: string;
      status: "synced" | "failed";
      google_event_id?: string;
      error?: string;
      html_link?: string;
      calendar_id?: string;
    }[] = [];

    // Process one at a time to avoid Google API rate limits
    for (const booking of bookings) {
      const calendarEventData: CalendarEventData = {
        room_name: booking.room_name,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        check_in_time: booking.check_in_time,
        check_out_time: booking.check_out_time,
        guest_first_name: booking.guest_first_name || "Unknown",
        guest_last_name: booking.guest_last_name || "Guest",
        guest_email: booking.guest_email || "",
        guest_phone: booking.guest_phone || "",
        booking_id: booking.booking_id,
        status: booking.status,
        payment_method: booking.payment_method,
        payment_proof_url: booking.payment_proof_url,
        total_amount: booking.total_amount,
        down_payment: booking.down_payment,
        adults: booking.adults,
        children: booking.children,
        infants: booking.infants,
      };

      const { id: googleEventId, htmlLink, calendarId: usedCalendarId, error: calendarError } = await createCalendarEventWithResult(calendarEventData);

      if (googleEventId) {
        await pool.query(
          `UPDATE booking SET google_event_id = $1, updated_at = NOW() WHERE id = $2`,
          [googleEventId, booking.id],
        );
        synced++;
        results.push({ booking_id: booking.booking_id, status: "synced", google_event_id: googleEventId, html_link: htmlLink ?? undefined, calendar_id: usedCalendarId ?? undefined });
        console.log(`✅ [SYNC] Synced booking ${booking.booking_id} → Calendar: ${usedCalendarId}, Event: ${htmlLink}`);
      } else {
        failed++;
        results.push({ booking_id: booking.booking_id, status: "failed", error: calendarError ?? "Unknown error" });
        console.warn(`⚠️ [SYNC] Failed booking ${booking.booking_id}: ${calendarError}`);

        // If the very first booking fails with an auth/network error, stop early — all will fail for the same reason
        if (failed === 1 && calendarError && (
          calendarError.includes("Auth failed") ||
          calendarError.includes("Network error") ||
          calendarError.includes("Calendar not found") ||
          calendarError.includes("Missing GOOGLE_CALENDAR_ID")
        )) {
          console.error(`❌ [SYNC] Stopping early — persistent error detected: ${calendarError}`);
          return NextResponse.json({
            success: false,
            message: `Sync stopped after first failure. Reason: ${calendarError}`,
            synced,
            failed: bookings.length,
            total: bookings.length,
            error: calendarError,
            results,
          });
        }
      }
    }

    console.log(`📅 [SYNC] Done. Synced: ${synced}, Failed: ${failed}, Total: ${bookings.length}`);

    // Collect unique error messages from failures for the summary
    const uniqueErrors = [...new Set(results.filter((r) => r.error).map((r) => r.error))];

    return NextResponse.json({
      success: synced > 0,
      message: `Synced ${synced} of ${bookings.length} booking(s) to Google Calendar.`,
      synced,
      failed,
      total: bookings.length,
      ...(uniqueErrors.length > 0 && { errors: uniqueErrors }),
      results,
    });
  } catch (error) {
    console.error("❌ [SYNC] Error syncing bookings to calendar:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync bookings to Google Calendar",
      },
      { status: 500 },
    );
  }
};

// GET Room/Haven Bookings (for checking availability)
export const getRoomBookings = async (
  req: NextRequest,
  { params }: { params: Promise<{ havenId: string }> },
): Promise<NextResponse> => {
  const { havenId } = await params;

  try {
    // First, get the room name from havens table using havenId
    const havenQuery = `SELECT haven_name FROM havens WHERE uuid_id = $1`;
    const havenResult = await pool.query(havenQuery, [havenId]);

    if (havenResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Haven not found",
        },
        { status: 404 },
      );
    }

    const roomName = havenResult.rows[0].haven_name.trim();

    // Get all active bookings for this room from the new booking table
    // Use TRIM to handle any whitespace issues in room_name
    // Only block dates for bookings with status: pending, approved, confirmed, checked-in
    // Don't block dates for rejected, cancelled, completed bookings
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
        AND status IN ('pending', 'approved', 'confirmed', 'checked-in')
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch room bookings",
      },
      { status: 500 },
    );
  }
};