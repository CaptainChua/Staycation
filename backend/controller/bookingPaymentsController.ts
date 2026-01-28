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
      amount_paid,
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

    // Compute remaining balance if not provided. If an explicit amount_paid was
    // provided use that as the current paid amount; otherwise default to down_payment.
    const computedTotal = Number(total_amount || 0);
    const computedDown = Number(down_payment || 0);
    const computedAmountPaid =
      typeof amount_paid !== "undefined" && amount_paid !== null
        ? Number(amount_paid)
        : computedDown;
    const computedRemaining =
      typeof remaining_balance !== "undefined" && remaining_balance !== null
        ? Number(remaining_balance)
        : computedTotal - computedAmountPaid;

    const insertQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url, room_rate,
        add_ons_total, total_amount, down_payment, amount_paid, remaining_balance, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
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
      computedAmountPaid,
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
      amount_paid,
      remaining_balance,
      collect_amount,
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

    // Handle optional fields (support incremental collection via collect_amount)
    // payment_status_effective will be used when collect_amount triggers an implicit approval
    let payment_status_effective = payment_status;
    // keep an applied amount copy for activity logging after commit
    let appliedAmountForLog = 0;
    const collectAmountRaw =
      typeof collect_amount !== "undefined" ? collect_amount : undefined;

    if (typeof collectAmountRaw !== "undefined" && collectAmountRaw !== null) {
      const collectAmount = Number(collectAmountRaw);
      if (Number.isNaN(collectAmount) || collectAmount < 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Invalid collect_amount" },
          { status: 400 },
        );
      }

      // Lock and read the current payment row so we can compute applied amount safely
      const currentRes = await client.query(
        `SELECT down_payment, amount_paid, remaining_balance, total_amount FROM booking_payments WHERE id = $1 FOR UPDATE`,
        [id],
      );

      if (currentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Booking payment not found" },
          { status: 404 },
        );
      }

      const cur = currentRes.rows[0];
      const prevDown = Number(cur.down_payment ?? 0);
      const prevAmountPaid = Number(cur.amount_paid ?? 0);
      const explicitPrevRemaining =
        typeof cur.remaining_balance !== "undefined" &&
        cur.remaining_balance !== null
          ? Number(cur.remaining_balance)
          : NaN;
      const derivedPrevRemaining = !Number.isNaN(Number(cur.total_amount))
        ? Number(cur.total_amount) - prevAmountPaid
        : NaN;
      const actualPrevRemaining = !Number.isNaN(explicitPrevRemaining)
        ? explicitPrevRemaining
        : !Number.isNaN(derivedPrevRemaining)
          ? derivedPrevRemaining
          : 0;

      // If collecting less than the outstanding remaining balance, only allow it
      // when the collected amount matches the submitted down payment (i.e. this
      // is an approval of a submitted payment). Otherwise, reject as insufficient.
      if (collectAmount < actualPrevRemaining) {
        if (Number(cur.down_payment ?? 0) !== collectAmount) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient amount: remaining balance is ${actualPrevRemaining}`,
            },
            { status: 400 },
          );
        }
      }

      // appliedAmount is portion of collectAmount that is actually applied to outstanding balance
      const appliedAmount = Math.min(
        Math.max(collectAmount, 0),
        Math.max(0, actualPrevRemaining),
      );
      // Keep a copy to include in employee activity logs after the transaction commits
      appliedAmountForLog = appliedAmount;

      const newDown = prevDown + appliedAmount;
      const newAmountPaid = prevAmountPaid + appliedAmount;
      const newRemaining = Math.max(0, actualPrevRemaining - appliedAmount);

      // Update with computed incremental values
      pushField("down_payment", newDown);
      pushField("amount_paid", newAmountPaid);
      pushField("remaining_balance", newRemaining);

      // Default to approving the payment if payment_status wasn't provided explicitly
      if (typeof payment_status === "undefined" || payment_status === null) {
        payment_status_effective = "approved";
      }
    } else {
      // No collect_amount provided - allow direct updates to these fields
      pushField(
        "down_payment",
        typeof down_payment === "undefined" ? undefined : down_payment,
      );
      pushField(
        "amount_paid",
        typeof amount_paid === "undefined" ? undefined : amount_paid,
      );
      pushField(
        "remaining_balance",
        typeof remaining_balance === "undefined"
          ? undefined
          : remaining_balance,
      );
    }

    // Push other optional edits (use effective payment status if modified by collect_amount)
    pushField("payment_status", payment_status_effective ?? null);
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

    // Handle upload if provided
    if (payment_proof) {
      const uploadResult = await upload_file(
        payment_proof,
        "staycation-haven/payment-proofs",
      );
      pushField("payment_proof_url", uploadResult.url);
    }

    // If reviewed_by or (effective) payment_status is provided, set reviewed_at = NOW()
    if (
      typeof reviewed_by !== "undefined" ||
      typeof payment_status_effective !== "undefined"
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

    // If payment_status_effective is rejected, update booking.status to rejected.
    // If payment_status_effective is approved and remaining_balance is zero, mark booking as approved (fully paid).
    if (payment_status_effective === "rejected") {
      await client.query(
        `UPDATE booking SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
        ["rejected", rejection_reason ?? null, updatedPayment.booking_id],
      );
    } else if (payment_status_effective === "approved") {
      const remainingAfter = Number(updatedPayment.remaining_balance ?? 0);
      if (remainingAfter === 0) {
        await client.query(
          `UPDATE booking SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
          ["approved", null, updatedPayment.booking_id],
        );
      }
    }

    // Commit transaction
    await client.query("COMMIT");

    // If approved (effective), send confirmation email similar to bookingController
    if (payment_status_effective === "approved") {
      try {
        // Fetch booking & guest for email
        const bookingDetailsQuery = `
          SELECT
            b.*,
            bg.first_name,
            bg.last_name,
            bg.email,
            bp.total_amount,
            bp.down_payment,
            bp.amount_paid
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
            // Prefer amount_paid if present (total paid so far), otherwise fall back to down_payment
            downPayment:
              booking.amount_paid ??
              updatedPayment.amount_paid ??
              booking.down_payment ??
              updatedPayment.down_payment,
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

    // Log employee activity (if provided via `reviewed_by`) to employee_activity_logs.
    // This captures approve/reject/update events performed by CSR/employee users.
    try {
      const ip =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        req.headers.get("cf-connecting-ip") ||
        null;
      const ua = req.headers.get("user-agent") || null;

      if (reviewed_by) {
        let activityType = "UPDATE_PAYMENT";
        let description = `Updated payment ${updatedPayment.id} for booking ${updatedPayment.booking_id}`;

        if (payment_status_effective === "approved") {
          activityType = "APPROVE_PAYMENT";
          description = `Approved payment for booking ${updatedPayment.booking_id}. Collected: ${collect_amount ?? "N/A"}. Applied: ${appliedAmountForLog}. Remaining: ${updatedPayment.remaining_balance ?? 0}.`;
        } else if (payment_status_effective === "rejected") {
          activityType = "REJECT_PAYMENT";
          description = `Rejected payment for booking ${updatedPayment.booking_id}. Reason: ${rejection_reason ?? "N/A"}.`;
        } else {
          const changedFields = updateFields
            .map((f) => f.split("=")[0].trim())
            .join(", ");
          if (changedFields) {
            description = `Updated payment ${updatedPayment.id} fields: ${changedFields}`;
          }
        }

        await client.query(
          `INSERT INTO employee_activity_logs (employee_id, activity_type, description, entity_type, entity_id, ip_address, user_agent, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
          [
            reviewed_by,
            activityType,
            description,
            "payment",
            updatedPayment.id,
            ip,
            ua,
          ],
        );

        console.log("✅ Employee activity logged:", {
          employee_id: reviewed_by,
          activity_type: activityType,
          entity_id: updatedPayment.id,
        });
      }
    } catch (logErr) {
      console.error("❌ Failed to log employee activity:", logErr);
    }

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
