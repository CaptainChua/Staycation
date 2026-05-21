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
    const days = Math.min(Number(searchParams.get("days") || 90), 365);

    // Top-line KPIs (active = haven has approval status approved, or no approval row yet)
    const kpiQuery = `
      SELECT
        COUNT(DISTINCT h.uuid_id) AS active_listings,
        COUNT(b.id) AS total_bookings,
        COALESCE(SUM(
          (SELECT SUM(bp.amount_paid) FROM booking_payments bp WHERE bp.booking_id = b.id AND bp.payment_status IN ('approved_down_payment', 'approved_full_payment'))
        ), 0)::numeric(12,2) AS gross_total
      FROM havens h
      LEFT JOIN booking b
        ON b.room_name = h.haven_name
        AND b.created_at >= NOW() - INTERVAL '${days} days'
      WHERE h.partner_id = $1;
    `;
    const kpiResult = await pool.query(kpiQuery, [partnerId]);
    const kpi = kpiResult.rows[0] || {};

    // Lifetime completed bookings — used for tier progression
    const lifetimeResult = await pool.query(
      `SELECT COUNT(b.id)::int AS lifetime_completed
       FROM booking b
       JOIN havens h ON h.haven_name = b.room_name
       WHERE h.partner_id = $1 AND b.status = 'completed'`,
      [partnerId]
    );
    const lifetimeCompleted = Number(lifetimeResult.rows[0]?.lifetime_completed) || 0;

    // Commission rate for net calculation
    const rateResult = await pool.query(
      `SELECT commission_rate FROM partners_information WHERE partner_id = $1`,
      [partnerId]
    );
    const commissionRate = Number(rateResult.rows[0]?.commission_rate ?? 12) / 100;
    const grossTotal = Number(kpi.gross_total) || 0;
    const netTotal = Math.round(grossTotal * (1 - commissionRate - 0.02));

    // Bookings by room
    const byRoomQuery = `
      SELECT
        h.haven_name AS room,
        COUNT(b.id)::int AS bookings,
        COALESCE(SUM(
          (SELECT SUM(bp.amount_paid) FROM booking_payments bp WHERE bp.booking_id = b.id AND bp.payment_status IN ('approved_down_payment', 'approved_full_payment'))
        ), 0)::numeric(12,2) AS gross
      FROM havens h
      LEFT JOIN booking b
        ON b.room_name = h.haven_name
        AND b.created_at >= NOW() - INTERVAL '${days} days'
      WHERE h.partner_id = $1
      GROUP BY h.uuid_id, h.haven_name
      ORDER BY gross DESC
      LIMIT 10;
    `;
    const byRoomResult = await pool.query(byRoomQuery, [partnerId]);
    const bookingsByRoom = byRoomResult.rows.map((r) => {
      const gross = Number(r.gross) || 0;
      return {
        room: r.room,
        bookings: r.bookings,
        net: Math.round(gross * (1 - commissionRate - 0.02)),
      };
    });

    // Weekly revenue series (last 12 weeks)
    const weeklyQuery = `
      SELECT
        TO_CHAR(date_trunc('week', b.created_at), 'YYYY-"W"WW') AS label,
        COALESCE(SUM(
          (SELECT SUM(bp.amount_paid) FROM booking_payments bp WHERE bp.booking_id = b.id AND bp.payment_status IN ('approved_down_payment', 'approved_full_payment'))
        ), 0)::numeric(12,2) AS gross
      FROM booking b
      JOIN havens h ON h.haven_name = b.room_name
      WHERE h.partner_id = $1
        AND b.created_at >= NOW() - INTERVAL '12 weeks'
      GROUP BY date_trunc('week', b.created_at)
      ORDER BY date_trunc('week', b.created_at) ASC;
    `;
    const weeklyResult = await pool.query(weeklyQuery, [partnerId]);
    const revenueSeries = weeklyResult.rows.map((r, i) => {
      const gross = Number(r.gross) || 0;
      return {
        label: `W${i + 1}`,
        gross,
        net: Math.round(gross * (1 - commissionRate - 0.02)),
      };
    });

    // Occupancy estimate (booked nights / available nights)
    const occupancyQuery = `
      SELECT
        COALESCE(SUM(b.check_out_date - b.check_in_date), 0)::int AS booked_nights,
        COUNT(DISTINCT h.uuid_id) AS room_count
      FROM havens h
      LEFT JOIN booking b
        ON b.room_name = h.haven_name
        AND b.check_in_date >= NOW() - INTERVAL '${days} days'
        AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
      WHERE h.partner_id = $1;
    `;
    const occupancyResult = await pool.query(occupancyQuery, [partnerId]);
    const bookedNights = Number(occupancyResult.rows[0]?.booked_nights) || 0;
    const roomCount = Number(occupancyResult.rows[0]?.room_count) || 0;
    const availableNights = roomCount * days;
    const occupancy = availableNights > 0 ? Math.round((bookedNights / availableNights) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        days,
        active_listings: Number(kpi.active_listings) || 0,
        total_bookings: Number(kpi.total_bookings) || 0,
        lifetime_completed_bookings: lifetimeCompleted,
        gross_total: grossTotal,
        net_total: netTotal,
        commission_rate: commissionRate * 100,
        occupancy,
        booked_nights: bookedNights,
        available_nights: availableNights,
        bookings_by_room: bookingsByRoom,
        revenue_series: revenueSeries,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load analytics";
    console.error("[partners/me/analytics] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
