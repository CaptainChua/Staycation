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
        b.created_at,
        h.uuid_id AS haven_id,
        h.weekday_rate,
        h.weekend_rate,
        COALESCE(
          (SELECT SUM(bp.amount) FROM booking_payments bp WHERE bp.booking_id = b.id),
          0
        )::numeric(12,2) AS gross,
        COALESCE(pi.commission_rate, 12)::numeric AS commission_rate
      FROM booking b
      JOIN havens h ON h.haven_name = b.room_name
      LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY b.created_at DESC
      LIMIT ${limit};
    `;

    const result = await pool.query(query, values);

    // Mask guest names + compute commission/fee/net
    const data = result.rows.map((b) => {
      const gross = Number(b.gross) || 0;
      const commissionRate = Number(b.commission_rate) / 100;
      const commission = Math.round(gross * commissionRate);
      const fee = Math.round(gross * 0.02);
      const net = gross - commission - fee;
      return {
        ...b,
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
