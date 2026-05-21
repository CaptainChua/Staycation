"use client";

import { useState } from "react";
import { BarChart3, Info, Sparkles, ChevronDown, ExternalLink, Receipt, Calendar, FileText, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { useGetMyPayoutsQuery, useGetMyEarningsQuery } from "@/redux/api/partnerSelfApi";
import type { PartnerPayout } from "@/redux/api/partnerSelfApi";

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

const ALLOCATIONS = [
  { label: "Platform & engineering", pct: 32, widthClass: "w-[32%]", color: "bg-[#B8860B]" },
  { label: "Marketing & guest acquisition", pct: 28, widthClass: "w-[28%]", color: "bg-[#DAA520]" },
  { label: "Customer support (24/7)", pct: 22, widthClass: "w-[22%]", color: "bg-[#16a34a]" },
  { label: "Payment processing & fraud", pct: 11, widthClass: "w-[11%]", color: "bg-[#2563eb]" },
  { label: "Insurance & verification", pct: 7, widthClass: "w-[7%]", color: "bg-[#92400e]" },
];

interface CostBreakdownPageProps {
  onNavigate: (page: string) => void;
}

export default function CostBreakdownPage({ onNavigate }: CostBreakdownPageProps) {
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);
  const { data: payoutData } = useGetMyPayoutsQuery();
  const { data: earningsData, isLoading: earningsLoading } = useGetMyEarningsQuery();

  const commissionRatePct = payoutData?.commission_rate ?? 12;
  const commissionRate = commissionRatePct / 100;
  const processingRate = 0.02;
  const rate = 4800;
  const nights = 2;
  const gross = rate * nights;
  const commission = Math.round(gross * commissionRate);
  const processing = Math.round(gross * processingRate);
  const net = gross - commission - processing;

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
                Standard Partner
              </span>
              <span className={`text-[24px] text-[#B8860B] ${fontFraunces}`}>
                · {commissionRatePct}% commission
              </span>
            </div>
            <p className="text-[#6B7280] text-[14px] max-w-[480px]">
              You&apos;re 32 completed bookings away from{" "}
              <strong className="text-[#111827]">Premium Partner</strong> (9% commission). Premium
              also unlocks priority listing placement and a dedicated account manager.
            </p>
            <div className="mt-4 p-3.5 rounded-[10px] bg-[#f9fafb] border border-[#e5e7eb]">
              <div className="flex justify-between text-[11.5px] text-[#6B7280] mb-2">
                <span>Progress to Premium</span>
                <span>64 / 96 bookings · 6-mo rolling</span>
              </div>
              <div className="h-2 rounded-full bg-[#f3f4f6] overflow-hidden">
                <div className="h-full w-[64%] bg-gradient-to-r from-[#B8860B] to-[#DAA520]" />
              </div>
            </div>
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

      {/* RECEIPT + ALLOCATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-[18px] mb-6">
        {/* Receipt example */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px]">
          <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1.5 ${fontFraunces}`}>
            How a single booking breaks down
          </h3>
          <p className="text-[12.5px] text-[#6B7280] mb-4">
            Worked example for a 2-night stay at{" "}
            <strong className="text-[#111827]">Hilltop Deluxe Suite</strong>.
          </p>

          <div className="bg-[#f9fafb] p-1.5 rounded-[12px]">
            <div className="bg-white rounded-[10px] px-[26px] py-6 border border-dashed border-[#d1d5db] shadow-[0_1px_2px_rgba(15,42,46,0.04)] font-mono text-[13.5px]">
              <div className={`text-[16px] mb-1 text-[#111827] ${fontFraunces}`}>
                Booking BK-21048
              </div>
              <div className="text-[11px] text-[#6B7280] mb-4">
                Hilltop Deluxe Suite · J**** R**** · May 14–16, 2026
              </div>

              <ReceiptLine label="Room rate × nights" sub={`${peso(rate)} × ${nights}`} value={peso(gross)} />
              <ReceiptLine label="Gross booking amount" value={peso(gross)} bold />
              <Divider />
              <ReceiptLine label="Platform service fee" sub={`${(commissionRate * 100).toFixed(0)}% commission`} value={`− ${peso(commission)}`} deduct />
              <ReceiptLine label="Payment processing" sub={`${(processingRate * 100).toFixed(0)}% (cards / e-wallet)`} value={`− ${peso(processing)}`} deduct />
              <Divider />
              <ReceiptLine label="Net payout to you" value={peso(net)} bold accent />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-[11px] bg-[#FEF3C7] flex gap-3">
            <Info className="w-4 h-4 text-[#B8860B] flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#374151]">
              Staycation Haven PH charges a{" "}
              <strong>{(commissionRate * 100).toFixed(0)}% service commission</strong> per confirmed
              booking. This covers platform maintenance, customer support, marketing, and payment
              processing. You always see exactly what&apos;s deducted before you receive your payout.
            </p>
          </div>
        </div>

        {/* Allocations + pro tip */}
        <div className="flex flex-col gap-[18px]">
          <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px]">
            <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-4 ${fontFraunces}`}>
              What your commission pays for
            </h3>
            <div className="flex flex-col gap-3.5">
              {ALLOCATIONS.map((a, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-semibold text-[#111827]">{a.label}</span>
                    <span className="text-[12.5px] font-mono text-[#6B7280]">{a.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden">
                    <div className={`h-full rounded-full ${a.color} ${a.widthClass}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px]">
            <div className="text-[11.5px] text-[#B8860B] font-semibold uppercase tracking-widest mb-2">
              Pro tip
            </div>
            <h3 className={`text-[15.5px] mb-2 text-[#111827] font-medium ${fontFraunces}`}>
              Pricing for the long stay
            </h3>
            <p className="text-[13px] text-[#374151]">
              Rooms offering a 3+ night discount see <strong>34% more</strong> bookings and net
              higher overall — the commission is calculated on the discounted total, not the
              original rate.
            </p>
          </div>
        </div>
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

interface ReceiptLineProps {
  label: string;
  sub?: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  deduct?: boolean;
}

const ReceiptLine = ({ label, sub, value, bold, accent, deduct }: ReceiptLineProps) => {
  const color = deduct ? "text-[#dc2626]" : accent ? "text-[#B8860B]" : "text-[#111827]";
  return (
    <div className={`flex justify-between items-baseline py-1.5 ${color} ${bold ? "font-semibold" : ""}`}>
      <div>
        <div>{label}</div>
        {sub && <div className="text-[10.5px] text-[#6B7280] font-normal">{sub}</div>}
      </div>
      <div className={bold ? "text-[15px]" : "text-[13.5px]"}>{value}</div>
    </div>
  );
};

const Divider = () => (
  <div className="h-px bg-[#e5e7eb] my-1 border-t border-dashed border-[#d1d5db]" />
);

// ─── Helpers for the new Earnings + Payouts sections ───────────────────────
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
