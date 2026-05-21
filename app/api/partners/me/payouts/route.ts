import { NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { getPartnerIdFromSession } from "@/backend/utils/partnerSession";

// GET /api/partners/me/payouts
// Returns the partner's payouts (with summary + line items) AND a "pending bookings"
// section showing eligible-but-not-yet-paid bookings derived from completed stays.
export async function GET() {
  try {
    const partnerId = await getPartnerIdFromSession();
    if (!partnerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Recent payouts with their line items
    const payoutsResult = await pool.query(
      `SELECT
        id, cycle_start, cycle_end, scheduled_date, paid_at,
        gross_amount, commission_amount, processing_fee, net_amount,
        deductions_total, deductions,
        payment_method, payment_destination, reference_number,
        proof_of_payment_url, status, notes, created_at,
        (
          SELECT json_agg(json_build_object(
            'id', pi.id,
            'booking_id', pi.booking_id,
            'haven_name', pi.haven_name,
            'guest_name', pi.guest_name,
            'check_in_date', pi.check_in_date,
            'check_out_date', pi.check_out_date,
            'nights', pi.nights,
            'gross', pi.gross,
            'cleaning_fee', pi.cleaning_fee,
            'platform_share', pi.platform_share,
            'partner_share', pi.partner_share,
            'processing_fee', pi.processing_fee,
            'commission_type', pi.commission_type,
            'notes', pi.notes
          ))
          FROM partner_payout_items pi
          WHERE pi.payout_id = partner_payouts.id
        ) AS items
       FROM partner_payouts
       WHERE partner_id = $1
       ORDER BY COALESCE(paid_at, scheduled_date, created_at) DESC
       LIMIT 50`,
      [partnerId]
    );

    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(net_amount) FILTER (WHERE status = 'pending'), 0)::numeric(12,2) AS pending_amount,
        COALESCE(SUM(net_amount) FILTER (WHERE status = 'processing'), 0)::numeric(12,2) AS processing_amount,
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
      `SELECT
         commission_rate,
         total_earnings,
         total_paid,
         default_commission_type,
         default_partner_share_pct,
         default_platform_share_pct,
         default_cleaning_fee_share_pct,
         default_payment_schedule,
         payout_method,
         payout_destination
       FROM partners_information
       WHERE partner_id = $1`,
      [partnerId]
    );
    const partnerInfo = partnerResult.rows[0] || {};

    return NextResponse.json({
      success: true,
      data: {
        commission_rate: Number(partnerInfo.commission_rate) || Number(partnerInfo.default_platform_share_pct) || 12,
        default_config: {
          commission_type: partnerInfo.default_commission_type || "percentage",
          partner_share_pct: Number(partnerInfo.default_partner_share_pct) || 88,
          platform_share_pct: Number(partnerInfo.default_platform_share_pct) || 12,
          cleaning_fee_share_pct: Number(partnerInfo.default_cleaning_fee_share_pct) || 100,
          payment_schedule: partnerInfo.default_payment_schedule || "biweekly",
          payout_method: partnerInfo.payout_method || "gcash",
          payout_destination: partnerInfo.payout_destination || null,
        },
        total_earnings: Number(partnerInfo.total_earnings) || 0,
        total_paid: Number(summaryResult.rows[0]?.total_paid) || Number(partnerInfo.total_paid) || 0,
        pending_amount: Number(summaryResult.rows[0]?.pending_amount) || 0,
        processing_amount: Number(summaryResult.rows[0]?.processing_amount) || 0,
        next_payout_date: summaryResult.rows[0]?.next_payout_date || null,
        payouts: payoutsResult.rows,
      },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "42P01") {
      return NextResponse.json({
        success: true,
        data: {
          commission_rate: 12,
          default_config: {
            commission_type: "percentage",
            partner_share_pct: 88,
            platform_share_pct: 12,
            cleaning_fee_share_pct: 100,
            payment_schedule: "biweekly",
            payout_method: "gcash",
            payout_destination: null,
          },
          total_earnings: 0,
          total_paid: 0,
          pending_amount: 0,
          processing_amount: 0,
          next_payout_date: null,
          payouts: [],
        },
      });
    }
    const msg = err instanceof Error ? err.message : "Failed to load payouts";
    console.error("[partners/me/payouts] error:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
