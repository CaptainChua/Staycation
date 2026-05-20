import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/listings/[havenId]/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns a unified list of calendar events for one haven over a date range:
//   - manual partner / admin blocks
//   - maintenance
//   - external iCal imports (with source)
//   - real Staycation bookings (approved/confirmed/checked-in/completed)
export async function GET(req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId } = await ctx.params;

    // Ownership check
    const owns = await pool.query(
      `SELECT 1 FROM havens WHERE uuid_id = $1 AND partner_id = $2`,
      [havenId, partnerId]
    );
    if (owns.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const params: (string | null)[] = [havenId];
    let dateClause = "";
    if (from && to) {
      params.push(from, to);
      dateClause = ` AND from_date <= $3 AND to_date >= $2`;
    }

    const blocks = await pool.query(
      `SELECT id::text, from_date::text, to_date::text, reason, block_type,
              external_source, external_uid, external_summary, synced_at, created_at
       FROM blocked_dates
       WHERE haven_id = $1 ${dateClause}
       ORDER BY from_date`,
      params
    );

    // Real Staycation bookings — show as 'booked' on the calendar.
    // booking has no haven_id column; link via room_name = haven_name.
    const bookingParams: (string | null)[] = [havenId];
    let bookingDateClause = "";
    if (from && to) {
      bookingParams.push(from, to);
      bookingDateClause = ` AND b.check_in_date <= $3 AND b.check_out_date >= $2`;
    }
    let bookings: { rows: Array<Record<string, unknown>> };
    try {
      bookings = await pool.query(
        `SELECT b.id::text AS id, b.booking_id,
                b.check_in_date::text, b.check_out_date::text,
                b.status,
                COALESCE(b.booking_source, 'staycation') AS booking_source
         FROM booking b
         JOIN havens h ON h.haven_name = b.room_name
         WHERE h.uuid_id = $1 ${bookingDateClause}
           AND b.status IN ('approved','confirmed','checked-in','completed','pending')
         ORDER BY b.check_in_date`,
        bookingParams
      );
    } catch (e: unknown) {
      // booking_source column may not exist yet if the calendar/ical migration wasn't run
      if ((e as { code?: string })?.code === "42703") {
        bookings = await pool.query(
          `SELECT b.id::text AS id, b.booking_id,
                  b.check_in_date::text, b.check_out_date::text,
                  b.status,
                  'staycation'::text AS booking_source
           FROM booking b
           JOIN havens h ON h.haven_name = b.room_name
           WHERE h.uuid_id = $1 ${bookingDateClause}
             AND b.status IN ('approved','confirmed','checked-in','completed','pending')
           ORDER BY b.check_in_date`,
          bookingParams
        );
      } else {
        throw e;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        blocks: blocks.rows,
        bookings: bookings.rows,
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: { blocks: [], bookings: [] } });
    }
    const msg = err instanceof Error ? err.message : "Failed to load calendar";
    console.error("[partners/me/listings/[havenId]/calendar GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/partners/me/listings/[havenId]/calendar
// Body: { from_date, to_date, reason?, block_type? ('manual_partner' | 'maintenance') }
export async function POST(req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { havenId } = await ctx.params;
    const body = await req.json();
    const fromDate = body.from_date;
    const toDate = body.to_date;
    const reason: string = body.reason ? String(body.reason).slice(0, 280) : "";
    const blockType: string =
      body.block_type === "maintenance" ? "maintenance" : "manual_partner";

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: "from_date and to_date are required" },
        { status: 400 }
      );
    }
    if (new Date(fromDate).getTime() > new Date(toDate).getTime()) {
      return NextResponse.json(
        { success: false, error: "from_date cannot be after to_date" },
        { status: 400 }
      );
    }

    // Ownership check
    const owns = await pool.query(
      `SELECT 1 FROM havens WHERE uuid_id = $1 AND partner_id = $2`,
      [havenId, partnerId]
    );
    if (owns.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const inserted = await pool.query(
      `INSERT INTO blocked_dates
         (haven_id, from_date, to_date, reason, block_type, blocked_by_role, blocked_by_id, created_at)
       VALUES ($1, $2, $3, $4, $5, 'partner', $6, NOW())
       RETURNING id::text, from_date::text, to_date::text, reason, block_type`,
      [havenId, fromDate, toDate, reason || (blockType === "maintenance" ? "Maintenance" : "Blocked"), blockType, partnerId]
    );

    return NextResponse.json({ success: true, data: inserted.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to block dates";
    console.error("[partners/me/listings/[havenId]/calendar POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
