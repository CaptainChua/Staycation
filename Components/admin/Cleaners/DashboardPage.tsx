"use client";

import { ClipboardList, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface DashboardStats {
  todaysTasks: number;
  completed: number;
  inProgress: number;
  pending: number;
}

interface TodayAssignment {
  cleaning_id: string;
  haven: string;
  cleaning_status: string;
  check_out_time: string | null;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "cleaned":
    case "inspected":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "assigned":
    case "pending":
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
    default:
      return "text-orange-600";
  }
}

function formatCheckoutTime(time: string | null): string {
  if (!time) return "—";
  return time.substring(0, 5);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    todaysTasks: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [todayAssignments, setTodayAssignments] = useState<TodayAssignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/cleaners/${session.user.id}/dashboard-stats`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();
        if (payload.success && payload.data) {
          setStats(payload.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTodayAssignments = async () => {
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
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const todayOnly = payload.data.filter(
            (t: any) => String(t.check_out_date ?? "").slice(0, 10) === todayStr
          );
          setTodayAssignments(todayOnly);
        }
      } catch (error) {
        console.error("Error fetching today assignments:", error);
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchStats();
    fetchTodayAssignments();
  }, [session?.user?.id]);

  const statsArray = [
    {
      label: "Today's Tasks",
      value: isLoading ? "..." : stats.todaysTasks.toString(),
      color: "bg-blue-500",
      icon: ClipboardList,
    },
    {
      label: "Completed",
      value: isLoading ? "..." : stats.completed.toString(),
      color: "bg-green-500",
      icon: CheckCircle,
    },
    {
      label: "In Progress",
      value: isLoading ? "..." : stats.inProgress.toString(),
      color: "bg-yellow-500",
      icon: Clock,
    },
    {
      label: "Pending",
      value: isLoading ? "..." : stats.pending.toString(),
      color: "bg-orange-500",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Overview of your daily cleaning tasks and performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsArray.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Today&apos;s Schedule
        </h2>
        <div className="space-y-3">
          {isLoadingAssignments ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))
          ) : todayAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No assignments scheduled for today
            </div>
          ) : (
            todayAssignments.map((task) => (
              <div
                key={task.cleaning_id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{task.haven}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formatCheckoutTime(task.check_out_time)}</span>
                  <span className={`text-sm font-bold ${getStatusColor(task.cleaning_status)}`}>
                    {getStatusLabel(task.cleaning_status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
