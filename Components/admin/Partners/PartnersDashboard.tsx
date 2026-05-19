"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  useGetMyListingsQuery,
  useGetMyAnalyticsQuery,
  useGetMyNotificationsQuery,
} from "@/redux/api/partnerSelfApi";
import {
  Home,
  Plus,
  List,
  BarChart3,
  Receipt,
  Calendar,
  Info,
  Eye,
  ChevronRight,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const peso = (n: number) => "₱" + (n || 0).toLocaleString("en-PH");
const num = (n: number) => (n || 0).toLocaleString("en-PH");

const ROOMS = [
  { id: "r-001", name: "Hilltop Deluxe Suite", status: "approved", bookings: 142 },
  { id: "r-002", name: "Garden Casita", status: "approved", bookings: 96 },
  { id: "r-003", name: "Lakeview Family Loft", status: "pending", bookings: 0 },
  { id: "r-004", name: "Bamboo Cottage", status: "review", bookings: 58 },
  { id: "r-005", name: "Sunrise Studio", status: "rejected", bookings: 0 },
];

const NOTIFICATIONS = [
  {
    kind: "rejected" as const,
    title: "Sunrise Studio needs revision",
    body: "Photos and amenity tags need attention before resubmission.",
  },
  {
    kind: "review" as const,
    title: "Bamboo Cottage is under review",
    body: "Your edit was submitted May 17 — expected decision by May 20.",
  },
];

const RECENT_ACTIVITY = [
  { t: "2h ago", text: "Booking BK-21048 completed at Hilltop Deluxe Suite.", dotClass: "bg-[#16a34a]" },
  { t: "8h ago", text: "Payout of ₱42,180 sent to GCash ending in 4421.", dotClass: "bg-[#B8860B]" },
  { t: "Yesterday", text: "New 5-star review on Garden Casita.", dotClass: "bg-[#DAA520]" },
  { t: "May 17", text: "Bamboo Cottage edits resubmitted for review.", dotClass: "bg-[#2563eb]" },
];

interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaKind?: "up" | "down";
  sub?: string;
  icon: React.ElementType;
}

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

const Stat = ({ label, value, delta, deltaKind = "up", sub, icon: IconCmp }: StatProps) => (
  <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] flex flex-col gap-1.5">
    <div className="flex justify-between items-center text-[#6B7280]">
      <span className="text-[11px] uppercase tracking-[0.08em] font-semibold">{label}</span>
      <span className="text-[#B8860B]/70">
        <IconCmp className="w-4 h-4" />
      </span>
    </div>
    <div
      className={`text-[30px] font-medium tracking-[-0.02em] leading-[1.1] mt-1 text-[#111827] ${fontFraunces}`}
    >
      {value}
    </div>
    <div className="flex items-center gap-2 mt-0.5">
      {delta && (
        <span
          className={`text-[11.5px] inline-flex items-center gap-1 font-semibold ${
            deltaKind === "up" ? "text-[#16a34a]" : "text-[#dc2626]"
          }`}
        >
          <TrendingUp className="w-3 h-3" />
          {delta}
        </span>
      )}
      {sub && <span className="text-[11.5px] text-[#6B7280]">{sub}</span>}
    </div>
  </div>
);

interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  sub: string;
  onClick?: () => void;
}

const QuickAction = ({ icon: IconCmp, title, sub, onClick }: QuickActionProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-[10px] bg-[#f9fafb] border border-[#e5e7eb] hover:border-[#B8860B] transition text-left"
  >
    <span className="w-9 h-9 rounded-[9px] grid place-items-center flex-shrink-0 bg-[#FEF3C7] text-[#B8860B]">
      <IconCmp className="w-[18px] h-[18px]" />
    </span>
    <span className="flex-1">
      <span className="block font-semibold text-[13.5px] text-[#111827]">{title}</span>
      <span className="block text-[11.5px] text-[#6B7280] mt-0.5">{sub}</span>
    </span>
    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
  </button>
);

interface PartnersDashboardProps {
  onNavigate?: (page: string) => void;
}

const PartnersDashboard = ({ onNavigate }: PartnersDashboardProps = {}) => {
  const { data: session } = useSession();
  const partnerName = (session?.user?.name as string) || "Partner";
  const firstName = partnerName.split(" ")[0];
  const go = (page: string) => onNavigate?.(page);

  const { data: listings = [] } = useGetMyListingsQuery();
  const { data: analytics } = useGetMyAnalyticsQuery({ days: 30 });
  const { data: notifications = [] } = useGetMyNotificationsQuery({ unread: true });

  const active = useMemo(
    () => listings.filter((r) => ["approved", "active", "live"].includes((r.status || "").toLowerCase())).length,
    [listings]
  );
  const pending = useMemo(
    () => listings.filter((r) => ["pending", "review", "under_review"].includes((r.status || "").toLowerCase())).length,
    [listings]
  );
  const totalListings = listings.length;
  const totalBookings = analytics?.total_bookings ?? 0;
  const monthNet = analytics?.net_total ?? 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const PREMIUM_THRESHOLD = 50;
  const lifetimeBookings = analytics?.lifetime_completed_bookings ?? 0;
  const isPremium = lifetimeBookings >= PREMIUM_THRESHOLD;
  const bookingsToPremium = Math.max(0, PREMIUM_THRESHOLD - lifetimeBookings);
  const tierPct = Math.min(100, Math.round((lifetimeBookings / PREMIUM_THRESHOLD) * 100));
  // Static lookup so Tailwind picks the classes up at build time
  const TIER_WIDTHS: Record<number, string> = {
    0: "w-0", 5: "w-[5%]", 10: "w-[10%]", 15: "w-[15%]", 20: "w-[20%]",
    25: "w-1/4", 30: "w-[30%]", 35: "w-[35%]", 40: "w-[40%]", 45: "w-[45%]",
    50: "w-1/2", 55: "w-[55%]", 60: "w-[60%]", 65: "w-[65%]", 70: "w-[70%]",
    75: "w-3/4", 80: "w-[80%]", 85: "w-[85%]", 90: "w-[90%]", 95: "w-[95%]", 100: "w-full",
  };
  const tierProgressClass = TIER_WIDTHS[Math.round(tierPct / 5) * 5] || "w-0";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* WELCOME BANNER */}
      <div className="relative rounded-[14px] overflow-hidden p-7 md:p-9 bg-white border border-[#e5e7eb] shadow-[0_1px_2px_rgba(15,42,46,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] uppercase tracking-[0.12em] text-[#6B7280] font-semibold mb-2">
              {today}
            </div>
            <h1
              className={`text-[#111827] text-[34px] leading-[1.15] tracking-[-0.02em] mb-1.5 font-medium ${fontFraunces}`}
            >
              Welcome back, {firstName}.
            </h1>
            <p className="text-[#374151] text-[15px] max-w-[520px] leading-relaxed">
              Here&apos;s how{" "}
              <strong className="font-semibold text-[#B8860B]">
                Casa Verde Tagaytay
              </strong>{" "}
              is doing this week — {active} rooms live, {pending}{" "}
              {pending === 1 ? "resubmission" : "items"} in review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => go("add")}
              className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 transition active:translate-y-[0.5px] bg-[#B8860B] hover:bg-[#8B6508] text-white"
            >
              <Plus className="w-4 h-4" /> Add new room
            </button>
            <button
              type="button"
              onClick={() => go("analytics")}
              className="px-4 py-2 rounded-[9px] text-[13.5px] font-semibold flex items-center gap-2 bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb] transition active:translate-y-[0.5px]"
            >
              <BarChart3 className="w-4 h-4" /> See analytics
            </button>
          </div>
        </div>
      </div>

      {/* STAT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[18px]">
        <Stat label="Active listings" value={active} sub={`of ${totalListings} total`} icon={Home} />
        <Stat
          label="Total bookings"
          value={num(totalBookings)}
          delta="+12 this wk"
          deltaKind="up"
          icon={Calendar}
        />
        <Stat label="Awaiting review" value={pending} sub="admin approval" icon={Info} />
        <Stat
          label="Net this month"
          value={peso(monthNet)}
          delta="+18% MoM"
          deltaKind="up"
          icon={BarChart3}
        />
      </div>

      {/* ALERTS + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[18px]">
        {/* LEFT — Needs attention + Recent activity */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)]">
          <div className="flex justify-between items-baseline mb-4">
            <h3
              className={`text-[17px] leading-[1.3] font-medium text-[#111827] ${fontFraunces}`}
            >
              Needs your attention
            </h3>
            <span className="text-[11.5px] text-[#6B7280]">
              {notifications.length > 0 ? `${notifications.length} items` : "all caught up"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {notifications.length === 0 && (
              <div className="text-center py-6 text-[13px] text-[#6B7280]">
                No new alerts. Everything looks good.
              </div>
            )}
            {notifications.map((n, i) => {
              const isRejected = n.kind === "rejected";
              return (
                <div
                  key={i}
                  className={`flex gap-3.5 p-3.5 rounded-[11px] border ${
                    isRejected
                      ? "bg-[#fee2e2] border-[#dc2626]/30"
                      : "bg-[#dbeafe] border-[#2563eb]/30"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[9px] flex-shrink-0 text-white grid place-items-center ${
                      isRejected ? "bg-[#dc2626]" : "bg-[#2563eb]"
                    }`}
                  >
                    {isRejected ? (
                      <AlertCircle className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold mb-0.5 ${
                        isRejected ? "text-[#dc2626]" : "text-[#2563eb]"
                      }`}
                    >
                      {n.title}
                    </div>
                    <div className="text-[12.5px] text-[#374151]">{n.body}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("listings")}
                    className="self-center px-2.5 py-1.5 rounded-[7px] text-[12.5px] text-[#374151] hover:bg-white/60 transition whitespace-nowrap font-medium"
                  >
                    Review
                  </button>
                </div>
              );
            })}
          </div>

          <div className="h-px bg-[#e5e7eb] my-6" />

          <div>
            <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.08em] font-semibold mb-3">
              Recent activity
            </div>
            <div className="flex flex-col gap-2.5">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${a.dotClass}`} />
                  <span className="text-[12.5px] flex-1 text-[#374151]">{a.text}</span>
                  <span className="text-[11.5px] text-[#6B7280]">{a.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Quick actions + Tier progress */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)]">
          <h3
            className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-4 ${fontFraunces}`}
          >
            Quick actions
          </h3>

          <div className="flex flex-col gap-2.5">
            <QuickAction
              icon={Plus}
              title="Add new room"
              sub="Submit a listing for review"
              onClick={() => go("add")}
            />
            <QuickAction
              icon={List}
              title="View my listings"
              sub={`${totalListings} rooms across all statuses`}
              onClick={() => go("listings")}
            />
            <QuickAction
              icon={BarChart3}
              title="See analytics"
              sub="Revenue, occupancy, top performer"
              onClick={() => go("analytics")}
            />
            <QuickAction
              icon={Receipt}
              title="Cost breakdown"
              sub="See your commission tier & FAQs"
              onClick={() => go("cost")}
            />
          </div>

          {/* Tier progress */}
          <div className="mt-[18px] p-3.5 rounded-[10px] border bg-[#FEF3C7] border-[#DAA520]/30">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.08em] flex items-center gap-1.5 text-[#92400e]">
              <Sparkles className="w-3 h-3" /> {isPremium ? "Premium Partner" : "Tier progress"}
            </div>
            <div className={`text-[17px] mt-1.5 mb-1.5 font-medium text-[#111827] ${fontFraunces}`}>
              {isPremium
                ? "You're a Premium Partner"
                : lifetimeBookings === 0
                ? `Complete your first booking`
                : `${bookingsToPremium} bookings to Premium`}
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.08] overflow-hidden">
              <div className={`h-full rounded-full bg-[#DAA520] ${tierProgressClass}`} />
            </div>
            <div className="text-[11.5px] text-[#6B7280] mt-2">
              {isPremium
                ? "Enjoying 9% commission and priority placement."
                : `${lifetimeBookings} of ${PREMIUM_THRESHOLD} completed · unlocks at 9% commission.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnersDashboard;
