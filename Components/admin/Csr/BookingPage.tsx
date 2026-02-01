"use client";

import { Calendar, Search, Filter, Plus, XCircle, CheckSquare, Eye, Edit, Trash2, MapPin, User, Phone, Mail, CheckCircle, Clock, LogIn, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, Download, FileSpreadsheet, RefreshCw, Check, X, ExternalLink, CreditCard, Banknote } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import ViewBookings from "./Modals/ViewBookings";
import ViewBookingDetails from "./Modals/ViewBookingDetails";
import ApproveBookingModal from "./Modals/ApproveBookingModal";
import RejectBookingModal from "./Modals/RejectBookingModal";
import NewBookings from "./Modals/NewBookings";
import { useGetBookingsQuery, useDeleteBookingMutation } from "@/redux/api/bookingsApi";
import toast from "react-hot-toast";
import DeleteConfirmation from "./Modals/DeleteConfirmation";
import ExportBookingsModal from "./Modals/ExportBookingsModal";
import TotalBreakdown from "./TotalBreakdown";

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
  deposit_status?: string;
  security_deposit_payment_method?: string;
  security_deposit_payment_proof_url?: string;
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
  const { data: session } = useSession();
  const employeeId = session?.user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "weekly" | "monthly" | "yearly">("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
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
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedBookingsForModal, setSelectedBookingsForModal] = useState<BookingData[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);

  const logEmployeeActivity = async (action: string, details: string, bookingId?: string) => {
    if (!employeeId) return;
    try {
      await fetch('/api/admin/employee-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          action,
          details,
          entityType: 'booking',
          entityId: bookingId,
        }),
      });
    } catch {
      // ignore
    }
  };

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
    logEmployeeActivity('OPEN_LIVE_SHEET', 'Opened bookings live sheet');
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
    logEmployeeActivity('VIEW_BOOKING', `Viewed booking ${booking.booking_id}`, booking.id);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedBooking(null);
  };

  const handleEditBooking = (booking: BookingData) => {
    setEditingBooking(booking);
    setIsEditBookingModalOpen(true);
    logEmployeeActivity('OPEN_EDIT_BOOKING', `Opened edit for booking ${booking.booking_id}`, booking.id);
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
      logEmployeeActivity('DELETE_BOOKING', `Deleted booking ${bookingToDelete.booking_id}`, bookingToDelete.id);
      toast.success("Booking deleted successfully");
      closeDeleteModal();
    } catch (error) {
      toast.error("Failed to delete booking");
      console.error(error);
    }
  };

  const handleApproveBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsApproveModalOpen(true);
  };

  const handleRejectBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setIsRejectModalOpen(true);
  };

  const handleConfirmApprove = async (bookingId: string) => {
    setIsApproving(true);
    try {
      const response = await fetch('/api/admin/bookings/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });
      
      if (response.ok) {
        toast.success("Booking approved successfully");
        logEmployeeActivity('APPROVE_BOOKING', `Approved booking ${selectedBooking?.booking_id}`, bookingId);
        setIsApproveModalOpen(false);
        setSelectedBooking(null);
      } else {
        toast.error("Failed to approve booking");
      }
    } catch (error) {
      toast.error("Failed to approve booking");
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleBulkConfirmApprove = async (bookingIds: string[]) => {
    setIsApproving(true);
    try {
      const response = await fetch('/api/admin/bookings/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingIds }),
      });
      
      if (response.ok) {
        toast.success(`${bookingIds.length} booking(s) approved successfully`);
        logEmployeeActivity('BULK_APPROVE_BOOKINGS', `Bulk approved ${bookingIds.length} bookings`);
        setIsApproveModalOpen(false);
        setSelectedBookingsForModal([]);
        setSelectedBookings([]);
        setIsBulkMode(false);
      } else {
        toast.error("Failed to approve bookings");
      }
    } catch (error) {
      toast.error("Failed to approve bookings");
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleConfirmReject = async (bookingId: string, reason: string) => {
    setIsRejecting(true);
    try {
      const response = await fetch('/api/admin/bookings/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId, reason }),
      });
      
      if (response.ok) {
        toast.success("Booking rejected successfully");
        logEmployeeActivity('REJECT_BOOKING', `Rejected booking ${selectedBooking?.booking_id} with reason: ${reason}`, bookingId);
        setIsRejectModalOpen(false);
        setSelectedBooking(null);
      } else {
        toast.error("Failed to reject booking");
      }
    } catch (error) {
      toast.error("Failed to reject booking");
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleBulkConfirmReject = async (bookingIds: string[], reason: string) => {
    setIsRejecting(true);
    try {
      const response = await fetch('/api/admin/bookings/bulk-reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingIds, reason }),
      });
      
      if (response.ok) {
        toast.success(`${bookingIds.length} booking(s) rejected successfully`);
        logEmployeeActivity('BULK_REJECT_BOOKINGS', `Bulk rejected ${bookingIds.length} bookings with reason: ${reason}`);
        setIsRejectModalOpen(false);
        setSelectedBookingsForModal([]);
        setSelectedBookings([]);
        setIsBulkMode(false);
      } else {
        toast.error("Failed to reject bookings");
      }
    } catch (error) {
      toast.error("Failed to reject bookings");
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCheckInBooking = async (booking: BookingData) => {
    try {
      const response = await fetch('/api/admin/bookings/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      
      if (response.ok) {
        toast.success("Booking checked in successfully");
        logEmployeeActivity('CHECKIN_BOOKING', `Checked in booking ${booking.booking_id}`, booking.id);
      } else {
        toast.error("Failed to check in booking");
      }
    } catch (error) {
      toast.error("Failed to check in booking");
      console.error(error);
    }
  };

  // Bulk operations
  const handleBulkApprove = async () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }

    // Get the selected booking objects
    const selectedBookingObjects = bookings.filter(b => selectedBookings.includes(b.id));
    
    if (selectedBookingObjects.length === 0) {
      toast.error("No valid bookings found");
      return;
    }

    // Open bulk approve modal
    setSelectedBookingsForModal(selectedBookingObjects);
    setIsApproveModalOpen(true);
    setIsBulkMode(true);
  };

  const handleBulkReject = async () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }

    // Get the selected booking objects
    const selectedBookingObjects = bookings.filter(b => selectedBookings.includes(b.id));
    
    if (selectedBookingObjects.length === 0) {
      toast.error("No valid bookings found");
      return;
    }

    // Open bulk reject modal
    setSelectedBookingsForModal(selectedBookingObjects);
    setIsRejectModalOpen(true);
    setIsBulkMode(true);
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedBookings.length} booking(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/bookings/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingIds: selectedBookings }),
      });
      
      if (response.ok) {
        toast.success(`${selectedBookings.length} booking(s) deleted successfully`);
        logEmployeeActivity('BULK_DELETE_BOOKINGS', `Bulk deleted ${selectedBookings.length} bookings`);
        setSelectedBookings([]);
      } else {
        toast.error("Failed to delete bookings");
      }
    } catch (error) {
      toast.error("Failed to delete bookings");
      console.error(error);
    }
  };

  const handleBulkCheckIn = async () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }

    try {
      const response = await fetch('/api/admin/bookings/bulk-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingIds: selectedBookings }),
      });
      
      if (response.ok) {
        toast.success(`${selectedBookings.length} booking(s) checked in successfully`);
        logEmployeeActivity('BULK_CHECKIN_BOOKINGS', `Bulk checked in ${selectedBookings.length} bookings`);
        setSelectedBookings([]);
      } else {
        toast.error("Failed to check in bookings");
      }
    } catch (error) {
      toast.error("Failed to check in bookings");
      console.error(error);
    }
  };

  const handleBulkView = () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }
    // TODO: Implement bulk view modal or navigation
    toast.info(`Viewing ${selectedBookings.length} selected bookings`);
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === paginatedBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(paginatedBookings.map(booking => booking.id));
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
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Bookings Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all customer bookings and reservations</p>
        </div>
      </div>

      {/* Booking Status Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Booking Status Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Pending</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Booking awaiting approval or payment confirmation</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Approved</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Booking confirmed and approved by management</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Checked-In</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Guest has arrived and checked in to the haven</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Checked-Out</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Guest has completed their stay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
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
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600`}
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

      <div className="flex justify-start flex-shrink-0">
          <button
            onClick={() => {
              setIsNewBookingModalOpen(true);
              logEmployeeActivity('OPEN_NEW_BOOKING', 'Opened create booking modal');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Booking
          </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBookings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkView}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View Selected
              </button>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Selected
              </button>
              <button
                onClick={handleBulkCheckIn}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Check-In Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedBookings([])}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
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
              onClick={() => {
                setIsExportModalOpen(true);
                logEmployeeActivity('OPEN_EXPORT_BOOKINGS', 'Opened export bookings modal');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          </div>
        </div>
      </div>

      {/* Bookings Table - Desktop View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700 hidden lg:flex">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="py-4 px-4 w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookings(paginatedBookings.map((b: BookingData) => b.id));
                      } else {
                        setSelectedBookings([]);
                      }
                    }}
                    checked={paginatedBookings.length > 0 && selectedBookings.length === paginatedBookings.length}
                  />
                </th>
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
                  onClick={() => handleSort("haven")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Haven & Booking
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("guestName")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Guest
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("checkIn")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Check-In / Check-Out
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Total</th>
                <th
                  onClick={() => handleSort("status")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: entriesPerPage }).map((_, idx) => (
                  <tr
                    key={`skeleton-${idx}`}
                    className="border-b border-gray-100 dark:border-gray-700 animate-pulse"
                  >
                    <td className="py-4 px-4">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-2 min-w-[200px]">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="text-red-600">
                      <p className="text-lg font-semibold">Error loading bookings</p>
                      <p className="text-sm mt-2">Please try again later</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
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
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedBookings.includes(booking.id) ? 'bg-brand-primary/5' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-brand-primary focus:ring-brand-primary"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBookings([...selectedBookings, booking.id]);
                            } else {
                              setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                            }
                          }}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{booking.booking_id}</span>
                          {booking.payment_method && (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                {booking.payment_method.toLowerCase() === 'cash' && <Banknote className="w-3 h-3 text-green-600" />}
                                {booking.payment_method.toLowerCase() === 'gcash' && <CreditCard className="w-3 h-3 text-blue-600" />}
                                {booking.payment_method.toLowerCase() === 'bank transfer' && <CreditCard className="w-3 h-3 text-purple-600" />}
                                <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{booking.payment_method}</span>
                              </div>
                              {booking.payment_proof_url && (
                                <a
                                  href={booking.payment_proof_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Proof
                                </a>
                              )}
                            </div>
                          )}
                          {booking.down_payment > 0 && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              Down Payment: {formatCurrency(booking.down_payment)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{booking.room_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Booking ID:</span>
                            <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{booking.booking_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-2 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{guestName}</span>
                          </div>
                          {booking.guest_email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Email:</span>
                              <a href={`mailto:${booking.guest_email}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                                {booking.guest_email}
                              </a>
                            </div>
                          )}
                          {booking.guest_phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Phone:</span>
                              <a href={`tel:${booking.guest_phone}`} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline">
                                {booking.guest_phone}
                              </a>
                            </div>
                          )}
                          {booking.facebook_link && (
                            <div className="flex items-center gap-1">
                              <a
                                href={booking.facebook_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                title="View Facebook Profile"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Facebook
                              </a>
                            </div>
                          )}
                          {booking.valid_id_url && (
                            <div className="flex items-center gap-1">
                              <a
                                href={booking.valid_id_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline"
                                title="View Valid ID"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Valid ID
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500">Check-In:</span>
                            <span className="whitespace-nowrap">{formatDate(booking.check_in_date)} {booking.check_in_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500">Check-Out:</span>
                            <span className="whitespace-nowrap">{formatDate(booking.check_out_date)} {booking.check_out_time}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <TotalBreakdown
                          roomRate={booking.room_rate}
                          securityDeposit={booking.security_deposit}
                          depositStatus={booking.deposit_status}
                          addOnsTotal={booking.add_ons_total}
                          totalAmount={booking.total_amount}
                          downPayment={booking.down_payment}
                          remainingBalance={booking.remaining_balance}
                          isCompact={true}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap capitalize ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {booking.status?.toLowerCase() === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveBooking(booking)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve Booking"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectBooking(booking)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject Booking"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {booking.status?.toLowerCase() === 'approved' && (
                            <button
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Ready for Check-in"
                            >
                              <LogIn className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewBooking(booking)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
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
      <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-4 flex-1 flex flex-col min-h-0">
        {isLoading ? (
          // Mobile skeleton loading
          Array.from({ length: entriesPerPage }).map((_, idx) => (
            <div
              key={`mobile-skeleton-${idx}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Guest Info */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                </div>
                <div>
                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                </div>
              </div>

              {/* Dates */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
              </div>

              {/* Total and Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                  <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-9 w-9 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-9 w-9 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          ))
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
                    {booking.payment_method ? (
                      ['cash', 'gcash', 'bank transfer'].includes(booking.payment_method.toLowerCase()) && (
                        <div className="flex items-center gap-1 mt-1">
                          {booking.payment_method.toLowerCase() === 'cash' && <Banknote className="w-3 h-3 text-green-600" />}
                          {booking.payment_method.toLowerCase() === 'gcash' && <CreditCard className="w-3 h-3 text-blue-600" />}
                          {booking.payment_method.toLowerCase() === 'bank transfer' && <CreditCard className="w-3 h-3 text-purple-600" />}
                          <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{booking.payment_method}</span>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">No payment info</span>
                    )}
                    {booking.down_payment > 0 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Down Payment: {formatCurrency(booking.down_payment)}
                      </div>
                    )}
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
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stay Dates</p>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500">Check-In:</span>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(booking.check_in_date)}</p>
                      <p className="text-xs text-gray-500">{booking.check_in_time}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500">Check-Out:</span>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(booking.check_out_date)}</p>
                      <p className="text-xs text-gray-500">{booking.check_out_time}</p>
                    </div>
                  </div>
                </div>

                {/* Total and Actions */}
                <div className="flex items-start justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{formatCurrency(booking.total_amount)}</p>
                    {booking.remaining_balance > 0 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Balance: {formatCurrency(booking.remaining_balance)}
                      </p>
                    )}
                    <TotalBreakdown
                      roomRate={booking.room_rate}
                      securityDeposit={booking.security_deposit}
                      depositStatus={booking.deposit_status}
                      addOnsTotal={booking.add_ons_total}
                      totalAmount={booking.total_amount}
                      downPayment={booking.down_payment}
                      remainingBalance={booking.remaining_balance}
                      isCompact={false}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status?.toLowerCase() === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveBooking(booking)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve Booking"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject Booking"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {booking.status?.toLowerCase() === 'approved' && (
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Ready for Check-in"
                      >
                        <LogIn className="w-5 h-5" />
                      </button>
                    )}
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
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
                        ? "bg-brand-primary text-white"
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
        <ViewBookingDetails booking={selectedBooking} onClose={handleCloseModal} />
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
            logEmployeeActivity('UPDATE_BOOKING', `Updated booking ${editingBooking.booking_id}`, editingBooking.id);
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

      {/* Approve Booking Modal */}
      {isApproveModalOpen && (isBulkMode ? selectedBookingsForModal.length > 0 : selectedBooking) && (
        <ApproveBookingModal
          booking={!isBulkMode ? selectedBooking : undefined}
          bookings={isBulkMode ? selectedBookingsForModal : undefined}
          onClose={() => {
            setIsApproveModalOpen(false);
            setSelectedBooking(null);
            setSelectedBookingsForModal([]);
            setIsBulkMode(false);
          }}
          onApprove={handleConfirmApprove}
          onBulkApprove={handleBulkConfirmApprove}
          isLoading={isApproving}
          isBulk={isBulkMode}
        />
      )}

      {/* Reject Booking Modal */}
      {isRejectModalOpen && (isBulkMode ? selectedBookingsForModal.length > 0 : selectedBooking) && (
        <RejectBookingModal
          booking={!isBulkMode ? selectedBooking : undefined}
          bookings={isBulkMode ? selectedBookingsForModal : undefined}
          onClose={() => {
            setIsRejectModalOpen(false);
            setSelectedBooking(null);
            setSelectedBookingsForModal([]);
            setIsBulkMode(false);
          }}
          onReject={handleConfirmReject}
          onBulkReject={handleBulkConfirmReject}
          isLoading={isRejecting}
          isBulk={isBulkMode}
        />
      )}

    </div>
  );
}