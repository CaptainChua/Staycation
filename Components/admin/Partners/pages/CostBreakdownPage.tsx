"use client";

import React, { useMemo, useState } from "react";
import { BarChart3, Sparkles, ChevronDown, ExternalLink, Receipt, Calendar, FileText, CheckCircle2, Clock, AlertCircle, XCircle, EyeOff } from "lucide-react";
import {
  useGetMyPayoutsQuery,
  useGetMyEarningsQuery,
  useGetMyAnalyticsQuery,
  useGetMyListingsQuery,
  useGetMyBookingsQuery,
} from "@/redux/api/partnerSelfApi";
import type { PartnerPayout, PartnerBooking } from "@/redux/api/partnerSelfApi";
import DocumentsManager from "@/Components/admin/Owners/Modals/DocumentsManager";

// Status pill styling — mirrors the old Recent Bookings table from AnalyticsPage.
const STATUS_MAP: Record<string, string> = {
  Completed: "bg-[#dcfce7] text-[#16a34a]",
  Confirmed: "bg-[#dbeafe] text-[#2563eb]",
  Cancelled: "bg-[#fee2e2] text-[#dc2626]",
};

const normalizeStatus = (s: string | undefined): "Completed" | "Confirmed" | "Cancelled" => {
  if (s === "completed") return "Completed";
  if (s === "cancelled" || s === "rejected") return "Cancelled";
  return "Confirmed";
};

// Tier threshold — matches the FAQ copy ("50 completed bookings").
// Keep PREMIUM_THRESHOLD in sync with the FAQ answer in [FAQS].
const PREMIUM_THRESHOLD = 50;

// Progress-bar widths snapped to 5% buckets so Tailwind JIT can statically
// resolve the class.
const PROGRESS_WIDTH_CLASSES: Record<number, string> = {
  0: "w-[0%]",   5: "w-[5%]",   10: "w-[10%]",  15: "w-[15%]",  20: "w-[20%]",
  25: "w-[25%]", 30: "w-[30%]", 35: "w-[35%]",  40: "w-[40%]",  45: "w-[45%]",
  50: "w-[50%]", 55: "w-[55%]", 60: "w-[60%]",  65: "w-[65%]",  70: "w-[70%]",
  75: "w-[75%]", 80: "w-[80%]", 85: "w-[85%]",  90: "w-[90%]",  95: "w-[95%]",
  100: "w-[100%]",
};

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";
const peso = (n: number) => "₱" + (n || 0).toLocaleString("en-PH");

const FAQS = [
  {
    q: "Why was my payout lower than expected?",
    a: "The most common reasons are: (1) a guest cancellation refund within the free-cancel window, (2) a partial-stay refund issued by support, or (3) a promo discount you opted into. Open the booking from Recent Bookings to see the line-by-line breakdown.",
  },
  {
    q: "What happens if a booking is cancelled?",
    a: "If the guest cancels within their free-cancel window, no commission is charged and no payout is generated. If they cancel after, the standard commission applies to the non-refundable portion and you receive that share on the next payout cycle.",
  },
  {
    q: "How do I upgrade my partner tier?",
    a: "Premium Partner status (9% commission) opens automatically once you've hosted 50 completed bookings with an average rating of 4.7+ over the trailing 6 months. You can also request early review from your account manager.",
  },
  {
    q: "When are payouts released?",
    a: "Payouts are processed on the 15th and 30th of every month. Bookings that complete check-out before the cut-off (midnight Manila time, two days prior) are included in that cycle.",
  },
];

interface CostBreakdownPageProps {
  onNavigate: (page: string) => void;
}

type DateFilter = "today" | "7d" | "30d" | "upcoming" | "all" | "custom";

export default function CostBreakdownPage({ onNavigate }: CostBreakdownPageProps) {
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  // Which booking row in the date-range card is currently expanded.
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const { data: payoutData } = useGetMyPayoutsQuery();
  const { data: earningsData, isLoading: earningsLoading } = useGetMyEarningsQuery();
  const { data: analytics } = useGetMyAnalyticsQuery();
  const { data: listings = [] } = useGetMyListingsQuery();
  // Same source the Analytics "Recent bookings" table used to use.
  // Poll every 15s so owner-side visibility toggles propagate without a manual refresh.
  const { data: bookings = [], isLoading: bookingsLoading } = useGetMyBookingsQuery(
    { limit: 50 },
    { pollingInterval: 15000 }
  );
  // Visibility is decided per-row via b.guest_details_visible (computed server-side
  // from booking.show_guest_details_override ?? partner-level default).

  const commissionRatePct = payoutData?.commission_rate ?? 12;
  const commissionRate = commissionRatePct / 100;

  // Tier — derived from real lifetime completed bookings.
  const completedBookings = analytics?.lifetime_completed_bookings ?? 0;
  const isPremium = completedBookings >= PREMIUM_THRESHOLD;
  const tierLabel = isPremium ? "Premium Partner" : "Standard Partner";
  const bookingsToPremium = Math.max(0, PREMIUM_THRESHOLD - completedBookings);
  const tierProgressPct = Math.min(100, Math.round((completedBookings / PREMIUM_THRESHOLD) * 100));
  const tierProgressBucket = Math.round(tierProgressPct / 5) * 5;
  const tierProgressWidth = PROGRESS_WIDTH_CLASSES[tierProgressBucket] || PROGRESS_WIDTH_CLASSES[0];

  // Per-room breakdown — every line item is shown as a deduction from the
  // base nightly rate so the partner sees exactly what's subtracted before
  // their net per night. Each room can have its own commission_rate set by
  // the owner; if null, we fall back to the partner's default commissionRate.
  const roomBreakdowns = listings.map((l) => {
    const baseRate =
      Number(l.weekday_rate) ||
      Number(l.weekend_rate) ||
      Number(l.ten_hour_rate) ||
      0;
    const cleaningFee = Number(l.cleaning_fee) || 0;
    const securityDeposit = Number(l.security_deposit) || 0;
    const roomCommissionPct =
      l.commission_rate === null || l.commission_rate === undefined
        ? commissionRatePct
        : Number(l.commission_rate);
    const roomCommissionRate = roomCommissionPct / 100;
    const commissionAmt = Math.round(baseRate * roomCommissionRate);
    // Amenities = rentable items / other extra-charge things tied to the room.
    // Wire this up to a real source (e.g. sum of booking_add_ons for this haven)
    // when the data is exposed on the partner listings endpoint.
    const amenitiesAmt = 0;
    const netPerNight = baseRate - commissionAmt - amenitiesAmt - cleaningFee - securityDeposit;
    return {
      uuid: l.uuid_id,
      name: l.haven_name,
      baseRate,
      cleaningFee,
      securityDeposit,
      commissionAmt,
      commissionPct: roomCommissionPct,
      isCommissionOverride: l.commission_rate !== null && l.commission_rate !== undefined,
      amenitiesAmt,
      netPerNight,
    };
  });

  // Overall totals across all rooms — the "per partner" rollup.
  const overall = roomBreakdowns.reduce(
    (acc, r) => ({
      baseRate: acc.baseRate + r.baseRate,
      cleaningFee: acc.cleaningFee + r.cleaningFee,
      securityDeposit: acc.securityDeposit + r.securityDeposit,
      commissionAmt: acc.commissionAmt + r.commissionAmt,
      amenitiesAmt: acc.amenitiesAmt + r.amenitiesAmt,
      netPerNight: acc.netPerNight + r.netPerNight,
    }),
    { baseRate: 0, cleaningFee: 0, securityDeposit: 0, commissionAmt: 0, amenitiesAmt: 0, netPerNight: 0 }
  );

  const pendingAmount = Number(payoutData?.pending_amount) || 0;
  const nextPayoutDate = payoutData?.next_payout_date
    ? new Date(payoutData.next_payout_date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

  const payoutMethodLabel = (() => {
    const cfg = payoutData?.default_config;
    if (!cfg) return "—";
    const method = (cfg.payout_method || "gcash").toString();
    const dest = cfg.payout_destination ? ` · ${maskDestination(cfg.payout_destination)}` : "";
    return `${method.toUpperCase()}${dest}`;
  })();

  const payouts = payoutData?.payouts || [];
  const earnings = earningsData?.items || [];
  const totals = earningsData?.totals;

  // Date-range filter for the "Bookings & net profit by date range" card.
  // A booking matches if its stay [check_in, check_out] OVERLAPS the window,
  // so a stay that spans the range edge is included even if check-in lands
  // outside it. "All time" disables filtering entirely.
  const filteredByDate = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;

    if (dateFilter === "today") {
      from = new Date(now); from.setHours(0, 0, 0, 0);
      to = new Date(now); to.setHours(23, 59, 59, 999);
    } else if (dateFilter === "7d") {
      from = new Date(now); from.setDate(from.getDate() - 7); from.setHours(0, 0, 0, 0);
      to = new Date(now); to.setHours(23, 59, 59, 999);
    } else if (dateFilter === "30d") {
      from = new Date(now); from.setDate(from.getDate() - 30); from.setHours(0, 0, 0, 0);
      to = new Date(now); to.setHours(23, 59, 59, 999);
    } else if (dateFilter === "upcoming") {
      from = new Date(now); from.setHours(0, 0, 0, 0);
      to = null; // open-ended into the future
    } else if (dateFilter === "all") {
      from = null;
      to = null;
    } else if (dateFilter === "custom") {
      from = customFrom ? new Date(customFrom + "T00:00:00") : null;
      to = customTo ? new Date(customTo + "T23:59:59") : null;
    }

    const items = bookings.filter((b) => {
      if (from === null && to === null) return true;
      const checkIn = new Date(b.check_in_date);
      const checkOut = b.check_out_date ? new Date(b.check_out_date) : checkIn;
      // Overlap: stay ends on/after `from` AND starts on/before `to`.
      if (from && checkOut < from) return false;
      if (to && checkIn > to) return false;
      return true;
    });

    const netTotal = items.reduce(
      (sum, b) => sum + Number(b.net || 0),
      0
    );
    const grossTotal = items.reduce(
      (sum, b) => sum + Number(b.gross || 0),
      0
    );
    const commissionTotal = items.reduce(
      (sum, b) => sum + Number(b.commission || 0),
      0
    );
    // Sum of booking_add_ons across all bookings in the range (excludes
    // cancelled/refunded — those are also excluded server-side on amenities_total).
    const amenitiesTotal = items.reduce(
      (sum, b) => sum + Number(b.amenities_total || 0),
      0
    );

    return { items, netTotal, grossTotal, commissionTotal, amenitiesTotal, from, to };
  }, [bookings, dateFilter, customFrom, customTo]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
            Transparency
          </div>
          <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
            How your earnings are calculated
          </h1>
          <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">
            A clear look at what&apos;s deducted from each booking — and what lands in your payout.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("analytics")}
          className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-white border border-[#d1d5db] text-[#111827] hover:bg-[#f3f4f6] transition"
        >
          <BarChart3 className="w-3.5 h-3.5" /> Back to analytics
        </button>
      </div>

      {/* TIER + PAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-[18px] mb-6">
        {/* Tier card */}
        <div className="bg-gradient-to-br from-white to-[#f9fafb] border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-7 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(232,162,59,0.18),transparent_70%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400e] text-[11px] font-semibold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Your tier
            </div>
            <div className="flex items-baseline gap-3 mt-3 mb-1 flex-wrap">
              <span className={`text-[32px] font-medium tracking-[-0.02em] text-[#111827] ${fontFraunces}`}>
                {tierLabel}
              </span>
              <span className={`text-[24px] text-[#B8860B] ${fontFraunces}`}>
                · {commissionRatePct}% commission
              </span>
            </div>
            <p className="text-[#6B7280] text-[14px] max-w-[480px]">
              {isPremium ? (
                <>
                  You&apos;ve unlocked <strong className="text-[#111827]">Premium Partner</strong>{" "}
                  benefits — priority listing placement and a dedicated account manager.
                </>
              ) : (
                <>
                  You&apos;re {bookingsToPremium} completed booking{bookingsToPremium === 1 ? "" : "s"} away from{" "}
                  <strong className="text-[#111827]">Premium Partner</strong> (9% commission). Premium
                  also unlocks priority listing placement and a dedicated account manager.
                </>
              )}
            </p>
            {!isPremium && (
              <div className="mt-4 p-3.5 rounded-[10px] bg-[#f9fafb] border border-[#e5e7eb]">
                <div className="flex justify-between text-[11.5px] text-[#6B7280] mb-2">
                  <span>Progress to Premium</span>
                  <span>{completedBookings} / {PREMIUM_THRESHOLD} completed bookings</span>
                </div>
                <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
                  <div className={`h-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] transition-all ${tierProgressWidth}`} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payout schedule */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px]">
          <div className="text-[11.5px] text-[#B8860B] font-semibold uppercase tracking-widest mb-2">
            Payout schedule
          </div>
          <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-2.5 ${fontFraunces}`}>
            Twice a month, every month
          </h3>
          <p className="text-[13px] text-[#374151]">
            Payouts are processed every <strong>15th and 30th</strong> via GCash or bank transfer.
            Bookings that check out before midnight (Manila) two days prior are included in that cycle.
          </p>
          <div className="h-px bg-[#e5e7eb] my-4" />
          <div className="flex justify-between mb-2">
            <span className="text-[12.5px] text-[#6B7280]">Next payout</span>
            <span className="text-[12.5px] font-semibold text-[#111827]">{nextPayoutDate}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-[12.5px] text-[#6B7280]">Pending amount</span>
            <span className="text-[12.5px] font-mono font-semibold text-[#111827]">{peso(pendingAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12.5px] text-[#6B7280]">Payout method</span>
            <span className="text-[12.5px] text-[#111827]">{payoutMethodLabel}</span>
          </div>
        </div>
      </div>

      {/* PER-ROOM BREAKDOWN */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px] mb-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1.5">
          <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] ${fontFraunces}`}>
            Per-room cost breakdown
          </h3>
          <span className="text-[11.5px] text-[#6B7280]">
            {roomBreakdowns.length} room{roomBreakdowns.length === 1 ? "" : "s"} · {commissionRatePct}% commission
          </span>
        </div>
        <p className="text-[12.5px] text-[#6B7280] mb-4">
          Every deduction shown is subtracted from the room&apos;s base nightly rate. The Net per
          night column is what reaches your payout for one night at the room&apos;s standard rate.
        </p>

        {roomBreakdowns.length === 0 ? (
          <div className="py-10 text-center text-[#6B7280]">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-[14px] font-semibold text-[#374151] mb-0.5">No rooms yet</p>
            <p className="text-[12.5px]">Add a listing to see its per-room cost breakdown here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr>
                  {["Room", "Base rate / night", "Commission", "Amenities", "Cleaning fee", "Security deposit", "Net per night"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left text-[10.5px] font-semibold uppercase tracking-wider text-[#6B7280] px-3 py-2 border-b border-[#e5e7eb] bg-[#f9fafb] ${
                        i > 0 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomBreakdowns.map((r) => (
                  <tr key={r.uuid} className="hover:bg-[#f9fafb]">
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-[#111827] font-medium truncate max-w-[240px]">
                      {r.name}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#111827]">
                      {peso(r.baseRate)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626]">
                      <div>− {peso(r.commissionAmt)}</div>
                      <div className="text-[10px] text-[#6B7280] font-sans">
                        {r.commissionPct}%
                        {r.isCommissionOverride && (
                          <span className="ml-1 text-[#B8860B] font-semibold">override</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626]">
                      − {peso(r.amenitiesAmt)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626]">
                      − {peso(r.cleaningFee)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626]">
                      − {peso(r.securityDeposit)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono font-semibold text-[#16a34a]">
                      {peso(r.netPerNight)}
                    </td>
                  </tr>
                ))}
                {/* Overall totals */}
                <tr className="bg-[#FEF3C7]">
                  <td className={`px-3 py-3 text-[#111827] font-semibold ${fontFraunces}`}>
                    Overall ({roomBreakdowns.length} room{roomBreakdowns.length === 1 ? "" : "s"})
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#111827]">
                    {peso(overall.baseRate)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#dc2626]">
                    − {peso(overall.commissionAmt)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#dc2626]">
                    − {peso(overall.amenitiesAmt)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#dc2626]">
                    − {peso(overall.cleaningFee)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#dc2626]">
                    − {peso(overall.securityDeposit)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#B8860B]">
                    {peso(overall.netPerNight)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BOOKINGS & NET PROFIT BY DATE RANGE */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px] mb-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1.5">
          <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] ${fontFraunces}`}>
            Bookings & net profit by date range
          </h3>
          <span className="text-[11.5px] text-[#6B7280]">
            Filter by check-in date
          </span>
        </div>
        <p className="text-[12.5px] text-[#6B7280] mb-4">
          Same breakdown as above, but scoped to a date range you pick. The total
          shown is the sum of your net payable from bookings checking in inside
          the selected window.
        </p>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {([
            { id: "all", label: "All time" },
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 days" },
            { id: "30d", label: "Last 30 days" },
            { id: "upcoming", label: "Upcoming" },
            { id: "custom", label: "Custom" },
          ] as { id: DateFilter; label: string }[]).map((opt) => {
            const active = dateFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDateFilter(opt.id)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition ${
                  active
                    ? "bg-[#B8860B] border-[#B8860B] text-white"
                    : "bg-white border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 ml-1">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2 py-1 text-[12px] border border-[#d1d5db] rounded-[8px] bg-white text-[#111827]"
              />
              <span className="text-[12px] text-[#6B7280]">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2 py-1 text-[12px] border border-[#d1d5db] rounded-[8px] bg-white text-[#111827]"
              />
            </div>
          )}
        </div>

        {/* Range totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-[10px] bg-[#f9fafb] border border-[#e5e7eb]">
          <Stat label="Bookings in range" value={filteredByDate.items.length.toString()} />
          <Stat label="Gross in range" value={peso(filteredByDate.grossTotal)} />
          <Stat label="Commission + amenities" value={peso(filteredByDate.commissionTotal + filteredByDate.amenitiesTotal)} />
          <Stat label="Net profit in range" value={peso(filteredByDate.netTotal)} accent />
        </div>

        {bookingsLoading ? (
          <div className="py-10 text-center text-[13px] text-[#6B7280]">Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="py-10 text-center text-[#6B7280]">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-[14px] font-semibold text-[#374151] mb-0.5">You don&apos;t have any bookings yet</p>
            <p className="text-[12.5px]">Once a guest books one of your rooms, it&apos;ll appear here.</p>
          </div>
        ) : filteredByDate.items.length === 0 ? (
          <div className="py-10 text-center text-[#6B7280]">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-[14px] font-semibold text-[#374151] mb-0.5">
              No bookings overlap this range
            </p>
            <p className="text-[12.5px]">
              You have <strong>{bookings.length}</strong> booking{bookings.length === 1 ? "" : "s"} in
              total — try “All time”, “Upcoming”, or a wider custom window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr>
                  {["Booking", "Room", "Stay", "Gross", "Commission", "Amenities", "Net", "Status", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`text-left text-[10.5px] font-semibold uppercase tracking-wider text-[#6B7280] px-3 py-2 border-b border-[#e5e7eb] bg-[#f9fafb] ${
                        [3, 4, 5, 6].includes(i) ? "text-right" : ""
                      } ${i === 8 ? "text-center w-[1%]" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredByDate.items.map((b) => {
                  const statusLabel = normalizeStatus(b.status);
                  const expanded = expandedBookingId === b.booking_uuid;
                  const adults = Number(b.adults) || 0;
                  const children = Number(b.children) || 0;
                  const infants = Number(b.infants) || 0;
                  const totalGuests = adults + children + infants;
                  const fullName = [b.guest_first_name, b.guest_last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  return (
                    <React.Fragment key={b.booking_uuid}>
                      <tr className="hover:bg-[#f9fafb]">
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] font-mono text-[11px] text-[#6B7280]">
                          {b.booking_id}
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-[#374151] truncate max-w-[200px]">
                          {b.room_name}
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-[#374151]">
                          <div className="text-[12px]">
                            {fmtDate(b.check_in_date)} → {fmtDate(b.check_out_date)}
                          </div>
                          <div className="text-[10.5px] text-[#6B7280]">
                            {b.nights} night{b.nights > 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#111827]">
                          {peso(Number(b.gross))}
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626]">
                          − {peso(Number(b.commission))}
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626] relative">
                          <AmenitiesCell amenities={b.amenities} total={Number(b.amenities_total || 0)} />
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono font-semibold text-[#16a34a]">
                          {peso(Number(b.net))}
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb]">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_MAP[statusLabel]}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedBookingId(expanded ? null : b.booking_uuid)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb] transition whitespace-nowrap"
                          >
                            {expanded ? "Hide" : "Details"}
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-[#f9fafb]">
                          <td colSpan={9} className="px-4 py-4 border-b border-[#e5e7eb]">
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                              <div className="col-span-2">
                                <div className="text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280] mb-0.5">
                                  Guest name
                                </div>
                                <div className="text-[14px] text-[#111827] font-medium">
                                  {/* Per-row: honor this specific booking's flag. */}
                                  {(b.guest_details_visible ?? true) ? (
                                    fullName ? (
                                      fullName
                                    ) : (
                                      <span className="text-[12px] text-[#9CA3AF] italic">
                                        No guest name on file
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[12px] text-[#92400e] bg-[#fef3c7] px-2 py-0.5 rounded-full">
                                      <EyeOff className="w-3 h-3" /> Hidden by admin
                                    </span>
                                  )}
                                </div>
                              </div>
                              <DetailStat label="Adults" value={adults} />
                              <DetailStat label="Children" value={children} />
                              <DetailStat label="Infants" value={infants} />
                              <DetailStat label="Total guests" value={totalGuests} accent />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                <tr className="bg-[#FEF3C7]">
                  <td className={`px-3 py-3 text-[#111827] font-semibold ${fontFraunces}`} colSpan={3}>
                    Total ({filteredByDate.items.length} booking{filteredByDate.items.length === 1 ? "" : "s"})
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#111827]">
                    {peso(filteredByDate.grossTotal)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#dc2626]">
                    − {peso(filteredByDate.commissionTotal)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#dc2626]">
                    − {peso(filteredByDate.amenitiesTotal)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-[#B8860B]">
                    {peso(filteredByDate.netTotal)}
                  </td>
                  <td className="px-3 py-3" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* YOUR EARNINGS — real per-booking breakdown */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px] mb-6">
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
              Your earnings
            </h3>
            <p className="text-[12.5px] text-[#6B7280]">
              Live breakdown per booking. Numbers here use the commission set on each room
              (with your partner default as fallback).
            </p>
          </div>
          {totals && (
            <div className="flex gap-4 text-right">
              <Stat label="Total gross" value={peso(totals.gross)} />
              <Stat label="Your share" value={peso(totals.partner_share)} accent />
              <Stat label="Pending payout" value={peso(totals.pending_payout)} />
            </div>
          )}
        </div>
        {earningsLoading ? (
          <div className="py-10 text-center text-[13px] text-[#6B7280]">Loading earnings…</div>
        ) : earnings.length === 0 ? (
          <div className="py-10 text-center text-[#6B7280]">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-[14px] font-semibold text-[#374151] mb-0.5">No earnings yet</p>
            <p className="text-[12.5px]">Once you receive your first booking, the breakdown will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr>
                  {["Booking", "Room", "Stay", "Gross", "Platform", "Your share", "Net", "Settled"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left text-[10.5px] font-semibold uppercase tracking-wider text-[#6B7280] px-3 py-2 border-b border-[#e5e7eb] bg-[#f9fafb] ${
                        [3, 4, 5, 6].includes(i) ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnings.slice(0, 15).map((r) => (
                  <tr key={r.booking_uuid} className="hover:bg-[#f9fafb]">
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] font-mono text-[11px] text-[#6B7280]">
                      {r.booking_id}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-[#374151] truncate max-w-[180px]">
                      {r.haven_name}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-[#374151]">
                      <div className="text-[12px]">
                        {fmtDate(r.check_in_date)} → {fmtDate(r.check_out_date)}
                      </div>
                      <div className="text-[10.5px] text-[#6B7280]">
                        {r.nights} night{r.nights > 1 ? "s" : ""} · {r.commission_type}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#111827]">
                      {peso(r.gross)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono text-[#dc2626]">
                      − {peso(r.platform_share)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono font-semibold text-[#111827]">
                      {peso(r.partner_share)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb] text-right font-mono font-semibold text-[#16a34a]">
                      {peso(r.net_payable)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e5e7eb]">
                      {r.payout_id ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#16a34a] font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Paid out
                        </span>
                      ) : r.status === "completed" || r.status === "checked-in" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#92400e] font-semibold">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#6B7280] capitalize">{r.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAYOUTS — real, with line items */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px] mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
              Payout history
            </h3>
            <p className="text-[12.5px] text-[#6B7280]">
              Every payout we&apos;ve generated for you. Click any row to see the bookings it covers.
            </p>
          </div>
        </div>
        {payouts.length === 0 ? (
          <div className="py-10 text-center text-[#6B7280]">
            <FileText className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
            <p className="text-[14px] font-semibold text-[#374151] mb-0.5">No payouts yet</p>
            <p className="text-[12.5px]">Payouts appear here once admin generates them from your completed bookings.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {payouts.map((p) => (
              <PayoutRow
                key={p.id}
                payout={p}
                expanded={expandedPayout === p.id}
                onToggle={() => setExpandedPayout(expandedPayout === p.id ? null : p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px]">
        <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1.5 ${fontFraunces}`}>
          Frequently asked questions
        </h3>
        <p className="text-[12.5px] text-[#6B7280] mb-4">
          Common questions we hear from our partners.
        </p>
        <div className="flex flex-col">
          {FAQS.map((f, i) => {
            const isOpen = openFaq === i;
            const isLast = i === FAQS.length - 1;
            return (
              <div key={i} className={isLast ? "" : "border-b border-[#e5e7eb]"}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  className="w-full text-left py-4 bg-none border-none cursor-pointer flex justify-between items-center gap-4 text-[#111827]"
                >
                  <span className={`text-[15.5px] font-medium ${fontFraunces}`}>{f.q}</span>
                  <span
                    className={`w-7 h-7 rounded-full grid place-items-center flex-shrink-0 transition-transform ${
                      isOpen ? "bg-[#B8860B] text-white rotate-180" : "bg-[#f3f4f6] text-[#6B7280] rotate-0"
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>
                {isOpen && (
                  <p className="text-[13px] text-[#374151] pb-4 max-w-[680px] animate-in fade-in duration-200">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers for the Earnings + Payouts sections ───────────────────────
const fmtDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    : "—";

const maskDestination = (v: string) => {
  const trimmed = v.trim();
  if (trimmed.length <= 4) return trimmed;
  return `●●●● ${trimmed.slice(-4)}`;
};

const PAYOUT_STATUS_META: Record<string, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:    { label: "Pending",    bg: "bg-[#fef3c7]", text: "text-[#92400e]", Icon: Clock },
  processing: { label: "Processing", bg: "bg-[#dbeafe]", text: "text-[#2563eb]", Icon: Clock },
  paid:       { label: "Paid",       bg: "bg-[#dcfce7]", text: "text-[#16a34a]", Icon: CheckCircle2 },
  failed:     { label: "Failed",     bg: "bg-[#fee2e2]", text: "text-[#dc2626]", Icon: AlertCircle },
  cancelled:  { label: "Cancelled",  bg: "bg-[#f3f4f6]", text: "text-[#6B7280]", Icon: XCircle },
};

const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div>
    <div className="text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280]">{label}</div>
    <div
      className={`text-[15px] font-semibold ${
        accent ? "text-[#B8860B]" : "text-[#111827]"
      }`}
    >
      {value}
    </div>
  </div>
);

const DetailStat = ({ label, value, accent }: { label: string; value: number; accent?: boolean }) => (
  <div>
    <div className="text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280] mb-0.5">{label}</div>
    <div className={`text-[18px] font-semibold ${accent ? "text-[#B8860B]" : "text-[#111827]"}`}>
      {value}
    </div>
  </div>
);

// Amenities cell: shows the deducted total, with a hover popover listing each
// rentable item (name · qty · subtotal). Uses CSS group-hover so no JS state
// per cell — works on touch by tapping which fires :hover momentarily.
type AmenityItem = NonNullable<PartnerBooking["amenities"]>[number];
const AmenitiesCell = ({
  amenities,
  total,
}: {
  amenities: AmenityItem[] | undefined;
  total: number;
}) => {
  const list = amenities || [];
  return (
    <span className="group inline-block relative cursor-help">
      <span className={list.length > 0 ? "underline decoration-dotted" : ""}>
        − {peso(total)}
      </span>
      {list.length > 0 && (
        <div
          className="hidden group-hover:block absolute right-0 z-30 mt-1 w-[260px] rounded-[10px] border border-[#e5e7eb] bg-white shadow-lg p-3 text-left font-sans"
          role="tooltip"
        >
          <div className="text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280] mb-1.5">
            Amenities for this stay
          </div>
          <ul className="flex flex-col gap-1.5">
            {list.map((a) => {
              const isInactive = a.status === "cancelled" || a.status === "refunded";
              return (
                <li
                  key={a.id}
                  className={`flex items-baseline justify-between gap-2 text-[12px] ${
                    isInactive ? "text-[#9CA3AF] line-through" : "text-[#374151]"
                  }`}
                >
                  <span className="truncate">
                    {a.name}
                    {a.quantity > 1 && (
                      <span className="text-[#6B7280]"> × {a.quantity}</span>
                    )}
                  </span>
                  <span className="font-mono text-[11.5px] whitespace-nowrap">
                    {peso(Number(a.total))}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 pt-2 border-t border-[#e5e7eb] flex items-baseline justify-between text-[12px]">
            <span className="text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280]">
              Total
            </span>
            <span className="font-mono font-semibold text-[#111827]">
              {peso(total)}
            </span>
          </div>
        </div>
      )}
    </span>
  );
};

function PayoutRow({
  payout,
  expanded,
  onToggle,
}: {
  payout: PartnerPayout;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = PAYOUT_STATUS_META[payout.status] || PAYOUT_STATUS_META.pending;
  const items = payout.items || [];

  return (
    <div className="border border-[#e5e7eb] rounded-[12px] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-[#f9fafb] transition"
      >
        <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] text-[#B8860B] grid place-items-center flex-shrink-0">
          <Receipt className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-[#111827]">
            Cycle {fmtDate(payout.cycle_start)} → {fmtDate(payout.cycle_end)}
          </div>
          <div className="text-[11.5px] text-[#6B7280] flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {payout.paid_at
                ? `Paid ${fmtDate(payout.paid_at)}`
                : payout.scheduled_date
                ? `Scheduled ${fmtDate(payout.scheduled_date)}`
                : "Not yet scheduled"}
            </span>
            {payout.payment_method && (
              <span>· {payout.payment_method.toUpperCase()}</span>
            )}
            {payout.reference_number && <span>· Ref {payout.reference_number}</span>}
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280]">Net</div>
          <div className="text-[15px] font-mono font-semibold text-[#111827]">
            {peso(Number(payout.net_amount))}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${meta.bg} ${meta.text}`}
        >
          <meta.Icon className="w-3 h-3" /> {meta.label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#6B7280] transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-[#e5e7eb] bg-[#f9fafb]/40 p-4 space-y-3">
          {/* Totals strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
            <Stat label="Gross" value={peso(Number(payout.gross_amount))} />
            <Stat label="Commission" value={`− ${peso(Number(payout.commission_amount))}`} />
            <Stat
              label="Deductions"
              value={`− ${peso(Number(payout.deductions_total || 0))}`}
            />
            <Stat label="Net to you" value={peso(Number(payout.net_amount))} accent />
          </div>

          {/* Deductions detail */}
          {Array.isArray(payout.deductions) && payout.deductions.length > 0 && (
            <div className="p-3 bg-[#fef3c7] rounded-lg">
              <div className="text-[11px] font-semibold text-[#92400e] uppercase tracking-wide mb-1.5">
                Deductions
              </div>
              <ul className="space-y-0.5">
                {payout.deductions.map((d, i) => (
                  <li key={i} className="text-[12.5px] text-[#374151] flex justify-between">
                    <span>{d.label}</span>
                    <span className="font-mono">− {peso(Number(d.amount))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {payout.notes && (
            <div className="p-3 bg-white border border-[#e5e7eb] rounded-lg text-[12.5px] text-[#374151]">
              <div className="text-[10.5px] uppercase font-semibold text-[#6B7280] mb-0.5">Notes</div>
              {payout.notes}
            </div>
          )}

          {/* Proof link */}
          {payout.proof_of_payment_url && (
            <a
              href={payout.proof_of_payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#B8860B] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View proof of payment
            </a>
          )}

          {/* Multi-file evidence — receipts, screenshots, confirmations the
              owner attached for this specific payout. Read-only on partner side. */}
          <DocumentsManager
            listEndpoint={`/api/partners/me/payouts/${payout.id}/attachments`}
            deleteUrlBuilder={() => ""}
            title="Evidence attachments"
            subtitle="Receipts, GCash screenshots, and other proofs the owner attached."
            readOnly
          />

          {/* Line items */}
          {items.length > 0 && (
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-[#f9fafb] border-b border-[#e5e7eb] text-[10.5px] uppercase tracking-wide font-semibold text-[#6B7280]">
                Bookings in this payout ({items.length})
              </div>
              <table className="w-full text-[11.5px]">
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-[#e5e7eb] last:border-0">
                      <td className="px-3 py-2 font-mono text-[10.5px] text-[#6B7280]">
                        {it.booking_id}
                      </td>
                      <td className="px-3 py-2 text-[#374151] truncate max-w-[200px]">
                        {it.haven_name}
                      </td>
                      <td className="px-3 py-2 text-[#374151]">
                        {fmtDate(it.check_in_date)} → {fmtDate(it.check_out_date)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[#111827]">
                        {peso(Number(it.gross))}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[#dc2626]">
                        − {peso(Number(it.platform_share))}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-[#16a34a]">
                        {peso(Number(it.partner_share) - Number(it.processing_fee))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
