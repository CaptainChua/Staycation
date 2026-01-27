import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import { upload_file } from "../utils/cloudinary";

/**
 * Controller for booking payments (booking_payments table)
 *
 * Exposes:
 * - createBookingPayment
 * - getAllBookingPayments
 * - getBookingPaymentById
 * - updateBookingPayment
 * - deleteBookingPayment
 *
 * Responses follow the shape used elsewhere in the project:
 * { success: boolean, data: ..., message?: string, count?: number }
 */

// CREATE booking payment
export const createBookingPayment = async (
  req: NextRequest,
): Promise<NextResponse> => {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const {
      booking_id,
      payment_method,
      payment_proof, // base64
      room_rate,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
    } = body;

    if (!booking_id) {
      return NextResponse.json(
        { success: false, error: "booking_id is required" },
        { status: 400 },
      );
    }

    // Upload payment proof if provided
    let paymentProofUrl: string | null = null;
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs",
      );
      paymentProofUrl = uploadResult.url;
    }

    // Compute remaining balance if not provided
    const computedTotal = Number(total_amount || 0);
    const computedDown = Number(down_payment || 0);
    const computedRemaining =
      typeof remaining_balance !== "undefined" && remaining_balance !== null
        ? Number(remaining_balance)
        : computedTotal - computedDown;

    const insertQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url, room_rate,
        add_ons_total, total_amount, down_payment, remaining_balance, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      RETURNING *
    `;

    const values = [
      booking_id,
      payment_method,
      paymentProofUrl,
      room_rate,
      add_ons_total ?? 0,
      computedTotal,
      computedDown,
      computedRemaining,
    ];

    const result = await client.query(insertQuery, values);

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: "Booking payment created",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Error creating booking payment:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create booking payment",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
};

// GET all booking payments (optional filters: status, q)
export const getAllBookingPayments = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    let query = `
      SELECT
        bp.*,
        b.booking_id as booking_id,
        b.id as booking_fk,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone
      FROM booking_payments bp
      LEFT JOIN booking b ON bp.booking_id = b.id
      LEFT JOIN booking_guests bg ON bg.booking_id = b.id
        AND bg.id = (
          SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
        )
      WHERE 1=1
    `;

    const values: unknown[] = [];

    if (status) {
      values.push(status);
      query += ` AND bp.payment_status = $${values.length}`;
    }

    if (q) {
      values.push(`%${q}%`);
      const paramIdx = values.length;
      query += ` AND (b.booking_id ILIKE $${paramIdx} OR (COALESCE(bg.first_name,'') || ' ' || COALESCE(bg.last_name,'')) ILIKE $${paramIdx})`;
    }

    query += ` ORDER BY bp.created_at DESC`;

    const result = await pool.query(query, values);
    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("❌ Error getting booking payments:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get booking payments",
      },
      { status: 500 },
    );
  }
};

// GET booking payment by ID (id = booking_payments.id)
export const getBookingPaymentById = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    // id should be the last segment
    const id = segments.pop() || segments.pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 },
      );
    }

    const query = `
      SELECT
        bp.*,
        b.booking_id as booking_id,
        b.id as booking_fk,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone
      FROM booking_payments bp
      LEFT JOIN booking b ON bp.booking_id = b.id
      LEFT JOIN booking_guests bg ON bg.booking_id = b.id
        AND bg.id = (
          SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
        )
      WHERE bp.id = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking payment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error getting booking payment by id:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get booking payment",
      },
      { status: 500 },
    );
  }
};

// UPDATE booking payment (approve/reject or edit fields)
// Accepts either body.id or last URL segment as id
export const updateBookingPayment = async (
  req: NextRequest,
): Promise<NextResponse> => {
  const client = await pool.connect();
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const body = await req.json();

    const idFromUrl = segments.pop() || segments.pop();
    const id = body?.id || idFromUrl;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 },
      );
    }

    const {
      payment_status,
      rejection_reason,
      reviewed_by,
      payment_method,
      payment_proof, // base64
      room_rate,
      add_ons_total,
      total_amount,
      down_payment,
      remaining_balance,
    } = body || {};

    // Validate payment_status if provided
    const validStatuses = ["pending", "approved", "rejected", "refunded"];
    if (typeof payment_status !== "undefined" && payment_status !== null) {
      if (
        typeof payment_status !== "string" ||
        !validStatuses.includes(payment_status)
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid payment_status" },
          { status: 400 },
        );
      }
    }

    await client.query("BEGIN");

    const updateFields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    const pushField = (field: string, value: unknown) => {
      if (typeof value === "undefined") return;
      updateFields.push(`${field} = $${i++}`);
      values.push(value);
    };

    // Handle optional fields
    pushField("payment_status", payment_status ?? null);
    pushField(
      "rejection_reason",
      typeof rejection_reason === "undefined"
        ? undefined
        : (rejection_reason ?? null),
    );
    pushField("reviewed_by", reviewed_by ?? null);
    pushField("payment_method", payment_method ?? undefined);
    pushField("room_rate", room_rate ?? undefined);
    pushField(
      "add_ons_total",
      typeof add_ons_total === "undefined" ? undefined : add_ons_total,
    );
    pushField(
      "total_amount",
      typeof total_amount === "undefined" ? undefined : total_amount,
    );
    pushField(
      "down_payment",
      typeof down_payment === "undefined" ? undefined : down_payment,
    );
    pushField(
      "remaining_balance",
      typeof remaining_balance === "undefined" ? undefined : remaining_balance,
    );

    // Handle upload if provided
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs",
      );
      pushField("payment_proof_url", uploadResult.url);
    }

    // If reviewed_by or payment_status is provided, set reviewed_at = NOW()
    if (
      typeof reviewed_by !== "undefined" ||
      typeof payment_status !== "undefined"
    ) {
      updateFields.push(`reviewed_at = NOW()`);
    }

    if (updateFields.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, error: "No fields provided to update" },
        { status: 400 },
      );
    }

    // Finalize query
    const query = `
      UPDATE booking_payments
      SET ${updateFields.join(", ")}
      WHERE id = $${i}
      RETURNING *
    `;
    values.push(id);

    const updateRes = await client.query(query, values);

    if (updateRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, error: "Booking payment not found" },
        { status: 404 },
      );
    }

    const updatedPayment = updateRes.rows[0];

    // If payment_status changed to approved or rejected, update the booking.status too
    if (payment_status === "approved" || payment_status === "rejected") {
      const bookingStatus = payment_status;
      await client.query(
        `UPDATE booking SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
        [
          bookingStatus,
          payment_status === "rejected" ? (rejection_reason ?? null) : null,
          updatedPayment.booking_id,
        ],
      );
    }

    // Commit transaction
    await client.query("COMMIT");

    // If approved, send confirmation email similar to bookingController
    if (payment_status === "approved") {
      try {
        // Fetch booking & guest for email
        const bookingDetailsQuery = `
          SELECT
            b.*,
            bg.first_name,
            bg.last_name,
            bg.email,
            bp.total_amount,
            bp.down_payment
          FROM booking b
          JOIN booking_guests bg ON b.id = bg.booking_id
          JOIN booking_payments bp ON b.id = bp.booking_id
          WHERE bp.id = $1 AND bg.id = (
            SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
          )
          LIMIT 1
        `;

        const bookingDetailsResult = await pool.query(bookingDetailsQuery, [
          updatedPayment.id,
        ]);

        if (bookingDetailsResult.rows.length > 0) {
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
            guests: `${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants`,
            paymentMethod:
              booking.payment_method || updatedPayment.payment_method,
            downPayment: booking.down_payment || updatedPayment.down_payment,
            totalAmount: booking.total_amount || updatedPayment.total_amount,
          };

          // Fire-and-forget email
          try {
            await fetch(
              `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/send-booking-email`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailData),
              },
            );
          } catch (emailErr) {
            console.error(
              "❌ Failed to send booking approval email:",
              emailErr,
            );
          }
        }
      } catch (emailError) {
        console.error("❌ Error preparing/sending approval email:", emailError);
      }
    }

    // Return updated payment (freshly fetch joined representation)
    const freshQuery = `
      SELECT
        bp.*,
        b.booking_id as booking_id,
        b.id as booking_fk,
        bg.first_name as guest_first_name,
        bg.last_name as guest_last_name,
        bg.email as guest_email,
        bg.phone as guest_phone
      FROM booking_payments bp
      LEFT JOIN booking b ON bp.booking_id = b.id
      LEFT JOIN booking_guests bg ON bg.booking_id = b.id
        AND bg.id = (
          SELECT id FROM booking_guests WHERE booking_id = b.id ORDER BY id LIMIT 1
        )
      WHERE bp.id = $1
      LIMIT 1
    `;

    const freshRes = await pool.query(freshQuery, [updatedPayment.id]);

    return NextResponse.json({
      success: true,
      data: freshRes.rows[0],
      message: `Booking payment ${payment_status ? payment_status : "updated"} successfully`,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Error updating booking payment:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update booking payment",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
};

// DELETE booking payment by id
export const deleteBookingPayment = async (
  req: NextRequest,
): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `DELETE FROM booking_payments WHERE id = $1 RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Booking payment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Booking payment deleted",
    });
  } catch (error) {
    console.error("❌ Error deleting booking payment:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete booking payment",
      },
      { status: 500 },
    );
  }
};
