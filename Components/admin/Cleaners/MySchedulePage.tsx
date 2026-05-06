"use client";

import { Calendar, Clock, ChevronLeft, ChevronRight, MapPin, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";

interface ScheduleStats {
  todaysTasks: number;
  thisWeek: number;
  thisMonth: number;
  completed: number;
}

interface RawAssignment {
  cleaning_id: string;
  haven: string;
  location: string;
  cleaning_status: string;
  check_out_date: string;
  check_out_time: string | null;
}

interface ScheduleAssignment {
  haven: string;
  time: string;
  location: string;
  status: string;
  statusColor: string;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "cleaned":
    case "inspected":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "assigned":
      return "Assigned";
    default:
      return "Pending";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "cleaned":
    case "inspected":
      return "text-green-600";
    case "in-progress":
      return "text-yellow-600";
    case "assigned":
      return "text-blue-600";
    default:
      return "text-orange-600";
  }
}

export default function MySchedulePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ScheduleStats>({
    todaysTasks: 0,
    thisWeek: 0,
    thisMonth: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [allAssignments, setAllAssignments] = useState<RawAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/cleaners/${session.user.id}/schedule-stats`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();
        if (payload.success && payload.data) {
          setStats(payload.data);
        }
      } catch (error) {
        console.error("Error fetching schedule stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAssignments = async () => {
      if (!session?.user?.id) {
        setIsLoadingAssignments(false);
        return;
      }

      try {
        setIsLoadingAssignments(true);
        const response = await fetch(`/api/admin/cleaners/${session.user.id}/assignments-today`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();
        if (payload.success && Array.isArray(payload.data)) {
          setAllAssignments(payload.data);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchStats();
    fetchAssignments();
  }, [session?.user?.id]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build schedule map from real API data keyed by date string
  const scheduleMap = useMemo(() => {
    const map: Record<string, ScheduleAssignment[]> = {};
    allAssignments.forEach((t) => {
      const dateKey = t.check_out_date ? new Date(t.check_out_date).toDateString() : null;
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      const timeStr = t.check_out_time ? t.check_out_time.substring(0, 5) : "—";
      map[dateKey].push({
        haven: t.haven || "—",
        time: timeStr,
        location: t.location || "Location TBD",
        status: getStatusLabel(t.cleaning_status),
        statusColor: getStatusColor(t.cleaning_status),
      });
    });
    return map;
  }, [allAssignments]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const hasAssignments = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return !!scheduleMap[checkDate.toDateString()];
  };

  const getSelectedDateAssignments = (): ScheduleAssignment[] => {
    return scheduleMap[selectedDate.toDateString()] || [];
  };

  const statsArray = [
    { label: "Today's Tasks", value: isLoading ? "..." : stats.todaysTasks.toString(), color: "bg-brand-primary" },
    { label: "This Week", value: isLoading ? "..." : stats.thisWeek.toString(), color: "bg-blue-500" },
    { label: "This Month", value: isLoading ? "..." : stats.thisMonth.toString(), color: "bg-green-500" },
    { label: "Completed", value: isLoading ? "..." : stats.completed.toString(), color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Schedule</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View your cleaning assignments calendar
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsArray.map((stat, i) => (
          <div
            key={i}
            className={`${stat.color} text-white rounded-lg p-4 shadow dark:shadow-gray-900`}
          >
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-bold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}

            {[...Array(startingDayOfWeek)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const hasTask = hasAssignments(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-2 rounded-lg text-sm font-semibold transition-all relative ${
                    isSelected
                      ? "bg-brand-primary text-white"
                      : isToday
                      ? "bg-brand-primary/20 text-brand-primaryDark dark:text-brand-primary"
                      : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {day}
                  {hasTask && (
                    <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                      isSelected ? "bg-white" : "bg-brand-primary"
                    }`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </h2>
          </div>

          {isLoadingAssignments ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
          ) : getSelectedDateAssignments().length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm">No assignments scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getSelectedDateAssignments().map((assignment, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {assignment.haven}
                    </h3>
                    <span className={`text-xs font-bold ${assignment.statusColor}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{assignment.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{assignment.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  onNavigate?: (page: string) => void;
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
    };
  }, [assignments]);

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
  const selectedAssignments: any[] = selectedSchedule ? selectedSchedule.assignments : [];

  const statsCards = [
    { label: "Total",      value: stats.total,     color: "bg-brand-primary", icon: ClipboardList },
    { label: "This Week",  value: stats.thisWeek,  color: "bg-blue-500",      icon: Calendar      },
    { label: "This Month", value: stats.thisMonth, color: "bg-green-500",     icon: Building2     },
    { label: "Completed",  value: stats.completed, color: "bg-purple-500",    icon: CheckCircle2  },
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
        {statsCards.map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className={`${color} text-white rounded-lg p-4 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">{label}</p>
                <p className="text-2xl font-bold mt-1">{isLoading ? "…" : value}</p>
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
              const labels          = dateSchedule?.labels || {};
              const badge           = getStatusBadge(effectiveStatus);

              const isMiddleDay   = hasTask && dayType === "middle";
              const isCheckOutDay = hasTask && (dayType === "checkOut" || dayType === "both");

              const cellClasses = [
                "aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg relative group p-0.5",
                isSelected
                  ? "bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-xl ring-2 ring-white/50"
                  : isToday
                  ? ""
                  : hasTask
                  ? `bg-gradient-to-br ${badge.bg} ${badge.text} shadow-xl border-2 border-white/30 dark:border-gray-600/50`
                  : "bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
              ].filter(Boolean).join(" ");

              // Legend-matched colors: Middle=Staying orange dashed ALWAYS, others=status, checkout=emerald
              const cellStyle: React.CSSProperties =
                isSelected || isToday ? {} :
                isMiddleDay ? (
                  // Staying (middle) always orange dashed to match legend
                  { 
                    backgroundColor: "#ffedd5", 
                    color: "#ea580c", 
                    border: "1.5px dashed #fdba74" 
                  }
                ) :
                isCheckOutDay ? {
                  // Check out: emerald solid
                   backgroundColor: "#4f46e5",
                  border: "2px solid #86efac",
                  color: "#ffffff"
                } :
                hasTask ? getStatusBadge(effectiveStatus).bg.includes("indigo") ? {
                  // Assigned: indigo solid
                  backgroundColor: "#4f46e5",
                  border: "2px solid #86efac",
                  color: "#ffffff"
                } : getStatusBadge(effectiveStatus).bg.includes("orange") ? {
                  // Progress: orange solid  
                  backgroundColor: "#ffedd5",
                  color: "#ea580c"
                } : getStatusBadge(effectiveStatus).bg.includes("emerald") ? {
                  // Completed: emerald solid
                  backgroundColor: "#0f6237", 
                  color: "#ffffff"
                } : {} : {};

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={cellClasses}
                  style={cellStyle}
                  title={hasTask ? `${dayType} (${badge.label})` : ""}
                >
                  {hasTask && !isSelected && !isToday && (
                    <>
                      {labels.checkIn && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-lg border border-emerald-300/50 z-30 whitespace-nowrap">
                          Check In
                        </div>
                      )}
                      {labels.checkOut && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-2 py-0.5 rounded-lg text-xs font-bold shadow-lg border border-amber-300/50 z-30 whitespace-nowrap">
                          Check Out ✅
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm" />
                    </>
                  )}

                  <div className={`font-bold text-lg leading-tight ${isSelected || isToday ? "text-white" : ""}`}>
                    {day}
                  </div>
                  <div className={`text-sm font-semibold mt-1 leading-tight opacity-90 ${isSelected || isToday ? "text-white" : ""}`}>
                    {dayAbbr}
                  </div>

                  {hasTask && isSelected && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/80 rounded-full shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend - Updated with Guest Staying (Middle) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {/* Assigned */}
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm mx-auto" style={{ backgroundColor: "#6366f1" }} />
              <span className="font-medium">Assigned</span>
            </span>
            {/* In Progress */}

            {/* Completed */}
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm mx-auto" style={{ backgroundColor: "#10b981" }} />
              <span className="font-medium">Completed</span>
            </span>
            {/* Today */}
            <span className="flex flex-col items-center gap-0.5 sm:gap-1 text-center min-w-[44px]">
              <span className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-offset-1 ring-brand-primary/60 mx-auto" style={{ backgroundColor: "#833102" }} />
              <span className="font-medium">Today</span>
            </span>
            {/* NEW: Guest Staying / Middle */}
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
                const badge = getStatusBadge(a.cleaning_status);
                const isActionable = a.cleaning_status !== "cleaned" && a.cleaning_status !== "inspected";

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