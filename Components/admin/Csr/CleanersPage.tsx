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
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import ViewBookings from "./Modals/ViewBookings";
import AssignCleanerModal from "./Modals/AssignCleanerModal";

type CleaningStatus = "Unassigned" | "Assigned" | "In Progress" | "Completed";

interface CleanerRow {
  cleaner_id: string;
  haven: string;
  booking_id: string;
  guest: string;
  check_out: string;
  assigned_to: string;
  status: CleaningStatus;
  statusColor: string;
}

interface BookingData {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  guest_gender?: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  facebook_link?: string;
  payment_method: string;
  payment_proof_url?: string;
  valid_id_url?: string;
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  status: string;
  add_ons?: unknown;
  additional_guests?: unknown;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  cleaning_status?: "pending" | "in-progress" | "cleaned" | "inspected";
  assigned_cleaner_id?: string | null;
}

const skeletonPulse = "animate-pulse bg-gray-100 dark:bg-gray-700/60";

function mapCleaningStatus(
  cleaning_status?: BookingData["cleaning_status"],
  assigned_cleaner_id?: string | null
): {
  status: CleaningStatus;
  statusColor: string;
} {
  if (cleaning_status === "pending" && assigned_cleaner_id) {
    return { status: "Assigned", statusColor: "bg-indigo-100 text-indigo-700" };
  }

  switch (cleaning_status) {
    case "in-progress":
      return { status: "In Progress", statusColor: "bg-yellow-100 text-yellow-700" };
    case "cleaned":
    case "inspected":
      return { status: "Completed", statusColor: "bg-green-100 text-green-700" };
    case "pending":
    default:
      return {
        status: "Unassigned",
        statusColor: "bg-gray-100 text-gray-700 dark:text-gray-200",
      };
  }
}

export default function CleanersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | CleaningStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof CleanerRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [assignmentBookingId, setAssignmentBookingId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const {
    data: bookings = [],
    isLoading,
    error,
  } = useGetBookingsQuery({}) as {
    data: BookingData[];
    isLoading: boolean;
    error: unknown;
  };

  const rows: CleanerRow[] = useMemo(() => {
    if (!Array.isArray(bookings)) return [];

    return bookings
      // Keep only bookings that have a checkout set (cleaning tasks happen after checkout)
      .filter((b) => Boolean(b?.booking_id))
      .map((b) => {
        const guestName = `${b.guest_first_name ?? ""} ${b.guest_last_name ?? ""}`.trim() || "Guest";
        const checkOut = `${b.check_out_date ?? ""} ${b.check_out_time ?? ""}`.trim() || "Not specified";
        const { status, statusColor } = mapCleaningStatus(b.cleaning_status, b.assigned_cleaner_id);

        const assignedTo = status === "Unassigned" ? "Unassigned" : "Assigned";

        return {
          cleaner_id: b.booking_id ?? "N/A",
          haven: b.room_name ?? "Not specified",
          booking_id: b.booking_id ?? "N/A",
          guest: guestName,
          check_out: checkOut,
          assigned_to: assignedTo,
          status,
          statusColor,
        };
      });
  }, [bookings]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        row.cleaner_id.toLowerCase().includes(term) ||
        row.booking_id.toLowerCase().includes(term) ||
        row.guest.toLowerCase().includes(term) ||
        row.haven.toLowerCase().includes(term) ||
        row.assigned_to.toLowerCase().includes(term);

      const matchesFilter = filterStatus === "all" || row.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, rows, searchTerm]);

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
    if (!Array.isArray(bookings)) return;
    const booking = (bookings as BookingData[]).find(
      (b) => b.booking_id === bookingId
    );
    if (booking) {
      setSelectedBooking(booking);
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
    // Refetch bookings to update the status
    // The query will automatically refetch due to invalidation
  };

  const totalCount = rows.length;
  const unassignedCount = rows.filter((r) => r.status === "Unassigned").length;
  const assignedCount = rows.filter((r) => r.status === "Assigned").length;
  const inProgressCount = rows.filter((r) => r.status === "In Progress").length;
  const completedCount = rows.filter((r) => r.status === "Completed").length;

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cleaners Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign and track post check-out cleaning tasks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`stat-skel-${i}`}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow dark:shadow-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-3 w-full">
                    <div className={`h-4 w-24 rounded ${skeletonPulse}`} />
                    <div className={`h-8 w-16 rounded ${skeletonPulse}`} />
                  </div>
                  <div className={`w-12 h-12 rounded ${skeletonPulse}`} />
                </div>
              </div>
            ))
          ) : (
            [
              { label: "Total Tasks", value: String(totalCount), color: "bg-orange-500", icon: Sparkles },
              { label: "Unassigned", value: String(unassignedCount), color: "bg-gray-500", icon: Users },
              { label: "Assigned", value: String(assignedCount), color: "bg-indigo-500", icon: ClipboardList },
              { label: "In Progress", value: String(inProgressCount), color: "bg-yellow-500", icon: Loader2 },
            ].map((stat, i) => {
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
            })
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Cleaners</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status, current room, and cleaning timer</p>
            </div>
          </div>

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
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
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
                  placeholder="Search by cleaner ID, booking ID, guest, haven, or assignee..."
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
                  if (value === "all" || ["Unassigned", "Assigned", "In Progress", "Completed"].includes(value)) {
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
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <th
                    onClick={() => handleSort("cleaner_id")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Cleaner ID
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("haven")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Haven Location
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("booking_id")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Booking ID
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("guest")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Guest
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("check_out")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Check-Out
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("assigned_to")}
                    className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      Assigned To
                      <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center justify-center gap-2">
                      Status
                      <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: entriesPerPage }).map((_, idx) => (
                    <tr key={`row-skel-${idx}`} className="border-b border-gray-100 dark:border-gray-700">
                      {Array.from({ length: 8 }).map((__, cidx) => (
                        <td key={`cell-skel-${idx}-${cidx}`} className="py-4 px-4">
                          <div className={`h-4 w-full max-w-[180px] rounded ${skeletonPulse}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-10 px-6 text-center text-sm text-red-600 dark:text-red-400">
                      Failed to load cleaning tasks. Please refresh.
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 px-6 text-center text-sm text-gray-600 dark:text-gray-300">
                      No cleaning tasks found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.cleaner_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.cleaner_id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{row.haven}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.booking_id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 min-w-[180px]">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.guest}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.check_out}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{row.assigned_to}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
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
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md"
                          : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
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

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Completed</h4>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Completed Tasks</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{completedCount}</span>
            </div>
          </div>
        </div>

        {isViewModalOpen && selectedBooking && (
          <ViewBookings booking={selectedBooking as any} onClose={handleCloseModal} />
        )}

        {assignmentBookingId && (
          <AssignCleanerModal
            isOpen={isAssignModalOpen}
            onClose={handleCloseAssignModal}
            bookingId={assignmentBookingId}
            onSuccess={handleAssignmentSuccess}
          />
        )}
      </div>
    </>
  );
}