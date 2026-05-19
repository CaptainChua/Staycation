import { NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payoutsResult = await pool.query(
      `SELECT
        id, cycle_start, cycle_end, scheduled_date, paid_at,
        gross_amount, commission_amount, processing_fee, net_amount,
        payment_method, reference_number, status, notes, created_at
       FROM partner_payouts
       WHERE partner_id = $1
       ORDER BY scheduled_date DESC
       LIMIT 50`,
      [partnerId]
    );

    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(net_amount) FILTER (WHERE status = 'pending'), 0)::numeric(12,2) AS pending_amount,
        COALESCE(SUM(net_amount) FILTER (WHERE status = 'paid'), 0)::numeric(12,2) AS total_paid,
        (
          SELECT scheduled_date FROM partner_payouts
          WHERE partner_id = $1 AND status IN ('pending', 'processing')
          ORDER BY scheduled_date ASC LIMIT 1
        ) AS next_payout_date
       FROM partner_payouts
       WHERE partner_id = $1`,
      [partnerId]
    );

    const partnerResult = await pool.query(
      `SELECT commission_rate, total_earnings, total_paid
       FROM partners_information
       WHERE partner_id = $1`,
      [partnerId]
    );
    const partnerInfo = partnerResult.rows[0] || {};

    return NextResponse.json({
      success: true,
      data: {
        commission_rate: Number(partnerInfo.commission_rate) || 12,
        total_earnings: Number(partnerInfo.total_earnings) || 0,
        total_paid: Number(partnerInfo.total_paid) || 0,
        pending_amount: Number(summaryResult.rows[0]?.pending_amount) || 0,
        next_payout_date: summaryResult.rows[0]?.next_payout_date || null,
        payouts: payoutsResult.rows,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load payouts";
    console.error("[partners/me/payouts] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
