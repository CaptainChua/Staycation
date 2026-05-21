import pool from "@/backend/config/db";

// ─── Types ─────────────────────────────────────────────────────────────────
export type CommissionType = "percentage" | "fixed_daily" | "fixed_commission" | "hybrid";

export interface CommissionConfig {
  commission_type: CommissionType;
  partner_share_pct: number;       // 0..100
  platform_share_pct: number;      // 0..100
  fixed_daily_guarantee: number;   // peso/night
  fixed_commission: number;        // peso/booking
  cleaning_fee_share_pct: number;  // 0..100 (default 100 — partner keeps cleaning)
  payment_schedule: "weekly" | "biweekly" | "monthly" | "per_booking";
  source: "haven" | "partner_default" | "platform_default"; // for transparency
}

export interface BreakdownInput {
  gross: number;          // total room rate paid
  cleaning_fee: number;   // separate cleaning fee
  processing_fee?: number; // payment gateway / platform overhead, default 0
  nights: number;         // for fixed_daily computation
}

export interface BookingBreakdown {
  gross: number;
  cleaning_fee: number;
  total_collected: number;     // gross + cleaning_fee
  platform_share: number;
  partner_share: number;       // before deductions
  processing_fee: number;
  net_payable: number;         // partner_share - processing_fee
  commission_type: CommissionType;
  config_source: CommissionConfig["source"];
}

// ─── Defaults — fallback when neither haven nor partner has config ──────────
const PLATFORM_DEFAULT: CommissionConfig = {
  commission_type: "percentage",
  partner_share_pct: 88,
  platform_share_pct: 12,
  fixed_daily_guarantee: 0,
  fixed_commission: 0,
  cleaning_fee_share_pct: 100,
  payment_schedule: "biweekly",
  source: "platform_default",
};

// ─── Resolve which config applies to a given haven ──────────────────────────
//   Priority: haven-level config > partner-level default > platform default.
export async function resolveCommissionForHaven(havenId: string): Promise<CommissionConfig> {
  const result = await pool.query<{
    h_commission_type: string | null;
    h_partner_share_pct: string | null;
    h_platform_share_pct: string | null;
    h_fixed_daily_guarantee: string | null;
    h_fixed_commission: string | null;
    h_cleaning_fee_share_pct: string | null;
    h_payment_schedule: string | null;
    p_commission_type: string | null;
    p_partner_share_pct: string | null;
    p_platform_share_pct: string | null;
    p_fixed_daily_guarantee: string | null;
    p_fixed_commission: string | null;
    p_cleaning_fee_share_pct: string | null;
    p_payment_schedule: string | null;
  }>(
    `SELECT
       h.commission_type        AS h_commission_type,
       h.partner_share_pct      AS h_partner_share_pct,
       h.platform_share_pct     AS h_platform_share_pct,
       h.fixed_daily_guarantee  AS h_fixed_daily_guarantee,
       h.fixed_commission       AS h_fixed_commission,
       h.cleaning_fee_share_pct AS h_cleaning_fee_share_pct,
       h.payment_schedule       AS h_payment_schedule,
       pi.default_commission_type        AS p_commission_type,
       pi.default_partner_share_pct      AS p_partner_share_pct,
       pi.default_platform_share_pct     AS p_platform_share_pct,
       pi.default_fixed_daily_guarantee  AS p_fixed_daily_guarantee,
       pi.default_fixed_commission       AS p_fixed_commission,
       pi.default_cleaning_fee_share_pct AS p_cleaning_fee_share_pct,
       pi.default_payment_schedule       AS p_payment_schedule
     FROM havens h
     LEFT JOIN partners_information pi ON pi.partner_id = h.partner_id
     WHERE h.uuid_id = $1`,
    [havenId]
  );

  if (result.rowCount === 0) return { ...PLATFORM_DEFAULT };
  const r = result.rows[0];

  const num = (v: string | null | undefined, fallback: number): number => {
    if (v === null || v === undefined || v === "") return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  };

  // If haven has its own commission_type, prefer haven values
  if (r.h_commission_type) {
    return {
      commission_type: r.h_commission_type as CommissionType,
      partner_share_pct: num(r.h_partner_share_pct, PLATFORM_DEFAULT.partner_share_pct),
      platform_share_pct: num(r.h_platform_share_pct, PLATFORM_DEFAULT.platform_share_pct),
      fixed_daily_guarantee: num(r.h_fixed_daily_guarantee, 0),
      fixed_commission: num(r.h_fixed_commission, 0),
      cleaning_fee_share_pct: num(r.h_cleaning_fee_share_pct, PLATFORM_DEFAULT.cleaning_fee_share_pct),
      payment_schedule: (r.h_payment_schedule as CommissionConfig["payment_schedule"]) || PLATFORM_DEFAULT.payment_schedule,
      source: "haven",
    };
  }
  // Otherwise the partner's default config
  if (r.p_commission_type) {
    return {
      commission_type: r.p_commission_type as CommissionType,
      partner_share_pct: num(r.p_partner_share_pct, PLATFORM_DEFAULT.partner_share_pct),
      platform_share_pct: num(r.p_platform_share_pct, PLATFORM_DEFAULT.platform_share_pct),
      fixed_daily_guarantee: num(r.p_fixed_daily_guarantee, 0),
      fixed_commission: num(r.p_fixed_commission, 0),
      cleaning_fee_share_pct: num(r.p_cleaning_fee_share_pct, PLATFORM_DEFAULT.cleaning_fee_share_pct),
      payment_schedule: (r.p_payment_schedule as CommissionConfig["payment_schedule"]) || PLATFORM_DEFAULT.payment_schedule,
      source: "partner_default",
    };
  }
  return { ...PLATFORM_DEFAULT };
}

// ─── Compute the breakdown for ONE booking given its haven's commission ─────
export function computeBreakdown(input: BreakdownInput, config: CommissionConfig): BookingBreakdown {
  const gross = Math.max(0, Number(input.gross) || 0);
  const cleaning = Math.max(0, Number(input.cleaning_fee) || 0);
  const processing = Math.max(0, Number(input.processing_fee) || 0);
  const nights = Math.max(1, Number(input.nights) || 1);
  const total_collected = gross + cleaning;

  let platform_share = 0;
  let partner_share_room = 0;

  switch (config.commission_type) {
    case "percentage": {
      platform_share = round2(gross * (config.platform_share_pct / 100));
      partner_share_room = round2(gross - platform_share);
      break;
    }
    case "fixed_commission": {
      // Platform takes a fixed peso commission per booking; partner gets the rest
      platform_share = Math.min(gross, config.fixed_commission || 0);
      partner_share_room = round2(gross - platform_share);
      break;
    }
    case "fixed_daily": {
      // Partner gets a fixed peso per night; platform keeps the rest
      partner_share_room = round2(Math.min(gross, (config.fixed_daily_guarantee || 0) * nights));
      platform_share = round2(gross - partner_share_room);
      break;
    }
    case "hybrid": {
      // Hybrid = percentage AND fixed_commission, whichever is higher for platform
      const pctPlatform = gross * (config.platform_share_pct / 100);
      const fixedPlatform = config.fixed_commission || 0;
      platform_share = round2(Math.min(gross, Math.max(pctPlatform, fixedPlatform)));
      partner_share_room = round2(gross - platform_share);
      break;
    }
  }

  // Cleaning fee share — partner gets `cleaning_fee_share_pct`% of the cleaning fee
  const partner_cleaning = round2(cleaning * (config.cleaning_fee_share_pct / 100));
  const platform_cleaning = round2(cleaning - partner_cleaning);

  const platform_total = round2(platform_share + platform_cleaning);
  const partner_total = round2(partner_share_room + partner_cleaning);

  return {
    gross,
    cleaning_fee: cleaning,
    total_collected,
    platform_share: platform_total,
    partner_share: partner_total,
    processing_fee: processing,
    net_payable: round2(partner_total - processing),
    commission_type: config.commission_type,
    config_source: config.source,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
