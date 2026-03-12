"use client";

import { ClipboardList, MapPin, Clock, AlertCircle, CheckCircle2, Flag } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

    fetchStats();
  }, [session?.user?.id]);
  const router = useRouter();

  const [assignments, setAssignments] = useState([
    {
      id: 1,
      haven: "Haven 3",
      location: "Building A, Floor 2",
      status: "In Progress",
      deadline: "Today, 2:00 PM",
      priority: "High",
      statusColor: "text-yellow-600",
      priorityColor: "text-red-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      id: 2,
      haven: "Haven 7",
      location: "Building B, Floor 1",
      status: "Pending",
      deadline: "Today, 4:00 PM",
      priority: "Medium",
      statusColor: "text-orange-600",
      priorityColor: "text-yellow-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      id: 3,
      haven: "Haven 12",
      location: "Building A, Floor 3",
      status: "Not Started",
      deadline: "Today, 5:30 PM",
      priority: "Low",
      statusColor: "text-gray-600",
      priorityColor: "text-blue-600",
      bgColor: "bg-gray-50 dark:bg-gray-700",
    },
    {
      id: 4,
      haven: "Haven 15",
      location: "Building C, Floor 2",
      status: "Completed",
      deadline: "Today, 12:00 PM",
      priority: "High",
      statusColor: "text-green-600",
      priorityColor: "text-red-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
  ]);

  const handleStartTask = async (id: number) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: "In Progress", statusColor: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" }
          : a
      )
    );
    try {
      console.log(`Starting task ${id}`);
      // TODO: call backend API to start task
    } catch (err) {
      console.error(err);
    }
  };

  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (id: number) => {
    const found = assignments.find((a) => a.id === id) || null;
    setSelectedAssignment(found);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  };

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

      {/* Assignments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Today&apos;s Assignments
        </h2>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`${assignment.bgColor} rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all pointer-events-auto`}
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

              <div className="mt-4 flex gap-2">
                {assignment.status !== "Completed" && (
                  <>
                    <button
                      onClick={() => handleStartTask(assignment.id)}
                      className="relative z-10 pointer-events-auto bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Start Task
                    </button>
                    <button
                      onClick={() => handleViewDetails(assignment.id)}
                      className="relative z-10 pointer-events-auto bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      View Details
                    </button>
                  </>
                )}
                {assignment.status === "Completed" && (
                  <button
                    onClick={() => handleViewDetails(assignment.id)}
                    className="relative z-10 pointer-events-auto bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    View Report
                  </button>
                )}
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
        {isModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={closeModal}></div>
            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 pointer-events-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedAssignment.haven}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedAssignment.location}</p>
                </div>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">Close</button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                <div>
                  <strong>Status:</strong> <span className={`${selectedAssignment.statusColor}`}>{selectedAssignment.status}</span>
                </div>
                <div>
                  <strong>Deadline:</strong> {selectedAssignment.deadline}
                </div>
                <div>
                  <strong>Priority:</strong> <span className={`${selectedAssignment.priorityColor}`}>{selectedAssignment.priority}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {selectedAssignment.status !== "Completed" && (
                  <button
                    onClick={() => {
                      handleStartTask(selectedAssignment.id);
                      closeModal();
                    }}
                    className="bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Start Task
                  </button>
                )}
                <button onClick={closeModal} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
