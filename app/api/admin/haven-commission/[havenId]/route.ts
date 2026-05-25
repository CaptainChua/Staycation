import { NextRequest, NextResponse } from "next/server";
import pool from "@/backend/config/db";
import { requireAdmin } from "@/backend/utils/requireAdmin";

const VALID_TYPES = ["percentage", "fixed_daily", "fixed_commission", "hybrid"] as const;
const VALID_SCHEDULES = ["weekly", "biweekly", "monthly", "per_booking"] as const;

// GET — current commission for one haven (with partner default for fallback context)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { havenId } = await ctx.params;
    const r = await pool.query(
      `SELECT
         h.uuid_id::text AS haven_id, h.haven_name, h.partner_id::text,
         h.commission_type, h.partner_share_pct, h.platform_share_pct,
         h.fixed_daily_guarantee, h.fixed_commission, h.cleaning_fee_share_pct, h.payment_schedule,
         pi.default_commission_type, pi.default_partner_share_pct, pi.default_platform_share_pct,
         pi.default_fixed_daily_guarantee, pi.default_fixed_commission,
         pi.default_cleaning_fee_share_pct, pi.default_payment_schedule
       FROM havens h
       LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
       WHERE h.uuid_id = $1`,
      [havenId]
    );
    if (r.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: r.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH — update the haven's commission config. Pass null to clear and inherit partner default.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ havenId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const { havenId } = await ctx.params;
    const body = await req.json();

    if (body.commission_type != null && !VALID_TYPES.includes(body.commission_type)) {
      return NextResponse.json(
        { success: false, error: `commission_type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if (body.payment_schedule != null && !VALID_SCHEDULES.includes(body.payment_schedule)) {
      return NextResponse.json(
        { success: false, error: `payment_schedule must be one of: ${VALID_SCHEDULES.join(", ")}` },
        { status: 400 }
      );
    }

    const r = await pool.query(
      `UPDATE havens
         SET commission_type = $1,
             partner_share_pct = $2,
             platform_share_pct = $3,
             fixed_daily_guarantee = $4,
             fixed_commission = $5,
             cleaning_fee_share_pct = $6,
             payment_schedule = $7,
             updated_at = NOW()
       WHERE uuid_id = $8
       RETURNING uuid_id::text AS haven_id, commission_type,
                 partner_share_pct, platform_share_pct,
                 fixed_daily_guarantee, fixed_commission,
                 cleaning_fee_share_pct, payment_schedule`,
      [
        body.commission_type ?? null,
        body.partner_share_pct ?? null,
        body.platform_share_pct ?? null,
        body.fixed_daily_guarantee ?? null,
        body.fixed_commission ?? null,
        body.cleaning_fee_share_pct ?? null,
        body.payment_schedule ?? null,
        havenId,
      ]
    );

    if (r.rowCount === 0) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: r.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
