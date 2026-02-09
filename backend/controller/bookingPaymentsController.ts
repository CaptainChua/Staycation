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
      // remaining_balance is computed, not used from body
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

    // Ensure proper number conversion and calculate remaining_balance to satisfy DB constraint
    // The constraint requires: remaining_balance = total_amount - down_payment
    const computedTotal = Number(total_amount) || 0;
    const computedDown = Number(down_payment) || 0;
    const computedRemaining = computedTotal - computedDown;
    // amount_paid defaults to down_payment if not provided
    const computedAmountPaid =
      typeof amount_paid !== "undefined" && amount_paid !== null
        ? Number(amount_paid)
        : computedDown;

    const insertQuery = `
      INSERT INTO booking_payments (
        booking_id, payment_method, payment_proof_url, room_rate,
        add_ons_total, total_amount, down_payment, remaining_balance, amount_paid, created_at
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
      computedRemaining,
      computedAmountPaid,
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
    // Fallback state for older DBs that enforce remaining_balance = total_amount - down_payment.
    // These variables are populated when handling `collect_amount` so the fallback can
    // update `down_payment` to satisfy legacy constraints if needed.
    let prevDownForFallback: number | null = null;
    let fallbackNewAmountPaid: number | null = null;
    let fallbackNewRemaining: number | null = null;
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
        `SELECT down_payment, remaining_balance, total_amount, amount_paid FROM booking_payments WHERE id = $1 FOR UPDATE`,
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
      const actualPrevRemaining = Number(cur.remaining_balance ?? 0);
      const prevAmountPaid = Number(cur.amount_paid ?? 0);

      // If collecting less than the outstanding remaining balance, only allow it
      // when the collected amount matches the submitted down payment (i.e. this
      // is an approval of a submitted payment). Otherwise, reject as insufficient.
      if (collectAmount < actualPrevRemaining) {
        if (prevDown !== collectAmount) {
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

      const newAmountPaid = prevAmountPaid + appliedAmount;
      const newRemaining = Math.max(0, actualPrevRemaining - appliedAmount);

      // Save fallback values for compatibility with older DB schemas that tie
      // remaining_balance to down_payment. These are used only if the update
      // fails due to a check-constraint violation.
      prevDownForFallback = prevDown;
      fallbackNewAmountPaid = newAmountPaid;
      fallbackNewRemaining = newRemaining;

      // Update with computed incremental values.
      // Note: Do not modify the original submitted down_payment here — it should
      // represent the original down payment and remain unchanged when collecting
      // additional amounts. Only update cumulative fields like amount_paid and
      // remaining_balance.
      pushField("amount_paid", newAmountPaid);
      pushField("remaining_balance", newRemaining);

      // Default to approving the payment if payment_status wasn't provided explicitly
      if (typeof payment_status === "undefined" || payment_status === null) {
        payment_status_effective = "approved";
      }
    } else {
      // No collect_amount provided - allow direct updates to these fields
      // But we must ensure remaining_balance = total_amount - down_payment constraint
      if (
        typeof down_payment !== "undefined" ||
        typeof total_amount !== "undefined"
      ) {
        // If down_payment or total_amount changes, we need to recalculate remaining_balance
        // Fetch current values first
        const currentRes = await client.query(
          `SELECT down_payment, total_amount FROM booking_payments WHERE id = $1`,
          [id],
        );
        if (currentRes.rows.length > 0) {
          const cur = currentRes.rows[0];
          const newTotal =
            typeof total_amount !== "undefined"
              ? Number(total_amount)
              : Number(cur.total_amount ?? 0);
          const newDown =
            typeof down_payment !== "undefined"
              ? Number(down_payment)
              : Number(cur.down_payment ?? 0);
          const newRemaining = newTotal - newDown;

          pushField("down_payment", newDown);
          pushField("total_amount", newTotal);
          pushField("remaining_balance", newRemaining);
        }
      } else if (typeof remaining_balance !== "undefined") {
        // If only remaining_balance is provided, we can't satisfy the constraint
        // So we need to adjust down_payment accordingly
        const currentRes = await client.query(
          `SELECT total_amount FROM booking_payments WHERE id = $1`,
          [id],
        );
        if (currentRes.rows.length > 0) {
          const curTotal = Number(currentRes.rows[0].total_amount ?? 0);
          const newRemaining = Number(remaining_balance);
          const newDown = curTotal - newRemaining;

          pushField("down_payment", newDown);
          pushField("remaining_balance", newRemaining);
        }
      }
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
      "amount_paid",
      typeof amount_paid === "undefined" ? undefined : amount_paid,
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

    // Execute update and provide a fallback for older DBs that enforce
    // remaining_balance = total_amount - down_payment (check constraint).
    let updateRes;
    let updatedPayment;
    try {
      updateRes = await client.query(query, values);
      if (updateRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { success: false, error: "Booking payment not found" },
          { status: 404 },
        );
      }
      updatedPayment = updateRes.rows[0];
    } catch (err) {
      // Detect Postgres check-constraint violation (SQLSTATE 23514) or message text.
      const errObj = (err as Record<string, unknown>) || {};
      const errCode =
        typeof errObj["code"] === "string" ? (errObj["code"] as string) : null;
      const errMsg =
        typeof errObj["message"] === "string"
          ? (errObj["message"] as string)
          : String(err);
      const isCheckViolation =
        errCode === "23514" || /violates check constraint/i.test(errMsg);

      if (isCheckViolation && prevDownForFallback !== null) {
        // If this was a full settlement (i.e. the applied collection would reduce
        // the remaining balance to zero), DO NOT perform the compatibility fallback
        // that mutates `down_payment`. Mutating `down_payment` on full settlement
        // changes the original down payment, which is not allowed. Instead, rollback
        // and return a clear, actionable error. This forces a schema migration to
        // the amount_paid-based model (preferred long-term).
        if (Number(fallbackNewRemaining ?? 0) === 0) {
          try {
            await client.query("ROLLBACK");
          } catch (_) {}

          console.error(
            "❌ Approve blocked by booking_payments check constraint: approving the full remaining balance would require mutating down_payment. Please run the DB migration to make remaining_balance derive from amount_paid (see backend/migrations/2026-01-30-fix-booking-payments.sql).",
          );

          return NextResponse.json(
            {
              success: false,
              error:
                "Cannot approve payment: database schema requires changing down_payment to reflect the applied amount. This operation would mutate the original down payment. Please run the migration to use amount_paid for remaining_balance (backend/migrations/2026-01-30-fix-booking-payments.sql) and try again.",
            },
            { status: 409 },
          );
        }

        // Attempt fallback that also updates down_payment to satisfy legacy constraint
        // (only allowed for non-full-settlement partial approvals for backward compatibility).
        try {
          await client.query("ROLLBACK");
        } catch (_) {}

        try {
          await client.query("BEGIN");
          const newDownFallback = prevDownForFallback + appliedAmountForLog;
          const fbParts: string[] = [];
          const fbValues: unknown[] = [];
          let j = 1;

          fbParts.push(`amount_paid = $${j++}`);
          fbValues.push(fallbackNewAmountPaid ?? 0);

          fbParts.push(`remaining_balance = $${j++}`);
          fbValues.push(fallbackNewRemaining ?? 0);

          fbParts.push(`down_payment = $${j++}`);
          fbValues.push(newDownFallback);

          if (typeof payment_status_effective !== "undefined") {
            fbParts.push(`payment_status = $${j++}`);
            fbValues.push(payment_status_effective ?? null);
          }

          if (typeof reviewed_by !== "undefined") {
            fbParts.push(`reviewed_by = $${j++}`);
            fbValues.push(reviewed_by ?? null);
          }

          if (
            typeof reviewed_by !== "undefined" ||
            typeof payment_status_effective !== "undefined"
          ) {
            fbParts.push(`reviewed_at = NOW()`);
          }

          const fbQuery = `
            UPDATE booking_payments
            SET ${fbParts.join(", ")}
            WHERE id = $${j}
            RETURNING *
          `;
          fbValues.push(id);

          const fbRes = await client.query(fbQuery, fbValues);

          if (fbRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { success: false, error: "Booking payment not found" },
              { status: 404 },
            );
          }

          updatedPayment = fbRes.rows[0];
        } catch (fbErr) {
          await client.query("ROLLBACK").catch(() => {});
          console.error("❌ Fallback update failed:", fbErr);
          return NextResponse.json(
            {
              success: false,
              error:
                fbErr instanceof Error
                  ? fbErr.message
                  : "Failed to update booking payment (fallback)",
            },
            { status: 500 },
          );
        }
      } else {
        await client.query("ROLLBACK").catch(() => {});
        console.error("❌ Error updating booking payment:", err);
        return NextResponse.json(
          {
            success: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to update booking payment",
          },
          { status: 500 },
        );
      }
    }

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
            downPayment: booking.down_payment ?? updatedPayment.down_payment,
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
