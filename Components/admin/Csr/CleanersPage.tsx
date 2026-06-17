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
  HelpCircle,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGetCleaningTasksQuery, CleaningTask } from "@/redux/api/cleanersApi";
import ViewBookings from "./Modals/ViewBookings";
import AssignCleanerModal from "./Modals/AssignCleanerModal";

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

// Translation content for guides
const guideTranslations = {
  en: {
    statusGuide: {
      title: "Cleaning Status Guide",
      statuses: [
        {
          name: "Unassigned",
          description: "No cleaner has been assigned to this task yet"
        },
        {
          name: "Assigned",
          description: "A cleaner has been assigned and is scheduled to clean"
        },
        {
          name: "In Progress",
          description: "Cleaning is currently being performed"
        },
        {
          name: "Completed",
          description: "Room has been cleaned and is ready for inspection"
        }
      ]
    },
    cleaningGuide: {
      title: "How to Manage Cleaning Tasks",
      steps: [
        {
          title: "View Task Details",
          description: "Click the eye icon to view full booking and guest details"
        },
        {
          title: "Assign Cleaner",
          description: "Click the assign icon to assign a cleaner to unassigned tasks"
        },
        {
          title: "Track Progress",
          description: "Monitor the status as cleaners update their progress"
        },
        {
          title: "Verify Completion",
          description: "Review completed tasks and verify the room is ready"
        }
      ],
      workflowTitle: "Cleaning Workflow:",
      workflows: [
        {
          title: "Unassigned → Assigned",
          description: "Assign a cleaner to the task after guest check-out"
        },
        {
          title: "Assigned → In Progress",
          description: "Cleaner starts the cleaning process"
        },
        {
          title: "In Progress → Completed",
          description: "Cleaner finishes and marks task as done"
        },
        {
          title: "Completed → Ready",
          description: "Room is verified and ready for next guest"
        }
      ]
    }
  },
  fil: {
    statusGuide: {
      title: "Cleaning Status Guide",
      statuses: [
        {
          name: "Unassigned",
          description: "Wala pang cleaner na na-assign sa task na ito"
        },
        {
          name: "Assigned",
          description: "May cleaner na na-assign at naka-schedule na maglinis"
        },
        {
          name: "In Progress",
          description: "Kasalukuyang ginagawa ang paglilinis"
        },
        {
          name: "Completed",
          description: "Nalinis na ang room at ready na para sa inspection"
        }
      ]
    },
    cleaningGuide: {
      title: "Paano Mag-manage ng Cleaning Tasks",
      steps: [
        {
          title: "Tingnan ang Task Details",
          description: "I-click ang mata icon para makita ang buong booking at guest details"
        },
        {
          title: "Mag-assign ng Cleaner",
          description: "I-click ang assign icon para mag-assign ng cleaner sa unassigned tasks"
        },
        {
          title: "I-track ang Progress",
          description: "I-monitor ang status habang ina-update ng cleaners ang kanilang progress"
        },
        {
          title: "I-verify ang Completion",
          description: "I-review ang completed tasks at i-verify na ready na ang room"
        }
      ],
      workflowTitle: "Cleaning Workflow:",
      workflows: [
        {
          title: "Unassigned → Assigned",
          description: "Mag-assign ng cleaner sa task pagkatapos ng guest check-out"
        },
        {
          title: "Assigned → In Progress",
          description: "Magsisimula ang cleaner sa paglilinis"
        },
        {
          title: "In Progress → Completed",
          description: "Tapos na ang cleaner at minark na done ang task"
        },
        {
          title: "Completed → Ready",
          description: "Na-verify na ang room at ready na para sa susunod na guest"
        }
      ]
    }
  }
};

const skeletonPulse = "animate-pulse bg-gray-100 dark:bg-gray-700/60";

function mapCleaningStatus(
  cleaning_status?: CleaningTask["cleaning_status"],
  assigned_cleaner_id?: string | null
): {
  status: CleaningStatus;
  statusColor: string;
} {
  switch (cleaning_status) {
    case "assigned":
      return { status: "Assigned", statusColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" };
    case "in-progress":
      return { status: "In Progress", statusColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" };
    case "cleaned":
    case "inspected":
      return { status: "Completed", statusColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" };
    case "pending":
    default:
      return {
        status: "Unassigned",
        statusColor: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
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
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-gray-900 dark:text-gray-100 px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function CleanersPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | CleaningStatus>("all");
  const [selectedHaven, setSelectedHaven] = useState("all");
  const [checkInDateFrom, setCheckInDateFrom] = useState("");
  const [checkInDateTo, setCheckInDateTo] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "checkin-today" | "checkout-today" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof CleanerRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedBooking, setSelectedBooking] = useState<CleaningTask | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [assignmentBookingId, setAssignmentBookingId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showGuideDrawer, setShowGuideDrawer] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<"status" | "manage">("status");
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
      pollingInterval: isMounted ? 10000 : 0, // Only poll when mounted
      skipPollingIfUnfocused: true,
      refetchOnFocus: true, // Enable refetch on focus for better refresh
      refetchOnReconnect: true,
      skip: !isMounted, // Skip query until component is mounted
    }
  ) as {
    data: CleaningTask[];
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
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const rows: CleanerRow[] = useMemo(() => {
    if (!Array.isArray(cleaningTasks)) return [];

    return cleaningTasks
      .filter((task) => Boolean(task?.cleaning_id))
      .map((task) => {
        const guestName = `${task.guest_first_name ?? ""} ${task.guest_last_name ?? ""}`.trim() || "Guest";
        
        // Format dates properly - only show date and time, not ISO format
        const formatDateTime = (date: string, time: string) => {
          if (!date && !time) return "Not specified";
          try {
            const dateStr = date ? new Date(date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }) : '';
            const timeStr = time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '';
            return `${dateStr} ${timeStr}`.trim() || "Not specified";
          } catch (error) {
            return "Invalid date";
          }
        };
        
        const checkIn = formatDateTime(task.check_in_date, task.check_in_time);
        const checkOut = formatDateTime(task.check_out_date, task.check_out_time);
        const { status, statusColor } = mapCleaningStatus(task.cleaning_status, task.assigned_cleaner_id);

        const cleanerName = task.cleaner_first_name && task.cleaner_last_name
          ? `${task.cleaner_first_name} ${task.cleaner_last_name}`
          : "Unassigned";

        return {
          cleaning_id: task.cleaning_id,
          booking_id: task.booking_id,
          haven: task.haven,
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

  const uniqueHavens = useMemo(() => {
    const names = rows.map((r) => r.haven).filter((n): n is string => Boolean(n));
    return [...new Set(names)].sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        row.booking_id.toLowerCase().includes(term) ||
        row.guest.toLowerCase().includes(term) ||
        row.haven.toLowerCase().includes(term) ||
        row.cleaner_name.toLowerCase().includes(term);

      const matchesFilter = filterStatus === "all" || row.status === filterStatus;

      const matchesHaven = selectedHaven === "all" || (row.haven || "") === selectedHaven;

      // Check-in date range filter (uses original task's raw check_in_date)
      let matchesCheckIn = true;
      if (checkInDateFrom || checkInDateTo) {
        const originalTask = cleaningTasks.find(task => task.cleaning_id === row.cleaning_id);
        const checkIn = originalTask?.check_in_date ? new Date(originalTask.check_in_date) : null;
        if (checkIn) {
          checkIn.setHours(0, 0, 0, 0);
          if (checkInDateFrom) {
            const from = new Date(checkInDateFrom); from.setHours(0, 0, 0, 0);
            if (checkIn < from) matchesCheckIn = false;
          }
          if (checkInDateTo) {
            const to = new Date(checkInDateTo); to.setHours(23, 59, 59, 999);
            if (checkIn > to) matchesCheckIn = false;
          }
        } else {
          matchesCheckIn = false;
        }
      }

      // Date filtering logic
      let matchesDateFilter = true;
      if (dateFilter !== "all") {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day

        // Find the original task to get the raw dates
        const originalTask = cleaningTasks.find(task => task.cleaning_id === row.cleaning_id);

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
              if (customStartDate && customEndDate && originalTask.check_out_date) {
                const taskDate = new Date(originalTask.check_out_date);
                const startDate = new Date(customStartDate);
                const endDate = new Date(customEndDate);
                endDate.setHours(23, 59, 59, 999); // Include end date
                matchesDateFilter = taskDate >= startDate && taskDate <= endDate;
              } else {
                matchesDateFilter = false;
              }
              break;
          }
        } else {
          matchesDateFilter = false;
        }
      }

      return matchesSearch && matchesFilter && matchesHaven && matchesCheckIn && matchesDateFilter;
    });
  }, [filterStatus, rows, searchTerm, dateFilter, customStartDate, customEndDate, cleaningTasks, selectedHaven, checkInDateFrom, checkInDateTo]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      const aSortable = String(a[sortField] ?? "").toLowerCase();
      const bSortable = String(b[sortField] ?? "").toLowerCase();
      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof CleanerRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewBooking = (bookingId: string) => {
    if (!Array.isArray(cleaningTasks)) return;
    const task = (cleaningTasks as CleaningTask[]).find(
      (task) => task.booking_id === bookingId
    );
    if (task) {
      setSelectedBooking(task as any);
      setIsViewModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedBooking(null);
  };

  const handleAssignCleaner = (bookingId: string) => {
    setAssignmentBookingId(bookingId);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignmentBookingId(null);
  };

  const handleAssignmentSuccess = () => {
    refetch();
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cleaners Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign and track post check-out cleaning tasks</p>
          </div>
          <button
            onClick={() => setShowGuideDrawer(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm whitespace-nowrap"
            title="Open help & guides"
          >
            <HelpCircle className="w-4 h-4" />
            Help &amp; Guides
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-shrink-0">
          {[
            { label: "Total Tasks", value: String(totalCount), color: "bg-orange-500", icon: Sparkles },
            { label: "Unassigned", value: String(unassignedCount), color: "bg-gray-500", icon: Users },
            { label: "Assigned", value: String(assignedCount), color: "bg-indigo-500", icon: ClipboardList },
            { label: "In Progress", value: String(inProgressCount), color: "bg-yellow-500", icon: Clock },
            { label: "Completed", value: String(completedCount), color: "bg-green-500", icon: CheckCircle },
          ].map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={i}
                className={`${stat.color} text-white rounded-lg p-5 shadow dark:shadow-gray-900 hover:shadow-lg transition-transform duration-200 transform hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm opacity-90 leading-snug">{stat.label}</p>
                    <div className="text-3xl font-bold mt-2">
                      {isLoading ? (
                        <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </div>
                  </div>
                  <IconComponent className="w-10 h-10 opacity-50 flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 space-y-3">
          {/* Top row: Show + Search + Refresh */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Entries per page"
                title="Entries per page"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</label>
            </div>

            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by booking ID, guest, haven, or cleaner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search cleaning tasks"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh Data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${(isRefreshing || isLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Bottom row: Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all" || ["Unassigned", "Assigned", "In Progress", "Completed"].includes(value)) {
                  setFilterStatus(value as "all" | CleaningStatus);
                }
                setCurrentPage(1);
              }}
              aria-label="Filter by cleaning status"
              title="Filter by cleaning status"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="Unassigned">Unassigned</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Haven filter */}
            <select
              value={selectedHaven}
              onChange={(e) => {
                setSelectedHaven(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by haven"
              title="Filter by haven"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
            >
              <option value="all">All Havens</option>
              {uniqueHavens.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Check-in date range */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Check-in:</span>
              <input
                type="date"
                value={checkInDateFrom}
                onChange={(e) => { setCheckInDateFrom(e.target.value); setCurrentPage(1); }}
                aria-label="Check-in date from"
                title="Check-in date from"
                className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
              />
              <span className="text-gray-400 text-xs">–</span>
              <input
                type="date"
                value={checkInDateTo}
                min={checkInDateFrom}
                onChange={(e) => { setCheckInDateTo(e.target.value); setCurrentPage(1); }}
                aria-label="Check-in date to"
                title="Check-in date to"
                className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
              />
              {(checkInDateFrom || checkInDateTo) && (
                <button
                  type="button"
                  onClick={() => { setCheckInDateFrom(""); setCheckInDateTo(""); setCurrentPage(1); }}
                  aria-label="Clear check-in dates"
                  title="Clear dates"
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                const value = e.target.value as "all" | "checkin-today" | "checkout-today" | "custom";
                setDateFilter(value);
                setCurrentPage(1);
              }}
              aria-label="Filter by date"
              title="Filter by date"
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
                  aria-label="Custom start date"
                  title="Custom start date"
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
                  aria-label="Custom end date"
                  title="Custom end date"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                  placeholder="End date"
                />
              </div>
            )}
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
            <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Loading cleaning tasks...</p>
          </div>
        )}

        {/* Table Section - Compact Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
          <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 overflow-hidden p-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: Math.min(entriesPerPage, 5) }).map((_, i) => (
                  <div
                    key={`cleaners-mobile-skeleton-${i}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
                  >
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-44" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="mt-3 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-20 text-center border border-gray-200 dark:border-gray-700 rounded-lg">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Failed to load cleaning tasks. Please refresh.</p>
              </div>
            ) : paginatedRows.length === 0 ? (
              <div className="py-20 text-center border border-gray-200 dark:border-gray-700 rounded-lg">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No cleaning tasks found.</p>
              </div>
            ) : (
              paginatedRows.map((row, index) => (
                <div key={`${row.cleaning_id}-mobile-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm font-mono truncate">
                        {highlightText(row.booking_id, searchTerm)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
                        {highlightText(row.haven, searchTerm)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        Guest: {highlightText(row.guest, searchTerm)}
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${row.statusColor}`}>
                      {row.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Check-in</div>
                      <div className="text-xs font-semibold text-green-700 dark:text-green-300">{row.check_in}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Check-out</div>
                      <div className="text-xs font-semibold text-red-700 dark:text-red-300">{row.check_out}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Assigned Cleaner</div>
                    <div className={`text-sm font-medium ${row.cleaner_name === "Unassigned" ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-800 dark:text-gray-100"}`}>
                      {highlightText(row.cleaner_name, searchTerm)}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="View details"
                      type="button"
                      onClick={() => handleViewBooking(row.booking_id)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {row.status === "Unassigned" && (
                      <button
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Assign cleaner"
                        type="button"
                        onClick={() => handleAssignCleaner(row.booking_id)}
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden lg:block overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
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
                    className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeleton loading rows
                  Array.from({ length: entriesPerPage }).map((_, idx) => (
                    <tr
                      key={`skeleton-${idx}`}
                      className="border border-gray-200 dark:border-gray-700 animate-pulse"
                    >
                      {/* Booking ID */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </td>
                      {/* Haven & Guest */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                        </div>
                      </td>
                      {/* Check-in / Check-out */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                      </td>
                      {/* Assigned Cleaner */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700">
                      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Failed to load cleaning tasks. Please refresh.</p>
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No cleaning tasks found.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, index) => (
                    <tr key={`${row.cleaning_id}-${index}`} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* Booking ID Column */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm font-mono">
                          {highlightText(row.booking_id, searchTerm)}
                        </span>
                      </td>

                      {/* Haven & Guest Column */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {highlightText(row.haven, searchTerm)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                              {highlightText(row.guest, searchTerm)}
                            </span>
                          </div>
                          {row.guest_email && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                              {row.guest_email}
                            </div>
                          )}
                          {row.guest_phone && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {row.guest_phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Check-in / Check-out Column */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">In:</span>
                            <span className="text-xs font-semibold text-green-700 dark:text-green-300">{row.check_in}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Out:</span>
                            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{row.check_out}</span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Cleaner Column */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className={`text-sm font-medium ${row.cleaner_name === "Unassigned" ? "text-gray-400 dark:text-gray-500 italic" : "text-gray-800 dark:text-gray-100"}`}>
                              {highlightText(row.cleaner_name, searchTerm)}
                            </span>
                          </div>
                          {row.cleaning_time_in && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                              <span className="text-xs text-gray-600 dark:text-gray-300">
                                Started: {new Date(row.cleaning_time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          {row.cleaning_time_in && !row.cleaning_time_out && row.status === "In Progress" && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                Duration: {formatDuration(row.cleaning_time_in)}
                              </span>
                            </div>
                          )}
                          {row.cleaned_at && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                              <span className="text-xs text-green-600 dark:text-green-400">
                                Completed: {new Date(row.cleaned_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View details"
                            type="button"
                            onClick={() => handleViewBooking(row.booking_id)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {row.status === "Unassigned" && (
                            <button
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Assign cleaner"
                              type="button"
                              onClick={() => handleAssignCleaner(row.booking_id)}
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
        </div>

        {/* Pagination Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} entries
                {searchTerm || filterStatus !== "all" ? ` (filtered from ${rows.length} total entries)` : ""}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                  type="button"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  aria-label="Previous page"
                  title="Previous page"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
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
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md border-brand-primary"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                      disabled={totalPages === 0}
                      type="button"
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  aria-label="Next page"
                  title="Next page"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last Page"
                  type="button"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Guides Drawer */}
        {showGuideDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowGuideDrawer(false)}
            />

            {/* Panel */}
            <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-brand-primary" />
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Help &amp; Guides</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {(['en', 'fil'] as const).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setGuideLanguage(lang)}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          guideLanguage === lang
                            ? 'bg-brand-primary text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowGuideDrawer(false)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pt-3 flex-shrink-0 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                {([
                  { key: 'status', label: 'Status' },
                  { key: 'manage', label: 'Manage' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveGuideTab(tab.key)}
                    className={`px-4 py-2.5 rounded-t-lg text-base font-semibold whitespace-nowrap transition-colors -mb-px ${
                      activeGuideTab === tab.key
                        ? 'bg-gray-100 dark:bg-gray-700 text-brand-primary border-b-2 border-brand-primary'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {activeGuideTab === 'status' && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">{guideTranslations[guideLanguage].statusGuide.title}</h4>
                    <div className="space-y-5">
                      {guideTranslations[guideLanguage].statusGuide.statuses.map((status, idx) => {
                        const statusColors: Record<string, { dot: string }> = {
                          Unassigned: { dot: 'bg-gray-500' },
                          Assigned: { dot: 'bg-indigo-500' },
                          "In Progress": { dot: 'bg-yellow-500' },
                          Completed: { dot: 'bg-green-500' }
                        };
                        const color = statusColors[status.name] || { dot: 'bg-gray-500' };

                        return (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={`w-3.5 h-3.5 ${color.dot} rounded-full mt-1.5 flex-shrink-0`}></div>
                            <div>
                              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-base">{status.name}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{status.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeGuideTab === 'manage' && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5">{guideTranslations[guideLanguage].cleaningGuide.title}</h4>
                    <div className="space-y-5">
                      {guideTranslations[guideLanguage].cleaningGuide.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-base font-bold">{idx + 1}</div>
                          <div>
                            <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-base">{step.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-base mb-3">{guideTranslations[guideLanguage].cleaningGuide.workflowTitle}</h5>
                      <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                        {guideTranslations[guideLanguage].cleaningGuide.workflows.map((workflow, idx) => {
                          const getWorkflowIcon = (title: string) => {
                            if (title.includes("Unassigned")) return { Icon: Users, color: 'text-gray-600 dark:text-gray-400' };
                            if (title.includes("Assigned")) return { Icon: ClipboardList, color: 'text-indigo-600 dark:text-indigo-400' };
                            if (title.includes("In Progress")) return { Icon: PlayCircle, color: 'text-yellow-600 dark:text-yellow-400' };
                            return { Icon: CheckCircle, color: 'text-green-600 dark:text-green-400' };
                          };
                          const iconData = getWorkflowIcon(workflow.title);

                          return (
                            <div key={idx} className="flex items-start gap-2">
                              <iconData.Icon className={`w-5 h-5 ${iconData.color} flex-shrink-0 mt-0.5`} />
                              <span className="leading-relaxed"><strong>{workflow.title}:</strong> {workflow.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isViewModalOpen && selectedBooking && (
          <ViewBookings booking={selectedBooking as any} onClose={handleCloseModal} />
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
      </div>
    </>
  );
}