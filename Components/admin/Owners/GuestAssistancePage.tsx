"use client";

import { useState } from "react";
import {
  Check,
  X,
  Clock,
  User,
  Calendar,
  Home,
  DollarSign,
  Mail,
  Eye,
  Filter,
  Search,
  AlertCircle,
} from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "declined" | "all"
  >("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Sample booking data
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
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: "approved" } : b))
    );
  };

  const handleDecline = (id: number) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: "declined" } : b))
    );
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesTab =
      activeTab === "all" ? true : booking.status === activeTab;
    const matchesSearch =
      booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.havenName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "declined":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <Check className="w-4 h-4" />;
      case "declined":
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const approvedCount = bookings.filter((b) => b.status === "approved").length;
  const declinedCount = bookings.filter((b) => b.status === "declined").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Guest Assistance & Booking Approvals
          </h2>
          <p className="text-sm text-gray-600">
            Manage booking requests, approve reservations, and assist guests
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 opacity-90" />
            <span className="text-3xl font-bold">{pendingCount}</span>
          </div>
          <p className="text-sm opacity-90 mb-1 font-semibold">
            Pending Approval
          </p>
          <p className="text-xs opacity-75">Awaiting your decision</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <Check className="w-8 h-8 opacity-90" />
            <span className="text-3xl font-bold">{approvedCount}</span>
          </div>
          <p className="text-sm opacity-90 mb-1 font-semibold">Approved</p>
          <p className="text-xs opacity-75">Confirmed reservations</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <X className="w-8 h-8 opacity-90" />
            <span className="text-3xl font-bold">{declinedCount}</span>
          </div>
          <p className="text-sm opacity-90 mb-1 font-semibold">Declined</p>
          <p className="text-xs opacity-75">Rejected requests</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-8 h-8 opacity-90" />
            <span className="text-3xl font-bold">{bookings.length}</span>
          </div>
          <p className="text-sm opacity-90 mb-1 font-semibold">
            Total Bookings
          </p>
          <p className="text-xs opacity-75">All time requests</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 min-w-[150px] px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === "pending"
                ? "text-orange-600 bg-orange-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            {activeTab === "pending" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex-1 min-w-[150px] px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === "approved"
                ? "text-green-600 bg-green-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              <span>Approved</span>
            </div>
            {activeTab === "approved" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-500"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("declined")}
            className={`flex-1 min-w-[150px] px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === "declined"
                ? "text-red-600 bg-red-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <X className="w-5 h-5" />
              <span>Declined</span>
            </div>
            {activeTab === "declined" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 min-w-[150px] px-6 py-4 font-semibold text-sm transition-all relative ${
              activeTab === "all"
                ? "text-blue-600 bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Filter className="w-5 h-5" />
              <span>All Bookings</span>
            </div>
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by guest name, booking reference, or haven..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Booking Ref
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Guest
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Haven
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Check In
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Check Out
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Guests
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Amount
                </th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">
                  Status
                </th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-600 font-medium">
                        No bookings found
                      </p>
                      <p className="text-sm text-gray-500">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-in fade-in duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-blue-600">
                        {booking.bookingRef}
                      </span>
                      <p className="text-xs text-gray-500">
                        {booking.createdAt}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {booking.guestName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {booking.guestName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {booking.havenName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.rateType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">
                        {booking.checkIn}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">
                        {booking.checkOut}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {booking.guests}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-green-600">
                          ₱{booking.amount.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusIcon(booking.status)}
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                        </button>
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(booking.id)}
                              className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                              title="Approve"
                            >
                              <Check className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleDecline(booking.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                              title="Decline"
                            >
                              <X className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
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

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                Previous
              </button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                1
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[99999]"
            onClick={() => setShowDetailModal(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-t-2xl flex-shrink-0">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Booking Details
                  </h2>
                  <p className="text-sm text-gray-600">
                    Reference: {selectedBooking.bookingRef}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full ${getStatusColor(
                      selectedBooking.status
                    )}`}
                  >
                    {getStatusIcon(selectedBooking.status)}
                    {selectedBooking.status.charAt(0).toUpperCase() +
                      selectedBooking.status.slice(1)}
                  </span>
                </div>

                {/* Guest Information */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Guest Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Name:</span>
                      <span className="font-semibold text-purple-950">
                        {selectedBooking.guestName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Email:</span>
                      <span className="font-semibold text-purple-950">
                        {selectedBooking.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Phone:</span>
                      <span className="font-semibold text-purple-950">
                        {selectedBooking.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Reservation Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Haven:</span>
                      <span className="font-semibold text-blue-950">
                        {selectedBooking.havenName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Check In:</span>
                      <span className="font-semibold text-blue-950">
                        {selectedBooking.checkIn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Check Out:</span>
                      <span className="font-semibold text-blue-950">
                        {selectedBooking.checkOut}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Rate Type:</span>
                      <span className="font-semibold text-blue-950">
                        {selectedBooking.rateType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Number of Guests:</span>
                      <span className="font-semibold text-blue-950">
                        {selectedBooking.guests} people
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Amount:</span>
                      <span className="font-bold text-green-950 text-lg">
                        ₱{selectedBooking.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Booking Date:</span>
                      <span className="font-semibold text-green-950">
                        {selectedBooking.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guest Message */}
                {selectedBooking.message && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Guest Message
                    </h3>
                    <p className="text-sm text-gray-700 italic">
                      &ldquo;{selectedBooking.message}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedBooking.status === "pending" && (
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
                  <button
                    onClick={() => {
                      handleDecline(selectedBooking.id);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Decline Booking
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedBooking.id);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Approve Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GuestAssistancePage;