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
