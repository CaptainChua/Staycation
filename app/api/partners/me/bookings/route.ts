import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

export async function GET(req: NextRequest) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const status = searchParams.get("status");

    const conditions: string[] = ["h.partner_id = $1"];
    const values: unknown[] = [partnerId];

    if (status && status !== "all") {
      values.push(status);
      conditions.push(`b.status = $${values.length}`);
    }

    // Whether to surface guest first/last name. Owner-controlled per partner.
    // Defensive: if the show_guest_details column hasn't been added yet
    // (migration not run), default to true and keep serving bookings.
    let showGuestDetails = true;
    try {
      const piRow = await pool.query<{ show_guest_details: boolean }>(
        `SELECT COALESCE(show_guest_details, true) AS show_guest_details
         FROM partners_information WHERE partner_id = $1`,
        [partnerId]
      );
      showGuestDetails = piRow.rows[0]?.show_guest_details ?? true;
    } catch (err) {
      console.warn(
        "[partners/me/bookings] show_guest_details lookup failed, defaulting to true:",
        err instanceof Error ? err.message : err
      );
    }

    const query = `
      SELECT
        b.id AS booking_uuid,
        b.booking_id,
        b.room_name,
        b.check_in_date,
        b.check_out_date,
        (b.check_out_date - b.check_in_date) AS nights,
        b.status,
        b.adults,
        b.children,
        b.infants,
        -- Per-booking visibility override set by the Owner. NULL = inherit
        -- partner default (computed above). Migration:
        -- backend/models/2026-05-21-booking-guest-visibility-override.sql
        b.show_guest_details_override,
        b.created_at,
        h.uuid_id AS haven_id,
        h.weekday_rate,
        h.weekend_rate,
        -- Gross = collected revenue that CSR has already APPROVED.
        -- Pending payments don't count yet — partner sees the money only after CSR review.
        COALESCE(
          (SELECT SUM(bp.amount_paid)
             FROM booking_payments bp
            WHERE bp.booking_id = b.id
              AND bp.payment_status IN ('approved_down_payment', 'approved_full_payment')),
          0
        )::numeric(12,2) AS gross,
        COALESCE(pi.commission_rate, 12)::numeric AS commission_rate,
        -- Amenities = rentable items / extras the guest selected at booking time.
        -- We expose them so the partner can hover to see the breakdown and
        -- know what to prepare.
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id',       ao.id,
                'name',     ao.name,
                'price',    ao.price,
                'quantity', ao.quantity,
                'status',   ao.status,
                'total',    (ao.price * ao.quantity)
              )
              ORDER BY ao.name
            )
            FROM booking_add_ons ao
            WHERE ao.booking_id = b.id
          ),
          '[]'::json
        ) AS amenities,
        COALESCE(
          (
            SELECT SUM(ao.price * ao.quantity)
            FROM booking_add_ons ao
            WHERE ao.booking_id = b.id
              AND ao.status NOT IN ('cancelled', 'refunded')
          ),
          0
        )::numeric(12,2) AS amenities_total,
        bg.first_name AS guest_first_name,
        bg.last_name  AS guest_last_name
      FROM booking b
      JOIN havens h ON h.haven_name = b.room_name
      LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
      LEFT JOIN LATERAL (
        SELECT first_name, last_name
        FROM booking_guests
        WHERE booking_id = b.id
        ORDER BY id
        LIMIT 1
      ) bg ON true
      WHERE ${conditions.join(" AND ")}
      ORDER BY b.created_at DESC
      LIMIT ${limit};
    `;

    const result = await pool.query(query, values);

    // Compute commission/fee/net + gate guest name fields. Per-booking
    // override (b.show_guest_details_override) wins if set; otherwise we fall
    // back to the partner-level default (showGuestDetails).
    const data = result.rows.map((b) => {
      const gross = Number(b.gross) || 0;
      const commissionRate = Number(b.commission_rate) / 100;
      const commission = Math.round(gross * commissionRate);
      const fee = Math.round(gross * 0.02);
      const net = gross - commission - fee;
      const effectiveVisible =
        b.show_guest_details_override === null || b.show_guest_details_override === undefined
          ? showGuestDetails
          : Boolean(b.show_guest_details_override);
      return {
        ...b,
        guest_first_name: effectiveVisible ? b.guest_first_name : null,
        guest_last_name: effectiveVisible ? b.guest_last_name : null,
        guest_details_visible: effectiveVisible,
        // Surface the raw override so the owner-side UI can show the toggle state.
        show_guest_details_override: b.show_guest_details_override ?? null,
        commission,
        fee,
        net,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load bookings";
    console.error("[partners/me/bookings] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
