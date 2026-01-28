"use client";

import { Calendar, Search, Filter, Plus, Eye, Edit, Trash2, MapPin, User, Phone, Mail, CheckCircle, Clock, LogIn, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Download, FileSpreadsheet } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import ViewBookings from "./Modals/ViewBookings";
import NewBookings from "./Modals/NewBookings";
import { useGetBookingsQuery, useDeleteBookingMutation } from "@/redux/api/bookingsApi";
import toast from "react-hot-toast";
import DeleteConfirmation from "./Modals/DeleteConfirmation";
import ExportBookingsModal from "./Modals/ExportBookingsModal";

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
}

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "weekly" | "monthly" | "yearly">("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingData | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<BookingData | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [liveSheetAutoSync, setLiveSheetAutoSync] = useState(false);
  const [isOpeningLiveSheet, setIsOpeningLiveSheet] = useState(false);
  const liveSheetClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch bookings from API
  const { data: bookings = [], isLoading, error } = useGetBookingsQuery(
    {},
    {
      pollingInterval: 5000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  ) as { data: BookingData[]; isLoading: boolean; error: unknown };
  const [deleteBooking, { isLoading: isDeletingBooking }] = useDeleteBookingMutation();

  useEffect(() => {
    if (!liveSheetAutoSync) return;

    let stopped = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/admin/sync-sheets", { method: "POST" });
        if (!res.ok) return;
      } catch {
        // ignore
      }
    };

    tick();
    const t = setInterval(() => {
      if (stopped) return;
      if (document.visibilityState !== "visible") return;
      tick();
    }, 5000);

    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [liveSheetAutoSync]);

  // Get status color
  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
        return "bg-red-100 text-red-700";
      case "checked-in":
        return "bg-blue-100 text-blue-700";
      case "checked-out":
        return "bg-indigo-100 text-indigo-700";
      case "cancelled":
        return "bg-orange-100 text-orange-700";
      case "completed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return { total: 0, confirmed: 0, pending: 0, checkedIn: 0 };
    }

    return {
      total: bookings.length,
      confirmed: bookings.filter((b: BookingData) => {
        const normalized = (b.status || '').toLowerCase().replace(/\s+/g, '-');
        return normalized === "confirmed" || normalized === "approved";
      }).length,
      pending: bookings.filter((b: BookingData) => {
        const normalized = (b.status || '').toLowerCase().replace(/\s+/g, '-');
        return normalized === "pending";
      }).length,
      checkedIn: bookings.filter((b: BookingData) => {
        const normalized = (b.status || '').toLowerCase().replace(/\s+/g, '-');
        return normalized === "checked-in";
      }).length,
    };
  }, [bookings]);

  // Date filter helper function
  const getDateRange = (filterType: "all" | "weekly" | "monthly" | "yearly") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterType) {
      case "weekly": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };
      }
      case "monthly": {
        // Use selected month and year (month is 1-12, but Date uses 0-11)
        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonth, 0); // Last day of selected month
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      }
      case "yearly": {
        // Use selected year
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        return { start: yearStart, end: yearEnd };
      }
      default:
        return null;
    }
  };

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const openLiveSheet = async () => {
    // Debounce: ignore rapid clicks
    if (liveSheetClickTimeoutRef.current) return;
    liveSheetClickTimeoutRef.current = setTimeout(() => {
      liveSheetClickTimeoutRef.current = null;
    }, 1000);

    setIsOpeningLiveSheet(true);
    try {
      // Run sync and URL fetch in parallel for speed
      const [syncRes, urlRes] = await Promise.allSettled([
        fetch("/api/admin/sync-sheets", { method: "POST" }),
        fetch("/api/admin/spreadsheet-url", { cache: "no-store" }),
      ]);

      // Check sync result
      if (syncRes.status === "fulfilled") {
        const syncData = (await syncRes.value.json()) as { success: boolean; error?: string; appended?: number; skipped?: number };
        if (!syncRes.value.ok || !syncData.success) {
          toast.error(syncData.error || "Failed to sync bookings to Google Sheet.");
          setIsOpeningLiveSheet(false);
          return;
        }
      } else {
        toast.error("Failed to sync bookings to Google Sheet.");
        setIsOpeningLiveSheet(false);
        return;
      }

      // Check URL result
      if (urlRes.status === "fulfilled") {
        const data = (await urlRes.value.json()) as { success: boolean; url?: string; error?: string };
        if (!urlRes.value.ok || !data.success || !data.url) {
          toast.error(data.error || "Spreadsheet link is not configured.");
          setIsOpeningLiveSheet(false);
          return;
        }
        window.open(data.url, "_blank");
        setLiveSheetAutoSync(true);
      } else {
        toast.error("Failed to fetch spreadsheet link.");
        setIsOpeningLiveSheet(false);
        return;
      }
    } catch {
      toast.error("Failed to sync/open spreadsheet.");
    } finally {
      setIsOpeningLiveSheet(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];

    const dateRange = dateFilter !== "all" ? getDateRange(dateFilter) : null;

    return bookings.filter((booking: BookingData) => {
      const guestName = `${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`;
      const matchesSearch =
        guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.booking_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.room_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.guest_email || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Normalize status: remove spaces and convert to lowercase for comparison
      const normalizedBookingStatus = (booking.status || '').toLowerCase().replace(/\s+/g, '-');
      const normalizedFilterStatus = filterStatus.toLowerCase();
      const matchesFilter = filterStatus === "all" || normalizedBookingStatus === normalizedFilterStatus;

      // Date filter: check if booking's created_at or check_in_date falls within the range
      let matchesDate = true;
      if (dateRange && dateFilter !== "all") {
        const bookingDate = booking.created_at 
          ? new Date(booking.created_at)
          : booking.check_in_date 
          ? new Date(booking.check_in_date)
          : null;
        
        if (bookingDate) {
          bookingDate.setHours(0, 0, 0, 0);
          matchesDate = bookingDate >= dateRange.start && bookingDate <= dateRange.end;
        }
      }

      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [bookings, searchTerm, filterStatus, dateFilter, selectedMonth, selectedYear]);

  // Sort bookings
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a: BookingData, b: BookingData) => {
      if (!sortField) return 0;

      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "guestName") {
        aValue = `${a.guest_first_name || ''} ${a.guest_last_name || ''}`;
        bValue = `${b.guest_first_name || ''} ${b.guest_last_name || ''}`;
      } else if (sortField === "id") {
        aValue = a.booking_id || '';
        bValue = b.booking_id || '';
      } else if (sortField === "haven") {
        aValue = a.room_name || '';
        bValue = b.room_name || '';
      } else if (sortField === "checkIn") {
        aValue = a.check_in_date || '';
        bValue = b.check_out_date || '';
      } else if (sortField === "checkOut") {
        aValue = a.check_out_date || '';
        bValue = b.check_out_date || '';
      } else {
        aValue = (a[sortField as keyof BookingData] as string | number) || '';
        bValue = (b[sortField as keyof BookingData] as string | number) || '';
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredBookings, sortField, sortDirection]);

  // Paginate bookings
  const totalPages = Math.ceil(sortedBookings.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedBookings = sortedBookings.slice(startIndex, endIndex);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedBooking(null);
  };

  const handleEditBooking = (booking: BookingData) => {
    setEditingBooking(booking);
    setIsEditBookingModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditBookingModalOpen(false);
    setEditingBooking(null);
  };

  const openDeleteModal = (booking: BookingData) => {
    setBookingToDelete(booking);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeletingBooking) return;
    setIsDeleteModalOpen(false);
    setBookingToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!bookingToDelete?.id) return;
    try {
      await deleteBooking(bookingToDelete.id).unwrap();
      toast.success("Booking deleted successfully");
      closeDeleteModal();
    } catch (error) {
      toast.error("Failed to delete booking");
      console.error(error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bookings Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all customer bookings and reservations</p>
        </div>
        <button
          onClick={() => setIsNewBookingModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]"
        >
          <Plus className="w-5 h-5" />
          New Booking
        </button>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: stats.total.toString(), color: "bg-blue-500", icon: Calendar },
          { label: "Confirmed", value: stats.confirmed.toString(), color: "bg-green-500", icon: CheckCircle },
          { label: "Pending", value: stats.pending.toString(), color: "bg-yellow-500", icon: Clock },
          { label: "Checked-In", value: stats.checkedIn.toString(), color: "bg-indigo-500", icon: LogIn },
        ].map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
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

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            {/* Entries Per Page */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</label>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking ID, guest name, or haven..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as "all" | "weekly" | "monthly" | "yearly");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
            >
              <option value="all">All Time</option>
              <option value="weekly">This Week</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            
            {/* Month selector - shown when monthly filter is selected */}
            {dateFilter === "monthly" && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Year selector - shown when yearly filter is selected */}
            {dateFilter === "yearly" && (
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="checked-in">Checked-In</option>
              <option value="checked-out">Checked-Out</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={openLiveSheet}
              disabled={isOpeningLiveSheet}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              {isOpeningLiveSheet ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  View Live Sheet
                </>
              )}
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table - Desktop View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th
                  onClick={() => handleSort("id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Booking ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("guestName")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Guest Details
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("haven")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Haven
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("checkIn")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Check-In
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("checkOut")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Check-Out
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Guests</th>
                <th
                  onClick={() => handleSort("status")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Total</th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                      Loading Bookings...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="text-red-600">
                      <p className="text-lg font-semibold">Error loading bookings</p>
                      <p className="text-sm mt-2">Please try again later</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking: BookingData) => {
                  const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`;
                  const totalGuests = booking.adults + booking.children + booking.infants;

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{booking.booking_id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{guestName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{booking.guest_email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {booking.guest_phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm whitespace-nowrap">{booking.room_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <div className="whitespace-nowrap">{formatDate(booking.check_in_date)}</div>
                          <div className="text-xs text-gray-500">{booking.check_in_time}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <div className="whitespace-nowrap">{formatDate(booking.check_out_date)}</div>
                          <div className="text-xs text-gray-500">{booking.check_out_time}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {totalGuests}
                          <div className="text-xs text-gray-500 font-normal">
                            A:{booking.adults} C:{booking.children} I:{booking.infants}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap capitalize ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-sm">
                          <div className="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                            {formatCurrency(booking.total_amount)}
                          </div>
                          {booking.remaining_balance > 0 && (
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Bal: {formatCurrency(booking.remaining_balance)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors"
                            title="Edit"
                            type="button"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(booking)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-4">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading bookings...</p>
            </div>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <div className="text-red-600">
              <p className="text-lg font-semibold">Error loading bookings</p>
              <p className="text-sm mt-2">Please try again later</p>
            </div>
          </div>
        ) : paginatedBookings.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No bookings found</div>
        ) : (
          paginatedBookings.map((booking: BookingData) => {
            const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`;
            const totalGuests = booking.adults + booking.children + booking.infants;
            return (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Booking ID</p>
                <p className="font-bold text-gray-800 dark:text-gray-100">{booking.booking_id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>

            {/* Guest Info */}
            <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Guest Details</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{guestName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 break-all">{booking.guest_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{booking.guest_phone}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Haven</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{booking.room_name}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guests</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {totalGuests}
                  <span className="text-xs text-gray-500 font-normal ml-1">
                    (A:{booking.adults} C:{booking.children} I:{booking.infants})
                  </span>
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-In</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(booking.check_in_date)}</p>
                <p className="text-xs text-gray-500">{booking.check_in_time}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-Out</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(booking.check_out_date)}</p>
                <p className="text-xs text-gray-500">{booking.check_out_time}</p>
              </div>
            </div>

            {/* Total and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{formatCurrency(booking.total_amount)}</p>
                {booking.remaining_balance > 0 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Balance: {formatCurrency(booking.remaining_balance)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewBooking(booking)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEditBooking(booking)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                  type="button"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openDeleteModal(booking)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                  type="button"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                </div>
              </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedBookings.length)} of {sortedBookings.length} entries
              {searchTerm || filterStatus !== "all" ? ` (filtered from ${bookings.length} total entries)` : ""}
            </p>
            <div className="flex gap-1">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
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
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md"
                        : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Booking Modal */}
      {isViewModalOpen && selectedBooking && (
        <ViewBookings booking={selectedBooking} onClose={handleCloseModal} />
      )}

      {isNewBookingModalOpen && (
        <NewBookings onClose={() => setIsNewBookingModalOpen(false)} />
      )}

      {isEditBookingModalOpen && editingBooking && (
        <NewBookings
          onClose={handleCloseEditModal}
          initialBooking={editingBooking}
          onSuccess={() => {
            toast.success("Booking updated");
          }}
        />
      )}

      {isDeleteModalOpen && bookingToDelete && (
        <DeleteConfirmation
          title="Delete Booking"
          itemName="booking"
          itemId={bookingToDelete.booking_id}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeletingBooking}
          confirmLabel="Delete booking"
        />
      )}

      {isExportModalOpen && (
        <ExportBookingsModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          bookings={filteredBookings}
        />
      )}

    </div>
  );
}