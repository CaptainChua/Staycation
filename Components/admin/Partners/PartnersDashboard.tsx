"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import {
  useGetMyListingsQuery,
  useGetMyAnalyticsQuery,
  useGetMyNotificationsQuery,
  useGetMyBookingsQuery,
} from "@/redux/api/partnerSelfApi";
import { useGetHavenCalendarQuery } from "@/redux/api/partnerCalendarApi";
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

// Relative-time formatter, e.g. "2h ago", "3d ago", "May 17"
const formatRelativeTime = (iso: string): string => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

// Dot color per notification kind
const DOT_BY_KIND: Record<string, string> = {
  approved: "bg-[#16a34a]",
  rejected: "bg-[#dc2626]",
  review: "bg-[#2563eb]",
  payout: "bg-[#B8860B]",
  message: "bg-[#DAA520]",
  info: "bg-[#6B7280]",
};

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
  <div className="bg-white border border-[#e5e7eb] rounded-[10px] sm:rounded-[14px] p-3 sm:p-4 lg:p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] flex flex-col gap-1 sm:gap-1.5 min-w-0">
    <div className="flex justify-between items-center text-[#6B7280]">
      <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] font-semibold leading-tight">{label}</span>
      <span className="text-[#B8860B]/70 flex-shrink-0">
        <IconCmp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </span>
    </div>
    <div
      className={`text-[18px] sm:text-[22px] lg:text-[30px] font-medium tracking-[-0.02em] leading-[1.1] mt-0.5 sm:mt-1 text-[#111827] truncate ${fontFraunces}`}
    >
      {value}
    </div>
    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
      {delta && (
        <span
          className={`text-[10px] sm:text-[11.5px] inline-flex items-center gap-1 font-semibold ${
            deltaKind === "up" ? "text-[#16a34a]" : "text-[#dc2626]"
          }`}
        >
          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          {delta}
        </span>
      )}
      {sub && <span className="text-[10px] sm:text-[11.5px] text-[#6B7280]">{sub}</span>}
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
  // All notifications (read + unread) feed the recent-activity stream
  const { data: allNotifications = [] } = useGetMyNotificationsQuery();
  const { data: bookings = [] } = useGetMyBookingsQuery({ limit: 10 });

  // Build recent activity from notifications + recent booking lifecycle events,
  // sorted newest first, capped at 6 items
  const recentActivity = useMemo(() => {
    type Item = { id: string; time: string; text: string; dotClass: string; iso: string };
    const items: Item[] = [];

    allNotifications.forEach((n) => {
      items.push({
        id: `n-${n.id}`,
        iso: n.created_at,
        time: formatRelativeTime(n.created_at),
        text: n.title,
        dotClass: DOT_BY_KIND[n.kind] || "bg-[#6B7280]",
      });
    });

    bookings.forEach((b) => {
      const verb =
        b.status === "completed"
          ? "completed"
          : b.status === "approved" || b.status === "confirmed"
          ? "confirmed"
          : b.status === "checked-in"
          ? "checked-in"
          : b.status === "rejected" || b.status === "cancelled"
          ? "cancelled"
          : null;
      if (!verb) return;
      const dot =
        verb === "completed" || verb === "confirmed"
          ? "bg-[#16a34a]"
          : verb === "checked-in"
          ? "bg-[#2563eb]"
          : "bg-[#dc2626]";
      items.push({
        id: `b-${b.booking_uuid || b.booking_id}`,
        iso: b.created_at,
        time: formatRelativeTime(b.created_at),
        text: `Booking ${b.booking_id} ${verb} at ${b.room_name}.`,
        dotClass: dot,
      });
    });

    return items
      .sort((a, b) => new Date(b.iso).getTime() - new Date(a.iso).getTime())
      .slice(0, 6);
  }, [allNotifications, bookings]);

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
    <div className="space-y-3 sm:space-y-6 animate-in fade-in duration-500 min-w-0 overflow-x-hidden">
      {/* WELCOME BANNER */}
      <div className="relative rounded-[14px] overflow-hidden p-4 sm:p-6 lg:p-9 bg-white border border-[#e5e7eb] shadow-[0_1px_2px_rgba(15,42,46,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#6B7280] font-semibold mb-1.5 truncate">
              {today}
            </div>
            <h1
              className={`text-[#111827] text-[22px] sm:text-[26px] lg:text-[32px] leading-[1.15] tracking-[-0.02em] mb-1.5 font-medium ${fontFraunces}`}
            >
              Welcome back, {firstName}.
            </h1>
            <p className="text-[#374151] text-[13px] sm:text-[14px] lg:text-[15px] leading-relaxed">
              Here&apos;s how{" "}
              <strong className="font-semibold text-[#B8860B]">
                Casa Verde Tagaytay
              </strong>{" "}
              is doing this week — {active} rooms live, {pending}{" "}
              {pending === 1 ? "resubmission" : "items"} in review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => go("add")}
              className="px-3 sm:px-4 py-2 rounded-[9px] text-[12.5px] sm:text-[13.5px] font-semibold flex items-center gap-2 transition active:translate-y-[0.5px] bg-[#B8860B] hover:bg-[#8B6508] text-white"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add new room
            </button>
            <button
              type="button"
              onClick={() => go("analytics")}
              className="px-3 sm:px-4 py-2 rounded-[9px] text-[12.5px] sm:text-[13.5px] font-semibold flex items-center gap-2 bg-white border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb] transition active:translate-y-[0.5px]"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> See analytics
            </button>
          </div>
        </div>
      </div>

      {/* STAT GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[18px]">
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

      {/* CALENDAR OVERVIEW — next 14 days for the first listing */}
      {listings.length > 0 && (
        <CalendarOverview
          havenId={listings[0].uuid_id}
          havenName={listings[0].haven_name}
          onGoToCalendar={() => go("calendar")}
        />
      )}

      {/* ALERTS + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 sm:gap-[18px]">
        {/* LEFT — Needs attention + Recent activity */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 sm:p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] min-w-0">
          <div className="flex justify-between items-baseline mb-4 gap-2">
            <h3
              className={`text-[15px] sm:text-[17px] leading-[1.3] font-medium text-[#111827] ${fontFraunces}`}
            >
              Needs your attention
            </h3>
            <span className="text-[11.5px] text-[#6B7280] flex-shrink-0">
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
                  className={`flex flex-wrap gap-3 p-3 sm:p-3.5 rounded-[11px] border ${
                    isRejected
                      ? "bg-[#fee2e2] border-[#dc2626]/30"
                      : "bg-[#dbeafe] border-[#2563eb]/30"
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[9px] flex-shrink-0 text-white grid place-items-center ${
                      isRejected ? "bg-[#dc2626]" : "bg-[#2563eb]"
                    }`}
                  >
                    {isRejected ? (
                      <AlertCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <div
                      className={`text-[13px] font-semibold mb-0.5 ${
                        isRejected ? "text-[#dc2626]" : "text-[#2563eb]"
                      }`}
                    >
                      {n.title}
                    </div>
                    <div className="text-[12px] sm:text-[12.5px] text-[#374151]">{n.body}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go("listings")}
                    className="self-center flex-shrink-0 px-2.5 py-1.5 rounded-[7px] text-[12px] sm:text-[12.5px] text-[#374151] hover:bg-white/60 transition whitespace-nowrap font-medium"
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
            {recentActivity.length === 0 ? (
              <div className="text-[12.5px] text-[#6B7280] py-3">
                No activity yet. Your bookings, listing updates, and payouts will appear here.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex gap-3 items-center min-w-0">
                    <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${a.dotClass}`} />
                    <span className="text-[12.5px] flex-1 text-[#374151] min-w-0 truncate">{a.text}</span>
                    <span className="text-[11.5px] text-[#6B7280] flex-shrink-0 whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Quick actions + Tier progress */}
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 sm:p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)] min-w-0">
          <h3
            className={`text-[15px] sm:text-[17px] leading-[1.3] font-medium text-[#111827] mb-4 ${fontFraunces}`}
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
            <div className={`text-[14px] sm:text-[17px] mt-1.5 mb-1.5 font-medium text-[#111827] ${fontFraunces}`}>
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

function CalendarOverview({
  havenId,
  havenName,
  onGoToCalendar,
}: {
  havenId: string;
  havenName: string;
  onGoToCalendar: () => void;
}) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days: Date[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  const fromYmd = ymd(start);
  const toYmd = ymd(days[days.length - 1]);
  const { data } = useGetHavenCalendarQuery({ havenId, from: fromYmd, to: toYmd });

  // Build a map of YYYY-MM-DD → status for the next 14 days
  const dayStatus = useMemo(() => {
    const map = new Map<string, { status: string; label: string; bg: string; text: string }>();
    const blocks = data?.blocks || [];
    const bookings = data?.bookings || [];
    blocks.forEach((b) => {
      let d = new Date(b.from_date);
      const end = new Date(b.to_date);
      while (d.getTime() <= end.getTime()) {
        const k = ymd(d);
        if (b.block_type === "imported_external") {
          map.set(k, { status: "external", label: "External", bg: "bg-[#dbeafe]", text: "text-[#1e3a8a]" });
        } else if (b.block_type === "manual_admin") {
          map.set(k, { status: "admin_block", label: "Admin block", bg: "bg-[#fee2e2]", text: "text-[#7f1d1d]" });
        } else if (b.block_type === "maintenance") {
          map.set(k, { status: "maintenance", label: "Maintenance", bg: "bg-[#e9d5ff]", text: "text-[#6b21a8]" });
        } else {
          map.set(k, { status: "blocked", label: "Blocked", bg: "bg-[#fef3c7]", text: "text-[#92400e]" });
        }
        d = new Date(d.getTime() + 86_400_000);
      }
    });
    bookings.forEach((bk) => {
      let d = new Date(bk.check_in_date);
      const end = new Date(bk.check_out_date);
      while (d.getTime() < end.getTime()) {
        map.set(ymd(d), { status: "booked", label: "Booked", bg: "bg-[#dcfce7]", text: "text-[#14532d]" });
        d = new Date(d.getTime() + 86_400_000);
      }
    });
    return map;
  }, [data]);

  const summary = useMemo(() => {
    let booked = 0, blocked = 0, available = 0;
    for (const d of days) {
      const s = dayStatus.get(ymd(d));
      if (!s) available++;
      else if (s.status === "booked") booked++;
      else blocked++;
    }
    return { booked, blocked, available };
  }, [days, dayStatus]);

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-[22px] shadow-[0_1px_2px_rgba(15,42,46,0.04)]">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
        <div>
          <h3 className={`text-[17px] leading-[1.3] font-medium text-[#111827] mb-0.5 ${fontFraunces}`}>
            Calendar overview
          </h3>
          <p className="text-[12px] text-[#6B7280]">
            Next 14 days · {havenName}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11.5px] text-[#6B7280]">
          <CalSummary label="Available" value={summary.available} color="text-[#16a34a]" />
          <CalSummary label="Booked" value={summary.booked} color="text-[#14532d]" />
          <CalSummary label="Blocked" value={summary.blocked} color="text-[#92400e]" />
          <button
            type="button"
            onClick={onGoToCalendar}
            className="ml-2 text-[12px] font-semibold text-[#B8860B] hover:underline inline-flex items-center gap-1"
          >
            Open full calendar →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 lg:grid-cols-14 gap-1">
        {days.map((d) => {
          const k = ymd(d);
          const s = dayStatus.get(k);
          const style = s
            ? `${s.bg} ${s.text} border-transparent`
            : "bg-white text-[#111827] border-[#e5e7eb]";
          const isToday = k === ymd(today);
          return (
            <div
              key={k}
              className={`relative aspect-[1.1/1] rounded-md border p-1.5 text-left ${style}`}
              title={s?.label || "Available"}
            >
              <div className="text-[9.5px] uppercase tracking-wide font-semibold opacity-70">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className={`text-[14px] font-semibold leading-tight ${isToday ? "underline underline-offset-2 decoration-[#B8860B]" : ""}`}>
                {d.getDate()}
              </div>
              {s && (
                <div className="text-[8.5px] uppercase tracking-wider font-bold opacity-90 mt-0.5 truncate">
                  {s.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalSummary({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-[#6B7280]">{label}</span>
    </span>
  );
}

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default PartnersDashboard;
