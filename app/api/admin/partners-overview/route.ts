import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

// GET /api/admin/partners-overview?partner_id=<uuid>
// Aggregated stats across all partners (or scoped to one partner when ?partner_id is set).
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const url = new URL(req.url);
    const partnerId = url.searchParams.get("partner_id") || null;
    // Param shared by all queries: $1 = partner_id filter (or NULL for "all partners")
    const params: (string | null)[] = [partnerId];

    const [partnerStats, havenStats, bookingStats, recentActivity] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_partners,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active_partners,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_partners,
          COUNT(*) FILTER (WHERE status = 'suspended')::int AS suspended_partners,
          COALESCE(SUM(pi.total_earnings), 0)::numeric(12,2) AS total_partner_earnings,
          COALESCE(SUM(pi.total_paid), 0)::numeric(12,2) AS total_paid_out,
          COALESCE(AVG(pi.commission_rate), 12)::numeric(5,2) AS avg_commission_rate
        FROM partners_account pa
        LEFT JOIN partners_information pi ON pi.partner_id = pa.id
        WHERE ($1::uuid IS NULL OR pa.id = $1::uuid)
      `, params),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_partner_havens,
          COUNT(*) FILTER (WHERE COALESCE(pa.status, 'pending') = 'pending')::int AS pending_havens,
          COUNT(*) FILTER (WHERE COALESCE(pa.status, 'pending') = 'approved')::int AS approved_havens,
          COUNT(*) FILTER (WHERE COALESCE(pa.status, 'pending') = 'rejected')::int AS rejected_havens
        FROM havens h
        LEFT JOIN property_approval pa ON pa.haven_id = h.uuid_id
        WHERE h.partner_id IS NOT NULL
          AND ($1::uuid IS NULL OR h.partner_id = $1::uuid)
      `, params),
      pool.query(`
        SELECT
          COUNT(b.id)::int AS total_bookings,
          COUNT(b.id) FILTER (WHERE b.status = 'completed')::int AS completed_bookings,
          COUNT(b.id) FILTER (WHERE b.created_at >= NOW() - INTERVAL '30 days')::int AS bookings_last_30d,
          COALESCE(
            SUM(
              (SELECT SUM(bp.amount_paid)
                 FROM booking_payments bp
                WHERE bp.booking_id = b.id
                  AND bp.payment_status IN ('approved_down_payment', 'approved_full_payment'))
            ),
            0
          )::numeric(12,2) AS gross_revenue
        FROM booking b
        JOIN havens h ON h.haven_name = b.room_name
        WHERE h.partner_id IS NOT NULL
          AND ($1::uuid IS NULL OR h.partner_id = $1::uuid)
      `, params),
      pool.query(`
        (
          SELECT 'haven_submitted' AS kind, h.haven_name AS title,
                 pi.partner_fullname AS partner, h.created_at AS at
          FROM havens h
          LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
          WHERE h.partner_id IS NOT NULL
            AND ($1::uuid IS NULL OR h.partner_id = $1::uuid)
          ORDER BY h.created_at DESC LIMIT 5
        )
        UNION ALL
        (
          SELECT 'booking_made' AS kind,
                 ('Booking ' || b.booking_id || ' on ' || b.room_name) AS title,
                 pi.partner_fullname AS partner,
                 b.created_at AS at
          FROM booking b
          JOIN havens h ON h.haven_name = b.room_name
          LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
          WHERE h.partner_id IS NOT NULL
            AND ($1::uuid IS NULL OR h.partner_id = $1::uuid)
          ORDER BY b.created_at DESC LIMIT 5
        )
        ORDER BY at DESC LIMIT 8
      `, params),
    ]);

    const p = partnerStats.rows[0] || {};
    const h = havenStats.rows[0] || {};
    const b = bookingStats.rows[0] || {};
    // Platform commission = approved gross revenue × avg commission rate.
    // This reflects money actually collected rather than a stale stored column.
    const grossRevenue = Number(b.gross_revenue) || 0;
    const avgRate = Number(p.avg_commission_rate) || 12;
    const platformCommission = Math.round(grossRevenue * (avgRate / 100));
    const partnerEarnings = Math.max(0, grossRevenue - platformCommission);

    return NextResponse.json({
      success: true,
      data: {
        partners: {
          total: Number(p.total_partners) || 0,
          active: Number(p.active_partners) || 0,
          pending: Number(p.pending_partners) || 0,
          suspended: Number(p.suspended_partners) || 0,
        },
        havens: {
          total: Number(h.total_partner_havens) || 0,
          pending: Number(h.pending_havens) || 0,
          approved: Number(h.approved_havens) || 0,
          rejected: Number(h.rejected_havens) || 0,
        },
        bookings: {
          total: Number(b.total_bookings) || 0,
          completed: Number(b.completed_bookings) || 0,
          last_30_days: Number(b.bookings_last_30d) || 0,
          gross_revenue: Number(b.gross_revenue) || 0,
        },
        financials: {
          partner_earnings: partnerEarnings,
          partner_paid: Number(p.total_paid_out) || 0,
          platform_commission: platformCommission,
          avg_commission_rate: avgRate,
        },
        recent_activity: recentActivity.rows,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load partner overview";
    console.error("[admin/partners-overview] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
