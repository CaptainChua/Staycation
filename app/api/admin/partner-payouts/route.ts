import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getServerSession } from "next-auth";
import { resolveCommissionForHaven, computeBreakdown } from "@/backend/utils/bookingBreakdown";

// GET /api/admin/partner-payouts
//   ?status=pending|processing|paid|failed|cancelled|all
//   ?partner_id=<uuid>
// Returns enriched payout rows with partner context and line items.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "all").toLowerCase();
    const partnerId = url.searchParams.get("partner_id");

    const params: (string | number)[] = [];
    const where: string[] = [];

    if (status !== "all") {
      params.push(status);
      where.push(`p.status = $${params.length}`);
    }
    if (partnerId) {
      params.push(partnerId);
      where.push(`p.partner_id = $${params.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
         p.id::text,
         p.partner_id::text,
         pi.partner_fullname,
         pa.partner_email,
         p.cycle_start::text, p.cycle_end::text,
         p.scheduled_date::text, p.paid_at,
         p.gross_amount, p.commission_amount, p.processing_fee,
         p.deductions_total, p.deductions,
         p.net_amount,
         p.payment_method, p.payment_destination,
         p.reference_number, p.proof_of_payment_url,
         p.status, p.notes, p.reviewer_notes,
         p.created_at, p.updated_at,
         (
           SELECT COUNT(*)::int FROM partner_payout_items WHERE payout_id = p.id
         ) AS item_count
       FROM partner_payouts p
       LEFT JOIN partners_account pa ON pa.id = p.partner_id
       LEFT JOIN partners_information pi ON pi.partner_id = p.partner_id
       ${whereClause}
       ORDER BY
         CASE p.status
           WHEN 'pending' THEN 1
           WHEN 'processing' THEN 2
           WHEN 'paid' THEN 3
           ELSE 4
         END,
         p.created_at DESC
       LIMIT 200`,
      params
    );

    const counts = await pool.query(
      `SELECT status, COUNT(*)::int AS count FROM partner_payouts GROUP BY status`
    );
    const countMap: Record<string, number> = {};
    counts.rows.forEach((r: { status: string; count: number }) => {
      countMap[r.status] = r.count;
    });

    return NextResponse.json({ success: true, data: result.rows, counts: countMap });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({ success: true, data: [], counts: {} });
    }
    const msg = err instanceof Error ? err.message : "Failed to load payouts";
    console.error("[admin/partner-payouts GET] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// POST /api/admin/partner-payouts
// Generate a new payout for a partner over a date range.
// Body: { partner_id, cycle_start (YYYY-MM-DD), cycle_end, scheduled_date?, payment_method?, payment_destination?, deductions? }
// System picks completed-but-unpaid bookings in the range, computes breakdowns,
// creates the payout row, and inserts line items. Marks each booking as settled.
export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const partnerId: string = body.partner_id;
    const cycleStart: string = body.cycle_start;
    const cycleEnd: string = body.cycle_end;
    const scheduledDate: string | null = body.scheduled_date || null;
    const paymentMethod: string | null = body.payment_method || null;
    const paymentDestination: string | null = body.payment_destination || null;
    const deductions: Array<{ label: string; amount: number }> = Array.isArray(body.deductions)
      ? body.deductions
      : [];

    if (!partnerId || !cycleStart || !cycleEnd) {
      return NextResponse.json(
        { success: false, error: "partner_id, cycle_start, cycle_end are required" },
        { status: 400 }
      );
    }

    // Find the reviewer/admin id from the session email
    const reviewerLookup = await client.query<{ id: string }>(
      `SELECT id FROM employees WHERE email = $1 LIMIT 1`,
      [session.user.email]
    );
    const reviewerId = reviewerLookup.rows[0]?.id || null;

    await client.query("BEGIN");

    // Eligible bookings: completed (or checked-in), within range, not already settled
    const bookings = await client.query(
      `SELECT
         b.booking_uuid::text AS booking_uuid,
         b.booking_id,
         b.haven_id::text AS haven_id,
         h.haven_name,
         b.check_in_date::text, b.check_out_date::text, b.nights,
         COALESCE(bp.total_amount, b.total_amount, 0) AS gross,
         COALESCE(bp.add_ons_total, 0) AS cleaning_fee,
         COALESCE(bg.firstname || ' ' || bg.lastname, '—') AS guest_name
       FROM booking b
       JOIN havens h ON h.uuid_id = b.haven_id
       LEFT JOIN booking_payments bp ON bp.booking_id = b.booking_id
       LEFT JOIN booking_guests bg ON bg.booking_id = b.booking_id
       WHERE h.partner_id = $1
         AND b.payout_id IS NULL
         AND b.status IN ('completed','checked-in')
         AND b.check_out_date >= $2::date
         AND b.check_out_date <= $3::date
       ORDER BY b.check_in_date ASC`,
      [partnerId, cycleStart, cycleEnd]
    );

    if (bookings.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { success: false, error: "No eligible bookings in that date range" },
        { status: 400 }
      );
    }

    // Compute per-booking breakdown
    const havenCache = new Map<string, Awaited<ReturnType<typeof resolveCommissionForHaven>>>();
    let totalGross = 0;
    let totalCommission = 0;
    let totalProcessing = 0;
    let totalNet = 0;

    type LineItem = {
      booking_uuid: string;
      booking_id: string;
      haven_id: string;
      haven_name: string;
      guest_name: string;
      check_in_date: string;
      check_out_date: string;
      nights: number;
      gross: number;
      cleaning_fee: number;
      platform_share: number;
      partner_share: number;
      processing_fee: number;
      commission_type: string;
    };
    const lineItems: LineItem[] = [];

    for (const row of bookings.rows) {
      if (!havenCache.has(row.haven_id)) {
        havenCache.set(row.haven_id, await resolveCommissionForHaven(row.haven_id));
      }
      const cfg = havenCache.get(row.haven_id)!;
      const bd = computeBreakdown(
        {
          gross: Number(row.gross) || 0,
          cleaning_fee: Number(row.cleaning_fee) || 0,
          nights: Number(row.nights) || 1,
        },
        cfg
      );
      lineItems.push({
        booking_uuid: row.booking_uuid,
        booking_id: row.booking_id,
        haven_id: row.haven_id,
        haven_name: row.haven_name,
        guest_name: row.guest_name,
        check_in_date: row.check_in_date,
        check_out_date: row.check_out_date,
        nights: Number(row.nights) || 1,
        gross: bd.gross,
        cleaning_fee: bd.cleaning_fee,
        platform_share: bd.platform_share,
        partner_share: bd.partner_share,
        processing_fee: bd.processing_fee,
        commission_type: bd.commission_type,
      });
      totalGross += bd.gross;
      totalCommission += bd.platform_share;
      totalProcessing += bd.processing_fee;
      totalNet += bd.partner_share - bd.processing_fee;
    }

    const deductionsTotal = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const netAfterDeductions = Math.max(0, totalNet - deductionsTotal);

    // Create the payout row
    const payout = await client.query(
      `INSERT INTO partner_payouts
         (partner_id, cycle_start, cycle_end, scheduled_date,
          gross_amount, commission_amount, processing_fee,
          deductions_total, deductions, net_amount,
          payment_method, payment_destination, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, 'pending', $13)
       RETURNING id::text, partner_id::text, cycle_start::text, cycle_end::text, scheduled_date::text,
                 gross_amount, commission_amount, processing_fee, deductions_total, deductions,
                 net_amount, payment_method, payment_destination, status, created_at`,
      [
        partnerId,
        cycleStart,
        cycleEnd,
        scheduledDate,
        round2(totalGross),
        round2(totalCommission),
        round2(totalProcessing),
        round2(deductionsTotal),
        JSON.stringify(deductions),
        round2(netAfterDeductions),
        paymentMethod,
        paymentDestination,
        reviewerId,
      ]
    );
    const payoutId = payout.rows[0].id;

    // Insert line items + mark bookings as settled
    for (const li of lineItems) {
      await client.query(
        `INSERT INTO partner_payout_items
           (payout_id, booking_uuid, booking_id, haven_id, haven_name, guest_name,
            check_in_date, check_out_date, nights, gross, cleaning_fee,
            platform_share, partner_share, processing_fee, commission_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          payoutId,
          li.booking_uuid,
          li.booking_id,
          li.haven_id,
          li.haven_name,
          li.guest_name,
          li.check_in_date,
          li.check_out_date,
          li.nights,
          li.gross,
          li.cleaning_fee,
          li.platform_share,
          li.partner_share,
          li.processing_fee,
          li.commission_type,
        ]
      );
      await client.query(
        `UPDATE booking SET payout_id = $1, payout_settled_at = NOW() WHERE booking_uuid = $2`,
        [payoutId, li.booking_uuid]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({
      success: true,
      data: { ...payout.rows[0], item_count: lineItems.length },
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = err instanceof Error ? err.message : "Failed to generate payout";
    console.error("[admin/partner-payouts POST] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;
