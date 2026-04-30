"use client";

import { ClipboardList, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useGetCleaningTasksQuery } from "@/redux/api/cleanersApi";

interface AssignmentStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

function getStatusBadge(cleaningStatus: string): { label: string; bgColor: string; textColor: string } {
  switch (cleaningStatus) {
    case "in-progress":
      return { label: "In Progress", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", textColor: "text-yellow-700 dark:text-yellow-300" };
    case "cleaned":
      return { label: "Completed", bgColor: "bg-green-100 dark:bg-green-900/30", textColor: "text-green-700 dark:text-green-300" };
    case "inspected":
      return { label: "Inspected", bgColor: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-700 dark:text-blue-300" };
    case "assigned":
      return { label: "Assigned", bgColor: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-700 dark:text-purple-300" };
    case "pending":
    default:
      return { label: "Pending", bgColor: "bg-gray-100 dark:bg-gray-700/30", textColor: "text-gray-700 dark:text-gray-300" };
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateString;
  }
}

function formatTime(timeString: string | null): string {
  if (!timeString) return "—";
  return timeString.substring(0, 5);
}

export default function MyAssignmentPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const { data: allTasks = [], isLoading: isLoadingAssignments } = useGetCleaningTasksQuery(undefined);

  const assignments = useMemo(() => {
    if (!userId) return [];
    return allTasks.filter((t: any) => String(t.assigned_cleaner_id ?? "") === String(userId));
  }, [allTasks, userId]);

  const stats = useMemo<AssignmentStats>(() => {
    if (!assignments.length) return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    return {
      total: assignments.length,
      completed: assignments.filter((a: any) => a.cleaning_status === "cleaned" || a.cleaning_status === "inspected").length,
      inProgress: assignments.filter((a: any) => a.cleaning_status === "in-progress").length,
      pending: assignments.filter((a: any) => a.cleaning_status === "pending" || a.cleaning_status === "assigned").length,
    };
  }, [assignments]);

  const statsArray = [
    {
      label: "Total Assignments",
      value: isLoadingAssignments ? "..." : stats.total.toString(),
      color: "bg-brand-primary",
      icon: ClipboardList,
    },
    {
      label: "Completed",
      value: isLoadingAssignments ? "..." : stats.completed.toString(),
      color: "bg-green-500",
      icon: CheckCircle2,
    },
    {
      label: "In Progress",
      value: isLoadingAssignments ? "..." : stats.inProgress.toString(),
      color: "bg-yellow-500",
      icon: Clock,
    },
    {
      label: "Pending",
      value: isLoadingAssignments ? "..." : stats.pending.toString(),
      color: "bg-orange-500",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Assignments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage all your assigned cleaning tasks
        </p>
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Haven</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Location</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Checkout Date</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Checkout Time</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Time In</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Time Out</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAssignments ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border border-gray-200 dark:border-gray-700 animate-pulse">
                    {[...Array(7)].map((__, i) => (
                      <td key={i} className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No assignments assigned to you yet</p>
                  </td>
                </tr>
              ) : (
                assignments.map((assignment: any) => {
                  const statusBadge = getStatusBadge(assignment.cleaning_status);
                  return (
                    <tr key={assignment.cleaning_id ?? assignment.id} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {assignment.haven ?? assignment.room_name ?? "—"}
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                        {assignment.location || "Location TBD"}
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                        {formatDate(assignment.check_out_date)}
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
                        {formatTime(assignment.check_out_time)}
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bgColor} ${statusBadge.textColor} inline-block`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                        {formatTime(assignment.cleaning_time_in)}
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                        {formatTime(assignment.cleaning_time_out)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
