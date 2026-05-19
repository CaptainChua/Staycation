"use client";

import { useState } from "react";
import { BarChart3, Info, Sparkles, ChevronDown } from "lucide-react";
import { useGetMyPayoutsQuery } from "@/redux/api/partnerSelfApi";

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
  const { data: payoutData } = useGetMyPayoutsQuery();

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
            <span className="text-[12.5px] text-[#111827]">GCash · ●●●● 4421</span>
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
