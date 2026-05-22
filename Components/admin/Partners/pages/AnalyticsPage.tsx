"use client";

import { useState } from "react";
import {
  Download,
  Receipt,
  Calendar,
  BarChart3,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useGetMyAnalyticsQuery } from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";
const peso = (n: number) => "₱" + (n || 0).toLocaleString("en-PH");

interface AnalyticsPageProps {
  onNavigate: (page: string) => void;
}

export default function AnalyticsPage({ onNavigate }: AnalyticsPageProps) {
  const [range, setRange] = useState("3mo");
  const [view, setView] = useState<"revenue" | "bookings">("revenue");

  const daysForRange = range === "wk" ? 7 : range === "mo" ? 30 : 90;
  const { data: analytics, isLoading: analyticsLoading } = useGetMyAnalyticsQuery({ days: daysForRange });

  const ranges = [
    { id: "wk", label: "This week" },
    { id: "mo", label: "This month" },
    { id: "3mo", label: "Last 3 months" },
    { id: "custom", label: "Custom" },
  ];

  // Real data only — empty arrays render an empty state instead of mock numbers
  const revenueSeries = analytics?.revenue_series ?? [];
  // Filter out rooms with no activity so the chart doesn't show a "12 — ₱0 — 0 bookings" row
  const bookingsByRoom = (analytics?.bookings_by_room ?? []).filter(
    (r) => r.net > 0 || r.bookings > 0
  );
  const totalGross = Number(analytics?.gross_total ?? 0);
  const totalNet = Number(analytics?.net_total ?? 0);
  const totalBookings = analytics?.total_bookings ?? 0;
  const occupancy = analytics?.occupancy ?? 0;
  const maxNet = Math.max(...bookingsByRoom.map((x) => x.net), 1);
  const hasRevenueData = revenueSeries.some((d) => d.gross > 0 || d.net > 0);
  const hasRoomData = bookingsByRoom.length > 0;

  return (
    <div className="animate-in fade-in duration-500">
      {/* PAGE HEADER */}
      <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
        <div>
          <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
            Revenue analytics
          </div>
          <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
            Your performance
          </h1>
          <p className="text-[14.5px] text-[#6B7280] max-w-[560px]">
            The numbers behind your listings — gross earnings, what&apos;s deducted, and what lands in your account.
          </p>
        </div>
        <div className="flex gap-2.5 flex-shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-white border border-[#d1d5db] text-[#111827] hover:bg-[#f3f4f6] transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => onNavigate("cost")}
            className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-[#B8860B] hover:bg-[#8B6508] text-white border border-[#B8860B] transition"
          >
            <Receipt className="w-3.5 h-3.5" /> Cost breakdown
          </button>
        </div>
      </div>

      {/* DATE RANGE */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] mb-6 px-4 py-3.5 flex items-center gap-4 flex-wrap">
        <Calendar className="w-4 h-4 text-[#6B7280]" />
        <div className="flex gap-1.5">
          {ranges.map((r) => {
            const isActive = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`px-3 py-1.5 rounded-[7px] border text-[12.5px] font-semibold transition ${
                  isActive
                    ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B]"
                    : "border-[#e5e7eb] bg-transparent text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto text-[12.5px] text-[#6B7280]">
          Feb 19 — May 19, 2026 ·{" "}
          <span className="text-[#111827] font-semibold">92 days</span>
        </div>
      </div>

      {/* TOP KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[18px] mb-6">
        <Kpi label="Gross earnings" value={peso(totalGross)} sub="before deductions" icon={BarChart3} />
        <Kpi label="Net payout" value={peso(totalNet)} sub="after commission" icon={Receipt} />
        <Kpi label="Total bookings" value={String(totalBookings)} sub={`last ${daysForRange} days`} icon={Calendar} />
        <OccupancyGauge value={occupancy} bookedNights={analytics?.booked_nights ?? 0} availableNights={analytics?.available_nights ?? 0} />
      </div>

      {/* REVENUE CHART */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px] mb-6">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
          <div>
            <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
              Revenue over time
            </h3>
            <p className="text-[12.5px] text-[#6B7280]">
              Gross booking amount vs. your net payout after platform fees.
            </p>
          </div>
          <div className="flex items-center gap-3.5 text-[12.5px]">
            <LegendDot color="bg-[#B8860B]" label="Gross" />
            <LegendDot color="bg-[#DAA520]" label="Net payout" />
            <div className="w-px h-[18px] bg-[#e5e7eb]" />
            <button
              type="button"
              onClick={() => setView("revenue")}
              className={`px-2.5 py-1 rounded-md border text-[12px] font-semibold transition ${
                view === "revenue"
                  ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B]"
                  : "border-[#e5e7eb] bg-transparent text-[#6B7280] hover:bg-[#f9fafb]"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setView("bookings")}
              className={`px-2.5 py-1 rounded-md border text-[12px] font-semibold transition ${
                view === "bookings"
                  ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B]"
                  : "border-[#e5e7eb] bg-transparent text-[#6B7280] hover:bg-[#f9fafb]"
              }`}
            >
              Bookings
            </button>
          </div>
        </div>
        {analyticsLoading ? (
          <div className="py-10 text-center">
            <Loader2 className="w-6 h-6 text-[#B8860B] animate-spin mx-auto" />
          </div>
        ) : !hasRevenueData ? (
          <div className="py-14 text-center text-[#6B7280]">
            <p className="text-[14px] font-semibold text-[#374151] mb-1">No revenue data yet</p>
            <p className="text-[12.5px]">
              Once you start receiving bookings, the breakdown will appear here.
            </p>
          </div>
        ) : view === "revenue" ? (
          <RevenueChart data={revenueSeries} />
        ) : (
          <BookingsChart data={revenueSeries} />
        )}
      </div>

      {/* TOP PERFORMER + BOOKINGS BY ROOM */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-[18px] mb-6">
        {/* Top Performer — derived from real bookingsByRoom (only rooms with actual earnings) */}
        {(() => {
          const top = bookingsByRoom
            .filter((r) => r.net > 0 || r.bookings > 0)
            .slice()
            .sort((a, b) => b.net - a.net)[0];
          return (
            <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] overflow-hidden flex flex-col">
              <div className="relative h-[160px] bg-[#f9fafb] border-b border-[#e5e7eb] grid place-items-center text-[#6B7280] font-mono text-[11px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_9px,#f3f4f6_9px,#f3f4f6_18px)] opacity-90" />
                <span className="relative bg-white border border-[#e5e7eb] rounded-md px-2 py-1">
                  {top?.room || "No data yet"}
                </span>
                {top && (
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DAA520] text-[#1f2937] text-[11.5px] font-semibold uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" /> Top performer
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
                  {top?.room || "No top performer yet"}
                </h3>
                <div className="text-[12.5px] text-[#6B7280] mb-4">
                  {top
                    ? "Your highest-earning room this period."
                    : "Once a room receives bookings, your top performer will appear here."}
                </div>
                {top && (
                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Net earned" value={peso(top.net)} accent />
                    <MiniStat label="Bookings" value={String(top.bookings)} />
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Bookings by room */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] p-[22px]">
          <div className="mb-4">
            <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-1 ${fontFraunces}`}>
              Bookings by room
            </h3>
            <p className="text-[12.5px] text-[#6B7280]">
              Where your earnings come from this period.
            </p>
          </div>
          {!hasRoomData && (
            <div className="py-10 text-center text-[#6B7280]">
              <p className="text-[13px] font-semibold text-[#374151] mb-1">No bookings yet</p>
              <p className="text-[12px]">
                Once any room receives a booking, the per-room breakdown will show here.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3.5">
            {bookingsByRoom.map((b, i) => {
              const pct = (b.net / maxNet) * 100;
              const widthClass =
                pct >= 95
                  ? "w-full"
                  : pct >= 75
                  ? "w-3/4"
                  : pct >= 50
                  ? "w-1/2"
                  : pct >= 25
                  ? "w-1/4"
                  : "w-[15%]";
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13.5px] font-semibold text-[#111827]">{b.room}</span>
                    <span className="text-[12.5px] font-mono text-[#374151]">
                      {peso(b.net)}{" "}
                      <span className="text-[#6B7280]">· {b.bookings} bookings</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] rounded-full ${widthClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

interface KpiProps {
  label: string;
  value: string;
  delta?: string;
  sub: string;
  icon: React.ElementType;
}

const Kpi = ({ label, value, delta, sub, icon: IconCmp }: KpiProps) => (
  <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] flex flex-col gap-1.5">
    <div className="flex justify-between items-center text-[#6B7280]">
      <span className="text-[11px] uppercase tracking-[0.08em] font-semibold">{label}</span>
      <span className="text-[#B8860B]/70">
        <IconCmp className="w-4 h-4" />
      </span>
    </div>
    <div className={`text-[30px] font-medium tracking-[-0.02em] leading-[1.1] mt-1 text-[#111827] ${fontFraunces}`}>
      {value}
    </div>
    <div className="flex items-center gap-2 mt-0.5">
      {delta && (
        <span className="text-[11.5px] inline-flex items-center gap-1 font-semibold text-[#16a34a]">
          <TrendingUp className="w-3 h-3" />
          {delta}
        </span>
      )}
      <span className="text-[11.5px] text-[#6B7280]">{sub}</span>
    </div>
  </div>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-[#374151]">
    <span className={`w-2.5 h-2.5 rounded-[3px] ${color}`} />
    {label}
  </span>
);

const MiniStat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
  <div className="px-3 py-2.5 rounded-[9px] bg-[#f9fafb] border border-[#e5e7eb]">
    <div className="text-[11px] text-[#6B7280] uppercase tracking-[0.06em] font-semibold">
      {label}
    </div>
    <div className={`text-[18px] mt-1 ${fontFraunces} ${accent ? "text-[#B8860B]" : "text-[#111827]"}`}>
      {value}
    </div>
  </div>
);


function OccupancyGauge({ value, bookedNights, availableNights }: { value: number; bookedNights?: number; availableNights?: number }) {
  const radius = 44;
  const circ = Math.PI * radius;
  const dash = (value / 100) * circ;
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] flex items-center gap-4">
      <div className="relative w-[110px] h-[70px]">
        <svg viewBox="0 0 110 60" width="110" height="60">
          <path
            d={`M 10 55 A ${radius} ${radius} 0 0 1 100 55`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d={`M 10 55 A ${radius} ${radius} 0 0 1 100 55`}
            fill="none"
            stroke="#B8860B"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
          />
        </svg>
        <div className={`absolute top-7 left-0 right-0 text-center text-[24px] font-medium text-[#111827] ${fontFraunces}`}>
          {value}%
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.08em] text-[#6B7280] font-semibold">
          Occupancy
        </div>
        <div className="text-[12.5px] mt-0.5 text-[#111827]">
          {bookedNights ?? 0} of {availableNights ?? 0} nights booked
        </div>
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: Array<{ label: string; gross: number; net: number }> }) {
  const W = 880,
    H = 240,
    PADX = 30,
    PADY = 20;
  const innerW = W - PADX * 2;
  const innerH = H - PADY * 2;
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => Math.max(d.gross, d.net)), 1);
  const stepX = innerW / data.length;
  const barW = stepX * 0.32;
  const ticks = [0, 25, 50, 75, 100].map((p) => Math.round(((max * p) / 100) / 1000) * 1000);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="min-w-[700px]">
        {ticks.map((t, i) => {
          const y = PADY + innerH - (t / max) * innerH;
          return (
            <g key={i}>
              <line x1={PADX} y1={y} x2={W - PADX} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
              <text x={PADX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6B7280" fontFamily="ui-monospace,monospace">
                ₱{(t / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = PADX + stepX * i + stepX / 2;
          const gH = (d.gross / max) * innerH;
          const nH = (d.net / max) * innerH;
          return (
            <g key={i}>
              <rect x={cx - barW - 2} y={PADY + innerH - gH} width={barW} height={gH} rx="3" fill="#B8860B" opacity="0.85" />
              <rect x={cx + 2} y={PADY + innerH - nH} width={barW} height={nH} rx="3" fill="#DAA520" />
              <text x={cx} y={H - 4} textAnchor="middle" fontSize="10.5" fill="#6B7280">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BookingsChart({ data }: { data: Array<{ label: string; gross: number; net: number }> }) {
  const W = 880,
    H = 240,
    PADX = 30,
    PADY = 20;
  const innerW = W - PADX * 2;
  const innerH = H - PADY * 2;
  if (data.length === 0) return null;
  const counts = data.map((d) => Math.round(d.gross / 3400));
  const max = Math.max(...counts, 1);
  const stepX = counts.length > 1 ? innerW / (counts.length - 1) : 0;
  const pts = counts.map((c, i) => {
    const x = counts.length > 1 ? PADX + stepX * i : PADX + innerW / 2;
    const y = PADY + innerH - (c / max) * innerH;
    return [x, y] as const;
  });
  const path = "M " + pts.map((p) => p.join(",")).join(" L ");
  const last = pts[pts.length - 1];
  const fill = `${path} L ${last[0]},${PADY + innerH} L ${PADX},${PADY + innerH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="min-w-[700px]">
        {[0, 25, 50, 75, 100].map((p, i) => {
          const v = Math.round((max * p) / 100);
          const y = PADY + innerH - (v / max) * innerH;
          return (
            <g key={i}>
              <line x1={PADX} y1={y} x2={W - PADX} y2={y} stroke="#e5e7eb" strokeDasharray="3 3" />
              <text x={PADX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6B7280" fontFamily="ui-monospace,monospace">
                {v}
              </text>
            </g>
          );
        })}
        <path d={fill} fill="#B8860B" opacity="0.12" />
        <path d={path} fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="#FFFFFF" stroke="#B8860B" strokeWidth="2" />
            <text x={x} y={H - 4} textAnchor="middle" fontSize="10.5" fill="#6B7280">
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
