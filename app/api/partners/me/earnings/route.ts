import { NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";
import { resolveCommissionForHaven, computeBreakdown } from "@/backend/utils/bookingBreakdown";

// GET /api/partners/me/earnings
// Returns the partner's bookings with PER-BOOKING breakdowns (gross, platform share,
// partner share, net payable, payout status). Used by the Cost Breakdown page to
// show transparent revenue numbers BEFORE a payout is generated.
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await pool.query(
      `SELECT
         b.id::text AS booking_uuid,
         b.booking_id,
         h.uuid_id::text AS haven_id,
         h.haven_name,
         b.check_in_date::text,
         b.check_out_date::text,
         GREATEST(b.check_out_date - b.check_in_date, 1) AS nights,
         b.status,
         b.booking_source,
         b.payout_id::text AS payout_id,
         b.payout_settled_at,
         COALESCE(bp.total_amount, 0) AS gross,
         COALESCE(bp.add_ons_total, 0) AS cleaning_fee
       FROM booking b
       JOIN havens h ON h.haven_name = b.room_name
       LEFT JOIN LATERAL (
         SELECT total_amount, add_ons_total
         FROM booking_payments
         WHERE booking_id = b.id
         ORDER BY created_at DESC
         LIMIT 1
       ) bp ON true
       WHERE h.partner_id = $1
       ORDER BY b.check_in_date DESC NULLS LAST
       LIMIT 100`,
      [partnerId]
    );

    // Resolve commission per unique haven once, then compute each row
    const havenCache = new Map<string, Awaited<ReturnType<typeof resolveCommissionForHaven>>>();
    const items: Array<Record<string, unknown>> = [];

    for (const row of bookings.rows) {
      if (!havenCache.has(row.haven_id)) {
        havenCache.set(row.haven_id, await resolveCommissionForHaven(row.haven_id));
      }
      const config = havenCache.get(row.haven_id)!;
      const breakdown = computeBreakdown(
        {
          gross: Number(row.gross) || 0,
          cleaning_fee: Number(row.cleaning_fee) || 0,
          nights: Number(row.nights) || 1,
        },
        config
      );
      items.push({
        booking_uuid: row.booking_uuid,
        booking_id: row.booking_id,
        haven_id: row.haven_id,
        haven_name: row.haven_name,
        check_in_date: row.check_in_date,
        check_out_date: row.check_out_date,
        nights: Number(row.nights) || 1,
        status: row.status,
        booking_source: row.booking_source,
        payout_id: row.payout_id,
        payout_settled_at: row.payout_settled_at,
        ...breakdown,
        commission_config: config,
      });
    }

    // Totals across all rows
    type Totals = {
      gross: number; partner_share: number; platform_share: number;
      net_payable: number; pending_payout: number;
    };
    const totals = items.reduce<Totals>(
      (acc, it) => ({
        gross: acc.gross + Number(it.gross),
        partner_share: acc.partner_share + Number(it.partner_share),
        platform_share: acc.platform_share + Number(it.platform_share),
        net_payable: acc.net_payable + Number(it.net_payable),
        pending_payout: acc.pending_payout +
          (it.payout_id == null && (it.status === "completed" || it.status === "checked-in")
            ? Number(it.net_payable) : 0),
      }),
      { gross: 0, partner_share: 0, platform_share: 0, net_payable: 0, pending_payout: 0 }
    );

    return NextResponse.json({ success: true, data: { items, totals } });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    // 42P01 = undefined_table, 42703 = undefined_column — degrade gracefully
    // until the revenue-share / calendar-sync migrations are applied.
    if (code === "42P01" || code === "42703") {
      return NextResponse.json({ success: true, data: { items: [], totals: null } });
    }
    const msg = err instanceof Error ? err.message : "Failed to load earnings";
    console.error("[partners/me/earnings] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
