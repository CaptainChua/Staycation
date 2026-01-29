
"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  LogIn,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  AlertCircle,
  Home,
  DollarSign,
  X,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";

interface Booking {
  id: number;
  bookingRef: string;
  guestName: string;
  email: string;
  phone: string;
  havenName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amount: number;
  rateType: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
  message?: string;
}

const GuestAssistancePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Sample booking data (unchanged)
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 1,
      bookingRef: "BK-2025-001",
      guestName: "Juan Dela Cruz",
      email: "juan@email.com",
      phone: "+63 912 345 6789",
      havenName: "Haven 1",
      checkIn: "2025-01-15",
      checkOut: "2025-01-16",
      guests: 4,
      amount: 1999,
      rateType: "21H Weekend",
      status: "pending",
      createdAt: "2025-01-10 10:30 AM",
      message: "Hi, planning a family gathering. Need early check-in if possible.",
    },
    {
      id: 2,
      bookingRef: "BK-2025-002",
      guestName: "Maria Santos",
      email: "maria@email.com",
      phone: "+63 917 234 5678",
      havenName: "Haven 3",
      checkIn: "2025-01-20",
      checkOut: "2025-01-21",
      guests: 2,
      amount: 2500,
      rateType: "21H Weekday",
      status: "pending",
      createdAt: "2025-01-10 11:45 AM",
    },
    {
      id: 3,
      bookingRef: "BK-2025-003",
      guestName: "Carlos Reyes",
      email: "carlos@email.com",
      phone: "+63 920 345 6789",
      havenName: "Haven 2",
      checkIn: "2025-01-18",
      checkOut: "2025-01-18",
      guests: 6,
      amount: 1800,
      rateType: "10H",
      status: "approved",
      createdAt: "2025-01-09 3:20 PM",
    },
    {
      id: 4,
      bookingRef: "BK-2025-004",
      guestName: "Anna Martinez",
      email: "anna@email.com",
      phone: "+63 918 456 7890",
      havenName: "Haven 4",
      checkIn: "2025-01-22",
      checkOut: "2025-01-22",
      guests: 3,
      amount: 999,
      rateType: "6H",
      status: "declined",
      createdAt: "2025-01-09 1:10 PM",
      message: "Sorry, need to cancel due to schedule conflict.",
    },
    {
      id: 5,
      bookingRef: "BK-2025-005",
      guestName: "Pedro Garcia",
      email: "pedro@email.com",
      phone: "+63 915 567 8901",
      havenName: "Haven 5",
      checkIn: "2025-01-25",
      checkOut: "2025-01-26",
      guests: 5,
      amount: 2100,
      rateType: "21H Weekend",
      status: "pending",
      createdAt: "2025-01-10 2:15 PM",
    },
  ]);

  const handleApprove = (id: number) => {
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "approved" } : b)));
  };

  const handleDecline = (id: number) => {
    setBookings(bookings.map((b) => (b.id === id ? { ...b, status: "declined" } : b)));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Stats
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "pending").length,
      approved: bookings.filter(b => b.status === "approved").length,
      declined: bookings.filter(b => b.status === "declined").length,
    };
  }, [bookings]);

  // Filter
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.havenName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterStatus === "all" || booking.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [bookings, searchTerm, filterStatus]);

  // Sort
  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      if (!sortField) return 0;

      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "guestName") {
        aValue = a.guestName;
        bValue = b.guestName;
      } else if (sortField === "id") {
        aValue = a.bookingRef;
        bValue = b.bookingRef;
      } else if (sortField === "haven") {
        aValue = a.havenName;
        bValue = b.havenName;
      } else if (sortField === "checkIn") {
        aValue = a.checkIn;
        bValue = b.checkIn;
      } else if (sortField === "checkOut") {
        aValue = a.checkOut;
        bValue = b.checkOut;
      } else if (sortField === "status") {
        aValue = a.status;
        bValue = b.status;
      } else if (sortField === "amount") {
        aValue = a.amount;
        bValue = b.amount;
      } else {
        aValue = a[sortField as keyof Booking] as string | number;
        bValue = b[sortField as keyof Booking] as string | number;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === "asc" ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });
  }, [filteredBookings, sortField, sortDirection]);

  // Pagination
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

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedBooking(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Guest Assistance & Booking Approvals
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage booking requests, approve reservations, and assist guests
          </p>
        </div>
        {/* No "New Booking" button — keep as-is */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: stats.total.toString(), color: "bg-blue-500", icon: Calendar },
          { label: "Pending", value: stats.pending.toString(), color: "bg-yellow-500", icon: Clock },
          { label: "Approved", value: stats.approved.toString(), color: "bg-green-500", icon: CheckCircle },
          { label: "Declined", value: stats.declined.toString(), color: "bg-red-500", icon: X },
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
                placeholder="Search by booking reference, guest name, or haven..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
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
                    Booking Ref
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
                  onClick={() => handleSort("amount")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
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
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{booking.bookingRef}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.createdAt}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{booking.guestName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{booking.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {booking.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm whitespace-nowrap">{booking.havenName}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.rateType}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <div className="whitespace-nowrap">{formatDate(booking.checkIn)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <div className="whitespace-nowrap">{formatDate(booking.checkOut)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {booking.guests}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                        {formatCurrency(booking.amount)}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
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
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                handleApprove(booking.id);
                                toast.success("Booking approved");
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                handleDecline(booking.id);
                                toast.error("Booking declined");
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Decline"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-4">
        {paginatedBookings.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No bookings found</div>
        ) : (
          paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Booking Ref</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{booking.bookingRef}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.createdAt}</p>
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
                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{booking.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 break-all">{booking.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{booking.phone}</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Haven</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{booking.havenName}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{booking.rateType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Guests</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{booking.guests}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-In</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(booking.checkIn)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-Out</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(booking.checkOut)}</p>
                </div>
              </div>

              {/* Total and Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                  <p className="font-bold text-green-600 dark:text-green-400 text-lg">{formatCurrency(booking.amount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewBooking(booking)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {booking.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(booking.id);
                          toast.success("Booking approved");
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          handleDecline(booking.id);
                          toast.error("Booking declined");
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Decline"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
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
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

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

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

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

      {/* View Modal */}
      {isViewModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={handleCloseModal}
          ></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-50 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Booking Details</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status === "pending" ? <Clock className="w-4 h-4" /> : selectedBooking.status === "approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </span>
              </div>

              {/* Guest Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Guest Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Name:</span> {selectedBooking.guestName}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {selectedBooking.email}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {selectedBooking.phone}</p>
                </div>
              </div>

              {/* Reservation */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Reservation Details
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Haven:</span> {selectedBooking.havenName}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Rate Type:</span> {selectedBooking.rateType}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Check-In:</span> {formatDate(selectedBooking.checkIn)}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Check-Out:</span> {formatDate(selectedBooking.checkOut)}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Guests:</span> {selectedBooking.guests}</p>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Total Amount:</span> {formatCurrency(selectedBooking.amount)}</p>
                  <p><span className="font-medium text-gray-700 dark:text-gray-300">Booked On:</span> {selectedBooking.createdAt}</p>
                </div>
              </div>

              {/* Message */}
              {selectedBooking.message && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Guest Message
                  </h3>
                  <p className="text-sm italic text-gray-700 dark:text-gray-300">“{selectedBooking.message}”</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selectedBooking.status === "pending" && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => {
                    handleDecline(selectedBooking.id);
                    toast.error("Booking declined");
                    handleCloseModal();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={() => {
                    handleApprove(selectedBooking.id);
                    toast.success("Booking approved");
                    handleCloseModal();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestAssistancePage;