"use client";

import OwnerPageHeader from "./OwnerPageHeader";
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
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import { useState, useMemo } from "react";
import {
  useGetBookingsQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
} from "@/redux/api/bookingsApi";
import { Booking, AdditionalGuest } from "@/types/booking";
import NewReservationModal from "./NewReservationModal";
import toast from "react-hot-toast";

const ReservationsPage = () => {
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHaven, setSelectedHaven] = useState("all");
  const [checkInDateFrom, setCheckInDateFrom] = useState("");
  const [checkInDateTo, setCheckInDateTo] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingBookingId, setRejectingBookingId] = useState<string | null>(null);
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRejectConfirmStep, setIsRejectConfirmStep] = useState(false);

  const { data, isLoading, refetch } = useGetBookingsQuery(
    {},
    {
      pollingInterval: 5000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const [createBooking] = useCreateBookingMutation();
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  const reservations: Booking[] = data ?? [];

  const formatShortDate = (date?: string | null) =>
    date
      ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "N/A";

  const formatDateSafe = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString() : "";

  const formatTime = (time?: string | null) => {
    if (!time) return "N/A";
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr ?? "00";
    if (isNaN(hour)) return time;
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute} ${period}`;
  };

  const formatStatus = (status?: string | null) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ") : "";

  const handleApprove = async (bookingId: string) => {
    try {
      await updateBookingStatus({ id: bookingId, status: "approved" }).unwrap();
      alert("Booking approved! Confirmation email will be sent to the guest.");
      refetch();
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking. Please try again.");
    }
  };

  const openRejectModal = (bookingId: string) => {
    setRejectingBookingId(bookingId);
    setRejectionReasonDraft("");
    setIsRejectConfirmStep(false);
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    if (isRejecting) return;
    setIsRejectModalOpen(false);
    setRejectingBookingId(null);
    setRejectionReasonDraft("");
    setIsRejectConfirmStep(false);
  };

  const confirmReject = async () => {
    if (!rejectingBookingId) return;
    const reason = rejectionReasonDraft.trim();
    if (!reason) {
      toast.error("Rejection reason is required");
      return;
    }
    setIsRejecting(true);
    try {
      await updateBookingStatus({
        id: rejectingBookingId,
        status: "rejected",
        rejection_reason: reason,
      }).unwrap();
      toast.success("Booking rejected. Guest will be notified.");
      closeRejectModal();
      refetch();
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Failed to reject booking. Please try again.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const booking = reservations.find((r) => r.id === bookingId);
      if (!booking) { alert("Booking not found"); return; }

      await updateBookingStatus({ id: bookingId, status: "checked-in" }).unwrap();

      try {
        const emailResponse = await fetch("/api/send-checkin-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: booking.guest_first_name || "Guest",
            lastName: booking.guest_last_name || "",
            email: booking.guest_email || "",
            bookingId: booking.booking_id,
            roomName: booking.room_name,
            checkInDate: formatDateSafe(booking.check_in_date),
            checkInTime: booking.check_in_time,
            checkOutDate: formatDateSafe(booking.check_out_date),
            checkOutTime: booking.check_out_time,
            guests: `${booking.adults || 0} Adults, ${booking.children || 0} Children, ${booking.infants || 0} Infants`,
          }),
        });
        if (!emailResponse.ok) console.error("Failed to send check-in email");
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
      const booking = reservations.find((r) => r.id === bookingId);
      if (!booking) { alert("Booking not found"); return; }

      await updateBookingStatus({ id: bookingId, status: "completed" }).unwrap();

      try {
        const emailResponse = await fetch("/api/send-checkout-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: booking.guest_first_name || "Guest",
            lastName: booking.guest_last_name || "",
            email: booking.guest_email || "",
            bookingId: booking.booking_id,
            roomName: booking.room_name,
            checkInDate: formatDateSafe(booking.check_in_date),
            checkOutDate: formatDateSafe(booking.check_out_date),
            totalAmount: Number(booking.total_amount).toLocaleString(),
            remainingBalance: Number(booking.remaining_balance),
          }),
        });
        if (!emailResponse.ok) console.error("Failed to send check-out email");
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

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "approved":
      case "confirmed":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "checked-in":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const uniqueHavens = useMemo(() => {
    const names = reservations.map((r: Booking) => r.room_name).filter(Boolean) as string[];
    return [...new Set(names)].sort();
  }, [reservations]);

  const filteredReservations = useMemo(() => reservations.filter((r: Booking) => {
    const matchesStatus = filter === "all" || r.status === filter;

    const matchesHaven = selectedHaven === "all" || (r.room_name || "") === selectedHaven;

    let matchesCheckIn = true;
    if (checkInDateFrom || checkInDateTo) {
      const checkIn = r.check_in_date ? new Date(r.check_in_date) : null;
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
      }
    }

    if (!searchQuery?.trim()) return matchesStatus && matchesHaven && matchesCheckIn;
    const q = searchQuery.trim().toLowerCase();
    const bookingId = String(r.booking_id || r.id || "").toLowerCase();
    const guestFirst = String(r.guest_first_name || "").toLowerCase();
    const guestLast = String(r.guest_last_name || "").toLowerCase();
    const guestFull = `${guestFirst} ${guestLast}`.trim();
    return (
      matchesStatus && matchesHaven && matchesCheckIn &&
      (bookingId.includes(q) || guestFirst.includes(q) || guestLast.includes(q) || guestFull.includes(q))
    );
  }), [reservations, filter, searchQuery, selectedHaven, checkInDateFrom, checkInDateTo]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReservations = filteredReservations.slice(startIndex, endIndex);

  const handleViewDetails = async (booking: Booking) => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}`);
      const result = await response.json();
      if (result.success) {
        const data = result.data;
        // Normalize additional_guests to camelCase so the display renders correctly
        data.additional_guests = (data.additional_guests || []).map((g: any) => ({
          firstName: g.first_name || g.firstName || '',
          lastName: g.last_name || g.lastName || '',
          age: g.age,
          gender: g.gender,
          validIdUrl: g.valid_id_url || g.validIdUrl || '',
          email: g.email,
          phone: g.phone,
          facebook_link: g.facebook_link,
        }));
        setSelectedBooking(data);
      } else {
        toast.error("Failed to load booking details");
      }
    } catch (error) {
      console.error("Error loading booking details:", error);
      toast.error("Failed to load booking details");
    }
  };

  const closeModal = () => setSelectedBooking(null);

  const handleNewReservation = async (formData: any) => {
    try {
      await createBooking(formData).unwrap();
      await refetch();
      toast.success("New reservation created successfully!");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation");
      throw error;
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  return (
    <>
      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="sticky top-0 bg-[#a1823d] text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <p className="text-sm opacity-90">ID: {selectedBooking.booking_id}</p>
              </div>
              <button
                type="button"
                title="Close"
                aria-label="Close"
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <span className={`px-6 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                  {formatStatus(selectedBooking.status)}
                </span>
              </div>

              {/* Booking / Haven Information */}
              <div className="bg-slate-100 dark:bg-[#334155] rounded-lg p-6 border border-slate-200 dark:border-[#475569]">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#d4a574]" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Haven</p>
                    <p className="font-semibold text-slate-900 dark:text-gray-100">{selectedBooking.room_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Total Guests</p>
                    <p className="font-semibold text-slate-900 dark:text-gray-100">
                      {(selectedBooking.adults || 0) + (selectedBooking.children || 0) + (selectedBooking.infants || 0)}
                      <span className="text-xs text-slate-500 dark:text-gray-400 ml-1">
                        (Adult:{selectedBooking.adults || 0} Children:{selectedBooking.children || 0} Infant:{selectedBooking.infants || 0})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Check-In</p>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      {formatDateSafe(selectedBooking.check_in_date)} {formatTime(selectedBooking.check_in_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Check-Out</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {formatDateSafe(selectedBooking.check_out_date)} {formatTime(selectedBooking.check_out_time)}
                    </p>
                  </div>
                  {selectedBooking.payment_method && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Payment Method</p>
                      <p className="font-semibold text-slate-900 dark:text-gray-100 capitalize">{selectedBooking.payment_method}</p>
                    </div>
                  )}
                  {selectedBooking.total_amount != null && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Total Amount</p>
                      <p className="font-semibold text-slate-900 dark:text-gray-100">
                        ₱{Number(selectedBooking.total_amount).toLocaleString()}
                        {Number(selectedBooking.remaining_balance) > 0 && (
                          <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                            (Bal: ₱{Number(selectedBooking.remaining_balance).toLocaleString()})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Guest Information */}
              <div className="bg-slate-100 dark:bg-[#334155] rounded-lg p-6 border border-slate-200 dark:border-[#475569]">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#d4a574]" />
                  Main Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Full Name</p>
                    <p className="font-semibold text-slate-900 dark:text-gray-100">
                      {selectedBooking.guest_first_name} {selectedBooking.guest_last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-slate-900 dark:text-gray-100">{selectedBooking.guest_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-gray-400">Phone</p>
                    <p className="font-semibold text-slate-900 dark:text-gray-100">{selectedBooking.guest_phone}</p>
                  </div>
                  {selectedBooking.guest_age && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Age</p>
                      <p className="font-semibold text-slate-900 dark:text-gray-100">{selectedBooking.guest_age} years old</p>
                    </div>
                  )}
                  {selectedBooking.guest_gender && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Gender</p>
                      <p className="font-semibold text-slate-900 dark:text-gray-100 capitalize">{selectedBooking.guest_gender}</p>
                    </div>
                  )}
                  {selectedBooking.facebook_link && (
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400">Facebook</p>
                      <a
                        href={selectedBooking.facebook_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                </div>

                {(selectedBooking.valid_id_url || selectedBooking.payment_proof_url) && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedBooking.valid_id_url && (
                        <div>
                          <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Valid ID
                          </h4>
                          <div className="relative w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                            <Image src={selectedBooking.valid_id_url} alt="Main Guest Valid ID" fill className="object-contain" />
                          </div>
                          <a href={selectedBooking.valid_id_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm">
                            Open in new tab →
                          </a>
                        </div>
                      )}
                      {selectedBooking.payment_proof_url && (
                        <div>
                          <h4 className="text-md font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                            Payment Proof
                          </h4>
                          <div className="relative w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                            <Image src={selectedBooking.payment_proof_url} alt="Payment Proof" fill className="object-contain" />
                          </div>
                          <a href={selectedBooking.payment_proof_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm">
                            Open in new tab →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Guests */}
              {selectedBooking.additional_guests?.length ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    Additional Guests ({selectedBooking.additional_guests.length})
                  </h3>
                  <div className="space-y-6">
                    {Array.isArray(selectedBooking.additional_guests) &&
                      selectedBooking.additional_guests.map((guest: AdditionalGuest, index: number) => {
                        const guestNumber = index + 2;
                        const isAdult = index < (selectedBooking.adults || 0) - 1;
                        const guestType = isAdult
                          ? `Adult ${guestNumber}`
                          : `Child ${guestNumber - ((selectedBooking.adults || 0) - 1)}`;
                        return (
                          <div key={index} className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                            <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-3">{guestType}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-sm text-slate-500 dark:text-gray-400">Full Name</p>
                                <p className="font-semibold text-slate-900 dark:text-gray-100">{guest.firstName} {guest.lastName}</p>
                              </div>
                              {guest.age && (
                                <div>
                                  <p className="text-sm text-slate-500 dark:text-gray-400">Age</p>
                                  <p className="font-semibold text-slate-900 dark:text-gray-100">{guest.age} years old</p>
                                </div>
                              )}
                              {guest.gender && (
                                <div>
                                  <p className="text-sm text-slate-500 dark:text-gray-400">Gender</p>
                                  <p className="font-semibold text-slate-900 dark:text-gray-100 capitalize">{guest.gender}</p>
                                </div>
                              )}
                            </div>
                            {guest.validIdUrl && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h5 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  Valid ID
                                </h5>
                                <div className="relative w-full max-w-sm h-48 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                                  <Image src={guest.validIdUrl} alt={`${guest.firstName} ${guest.lastName} Valid ID`} fill className="object-contain" />
                                </div>
                                <a href={guest.validIdUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm">
                                  Open in new tab →
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null}

              {/* Modal Action Buttons */}
              <div className="flex gap-3 justify-center mt-6 flex-wrap">
                {selectedBooking.status === "pending" && (
                  <>
                    <button
                      onClick={() => { handleApprove(selectedBooking.id); closeModal(); }}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Approve
                    </button>
                    <button
                      onClick={() => { openRejectModal(selectedBooking.id); closeModal(); }}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-5 h-5" /> Reject
                    </button>
                  </>
                )}
                {selectedBooking.status === "approved" && (
                  <button
                    onClick={() => { handleCheckIn(selectedBooking.id); closeModal(); }}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Check In Guest
                  </button>
                )}
                {selectedBooking.status === "checked-in" && (
                  <button
                    onClick={() => { handleCheckOut(selectedBooking.id); closeModal(); }}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Check Out Guest
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-700">
        <OwnerPageHeader
          title="Reservations"
          description="Manage all your bookings and reservations"
          actions={
            <button
              onClick={() => setIsNewReservationModalOpen(true)}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              type="button"
            >
              + New Reservation
            </button>
          }
        />

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { key: "pending", label: "Pending", bg: "bg-yellow-400 text-white", icon: <AlertCircle className="w-10 h-10" /> },
            { key: "approved", label: "Approved", bg: "bg-green-500 text-white", icon: <Check className="w-10 h-10" /> },
            { key: "checked-in", label: "Checked In", bg: "bg-blue-500 text-white", icon: <MapPin className="w-10 h-10" /> },
            { key: "completed", label: "Completed", bg: "bg-gray-500 text-white", icon: <Package className="w-10 h-10" /> },
            { key: "rejected", label: "Rejected", bg: "bg-red-500 text-white", icon: <X className="w-10 h-10" /> },
            { key: "cancelled", label: "Cancelled", bg: "bg-red-600 text-white", icon: <XCircle className="w-10 h-10" /> },
          ].map((s) => {
            const count = reservations.filter((r) => r.status === s.key).length;
            return (
              <div key={s.key} className={`rounded-xl p-5 ${s.bg} shadow-lg relative overflow-hidden`}>
                <div className="text-sm font-medium opacity-90 mb-2">{s.label}</div>
                <div className="text-3xl font-bold">{count}</div>
                <div className="absolute bottom-2 right-2 opacity-30">{s.icon}</div>
              </div>
            );
          })}
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-4 border border-gray-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Show</label>
              <select
                aria-label="Entries per page"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border rounded-md px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
              >
                {[5, 10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by booking ID or guest name..."
                className="w-full border rounded-lg px-4 py-2 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
            </div>
            <div className="w-full sm:w-auto">
              <select
                aria-label="Filter by status"
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-3 py-2 text-sm w-full dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
              >
                {["all","pending","approved","confirmed","checked-in","completed","rejected","cancelled"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</option>
                ))}
              </select>
            </div>

            {/* Haven filter */}
            <div className="w-full sm:w-auto">
              <select
                aria-label="Filter by haven"
                value={selectedHaven}
                onChange={(e) => { setSelectedHaven(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-3 py-2 text-sm w-full dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
              >
                <option value="all">All Havens</option>
                {uniqueHavens.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            {/* Check-in date range */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Check-in:</span>
              <input
                type="date"
                aria-label="Check-in date from"
                value={checkInDateFrom}
                onChange={(e) => { setCheckInDateFrom(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-2 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              <span className="text-gray-400 text-xs">–</span>
              <input
                type="date"
                aria-label="Check-in date to"
                value={checkInDateTo}
                min={checkInDateFrom}
                onChange={(e) => { setCheckInDateTo(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-2 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none"
              />
              {(checkInDateFrom || checkInDateTo) && (
                <button
                  onClick={() => { setCheckInDateFrom(""); setCheckInDateTo(""); setCurrentPage(1); }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-colors text-xs"
                  title="Clear dates"
                >✕</button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-12 border border-gray-200 dark:border-slate-800 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Reservations Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no {filter !== "all" ? filter : ""} reservations at the moment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full min-w-[1400px]">
                <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-700">
                  <tr>
                    {["ID", "Guest", "Haven", "Check-In", "Check-Out", "Guests", "Status", "Amount", "Actions"].map((h) => (
                      <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-tight ${ h === "Guests" ? "text-center w-12" : h === "Actions" ? "text-center" : "text-left" }`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                  {currentReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{reservation.booking_id}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-start gap-1.5 min-w-[140px]">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {reservation.guest_first_name} {reservation.guest_last_name}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{reservation.guest_email}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">{reservation.guest_phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <span className="truncate max-w-[80px]">{reservation.room_name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatShortDate(reservation.check_in_date)}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{formatTime(reservation.check_in_time)}</div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{formatShortDate(reservation.check_out_date)}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">{formatTime(reservation.check_out_time)}</div>
                      </td>
                      <td className="px-1.5 py-1.5 whitespace-nowrap text-center w-12">
                        <div className="relative group inline-block">
                          <div className="text-sm font-bold text-gray-900 dark:text-white cursor-default">
                            {(reservation.adults || 0) + (reservation.children || 0) + (reservation.infants || 0)}
                          </div>
                          <div className="absolute z-10 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap">
                            <div>Adult: {reservation.adults || 0}</div>
                            <div>Children: {reservation.children || 0}</div>
                            <div>Infant: {reservation.infants || 0}</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(reservation.status)}`}>
                          {formatStatus(reservation.status)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          ₱{Number(reservation.total_amount).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-orange-600 dark:text-orange-400">
                          Bal: ₱{Number(reservation.remaining_balance).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {reservation.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(reservation.id)} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600" title="Approve">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => openRejectModal(reservation.id)} className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {reservation.status === "approved" && (
                            <button onClick={() => handleCheckIn(reservation.id)} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                              Check In
                            </button>
                          )}
                          {reservation.status === "checked-in" && (
                            <button onClick={() => handleCheckOut(reservation.id)} className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600">
                              Check Out
                            </button>
                          )}
                          <button onClick={() => handleViewDetails(reservation)} className="p-1.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-slate-800" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredReservations.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-700 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredReservations.length)} of {filteredReservations.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="First page"
                aria-label="First page"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Previous page"
                aria-label="Previous page"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${currentPage === pageNum ? "bg-orange-500 text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                title="Next page"
                aria-label="Next page"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Last page"
                aria-label="Last page"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeRejectModal} />
          <div className="relative w-[92%] max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rejection Reason</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This will be sent to the guest.</p>
              </div>
              <button onClick={closeRejectModal} disabled={isRejecting} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 disabled:opacity-50" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4">
              <textarea
                value={rejectionReasonDraft}
                onChange={(e) => setRejectionReasonDraft(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-gray-900 dark:text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter reason..."
              />
            </div>
            {isRejectConfirmStep && (
              <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-3">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Confirm rejection</p>
                <p className="text-xs text-red-700/90 dark:text-red-300/90 mt-1">
                  This will mark the booking as rejected and send the reason to the guest.
                </p>
              </div>
            )}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={closeRejectModal} disabled={isRejecting} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50">
                Cancel
              </button>
              {isRejectConfirmStep && (
                <button onClick={() => setIsRejectConfirmStep(false)} disabled={isRejecting} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50">
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (!isRejectConfirmStep) {
                    if (!rejectionReasonDraft.trim()) { toast.error("Rejection reason is required"); return; }
                    setIsRejectConfirmStep(true);
                    return;
                  }
                  confirmReject();
                }}
                disabled={isRejecting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRejecting ? "Rejecting..." : isRejectConfirmStep ? "Yes, Reject" : "Reject Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NewReservationModal
        isOpen={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
        onSubmit={handleNewReservation}
      />
    </>
  );
};

export default ReservationsPage;