"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  Navigation,
  CheckSquare,
  Building2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useGetCleaningTasksQuery } from "@/redux/api/cleanersApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** Called when the user taps "Go to Checklist" so the parent can switch pages */
  onNavigate?: (page: string) => void;
  /** Called with the haven ID so the checklist page can pre-select it */
  onStartCleaning?: (havenId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(d: Date) {
  const copy = startOfWeek(d);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  return t.substring(0, 5);
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "in-progress":
      return {
        label: "In Progress",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-700 dark:text-yellow-300",
      };
    case "cleaned":
      return {
        label: "Completed",
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-700 dark:text-green-300",
      };
    case "inspected":
      return {
        label: "Inspected",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
      };
    case "assigned":
      return {
        label: "Assigned",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-300",
      };
    default:
      return {
        label: "Pending",
        bg: "bg-gray-100 dark:bg-gray-700/30",
        text: "text-gray-700 dark:text-gray-300",
      };
  }
}

function openInMaps(location: string | undefined) {
  const query = location && location !== "Location TBD" ? location : "Quezon City, Philippines";
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    "_blank",
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MySchedulePage({ onNavigate = () => {}, onStartCleaning }: Props) {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: allTasks = [], isLoading } = useGetCleaningTasksQuery(undefined);

  /** Tasks that belong to the current cleaner */
  const assignments = useMemo(() => {
    if (!userId) return [];
    return allTasks.filter(
      (t: any) => String(t.assigned_cleaner_id ?? "") === String(userId),
    );
  }, [allTasks, userId]);

  // ── Calendar state ────────────────────────────────────────────────────────
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const wStart = startOfWeek(now);
    const wEnd   = endOfWeek(now);
    const mStart = startOfMonth(now);
    const mEnd   = endOfMonth(now);

    return {
      total:     assignments.length,
      todayCount: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        return isSameDay(new Date(a.check_out_date), now);
      }).length,
      thisWeek:  assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = new Date(a.check_out_date);
        return d >= wStart && d <= wEnd;
      }).length,
      thisMonth: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = new Date(a.check_out_date);
        return d >= mStart && d <= mEnd;
      }).length,
      completed: assignments.filter(
        (a: any) => a.cleaning_status === "cleaned" || a.cleaning_status === "inspected",
      ).length,
    };
  }, [assignments]);

  // ── Schedule map: dateString → assignments ────────────────────────────────
  const scheduleMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    assignments.forEach((a: any) => {
      if (!a.check_out_date) return;
      const key = new Date(a.check_out_date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [assignments]);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year  = calMonth.getFullYear();
    const month = calMonth.getMonth();
    return {
      daysInMonth:       new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay(),
    };
  }, [calMonth]);

  const selectedAssignments: any[] = scheduleMap[selectedDate.toDateString()] ?? [];

  const statsCards = [
    { label: "Total", value: stats.total,     color: "bg-brand-primary",  icon: ClipboardList },
    { label: "This Week",  value: stats.thisWeek,  color: "bg-blue-500",       icon: Calendar     },
    { label: "This Month", value: stats.thisMonth, color: "bg-green-500",      icon: Building2    },
    { label: "Completed",  value: stats.completed, color: "bg-purple-500",     icon: CheckCircle2 },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Schedule</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View your assignments and manage cleaning tasks
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className={`${color} text-white rounded-lg p-4 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">{label}</p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? "…" : value}
                </p>
              </div>
              <Icon className="w-8 h-8 opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Calendar + Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Calendar ── */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-4 sm:p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
              {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
            {WEEK_DAYS.map(d => (
              <div
                key={d}
                className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1"
              >
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Leading empty cells */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
              const isToday    = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);
              const hasTask    = !!scheduleMap[date.toDateString()];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-semibold
                    transition-all relative select-none
                    ${isSelected
                      ? "bg-brand-primary text-white shadow-md"
                      : isToday
                      ? "bg-brand-primary/15 text-brand-primary dark:text-brand-primary ring-1 ring-brand-primary/40"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  {day}
                  {hasTask && (
                    <span
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-brand-primary"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-primary inline-block" />
              Has assignments
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-brand-primary/15 ring-1 ring-brand-primary/40 inline-block" />
              Today
            </span>
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-5 flex flex-col gap-4">
          {/* Selected date header */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month:   "long",
                  day:     "numeric",
                })}
              </p>
              {isSameDay(selectedDate, today) && (
                <span className="text-xs font-semibold text-brand-primary">Today</span>
              )}
            </div>
          </div>

          {/* Assignment list */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-0.5">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 animate-pulse space-y-2"
                >
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
              ))
            ) : selectedAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No assignments this day
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Select a date with a dot to see tasks
                </p>
              </div>
            ) : (
              selectedAssignments.map((a: any) => {
                const badge = getStatusBadge(a.cleaning_status);
                const isActionable =
                  a.cleaning_status !== "cleaned" &&
                  a.cleaning_status !== "inspected";

                return (
                  <div
                    key={a.cleaning_id ?? a.id}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 p-4 space-y-3 hover:shadow-md transition-all"
                  >
                    {/* Haven name + status */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">
                        {a.haven ?? a.room_name ?? "—"}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {a.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{a.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Checkout: {formatDate(a.check_out_date)}
                          {a.check_out_time ? ` · ${formatTime(a.check_out_time)}` : ""}
                        </span>
                      </div>
                      {(a.cleaning_time_in || a.cleaning_time_out) && (
                        <div className="flex items-center gap-3">
                          <span>In: {formatTime(a.cleaning_time_in)}</span>
                          <span>Out: {formatTime(a.cleaning_time_out)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      {/* Open in Maps */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openInMaps(a.location); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Open in Maps
                      </button>

                      {/* Go to Checklist — only if not already completed */}
                      {isActionable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const havenId = a.haven_id ?? a.id;
                            if (onStartCleaning && havenId) {
                              onStartCleaning(String(havenId));
                            } else {
                              onNavigate("cleaning-checklist");
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Start Cleaning
                        </button>
                      )}

                      {/* If completed, show a done indicator instead */}
                      {!isActionable && (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary footer */}
          {!isLoading && selectedAssignments.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{selectedAssignments.length} assignment{selectedAssignments.length !== 1 ? "s" : ""}</span>
              <span>
                {selectedAssignments.filter(
                  (a: any) => a.cleaning_status === "cleaned" || a.cleaning_status === "inspected",
                ).length}{" "}
                completed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: assignment cards for selected date (shown below calendar on small screens) ── */}
      {/* Already handled in the panel above since it's a single column on mobile */}

      {/* Today's quick-glance banner (only if today has tasks and selected date is NOT today) */}
      {!isLoading &&
        !isSameDay(selectedDate, today) &&
        stats.todayCount > 0 && (
          <button
            onClick={() => setSelectedDate(today)}
            className="w-full flex items-center justify-between gap-3 bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/30 rounded-xl px-4 py-3 hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-brand-primary text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              You have {stats.todayCount} assignment{stats.todayCount !== 1 ? "s" : ""} today
            </div>
            <span className="text-xs text-brand-primary font-medium">View today →</span>
          </button>
        )}
    </div>
  );
}