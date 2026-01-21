"use client";

import {
  Calendar,
  User,
  MapPin,
  Check,
  X,
  AlertCircle,
  Eye,
  XCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import {
  useGetBookingsQuery,
  useUpdateBookingStatusMutation,
} from "@/redux/api/bookingsApi";

import { Booking } from "@/types/booking";

const ReservationsPage = () => {
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useGetBookingsQuery({});
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const reservations: Booking[] = data ?? [];

  const formatShortDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const formatDateSafe = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString() : "";

  const formatStatus = (status?: string | null) =>
    status
      ? status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")
      : "";

  const handleApprove = async (bookingId: string) => {
    try {
      await updateBookingStatus({
        id: bookingId,
        status: "approved",
      }).unwrap();

      alert("Booking approved! Confirmation email will be sent to the guest.");
      refetch();
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking. Please try again.");
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt("Please enter rejection reason:");
    if (!reason) return;
    try {
      await updateBookingStatus({
        id: bookingId,
        status: "rejected",
        rejection_reason: reason,
      }).unwrap();

      alert("Booking rejected. Guest will be notified.");
      refetch();
    } catch (error) {
      console.error("Error rejecting booking:", error);
      alert("Failed to reject booking. Please try again.");
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      // Find the booking details
      const booking = reservations.find((r: Booking) => r.id === bookingId);
      if (!booking) {
        alert("Booking not found");
        return;
      }

      // Update booking status to checked-in
      await updateBookingStatus({
        id: bookingId,
        status: "checked-in",
      }).unwrap();

      // Send check-in email to guest
      try {
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: formatDateSafe(booking.check_in_date),
          checkInTime: booking.check_in_time,
          checkOutDate: formatDateSafe(booking.check_out_date),
          checkOutTime: booking.check_out_time,
          guests: `${booking.adults || 0} Adults, ${booking.children || 0} Children, ${booking.infants || 0} Infants`,
        };

        const emailResponse = await fetch("/api/send-checkin-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send check-in email");
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      alert("Guest checked in successfully! Confirmation email sent.");
      refetch();
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in. Please try again.");
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      // Find the booking details
      const booking = reservations.find((r: Booking) => r.id === bookingId);
      if (!booking) {
        alert("Booking not found");
        return;
      }

      // Update booking status to completed
      await updateBookingStatus({
        id: bookingId,
        status: "completed",
      }).unwrap();

      // Send check-out email to guest
      try {
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: formatDateSafe(booking.check_in_date),
          checkOutDate: formatDateSafe(booking.check_out_date),
          totalAmount: Number(booking.total_amount).toLocaleString(),
          remainingBalance: Number(booking.remaining_balance),
        };

        const emailResponse = await fetch("/api/send-checkout-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          console.error("Failed to send check-out email");
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }

      alert("Guest checked out successfully! Thank you email sent.");
      refetch();
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Failed to check out. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "checked-in":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-gray-100 text-gray-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredReservations = reservations.filter((r: Booking) => {
    const matchesStatus = filter === "all" || r.status === filter;

    if (
      !searchQuery ||
      typeof searchQuery !== "string" ||
      searchQuery.trim() === ""
    ) {
      return matchesStatus;
    }

    const q = searchQuery.trim().toLowerCase();
    const bookingId = String(r.booking_id || r.id || "").toLowerCase();
    const guestFirst = String(r.guest_first_name || "").toLowerCase();
    const guestLast = String(r.guest_last_name || "").toLowerCase();
    const guestFull = `${guestFirst} ${guestLast}`.trim();

    const matchesSearch =
      bookingId.includes(q) ||
      guestFirst.includes(q) ||
      guestLast.includes(q) ||
      guestFull.includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const closeModal = () => {
    setSelectedBooking(null);
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <>
      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <p className="text-sm opacity-90">
                  ID: {selectedBooking.booking_id}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span
                  className={`px-6 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status ?? "")}`}
                >
                  {formatStatus(selectedBooking.status)}
                </span>
              </div>

              {/* Guest Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Main Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold text-gray-800">
                      {selectedBooking.guest_first_name}{" "}
                      {selectedBooking.guest_last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">
                      {selectedBooking.guest_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-800">
                      {selectedBooking.guest_phone}
                    </p>
                  </div>
                  {selectedBooking.guest_age && (
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-semibold text-gray-800">{selectedBooking.guest_age} years old</p>
                    </div>
                  )}
                  {selectedBooking.guest_gender && (
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-semibold text-gray-800 capitalize">{selectedBooking.guest_gender}</p>
                    </div>
                  )}
                  {selectedBooking.facebook_link && (
                    <div>
                      <p className="text-sm text-gray-500">Facebook</p>
                      <a href={selectedBooking.facebook_link} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                        View Profile
                      </a>
                    </div>
                  )}
                </div>

                {/* Main Guest Valid ID */}
                {selectedBooking.valid_id_url && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Valid ID
                    </h4>
                    <div className="relative w-full max-w-md h-64 bg-gray-200 rounded-lg overflow-hidden">
                      <Image
                        src={selectedBooking.valid_id_url as string}
                        alt="Main Guest Valid ID"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <a
                      href={selectedBooking.valid_id_url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-blue-600 hover:underline text-sm"
                    >
                      Open in new tab →
                    </a>
                  </div>
                )}
              </div>

              {/* Additional Guests */}
              {selectedBooking.additional_guests && selectedBooking.additional_guests.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    Additional Guests ({selectedBooking.additional_guests.length})
                  </h3>
                  <div className="space-y-6">
                    {selectedBooking.additional_guests.map((guest: AdditionalGuest, index: number) => {
                      const guestNumber = index + 2;
                      const isAdult = index < (selectedBooking.adults || 0) - 1;
                      const guestType = isAdult ? `Adult ${guestNumber}` : `Child ${guestNumber - ((selectedBooking.adults || 0) - 1)}`;

                      return (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-orange-600 mb-3">{guestType}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-sm text-gray-500">Full Name</p>
                              <p className="font-semibold text-gray-800">{guest.firstName as string} {guest.lastName as string}</p>
                            </div>
                            {guest.age && (
                              <div>
                                <p className="text-sm text-gray-500">Age</p>
                                <p className="font-semibold text-gray-800">{guest.age} years old</p>
                              </div>
                            )}
                            {guest.gender && (
                              <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="font-semibold text-gray-800 capitalize">{guest.gender as string}</p>
                              </div>
                            )}
                          </div>

                          {/* Additional Guest Valid ID */}
                          {guest.validIdUrl && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-blue-600" />
                                Valid ID
                              </h5>
                              <div className="relative w-full max-w-sm h-48 bg-gray-200 rounded-lg overflow-hidden">
                                <Image
                                  src={guest.validIdUrl as string}
                                  alt={`${guest.firstName as string} ${guest.lastName as string} Valid ID`}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <a
                                href={guest.validIdUrl as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-blue-600 hover:underline text-sm"
                              >
                                Open in new tab →
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center mt-6">
                {selectedBooking.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedBooking.id);
                        closeModal();
                      }}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Approve Booking
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedBooking.id);
                        closeModal();
                      }}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-5 h-5" /> Reject Booking
                    </button>
                  </>
                )}
                {(selectedBooking.status === "approved" ||
                  selectedBooking.status === "confirmed") && (
                  <button
                    onClick={() => {
                      handleCheckIn(selectedBooking.id);
                      closeModal();
                    }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Check In Guest
                  </button>
                )}
                {selectedBooking.status === "checked-in" && (
                  <button
                    onClick={() => {
                      handleCheckOut(selectedBooking.id);
                      closeModal();
                    }}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Check Out Guest
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Reservations
            </h1>
            <p className="text-gray-600">
              Manage all your bookings and reservations
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            + New Reservation
          </button>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            {
              key: "pending",
              label: "Pending",
              bg: "bg-yellow-400 text-white",
              icon: <AlertCircle className="w-10 h-10" />,
            },
            {
              key: "approved",
              label: "Approved",
              bg: "bg-green-500 text-white",
              icon: <Check className="w-10 h-10" />,
            },
            {
              key: "confirmed",
              label: "Confirmed",
              bg: "bg-emerald-500 text-white",
              icon: <Calendar className="w-10 h-10" />,
            },
            {
              key: "checked-in",
              label: "Checked In",
              bg: "bg-blue-500 text-white",
              icon: <MapPin className="w-10 h-10" />,
            },
            {
              key: "completed",
              label: "Completed",
              bg: "bg-gray-500 text-white",
              icon: <Package className="w-10 h-10" />,
            },
            {
              key: "rejected",
              label: "Rejected",
              bg: "bg-red-500 text-white",
              icon: <X className="w-10 h-10" />,
            },
            {
              key: "cancelled",
              label: "Cancelled",
              bg: "bg-red-600 text-white",
              icon: <XCircle className="w-10 h-10" />,
            },
          ].map((s) => {
            const count = reservations.filter(
              (r: Booking) => r.status === s.key,
            ).length;
            return (
              <div
                key={s.key}
                className={`rounded-xl p-5 ${s.bg} shadow-lg relative overflow-hidden`}
              >
                <div className="text-sm font-medium opacity-90 mb-2">
                  {s.label}
                </div>
                <div className="text-3xl font-bold">{count}</div>
                <div className="absolute bottom-2 right-2 opacity-30">
                  {s.icon}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-md px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex-1 w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by booking ID or guest name..."
                className="w-full border rounded-lg px-4 py-2 text-sm"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-3 py-2 text-sm w-full"
              >
                {[
                  "all",
                  "pending",
                  "approved",
                  "confirmed",
                  "checked-in",
                  "completed",
                  "rejected",
                  "cancelled",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-200 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No Reservations Found
              </h3>
              <p className="text-gray-600">
                There are no {filter !== "all" ? filter : ""} reservations at
                the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Haven
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Check-In
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Check-Out
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Guests
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-tight">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentReservations.map((reservation: Booking) => (
                    <tr
                      key={reservation.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-900">
                          {reservation.booking_id}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-start gap-1.5 min-w-[140px]">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {reservation.guest_first_name}{" "}
                              {reservation.guest_last_name}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {reservation.guest_email}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {reservation.guest_phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span className="truncate max-w-[80px]">
                            {reservation.room_name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {formatShortDate(reservation.check_in_date)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {reservation.check_in_time}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {formatShortDate(reservation.check_out_date)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {reservation.check_out_time}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-center">
                        <div className="text-base font-bold text-gray-900">
                          {(reservation.adults || 0) +
                            (reservation.children || 0) +
                            (reservation.infants || 0)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          A:{reservation.adults || 0} C:
                          {reservation.children || 0} I:
                          {reservation.infants || 0}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(reservation.status ?? "")}`}
                        >
                          {formatStatus(reservation.status)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-900">
                          ₱{Number(reservation.total_amount).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-orange-600">
                          Bal: ₱
                          {Number(
                            reservation.remaining_balance,
                          ).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {reservation.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(reservation.id)}
                                className="p-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(reservation.id)}
                                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {(reservation.status === "approved" ||
                            reservation.status === "confirmed") && (
                            <button
                              onClick={() => handleCheckIn(reservation.id)}
                              className="px-2 py-0.5 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap"
                            >
                              Check In
                            </button>
                          )}
                          {reservation.status === "checked-in" && (
                            <button
                              onClick={() => handleCheckOut(reservation.id)}
                              className="px-2 py-0.5 text-[10px] bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors whitespace-nowrap"
                            >
                              Check Out
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="p-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(reservation.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {(reservation.status === "approved" || reservation.status === "confirmed") && (
                        <button
                          onClick={() => handleCheckIn(reservation.id)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Check In
                        </button>
                      )}
                      {reservation.status === "checked-in" && (
                        <button
                          onClick={() => handleCheckOut(reservation.id)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(reservation)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredReservations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredReservations.length)} of{" "}
              {filteredReservations.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
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
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      currentPage === pageNum
                        ? "bg-orange-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReservationsPage;
