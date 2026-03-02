"use client";

import { ClipboardList, CheckCircle2, Clock, AlertCircle, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useGetTodaysAssignmentsQuery } from "@/redux/api/cleanersApi";

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

  // Pagination and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: assignments = [], isLoading: isLoadingAssignments } = useGetTodaysAssignmentsQuery(
    userId || "",
    { skip: !userId }
  );

  const stats = useMemo<AssignmentStats>(() => {
    if (!assignments.length) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0 };
    }

    return {
      total: assignments.length,
      completed: assignments.filter((a) => a.cleaning_status === "cleaned" || a.cleaning_status === "inspected").length,
      inProgress: assignments.filter((a) => a.cleaning_status === "in-progress").length,
      pending: assignments.filter((a) => a.cleaning_status === "pending" || a.cleaning_status === "assigned").length,
    };
  }, [assignments]);

  // Filter and search logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        assignment.haven.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.booking_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === "all" || assignment.cleaning_status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchTerm, filterStatus]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssignments.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</label>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by haven, location, or booking ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="cleaned">Completed</option>
              <option value="inspected">Inspected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto overflow-y-auto flex-1 max-h-[600px]">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Haven</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Location</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Checkout Date</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Checkout Time</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Status</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Time In</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Time Out</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAssignments ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border border-gray-200 dark:border-gray-700 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                      <td key={i} className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      {assignments.length === 0 ? "No assignments assigned to you yet" : "No assignments match your search"}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAssignments.map((assignment) => {
                  const statusBadge = getStatusBadge(assignment.cleaning_status);
                  return (
                    <tr key={assignment.cleaning_id} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {assignment.haven}
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
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700 text-center">
                        <button className="inline-flex items-center px-3 py-1 text-xs font-semibold text-brand-primary hover:text-brand-primaryDark dark:text-brand-primary dark:hover:text-brand-primaryDark transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoadingAssignments && filteredAssignments.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, filteredAssignments.length)}</span> of <span className="font-semibold">{filteredAssignments.length}</span> assignments
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, currentPage - 2), Math.min(totalPages, currentPage + 2))
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-brand-primary text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
