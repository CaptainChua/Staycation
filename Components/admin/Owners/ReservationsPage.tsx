'use client';


import { Calendar, User, MapPin, Phone, Mail, Check, X, AlertCircle, Eye, XCircle, CreditCard, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useRef } from "react";
import { useGetBookingsQuery, useUpdateBookingStatusMutation, useCreateBookingMutation } from "@/redux/api/bookingsApi";
import NewReservationModal from "@/Components/admin/Owners/NewReservationModal";
import toast from "react-hot-toast";

interface AdditionalGuest {
  name: string;
  age?: number;
  [key: string]: unknown;
}

interface Booking {
  id: string;
  status: string;
  additional_guests?: AdditionalGuest[];
  booking_id?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  room_name?: string;
  check_in_date: string;    // ← Add this
  check_in_time?: string;
  check_out_date: string;   // ← Add this
  check_out_time?: string;
  adults?: number;
  children?: number;
  infants?: number;
  total_amount?: string | number;
  remaining_balance?: string | number;
  [key: string]: unknown;
}

const ReservationsPage = () => {
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data, isLoading, refetch } = useGetBookingsQuery({});
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [createBooking] = useCreateBookingMutation();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isNewReservationModalOpen, setIsNewReservationModalOpen] = useState(false);

  const reservations: Booking[] = (data as Booking[]) || [];

  const handleApprove = async (bookingId: string) => {
    try {
      await updateBookingStatus({
        id: bookingId,
        status: 'approved'
      }).unwrap();

      alert('Booking approved! Confirmation email will be sent to the guest.');
      refetch();
    } catch (error) {
      console.error('Error approving booking:', error);
      alert('Failed to approve booking. Please try again.');
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      await updateBookingStatus({
        id: bookingId,
        status: 'rejected',
        rejection_reason: reason
      }).unwrap();

      alert('Booking rejected. Guest will be notified.');
      refetch();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Failed to reject booking. Please try again.');
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const booking = reservations.find((r: Booking) => r.id === bookingId);
      if (!booking) {
        alert('Booking not found');
        return;
      }

      await updateBookingStatus({
        id: bookingId,
        status: 'checked-in'
      }).unwrap();

      try {
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: new Date(booking.check_in_date).toLocaleDateString(),
          checkInTime: booking.check_in_time,
          checkOutDate: new Date(booking.check_out_date).toLocaleDateString(),
          checkOutTime: booking.check_out_time,
          guests: `${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants`,
        };

        const emailResponse = await fetch('/api/send-checkin-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send check-in email');
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      alert('Guest checked in successfully! Confirmation email sent.');
      refetch();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const booking = reservations.find((r: Booking) => r.id === bookingId);
      if (!booking) {
        alert('Booking not found');
        return;
      }

      await updateBookingStatus({
        id: bookingId,
        status: 'completed'
      }).unwrap();

      try {
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: new Date(booking.check_in_date).toLocaleDateString(),
          checkOutDate: new Date(booking.check_out_date).toLocaleDateString(),
          totalAmount: Number(booking.total_amount).toLocaleString(),
          remainingBalance: Number(booking.remaining_balance),
        };

        const emailResponse = await fetch('/api/send-checkout-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send check-out email');
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      alert('Guest checked out successfully! Thank you email sent.');
      refetch();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out. Please try again.');
    }
  };

  const handleNewReservation = async (bookingData: any) => {
    try {
      let paymentProofBase64 = '';
      if (bookingData.paymentProof) {
        const reader = new FileReader();
        paymentProofBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(bookingData.paymentProof as File);
        });
      }

      let validIdBase64 = '';
      if (bookingData.validId) {
        const reader = new FileReader();
        validIdBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(bookingData.validId as File);
        });
      }

      const additionalGuestsData = await Promise.all(
        (bookingData.additionalGuests || []).map(async (guest: any) => {
          let guestIdBase64 = '';
          if (guest.validId) {
            const reader = new FileReader();
            guestIdBase64 = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(guest.validId as File);
            });
          }
          return {
            firstName: guest.firstName,
            lastName: guest.lastName,
            age: guest.age,
            gender: guest.gender,
            validId: guestIdBase64,
          };
        })
      );

      const bookingId = `BK${Date.now()}`;

      const bookingRequestData = {
        booking_id: bookingId,
        user_id: null,
        guest_first_name: bookingData.firstName,
        guest_last_name: bookingData.lastName,
        guest_age: bookingData.age,
        guest_gender: bookingData.gender,
        guest_email: bookingData.email,
        guest_phone: bookingData.phone,
        facebook_link: bookingData.facebookLink || '',
        valid_id: validIdBase64,
        additional_guests: additionalGuestsData,
        room_name: bookingData.roomName,
        stay_type: bookingData.stayType,
        check_in_date: bookingData.checkInDate,
        check_out_date: bookingData.checkOutDate,
        check_in_time: bookingData.checkInTime,
        check_out_time: bookingData.checkOutTime,
        adults: bookingData.adults,
        children: bookingData.children,
        infants: bookingData.infants,
        payment_method: bookingData.paymentMethod,
        payment_proof: paymentProofBase64,
        room_rate: bookingData.roomRate,
        security_deposit: bookingData.securityDeposit,
        add_ons_total: bookingData.addOnsTotal,
        total_amount: bookingData.totalAmount,
        down_payment: bookingData.downPayment,
        remaining_balance: bookingData.remainingBalance,
        add_ons: bookingData.addOns,
      };

      const result = await createBooking(bookingRequestData).unwrap();

      if (result.success) {
        toast.success(`Reservation created successfully! Booking ID: ${bookingId}`);
        setIsNewReservationModalOpen(false);
        refetch();
      } else {
        toast.error('Failed to create reservation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('An error occurred while creating the reservation.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "checked-in": return "bg-blue-100 text-blue-700";
      case "completed": return "bg-gray-100 text-gray-700";
      case "rejected":
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredReservations = reservations.filter((r: Booking) => {
    const matchesStatus = filter === "all" || r.status === filter;

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim() === '') {
      return matchesStatus;
    }

    const q = searchQuery.trim().toLowerCase();
    const bookingId = String(r.booking_id || r.id || '').toLowerCase();
    const guestFirst = String((r as any).guest_first_name || '').toLowerCase();
    const guestLast = String((r as any).guest_last_name || '').toLowerCase();
    const guestFull = `${guestFirst} ${guestLast}`.trim();

    const matchesSearch = bookingId.includes(q) || guestFirst.includes(q) || guestLast.includes(q) || guestFull.includes(q);

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
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  const statusCardsData = [
    { key: 'pending', label: 'Pending', bg: 'bg-yellow-400 text-white', icon: <AlertCircle className="w-14 h-14" /> },
    { key: 'approved', label: 'Approved', bg: 'bg-green-500 text-white', icon: <Check className="w-14 h-14" /> },
    { key: 'confirmed', label: 'Confirmed', bg: 'bg-emerald-500 text-white', icon: <Calendar className="w-14 h-14" /> },
    { key: 'checked-in', label: 'Checked In', bg: 'bg-blue-500 text-white', icon: <MapPin className="w-14 h-14" /> },
    { key: 'completed', label: 'Completed', bg: 'bg-gray-500 text-white', icon: <Package className="w-14 h-14" /> },
    { key: 'rejected', label: 'Rejected', bg: 'bg-red-500 text-white', icon: <X className="w-14 h-14" /> },
    { key: 'cancelled', label: 'Cancelled', bg: 'bg-red-600 text-white', icon: <XCircle className="w-14 h-14" /> },
  ];

  return (
    <>
      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-orange-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <p className="text-sm opacity-90">ID: {selectedBooking.booking_id}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <span className={`px-6 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status.toUpperCase().replace("-", " ")}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  Main Guest Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedBooking.guest_first_name} {selectedBooking.guest_last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedBooking.guest_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedBooking.guest_phone}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-gray-200 dark:border-gray-600 pt-6">
                {selectedBooking.status === "pending" && (
                  <>
                    <button onClick={() => { handleApprove(selectedBooking.id); closeModal(); }} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                      <Check className="w-5 h-5" /> Approve Booking
                    </button>
                    <button onClick={() => { handleReject(selectedBooking.id); closeModal(); }} className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
                      <X className="w-5 h-5" /> Reject Booking
                    </button>
                  </>
                )}
                {(selectedBooking.status === "approved" || selectedBooking.status === "confirmed") && (
                  <button onClick={() => { handleCheckIn(selectedBooking.id); closeModal(); }} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Check In Guest
                  </button>
                )}
                {selectedBooking.status === "checked-in" && (
                  <button onClick={() => { handleCheckOut(selectedBooking.id); closeModal(); }} className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    Check Out Guest
                  </button>
                )}
                <button onClick={closeModal} className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reservations</h1>
            <p className="text-gray-600">Manage all your bookings and reservations</p>
          </div>
          <button 
            onClick={() => setIsNewReservationModalOpen(true)}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
          >
            + New Reservation
          </button>
        </div>

        {/* Status summary cards */}
        {/* Large screens: show first 4 across and center the remaining 3 on the second row */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-6">
            {statusCardsData.slice(0, 4).map((s) => {
              const count = reservations.filter((r: Booking) => r.status === s.key).length;
              return (
                <div key={s.key} className={`rounded-2xl p-6 min-h-[120px] ${s.bg} shadow-lg relative overflow-hidden`}>
                  <div className="text-base font-medium opacity-95 mb-2">{s.label}</div>
                  <div className="text-4xl font-bold">{count}</div>
                  <div className="absolute bottom-3 right-3 opacity-30">{s.icon}</div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-6 mt-4">
            {statusCardsData.slice(4).map((s) => {
              const count = reservations.filter((r: Booking) => r.status === s.key).length;
              return (
                <div key={s.key} className={`rounded-2xl p-6 min-h-[120px] ${s.bg} shadow-lg relative overflow-hidden w-[240px]`}>
                  <div className="text-base font-medium opacity-95 mb-2">{s.label}</div>
                  <div className="text-4xl font-bold">{count}</div>
                  <div className="absolute bottom-3 right-3 opacity-30">{s.icon}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small/medium screens: responsive grid (fallback) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:hidden gap-6">
          {statusCardsData.map((s) => {
            const count = reservations.filter((r: Booking) => r.status === s.key).length;
            return (
              <div key={s.key} className={`rounded-2xl p-6 min-h-[120px] ${s.bg} shadow-lg relative overflow-hidden`}>
                <div className="text-base font-medium opacity-95 mb-2">{s.label}</div>
                <div className="text-4xl font-bold">{count}</div>
                <div className="absolute bottom-3 right-3 opacity-30">{s.icon}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show</label>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search by booking ID or guest name..."
                className="w-full border rounded-lg px-4 py-2 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg px-3 py-2 text-sm w-full"
              >
                {["all", "pending", "approved", "confirmed", "checked-in", "completed", "rejected", "cancelled"].map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table with Horizontal Scroll */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reservations Found</h3>
              <p className="text-gray-600">There are no {filter !== 'all' ? filter : ''} reservations at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[1400px]">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b-2 border-gray-200 dark:border-slate-700">
                  <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Booking ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Haven Location</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Guest</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Check-In</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Check-Out</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Assigned To</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                  <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-slate-700">
                  {currentReservations.map((reservation: Booking) => (
                      <tr key={reservation.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reservation.booking_id}</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{reservation.room_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{reservation.guest_first_name} {reservation.guest_last_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-800 dark:text-gray-200">{new Date(reservation.check_in_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} {reservation.check_in_time}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-800 dark:text-gray-200">{new Date(reservation.check_out_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} {reservation.check_out_time}</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-800 dark:text-gray-200">Unassigned</div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-md text-sm font-semibold ${getStatusColor(reservation.status)}`}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1).replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {reservation.status === "pending" && (
                            <>
                              <button onClick={() => handleApprove(reservation.id)} className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Approve">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleReject(reservation.id)} className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Reject">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(reservation.status === "approved" || reservation.status === "confirmed") && (
                            <button onClick={() => handleCheckIn(reservation.id)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Check In">
                              <MapPin className="w-4 h-4" />
                            </button>
                          )}
                          {reservation.status === "checked-in" && (
                            <button onClick={() => handleCheckOut(reservation.id)} className="p-2 text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed" title="Check Out">
                              <Package className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleViewDetails(reservation)} className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed" title="View Details">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed" title="View Clipboard">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
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

        {/* Pagination (matching MaintenancePage) */}
        {(!isLoading && filteredReservations.length > 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredReservations.length)} of {filteredReservations.length} entries
              </div>

              <div className="flex items-center gap-2">
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
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                  type="button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-brand-primary text-white shadow-md"
                          : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                      type="button"
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
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
        )}
      </div>

      {/* New Reservation Modal */}
      <NewReservationModal
        isOpen={isNewReservationModalOpen}
        onClose={() => setIsNewReservationModalOpen(false)}
        onSubmit={handleNewReservation}
      />
    </>
  );
};

export default ReservationsPage;