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

function toLocalMidnight(dateStr: string): Date {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day);
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
    case "upcoming":
      return {
        label: "Upcoming",
        bg: "bg-sky-100 dark:bg-sky-900/30",
        text: "text-sky-600 dark:text-sky-300",
        dot: "#0ea5e9",
      };
    case "ready":
      return {
        label: "Ready to Clean",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-300",
        dot: "#f59e0b",
      };
    case "in-progress":
      return {
        label: "In Progress",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-300",
        dot: "#f97316",
      };
    case "completed":
    case "cleaned":
    case "inspected":
      return {
        label: "Completed",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
        dot: "#006543",
      };
    case "assigned":
      return {
        label: "Assigned",
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-300",
        dot: "#6366f1",
      };
    default:
      return {
        label: "Pending",
        bg: "bg-slate-100 dark:bg-slate-700/30",
        text: "text-slate-600 dark:text-slate-300",
        dot: "#94a3b8",
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

  const { data: allTasks = [], isLoading } = useGetCleaningTasksQuery(undefined);

  const assignments = useMemo(() => {
    if (!userId) return [];
    return allTasks.filter(
      (t: any) => String(t.assigned_cleaner_id ?? "") === String(userId),
    );
  }, [allTasks, userId]);

  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const stats = useMemo(() => {
    const now = new Date();
    const wStart = startOfWeek(now);
    const wEnd   = endOfWeek(now);
    const mStart = startOfMonth(now);
    const mEnd   = endOfMonth(now);

    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    return {
      total:      assignments.length,
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
      readyCount: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = toLocalMidnight(a.check_out_date);
        const isDone = a.cleaning_status === "cleaned" || a.cleaning_status === "inspected";
        return d <= todayMidnight && !isDone;
      }).length,
      upcomingCount: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = toLocalMidnight(a.check_out_date);
        return d > todayMidnight;
      }).length,
    };
  }, [assignments]);

  // ── Schedule map: dateString → enhanced schedule info ────────────────────────
  const scheduleMap = useMemo(() => {
    const map: Record<string, {
      assignments: any[];
      effectiveStatus: string;
      labels: Record<string, string>;
      dayType: "checkIn" | "checkOut" | "middle" | "both";
    }> = {};

    assignments.forEach((a: any) => {
      if (!a.check_out_date) return;

      const startDate = toLocalMidnight(a.check_in_date || a.check_out_date);
      const endDate   = toLocalMidnight(a.check_out_date);

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const isPast = endDate < now;

      const effectiveStatus =
        a.cleaning_status === "in-progress" ? "in-progress"
        : a.cleaning_status === "cleaned" || a.cleaning_status === "inspected" || isPast
        ? "completed"
        : "assigned";

      const isSingleDay = isSameDay(startDate, endDate);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      ) {
        const key = d.toDateString();
        const isCheckIn  = isSameDay(d, startDate);
        const isCheckOut = isSameDay(d, endDate);

        const newDayType: "checkIn" | "checkOut" | "middle" | "both" =
          isSingleDay  ? "both"     :
          isCheckIn    ? "checkIn"  :
          isCheckOut   ? "checkOut" :
                         "middle";

        if (!map[key]) {
          map[key] = { assignments: [], effectiveStatus, labels: {}, dayType: newDayType };
        } else {
          const priority = { both: 4, checkIn: 3, checkOut: 3, middle: 1 };
          if (priority[newDayType] > priority[map[key].dayType]) {
            map[key].dayType = newDayType;
          }
        }

        if (!map[key].assignments.find((x: any) => x.cleaning_id === a.cleaning_id)) {
          map[key].assignments.push(a);
        }

        const statusPriority: Record<string, number> = { "in-progress": 3, completed: 2, assigned: 1 };
        if ((statusPriority[effectiveStatus] || 0) > (statusPriority[map[key].effectiveStatus] || 0)) {
          map[key].effectiveStatus = effectiveStatus;
        }

        if (isCheckIn)  map[key].labels.checkIn  = a.cleaning_id;
        if (isCheckOut) map[key].labels.checkOut = a.cleaning_id;
      }
    });

    return map;
  }, [assignments]);

  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year  = calMonth.getFullYear();
    const month = calMonth.getMonth();
    return {
      daysInMonth:       new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay(),
    };
  }, [calMonth]);

  const selectedDateKey = selectedDate.toDateString();
  const selectedSchedule = scheduleMap[selectedDateKey];
  // Only show tasks in the detail panel on their actual checkout date
  const selectedAssignments: any[] = selectedSchedule
    ? selectedSchedule.assignments.filter((a: any) => {
        if (!a.check_out_date) return true;
        return isSameDay(toLocalMidnight(a.check_out_date), selectedDate);
      })
    : [];

  const statsCards = [
    { label: "Total",      value: stats.total,     color: "bg-brand-primary", icon: ClipboardList, sub: `${stats.readyCount} ready · ${stats.upcomingCount} upcoming` },
    { label: "This Week",  value: stats.thisWeek,  color: "bg-blue-500",      icon: Calendar,      sub: null },
    { label: "This Month", value: stats.thisMonth, color: "bg-green-500",     icon: Building2,     sub: null },
    { label: "Completed",  value: stats.completed, color: "bg-purple-500",    icon: CheckCircle2,  sub: null },
  ];

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
        {statsCards.map(({ label, value, color, icon: Icon, sub }) => (
          <div
            key={label}
            className={`${color} text-white rounded-lg p-4 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">{label}</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "…" : value}</p>
                {sub && !isLoading && (
                  <p className="text-[10px] opacity-75 mt-0.5 leading-tight">{sub}</p>
                )}
              </div>
              <Icon className="w-8 h-8 opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
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
              <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
              const dateKey    = date.toDateString();
              const dayAbbr    = WEEK_DAYS[date.getDay()];
              const isToday    = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);

              const dateSchedule    = scheduleMap[dateKey];
              const hasTask         = !!dateSchedule;
              const effectiveStatus = dateSchedule?.effectiveStatus || "pending";
              const dayType         = dateSchedule?.dayType;
              const badge           = getStatusBadge(effectiveStatus);
              // Only count assignments whose checkout date is this specific day
              const taskCount       = dateSchedule?.assignments.filter((a: any) =>
                a.check_out_date ? isSameDay(toLocalMidnight(a.check_out_date), date) : true
              ).length ?? 0;

              const isMiddleDay   = hasTask && dayType === "middle";
              const isCheckOutDay = hasTask && (dayType === "checkOut" || dayType === "both");

              // Show task badge only when there are actual checkout tasks this day
              const showTaskBadges = taskCount > 0;

              const cellClasses = [
                "aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg relative group p-0.5",
                isSelected
                  ? "bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-xl ring-2 ring-white/50"
                  : isToday
                  ? "shadow-md text-gray-800 dark:text-gray-100"
                  : hasTask
                  ? `bg-gradient-to-br ${badge.bg} ${badge.text} shadow-xl border-2 border-white/30 dark:border-gray-600/50`
                  : "bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
              ].filter(Boolean).join(" ");

              const isCompleted = effectiveStatus === "completed";

              const cellStyle: React.CSSProperties =
                isSelected ? {} :
                isToday ? {
                  backgroundColor: "rgba(131, 49, 2, 0.15)",
                  border: "2px solid rgba(131, 49, 2, 0.5)",
                  color: "#833102",
                } :
                isMiddleDay ? {
                  backgroundColor: "rgba(255, 237, 213, 0.6)",
                  color: "#ea580c",
                  border: "1.5px dashed #fdba74"
                } :
                isCompleted ? {
                  backgroundColor: "rgba(22, 163, 74, 0.25)",
                  border: "2px solid rgba(74, 222, 128, 0.6)",
                  color: "#15803d"
                } :
                isCheckOutDay ? {
                  backgroundColor: "rgba(79, 70, 229, 0.25)",
                  border: "2px solid rgba(134, 239, 172, 0.6)",
                  color: "#4338ca"
                } :
                hasTask ? getStatusBadge(effectiveStatus).bg.includes("indigo") ? {
                  backgroundColor: "rgba(48, 40, 217, 0.25)",
                  border: "2px solid rgba(134, 239, 172, 0.6)",
                  color: "#4338ca"
                } : getStatusBadge(effectiveStatus).bg.includes("orange") ? {
                  backgroundColor: "rgba(255, 237, 213, 0.6)",
                  color: "#ea580c"
                } : {} : {};

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={cellClasses}
                  style={cellStyle}
                  title={hasTask ? `${taskCount} task${taskCount !== 1 ? "s" : ""} · ${badge.label}` : ""}
                >
                  {/* Task count badge — hidden on middle days */}
                  {showTaskBadges && !isSelected && !isToday && taskCount > 0 && (
                    <>
                      <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-white dark:bg-gray-800 border-2 border-current rounded-full text-[10px] font-black flex items-center justify-center z-30 shadow-sm leading-none">
                        {taskCount}
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm" />
                    </>
                  )}

                  <div className={`font-bold text-lg leading-none ${isSelected ? "text-white" : ""}`}>
                    {day}
                  </div>
                  <div className={`text-[11px] font-semibold leading-none opacity-90 ${isSelected ? "text-white" : ""}`}>
                    {dayAbbr}
                  </div>

                  {/* Task count + label pill, hidden on middle days */}
                  {showTaskBadges && !isSelected && !isToday && taskCount > 0 && (
                    <div
                      className="flex items-center gap-0.5 leading-none mt-1 px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap"
                      style={{ backgroundColor: "#fafafa", color: "#df1010" }}
                    >
                      <span className="text-sm font-black leading-none">{taskCount}</span>
                      <span className="text-[11px] font-black leading-none">
                        {taskCount === 1 ? "task" : "tasks"}
                      </span>
                    </div>
                  )}

                  {hasTask && isSelected && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/80 rounded-full shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm mx-auto" style={{ backgroundColor: "#6366f1" }} />
              <span className="font-medium">Assigned</span>
            </span>
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm mx-auto" style={{ backgroundColor: "#10b981" }} />
              <span className="font-medium">Completed</span>
            </span>
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-offset-1 ring-brand-primary/60 mx-auto" style={{ backgroundColor: "#833102" }} />
              <span className="font-medium">Today</span>
            </span>
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm border-2 border-dashed border-orange-400/80 mx-auto flex items-center justify-center p-0.5" style={{ backgroundColor: "#ffedd5" }} />
              <span className="font-medium text-orange-700 dark:text-orange-400">Staying</span>
            </span>
          </div>

        </div>

        {/* ── Detail panel ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-5 flex flex-col gap-4">
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

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-0.5">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 animate-pulse space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
              ))
            ) : selectedAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No assignments this day</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Select a highlighted date to see tasks</p>
              </div>
            ) : (
              selectedAssignments.map((a: any) => {
                const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
                const checkoutDate = a.check_out_date ? toLocalMidnight(a.check_out_date) : null;
                const isUpcoming = checkoutDate ? checkoutDate > todayMidnight : false;
                const isDone = a.cleaning_status === "cleaned" || a.cleaning_status === "inspected";
                const effectiveBadgeStatus = isDone ? a.cleaning_status
                  : isUpcoming ? "upcoming"
                  : a.cleaning_status === "in-progress" ? "in-progress"
                  : "ready";
                const badge = getStatusBadge(effectiveBadgeStatus);
                const isActionable = !isDone && !isUpcoming;

                return (
                  <div
                    key={a.cleaning_id ?? a.id}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 p-4 space-y-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">
                        {a.haven ?? a.room_name ?? "—"}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>

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

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openInMaps(a.location); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Open in Maps
                      </button>

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

                      {isUpcoming && (
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
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          View Checklist
                        </button>
                      )}

                      {isDone && (
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

      {!isLoading && !isSameDay(selectedDate, today) && stats.todayCount > 0 && (
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
