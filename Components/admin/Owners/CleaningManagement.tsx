"use client";

import {
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  User,
  Eye,
  ClipboardList,
  Loader2,
  CheckCircle,
  Users,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  UserPlus,
  Clock,
  PlayCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGetCleaningTasksQuery } from "@/redux/api/cleanersApi";
// Import modals from admin Csr folder
import ViewBookings from "@/Components/admin/Csr/Modals/ViewBookings";
import AssignCleanerModal from "@/Components/admin/Csr/Modals/AssignCleanerModal";

type CleaningStatus = "Unassigned" | "Assigned" | "In Progress" | "Completed";

interface CleanerRow {
  cleaning_id: string;
  booking_id: string;
  haven: string;
  guest: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  cleaner_name: string;
  cleaner_id?: string;
  cleaning_time_in?: string;
  cleaning_time_out?: string;
  cleaned_at?: string;
  status: CleaningStatus;
  statusColor: string;
}

import { CleaningTask } from "@/redux/api/cleanersApi";

// Define the actual CleaningTask structure from API
interface ExtendedCleaningTask {
  cleaning_id: string;
  booking_id: string;
  haven: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  cleaner_first_name?: string;
  cleaner_last_name?: string;
  assigned_cleaner_id?: string | null;
  cleaning_status?:
    | "pending"
    | "assigned"
    | "in-progress"
    | "cleaned"
    | "inspected";
  cleaning_time_in?: string | null;
  cleaning_time_out?: string | null;
  cleaned_at?: string | null;
}

// Translation content for guides
const guideTranslations = {
  en: {
    statusGuide: {
      title: "Cleaning Status Guide",
      statuses: [
        {
          name: "Unassigned",
          description: "No cleaner has been assigned to this task yet",
        },
        {
          name: "Assigned",
          description: "A cleaner has been assigned and is scheduled to clean",
        },
        {
          name: "In Progress",
          description: "Cleaning is currently being performed",
        },
        {
          name: "Completed",
          description: "Room has been cleaned and is ready for inspection",
        },
      ],
    },
    cleaningGuide: {
      title: "How to Manage Cleaning Tasks",
      steps: [
        {
          title: "View Task Details",
          description:
            "Click the eye icon to view full booking and guest details",
        },
        {
          title: "Assign Cleaner",
          description:
            "Click the assign icon to assign a cleaner to unassigned tasks",
        },
        {
          title: "Track Progress",
          description: "Monitor the status as cleaners update their progress",
        },
        {
          title: "Verify Completion",
          description: "Review completed tasks and verify the room is ready",
        },
      ],
      workflowTitle: "Cleaning Workflow:",
      workflows: [
        {
          title: "Unassigned → Assigned",
          description: "Assign a cleaner to the task after guest check-out",
        },
        {
          title: "Assigned → In Progress",
          description: "Cleaner starts the cleaning process",
        },
        {
          title: "In Progress → Completed",
          description: "Cleaner finishes and marks task as done",
        },
        {
          title: "Completed → Ready",
          description: "Room is verified and ready for next guest",
        },
      ],
    },
  },
  fil: {
    statusGuide: {
      title: "Cleaning Status Guide",
      statuses: [
        {
          name: "Unassigned",
          description: "Wala pang cleaner na na-assign sa task na ito",
        },
        {
          name: "Assigned",
          description: "May cleaner na na-assign at naka-schedule na maglinis",
        },
        {
          name: "In Progress",
          description: "Kasalukuyang ginagawa ang paglilinis",
        },
        {
          name: "Completed",
          description: "Nalinis na ang room at ready na para sa inspection",
        },
      ],
    },
    cleaningGuide: {
      title: "Paano Mag-manage ng Cleaning Tasks",
      steps: [
        {
          title: "Tingnan ang Task Details",
          description:
            "I-click ang mata icon para makita ang buong booking at guest details",
        },
        {
          title: "Mag-assign ng Cleaner",
          description:
            "I-click ang assign icon para mag-assign ng cleaner sa unassigned tasks",
        },
        {
          title: "I-track ang Progress",
          description:
            "I-monitor ang status habang ina-update ng cleaners ang kanilang progress",
        },
        {
          title: "I-verify ang Completion",
          description:
            "I-review ang completed tasks at i-verify na ready na ang room",
        },
      ],
      workflowTitle: "Cleaning Workflow:",
      workflows: [
        {
          title: "Unassigned → Assigned",
          description:
            "Mag-assign ng cleaner sa task pagkatapos ng guest check-out",
        },
        {
          title: "Assigned → In Progress",
          description: "Magsisimula ang cleaner sa paglilinis",
        },
        {
          title: "In Progress → Completed",
          description: "Tapos na ang cleaner at minark na done ang task",
        },
        {
          title: "Completed → Ready",
          description:
            "Na-verify na ang room at ready na para sa susunod na guest",
        },
      ],
    },
  },
};

const skeletonPulse = "animate-pulse bg-gray-100 dark:bg-gray-700/60";

function mapCleaningStatus(
  cleaning_status?: ExtendedCleaningTask["cleaning_status"],
  assigned_cleaner_id?: string | null,
): {
  status: CleaningStatus;
  statusColor: string;
} {
  switch (cleaning_status) {
    case "assigned":
      return {
        status: "Assigned",
        statusColor:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      };
    case "in-progress":
      return {
        status: "In Progress",
        statusColor:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      };
    case "cleaned":
    case "inspected":
      return {
        status: "Completed",
        statusColor:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      };
    case "pending":
    default:
      return {
        status: "Unassigned",
        statusColor:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
      };
  }
}

// Format duration helper
function formatDuration(startTime: string | null | undefined): string {
  if (!startTime) return "-";
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return "-";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Highlight search term in text
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <span
        key={index}
        className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100 px-0.5 rounded"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function CleaningManagement() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | CleaningStatus>(
    "all",
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "checkin-today" | "checkout-today" | "custom"
  >("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof CleanerRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedBooking, setSelectedBooking] =
    useState<ExtendedCleaningTask | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [assignmentBookingId, setAssignmentBookingId] = useState<string | null>(
    null,
  );
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [showCleaningGuide, setShowCleaningGuide] = useState(false);
  const [guideLanguage, setGuideLanguage] = useState<"en" | "fil">("en");
  const [now, setNow] = useState(() => Date.now());

  // Update timer every minute for duration display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure component is mounted before making API calls
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const {
    data: cleaningTasks = [],
    isLoading,
    error,
    refetch,
  } = useGetCleaningTasksQuery(
    {},
    {
      pollingInterval: isMounted ? 10000 : 0,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: !isMounted,
    },
  ) as {
    data: ExtendedCleaningTask[];
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const rows: CleanerRow[] = useMemo(() => {
    if (!Array.isArray(cleaningTasks)) return [];

    return cleaningTasks
      .filter((task) => Boolean(task?.cleaning_id))
      .map((task) => {
        const guestName =
          `${task.guest_first_name ?? ""} ${task.guest_last_name ?? ""}`.trim() ||
          "Guest";

        // Format dates properly
        const formatDateTime = (date: string, time: string) => {
          if (!date && !time) return "Not specified";
          try {
            const dateStr = date
              ? new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";
            const timeStr = time
              ? new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            return `${dateStr} ${timeStr}`.trim() || "Not specified";
          } catch (error) {
            return "Invalid date";
          }
        };

        const checkIn = formatDateTime(
          task.check_in_date,
          task.check_in_time || "",
        );
        const checkOut = formatDateTime(
          task.check_out_date,
          task.check_out_time || "",
        );
        const { status, statusColor } = mapCleaningStatus(
          task.cleaning_status,
          task.assigned_cleaner_id,
        );

        const cleanerName =
          task.cleaner_first_name && task.cleaner_last_name
            ? `${task.cleaner_first_name} ${task.cleaner_last_name}`
            : "Unassigned";

        return {
          cleaning_id: task.cleaning_id || "",
          booking_id: task.booking_id || "",
          haven: task.haven || "Unknown",
          guest: guestName,
          guest_email: task.guest_email,
          guest_phone: task.guest_phone,
          check_in: checkIn,
          check_out: checkOut,
          cleaner_name: cleanerName,
          cleaner_id: task.assigned_cleaner_id ?? undefined,
          cleaning_time_in: task.cleaning_time_in ?? undefined,
          cleaning_time_out: task.cleaning_time_out ?? undefined,
          cleaned_at: task.cleaned_at ?? undefined,
          status,
          statusColor,
        };
      });
  }, [cleaningTasks]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        row.booking_id.toLowerCase().includes(term) ||
        row.guest.toLowerCase().includes(term) ||
        row.haven.toLowerCase().includes(term) ||
        row.cleaner_name.toLowerCase().includes(term);

      const matchesFilter =
        filterStatus === "all" || row.status === filterStatus;

      // Date filtering logic
      let matchesDateFilter = true;
      if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const originalTask = cleaningTasks.find(
          (task) => task.cleaning_id === row.cleaning_id,
        );

        if (originalTask) {
          switch (dateFilter) {
            case "checkin-today":
              if (originalTask.check_in_date) {
                const checkInDate = new Date(originalTask.check_in_date);
                checkInDate.setHours(0, 0, 0, 0);
                matchesDateFilter = checkInDate.getTime() === today.getTime();
              } else {
                matchesDateFilter = false;
              }
              break;
            case "checkout-today":
              if (originalTask.check_out_date) {
                const checkOutDate = new Date(originalTask.check_out_date);
                checkOutDate.setHours(0, 0, 0, 0);
                matchesDateFilter = checkOutDate.getTime() === today.getTime();
              } else {
                matchesDateFilter = false;
              }
              break;
            case "custom":
              if (
                customStartDate &&
                customEndDate &&
                originalTask.check_out_date
              ) {
                const checkOutDate = new Date(originalTask.check_out_date);
                checkOutDate.setHours(0, 0, 0, 0);
                const startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(customEndDate);
                endDate.setHours(23, 59, 59, 999);
                matchesDateFilter =
                  checkOutDate >= startDate && checkOutDate <= endDate;
              } else {
                matchesDateFilter = false;
              }
              break;
          }
        } else {
          matchesDateFilter = false;
        }
      }

      return matchesSearch && matchesFilter && matchesDateFilter;
    });
  }, [
    rows,
    searchTerm,
    filterStatus,
    dateFilter,
    customStartDate,
    customEndDate,
    cleaningTasks,
  ]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentRows = sortedRows.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, dateFilter]);

  const handleSort = (field: keyof CleanerRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewBooking = (bookingId: string) => {
    const task = cleaningTasks.find((t) => t.booking_id === bookingId);
    if (task) {
      setSelectedBooking(task);
      setIsViewModalOpen(true);
    }
  };

  const handleAssignCleaner = (bookingId: string) => {
    setAssignmentBookingId(bookingId);
    setIsAssignModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedBooking(null);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignmentBookingId(null);
  };

  const handleAssignmentSuccess = () => {
    // Refetch to update data
  };

  const totalCount = rows.length;
  const unassignedCount = rows.filter((r) => r.status === "Unassigned").length;
  const assignedCount = rows.filter((r) => r.status === "Assigned").length;
  const inProgressCount = rows.filter((r) => r.status === "In Progress").length;
  const completedCount = rows.filter((r) => r.status === "Completed").length;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Cleaning Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Assign and track post check-out cleaning tasks
            </p>
          </div>
        </div>

        {/* Status Guide */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowStatusGuide(!showStatusGuide)}
              className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {guideTranslations[guideLanguage].statusGuide.title}
              </h4>
              <ChevronRight
                className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showStatusGuide ? "rotate-90" : ""}`}
              />
            </button>
            <div className="flex gap-1 ml-2">
              {(["en", "fil"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setGuideLanguage(lang)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    guideLanguage === lang
                      ? "bg-brand-primary text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {lang === "en" ? "EN" : "FIL"}
                </button>
              ))}
            </div>
          </div>

          {showStatusGuide && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {guideTranslations[guideLanguage].statusGuide.statuses.map(
                (status, idx) => {
                  const statusColors: Record<string, { dot: string }> = {
                    Unassigned: { dot: "bg-gray-500" },
                    Assigned: { dot: "bg-indigo-500" },
                    "In Progress": { dot: "bg-yellow-500" },
                    Completed: { dot: "bg-green-500" },
                  };
                  const color = statusColors[status.name] || {
                    dot: "bg-gray-500",
                  };

                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 ${color.dot} rounded-full mt-1 flex-shrink-0`}
                      ></div>
                      <div>
                        <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {status.name}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {status.description}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>

        {/* How to Manage Cleaning Tasks Guide */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowCleaningGuide(!showCleaningGuide)}
              className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {guideTranslations[guideLanguage].cleaningGuide.title}
              </h4>
              <ChevronRight
                className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showCleaningGuide ? "rotate-90" : ""}`}
              />
            </button>
            <div className="flex gap-1 ml-2">
              {(["en", "fil"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setGuideLanguage(lang)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    guideLanguage === lang
                      ? "bg-brand-primary text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {lang === "en" ? "EN" : "FIL"}
                </button>
              ))}
            </div>
          </div>

          {showCleaningGuide && (
            <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {guideTranslations[guideLanguage].cleaningGuide.steps.map(
                  (step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {step.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">
                  {guideTranslations[guideLanguage].cleaningGuide.workflowTitle}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                  {guideTranslations[guideLanguage].cleaningGuide.workflows.map(
                    (workflow, idx) => {
                      const getWorkflowIcon = (title: string) => {
                        if (title.includes("Unassigned"))
                          return {
                            Icon: Users,
                            color: "text-gray-600 dark:text-gray-400",
                          };
                        if (title.includes("Assigned"))
                          return {
                            Icon: ClipboardList,
                            color: "text-indigo-600 dark:text-indigo-400",
                          };
                        if (title.includes("In Progress"))
                          return {
                            Icon: PlayCircle,
                            color: "text-yellow-600 dark:text-yellow-400",
                          };
                        return {
                          Icon: CheckCircle,
                          color: "text-green-600 dark:text-green-400",
                        };
                      };
                      const iconData = getWorkflowIcon(workflow.title);

                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <iconData.Icon
                            className={`w-4 h-4 ${iconData.color} flex-shrink-0 mt-0.5`}
                          />
                          <span>
                            <strong>{workflow.title}:</strong>{" "}
                            {workflow.description}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-shrink-0">
          {[
            {
              label: "Total Tasks",
              value: String(totalCount),
              color: "bg-orange-500",
              icon: Sparkles,
            },
            {
              label: "Unassigned",
              value: String(unassignedCount),
              color: "bg-gray-500",
              icon: Users,
            },
            {
              label: "Assigned",
              value: String(assignedCount),
              color: "bg-indigo-500",
              icon: ClipboardList,
            },
            {
              label: "In Progress",
              value: String(inProgressCount),
              color: "bg-yellow-500",
              icon: Clock,
            },
            {
              label: "Completed",
              value: String(completedCount),
              color: "bg-green-500",
              icon: CheckCircle,
            },
          ].map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={i}
                className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{stat.label}</p>
                    <div className="text-3xl font-bold mt-2">
                      {isLoading ? (
                        <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </div>
                  </div>
                  <IconComponent className="w-12 h-12 opacity-50" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  Show
                </label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  entries
                </label>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by booking ID, guest, haven, or cleaner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  const value = e.target.value;
                  if (
                    value === "all" ||
                    [
                      "Unassigned",
                      "Assigned",
                      "In Progress",
                      "Completed",
                    ].includes(value)
                  ) {
                    setFilterStatus(value as "all" | CleaningStatus);
                  }
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="Unassigned">Unassigned</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => {
                  const value = e.target.value as
                    | "all"
                    | "checkin-today"
                    | "checkout-today"
                    | "custom";
                  setDateFilter(value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
              >
                <option value="all">All Dates</option>
                <option value="checkin-today">Check-in Today</option>
                <option value="checkout-today">Check-out Today</option>
                <option value="custom">Custom Range</option>
              </select>

              {/* Custom Date Range Inputs */}
              {dateFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                    placeholder="Start date"
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                    placeholder="End date"
                  />
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh Data"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isRefreshing || isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Loading cleaning tasks...
            </p>
          </div>
        )}

        {/* Table Section - Compact Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
                <tr>
                  <th
                    onClick={() => handleSort("booking_id")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      Booking ID
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("haven")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      Haven & Guest
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("check_out")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      Check-in / Check-out
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("cleaner_name")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      Assigned Cleaner
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className={`h-4 rounded ${skeletonPulse}`}></div>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className={`h-4 rounded ${skeletonPulse}`}></div>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className={`h-4 rounded ${skeletonPulse}`}></div>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className={`h-4 rounded ${skeletonPulse}`}></div>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className={`h-4 rounded ${skeletonPulse}`}></div>
                      </td>
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className={`h-4 rounded ${skeletonPulse}`}></div>
                      </td>
                    </tr>
                  ))
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">No cleaning tasks found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRows.map((row) => (
                    <tr
                      key={row.cleaning_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Booking ID */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {highlightText(row.booking_id, searchTerm)}
                        </span>
                      </td>

                      {/* Haven & Guest */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {highlightText(row.haven, searchTerm)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {highlightText(row.guest, searchTerm)}
                            </div>
                          </div>
                          {row.guest_email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              {row.guest_email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Check-in / Check-out */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-gray-600 dark:text-gray-400">
                              In:
                            </span>
                            <span className="font-medium text-green-700 dark:text-green-300">
                              {row.check_in}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="text-gray-600 dark:text-gray-400">
                              Out:
                            </span>
                            <span className="font-medium text-red-700 dark:text-red-300">
                              {row.check_out}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Cleaner */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span
                              className={`text-sm font-medium ${
                                row.cleaner_name === "Unassigned"
                                  ? "text-gray-400 dark:text-gray-500 italic"
                                  : "text-gray-800 dark:text-gray-100"
                              }`}
                            >
                              {highlightText(row.cleaner_name, searchTerm)}
                            </span>
                          </div>
                          {row.cleaning_time_in && (
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              Started:{" "}
                              {new Date(
                                row.cleaning_time_in,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                          {row.cleaning_time_in &&
                            !row.cleaning_time_out &&
                            row.status === "In Progress" && (
                              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                                <Calendar className="w-3 h-3" />
                                Duration: {formatDuration(row.cleaning_time_in)}
                              </div>
                            )}
                          {row.cleaned_at && (
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Completed:{" "}
                              {new Date(row.cleaned_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${row.statusColor}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewBooking(row.booking_id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {row.status === "Unassigned" && (
                            <button
                              onClick={() =>
                                handleAssignCleaner(row.booking_id)
                              }
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Assign cleaner"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(endIndex, sortedRows.length)} of {sortedRows.length}{" "}
                entries
                {(searchTerm ||
                  filterStatus !== "all" ||
                  dateFilter !== "all") &&
                  ` (filtered from ${rows.length} total)`}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 border rounded transition-colors ${
                        currentPage === pageNum
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isViewModalOpen && selectedBooking && (
        <ViewBookings
          booking={selectedBooking as any}
          onClose={handleCloseModal}
        />
      )}

      {assignmentBookingId && (
        <AssignCleanerModal
          isOpen={isAssignModalOpen}
          onClose={handleCloseAssignModal}
          bookingId={assignmentBookingId}
          onSuccess={handleAssignmentSuccess}
          currentUserId={session?.user?.id}
        />
      )}
    </>
  );
}
