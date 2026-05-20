"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Loader2, Plus, Trash2, RefreshCw, Copy,
  Calendar as CalendarIcon, ExternalLink, AlertCircle, CheckCircle2, X
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetHavenCalendarQuery,
  useBlockHavenDatesMutation,
  useUnblockHavenDateMutation,
  useGetICalFeedsQuery,
  useAddICalFeedMutation,
  useRemoveICalFeedMutation,
  useSyncICalFeedMutation,
  type ICalSource,
  type CalendarBlock,
} from "@/redux/api/partnerCalendarApi";
import { useGetMyListingsQuery } from "@/redux/api/partnerSelfApi";

const fontFraunces = "font-[var(--font-fraunces),Georgia,serif]";

// ─── Date helpers (all dates as 'YYYY-MM-DD' strings to avoid TZ bugs) ──────
const toYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const parseYmd = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const isWithin = (ymd: string, from: string, to: string) => ymd >= from && ymd <= to;

// Status taxonomy for the calendar cell visuals
type CellStatus =
  | "available"
  | "blocked_partner"
  | "blocked_admin"
  | "maintenance"
  | "imported"
  | "booked";

const STATUS_STYLE: Record<CellStatus, { bg: string; text: string; ring: string; label: string }> = {
  available:        { bg: "bg-white",                  text: "text-[#111827]", ring: "border-[#e5e7eb]",                  label: "Available" },
  blocked_partner:  { bg: "bg-[#fef3c7]",              text: "text-[#92400e]", ring: "border-[#92400e]/30",               label: "Blocked" },
  blocked_admin:    { bg: "bg-[#fee2e2]",              text: "text-[#7f1d1d]", ring: "border-[#7f1d1d]/30",               label: "Admin block" },
  maintenance:      { bg: "bg-[#e9d5ff]",              text: "text-[#6b21a8]", ring: "border-[#6b21a8]/30",               label: "Maintenance" },
  imported:         { bg: "bg-[#dbeafe]",              text: "text-[#1e3a8a]", ring: "border-[#1e3a8a]/30",               label: "External" },
  booked:           { bg: "bg-[#dcfce7]",              text: "text-[#14532d]", ring: "border-[#14532d]/30",               label: "Booked" },
};

export default function PartnerCalendarPage() {
  const { data: listings = [] } = useGetMyListingsQuery();
  const [havenId, setHavenId] = useState<string>("");
  const effectiveHaven = havenId || listings[0]?.uuid_id || "";

  // Default haven selection when listings load
  useEffect(() => {
    if (!havenId && listings[0]?.uuid_id) {
      setHavenId(listings[0].uuid_id);
    }
  }, [havenId, listings]);

  if (listings.length === 0) {
    return (
      <div className="animate-in fade-in duration-500">
        <PageHeader />
        <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-12 text-center">
          <CalendarIcon className="w-10 h-10 text-[#B8860B] mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-[#111827] mb-1">No listings yet</p>
          <p className="text-[13px] text-[#6B7280]">
            Add a room first — then you can manage its calendar and sync with external platforms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader />

      {/* Haven picker */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 mb-5">
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#6B7280] mb-2">
          Choose listing
        </div>
        <div className="flex flex-wrap gap-2">
          {listings.map((l) => {
            const isActive = effectiveHaven === l.uuid_id;
            return (
              <button
                key={l.uuid_id}
                type="button"
                onClick={() => setHavenId(l.uuid_id)}
                className={`px-3.5 py-1.5 rounded-[9px] text-[12.5px] font-semibold border transition ${
                  isActive
                    ? "border-[#B8860B] bg-[#FEF3C7] text-[#B8860B]"
                    : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                }`}
              >
                {l.haven_name}
              </button>
            );
          })}
        </div>
      </div>

      {effectiveHaven && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
          <CalendarGrid havenId={effectiveHaven} />
          <SidePanel havenId={effectiveHaven} />
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6">
      <div className="text-[11.5px] text-[#6B7280] uppercase tracking-[0.1em] mb-2 font-semibold">
        Availability
      </div>
      <h1 className={`text-[32px] leading-[1.15] tracking-[-0.02em] text-[#111827] mb-1.5 font-medium ${fontFraunces}`}>
        Calendar
      </h1>
      <p className="text-[14.5px] text-[#6B7280] max-w-[640px]">
        See bookings and blocked dates at a glance. Click dates to block them, or sync your
        Airbnb / Booking.com calendars to prevent double-bookings automatically.
      </p>
    </div>
  );
}

// ─── Month grid ────────────────────────────────────────────────────────────
function CalendarGrid({ havenId }: { havenId: string }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockType, setBlockType] = useState<"manual_partner" | "maintenance">("manual_partner");

  const monthStart = cursor;
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const from = toYmd(addDays(monthStart, -7));
  const to = toYmd(addDays(monthEnd, 14));

  const { data, isLoading } = useGetHavenCalendarQuery({ havenId, from, to });
  const [blockHavenDates, { isLoading: isBlocking }] = useBlockHavenDatesMutation();
  const [unblockHavenDate] = useUnblockHavenDateMutation();

  const cellStatus = useMemo(() => {
    const map = new Map<string, { status: CellStatus; reason?: string; blockId?: string; blockType?: string }>();
    const blocks = data?.blocks || [];
    const bookings = data?.bookings || [];

    // Apply blocks (later types override earlier — admin & booked outrank partner blocks)
    blocks.forEach((b) => {
      const status: CellStatus =
        b.block_type === "manual_admin"
          ? "blocked_admin"
          : b.block_type === "maintenance"
          ? "maintenance"
          : b.block_type === "imported_external"
          ? "imported"
          : "blocked_partner";
      let d = parseYmd(b.from_date);
      const endD = parseYmd(b.to_date);
      while (d.getTime() <= endD.getTime()) {
        map.set(toYmd(d), { status, reason: b.reason || undefined, blockId: b.id, blockType: b.block_type });
        d = addDays(d, 1);
      }
    });

    // Apply bookings — overrides any block
    bookings.forEach((bk) => {
      let d = parseYmd(bk.check_in_date);
      const endD = parseYmd(bk.check_out_date);
      while (d.getTime() < endD.getTime()) {
        map.set(toYmd(d), {
          status: "booked",
          reason: `${bk.booking_id} (${bk.booking_source})`,
        });
        d = addDays(d, 1);
      }
    });
    return map;
  }, [data]);

  // Generate the 6×7 grid of cells anchored to the first Sunday on/before the 1st
  const cells: Date[] = useMemo(() => {
    const first = monthStart;
    const startDayOffset = first.getDay(); // 0 = Sunday
    const start = addDays(first, -startDayOffset);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [monthStart]);

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleCellClick = (ymd: string) => {
    const status = cellStatus.get(ymd);
    if (status?.status === "booked" || status?.status === "blocked_admin" || status?.status === "imported") {
      const msg =
        status.status === "booked"
          ? "This date is booked — cancel the booking to free it up."
          : status.status === "blocked_admin"
          ? "Blocked by admin — only an admin can unblock."
          : "Imported from an external platform — remove the iCal feed to clear.";
      toast(msg, { icon: "ℹ️" });
      return;
    }
    if (status?.status === "blocked_partner" || status?.status === "maintenance") {
      // Click to unblock
      if (!status.blockId) return;
      if (confirm("Unblock this date?")) {
        unblockHavenDate({ havenId, blockId: status.blockId }).unwrap()
          .then(() => toast.success("Unblocked"))
          .catch((e) => toast.error(e?.data?.error || "Failed to unblock"));
      }
      return;
    }
    // Available — start / extend selection
    if (!selStart) {
      setSelStart(ymd);
      setSelEnd(ymd);
    } else if (!selEnd || selStart === selEnd) {
      // Pick range end
      if (ymd < selStart) {
        setSelEnd(selStart);
        setSelStart(ymd);
      } else {
        setSelEnd(ymd);
      }
    } else {
      // Reset to new single
      setSelStart(ymd);
      setSelEnd(ymd);
    }
  };

  const isInSelection = (ymd: string) =>
    selStart && selEnd && isWithin(ymd, selStart, selEnd);

  const submitBlock = async () => {
    if (!selStart || !selEnd) return;
    try {
      await blockHavenDates({
        havenId,
        from_date: selStart,
        to_date: selEnd,
        reason: blockReason,
        block_type: blockType,
      }).unwrap();
      toast.success("Dates blocked");
      setSelStart(null);
      setSelEnd(null);
      setBlockReason("");
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to block dates";
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-5">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            title="Previous month"
            className="p-1.5 rounded-md border border-[#e5e7eb] hover:bg-[#f9fafb] text-[#374151]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="px-3 py-1.5 rounded-md border border-[#e5e7eb] hover:bg-[#f9fafb] text-[12px] font-semibold text-[#374151]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            title="Next month"
            className="p-1.5 rounded-md border border-[#e5e7eb] hover:bg-[#f9fafb] text-[#374151]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className={`text-[18px] font-medium text-[#111827] ${fontFraunces}`}>
          {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        {isLoading && <Loader2 className="w-4 h-4 text-[#B8860B] animate-spin" />}
        {!isLoading && <div className="w-4" />}
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[11px] uppercase tracking-wider font-semibold text-[#6B7280] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d) => {
          const ymd = toYmd(d);
          const isCurrentMonth = d.getMonth() === cursor.getMonth();
          const status = cellStatus.get(ymd);
          const selected = isInSelection(ymd);
          const style = status ? STATUS_STYLE[status.status] : STATUS_STYLE.available;
          const isToday = ymd === toYmd(new Date());
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => handleCellClick(ymd)}
              className={`relative aspect-[1.2/1] rounded-md border transition text-left p-1.5 group ${
                style.bg
              } ${style.ring} ${selected ? "ring-2 ring-[#B8860B] border-[#B8860B]" : ""} ${
                !isCurrentMonth ? "opacity-40" : ""
              } hover:scale-[1.02] hover:shadow-sm`}
              title={status?.reason || style.label}
            >
              <div className={`text-[11.5px] font-semibold ${style.text} ${isToday ? "underline underline-offset-2 decoration-[#B8860B]" : ""}`}>
                {d.getDate()}
              </div>
              {status && (
                <div className={`text-[9px] uppercase tracking-wide font-bold mt-0.5 ${style.text} truncate`}>
                  {style.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#e5e7eb]">
        {(Object.entries(STATUS_STYLE) as [CellStatus, typeof STATUS_STYLE[CellStatus]][]).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm border ${v.bg} ${v.ring}`} />
            <span className="text-[11.5px] text-[#6B7280]">{v.label}</span>
          </div>
        ))}
      </div>

      {/* Block-form (visible only when partner selected available dates) */}
      {selStart && selEnd && (
        <div className="mt-5 p-4 bg-[#FEF3C7] border border-[#B8860B]/30 rounded-[12px] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-semibold text-[#92400e]">
              Block {selStart} → {selEnd}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelStart(null);
                setSelEnd(null);
                setBlockReason("");
              }}
              aria-label="Clear selection"
              title="Clear selection"
              className="p-1 rounded hover:bg-white/40 text-[#92400e]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as "manual_partner" | "maintenance")}
              aria-label="Block type"
              title="Block type"
              className="px-3 py-2 border border-[#d1d5db] bg-white text-[#111827] rounded-md text-[12.5px] outline-none focus:border-[#B8860B]"
            >
              <option value="manual_partner">Blocked</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason (optional, e.g. 'family visit')"
              aria-label="Reason"
              className="px-3 py-2 border border-[#d1d5db] bg-white text-[#111827] rounded-md text-[12.5px] outline-none focus:border-[#B8860B] placeholder:text-[#9CA3AF]"
            />
          </div>
          <button
            type="button"
            onClick={submitBlock}
            disabled={isBlocking}
            className="w-full px-4 py-2 rounded-md bg-[#B8860B] hover:bg-[#8B6508] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isBlocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Confirm block
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Side panel: iCal feeds + export ────────────────────────────────────────
function SidePanel({ havenId }: { havenId: string }) {
  const { data: feeds = [], isLoading } = useGetICalFeedsQuery({ havenId });
  const [addFeed, { isLoading: isAdding }] = useAddICalFeedMutation();
  const [removeFeed] = useRemoveICalFeedMutation();
  const [syncFeed] = useSyncICalFeedMutation();

  const [showAdd, setShowAdd] = useState(false);
  const [newSource, setNewSource] = useState<ICalSource>("airbnb");
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const exportUrl = typeof window !== "undefined" ? `${window.location.origin}/api/haven/${havenId}/ical-export` : "";

  const submitAdd = async () => {
    if (!newUrl.trim()) {
      toast.error("Please paste an iCal URL");
      return;
    }
    try {
      await addFeed({
        havenId,
        source: newSource,
        url: newUrl.trim(),
        label: newLabel.trim() || undefined,
      }).unwrap();
      toast.success("Feed added — will sync on next cron run");
      setNewUrl("");
      setNewLabel("");
      setShowAdd(false);
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Failed to add feed";
      toast.error(msg);
    }
  };

  const submitSync = async (feedId: string) => {
    setSyncingId(feedId);
    try {
      const result = await syncFeed({ havenId, feedId }).unwrap();
      if (result.ok) {
        toast.success(
          `Synced ${result.events_imported} events` +
            (result.events_removed > 0 ? `, removed ${result.events_removed}` : "")
        );
      } else {
        toast.error(result.error || "Sync failed");
      }
    } catch (err) {
      const msg = (err as { data?: { error?: string } })?.data?.error || "Sync failed";
      toast.error(msg);
    } finally {
      setSyncingId(null);
    }
  };

  const submitRemove = async (feedId: string) => {
    if (!confirm("Remove this feed and all the dates it imported?")) return;
    try {
      await removeFeed({ havenId, feedId }).unwrap();
      toast.success("Feed removed");
    } catch {
      toast.error("Could not remove");
    }
  };

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      toast.success("Export URL copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* My export URL */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4">
        <div className="flex items-center gap-2 mb-2">
          <ExternalLink className="w-4 h-4 text-[#B8860B]" />
          <h3 className={`text-[15px] font-medium text-[#111827] ${fontFraunces}`}>
            Your export URL
          </h3>
        </div>
        <p className="text-[12px] text-[#6B7280] mb-3">
          Paste this into Airbnb / Booking.com calendar-import settings so they block dates booked here.
        </p>
        <div className="flex gap-1.5">
          <input
            value={exportUrl}
            readOnly
            aria-label="iCal export URL"
            className="flex-1 px-2.5 py-1.5 border border-[#e5e7eb] bg-[#f9fafb] text-[11.5px] text-[#374151] rounded-md font-mono outline-none"
          />
          <button
            type="button"
            onClick={copyExport}
            title="Copy"
            aria-label="Copy export URL"
            className="px-2.5 py-1.5 rounded-md border border-[#e5e7eb] text-[#374151] hover:bg-[#f9fafb]"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Imported feeds */}
      <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-[15px] font-medium text-[#111827] ${fontFraunces}`}>
            Synced calendars
          </h3>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="text-[11.5px] font-semibold text-[#B8860B] hover:underline inline-flex items-center gap-1"
          >
            {showAdd ? "Cancel" : "Add"}
            {!showAdd && <Plus className="w-3 h-3" />}
          </button>
        </div>

        {showAdd && (
          <div className="mb-3 p-3 bg-[#FEF3C7]/40 border border-[#B8860B]/30 rounded-[10px] space-y-2">
            <select
              value={newSource}
              onChange={(e) => setNewSource(e.target.value as ICalSource)}
              aria-label="Calendar source"
              title="Calendar source"
              className="w-full px-2.5 py-1.5 border border-[#d1d5db] bg-white text-[#111827] rounded-md text-[12.5px] outline-none focus:border-[#B8860B]"
            >
              <option value="airbnb">Airbnb</option>
              <option value="booking.com">Booking.com</option>
              <option value="agoda">Agoda</option>
              <option value="vrbo">VRBO</option>
              <option value="other">Other</option>
            </select>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://www.airbnb.com/calendar/ical/...ics"
              aria-label="iCal URL"
              className="w-full px-2.5 py-1.5 border border-[#d1d5db] bg-white text-[#111827] rounded-md text-[12px] outline-none focus:border-[#B8860B] font-mono placeholder:text-[#9CA3AF]"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (optional, e.g. 'Airbnb listing 12345')"
              aria-label="Label"
              className="w-full px-2.5 py-1.5 border border-[#d1d5db] bg-white text-[#111827] rounded-md text-[12.5px] outline-none focus:border-[#B8860B] placeholder:text-[#9CA3AF]"
            />
            <button
              type="button"
              onClick={submitAdd}
              disabled={isAdding}
              className="w-full px-3 py-1.5 rounded-md bg-[#B8860B] hover:bg-[#8B6508] text-white font-semibold text-[12px] flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add feed
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="py-6 text-center">
            <Loader2 className="w-4 h-4 text-[#B8860B] animate-spin mx-auto" />
          </div>
        ) : feeds.length === 0 ? (
          <div className="text-[12px] text-[#6B7280] italic py-3 text-center">
            No external calendars synced yet.
          </div>
        ) : (
          <div className="space-y-2">
            {feeds.map((f) => (
              <div key={f.id} className="p-3 border border-[#e5e7eb] rounded-[10px] flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12.5px] font-bold text-[#111827] uppercase tracking-wide">
                      {f.source}
                    </span>
                    {f.label && (
                      <span className="text-[11px] text-[#6B7280] truncate">· {f.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => submitSync(f.id)}
                      disabled={syncingId === f.id}
                      title="Sync now"
                      aria-label="Sync now"
                      className="p-1 rounded text-[#374151] hover:bg-[#f9fafb]"
                    >
                      {syncingId === f.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitRemove(f.id)}
                      title="Remove feed"
                      aria-label="Remove feed"
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[10.5px] text-[#6B7280] font-mono truncate" title={f.url}>
                  {f.url}
                </div>
                <div className="flex items-center gap-2 text-[10.5px]">
                  {f.last_status === "ok" ? (
                    <span className="inline-flex items-center gap-1 text-[#16a34a] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Synced
                    </span>
                  ) : f.last_status === "error" ? (
                    <span className="inline-flex items-center gap-1 text-[#dc2626] font-semibold" title={f.last_error || ""}>
                      <AlertCircle className="w-3 h-3" /> Sync error
                    </span>
                  ) : (
                    <span className="text-[#6B7280] italic">Not synced yet</span>
                  )}
                  <span className="text-[#6B7280]">
                    {f.last_synced_at
                      ? `· ${new Date(f.last_synced_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}`
                      : ""}
                  </span>
                  <span className="text-[#6B7280] ml-auto">
                    {f.last_event_count} event{f.last_event_count === 1 ? "" : "s"}
                  </span>
                </div>
                {f.last_status === "error" && f.last_error && (
                  <div className="text-[10.5px] text-[#dc2626] bg-red-50 p-2 rounded">
                    {f.last_error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10.5px] text-[#6B7280] italic mt-3">
          Calendars also auto-sync every 15 minutes in the background.
        </p>
      </div>
    </div>
  );
}
