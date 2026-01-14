'use client';

import { Calendar, User, MapPin, Phone, Mail, Check, X, AlertCircle, Eye, XCircle, CreditCard } from "lucide-react";
import { useState } from "react";
import { useGetBookingsQuery, useUpdateBookingStatusMutation } from "@/redux/api/bookingsApi";
import Image from "next/image";

interface AdditionalGuest {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  validIdUrl?: string;
  [key: string]: unknown;
}

interface Booking {
  id: string;
  status: string;
  booking_id?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  guest_age?: string;
  guest_gender?: string;
  facebook_link?: string;
  valid_id_url?: string;
  room_name?: string;
  adults?: number;
  children?: number;
  infants?: number;
  check_in_date?: string;
  check_in_time?: string;
  check_out_date?: string;
  check_out_time?: string;
  payment_method?: string;
  payment_proof_url?: string;
  rejection_reason?: string;
  created_at?: string;
  additional_guests?: AdditionalGuest[];
  total_amount?: number;
  down_payment?: number;
  remaining_balance?: number;
  [key: string]: unknown;
}

const ReservationsPage = () => {
  const [filter, setFilter] = useState("all");
  const { data, isLoading, refetch } = useGetBookingsQuery({});
  const [updateBookingStatus] = useUpdateBookingStatusMutation();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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
      // Find the booking details
      const booking = reservations.find((r: Booking) => r.id === bookingId);
      if (!booking) {
        alert('Booking not found');
        return;
      }

      // Update booking status to checked-in
      await updateBookingStatus({
        id: bookingId,
        status: 'checked-in'
      }).unwrap();

      // Send check-in email to guest
      try {
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: new Date(booking.check_in_date || '').toLocaleDateString(),
          checkInTime: booking.check_in_time,
          checkOutDate: new Date(booking.check_out_date || '').toLocaleDateString(),
          checkOutTime: booking.check_out_time,
          guests: `${booking.adults || 0} Adults, ${booking.children || 0} Children, ${booking.infants || 0} Infants`,
        };

        const emailResponse = await fetch('/api/send-checkin-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData),
        });

        if (!emailResponse.ok) {
          console.error('Failed to send check-in email');
        } else {
          console.log('Check-in email sent to:', booking.guest_email);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the whole operation if email fails
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
      // Find the booking details
      const booking = reservations.find((r: Booking) => r.id === bookingId);
      if (!booking) {
        alert('Booking not found');
        return;
      }

      // Update booking status to completed
      await updateBookingStatus({
        id: bookingId,
        status: 'completed'
      }).unwrap();

      // Send check-out email to guest
      try {
        const emailData = {
          firstName: booking.guest_first_name,
          lastName: booking.guest_last_name,
          email: booking.guest_email,
          bookingId: booking.booking_id,
          roomName: booking.room_name,
          checkInDate: new Date(booking.check_in_date || '').toLocaleDateString(),
          checkOutDate: new Date(booking.check_out_date || '').toLocaleDateString(),
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
        } else {
          console.log('Check-out email sent to:', booking.guest_email);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the whole operation if email fails
      }

      alert('Guest checked out successfully! Thank you email sent.');
      refetch();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "checked-in": return "bg-green-100 text-green-700";
      case "completed": return "bg-gray-100 text-gray-700";
      case "rejected":
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredReservations = filter === "all"
    ? reservations
    : reservations.filter((r: Booking) => r.status === filter);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const closeModal = () => {
    setSelectedBooking(null);
  };

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
                <p className="text-sm opacity-90">ID: {selectedBooking.booking_id}</p>
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
                <span className={`px-6 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status.toUpperCase().replace("-", " ")}
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
                    <p className="font-semibold text-gray-800">{selectedBooking.guest_first_name} {selectedBooking.guest_last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">{selectedBooking.guest_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-800">{selectedBooking.guest_phone}</p>
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
                      <Check className="w-5 h-5" />
                      Approve Booking
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedBooking.id);
                        closeModal();
                      }}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Reject Booking
                    </button>
                  </>
                )}
                {(selectedBooking.status === "approved" || selectedBooking.status === "confirmed") && (
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reservations</h1>
            <p className="text-gray-600">Manage all your bookings and reservations</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            + New Reservation
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {["all", "pending", "approved", "confirmed", "checked-in", "completed", "rejected", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filter === status
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
              </button>
            ))}
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Reservations Found</h3>
              <p className="text-gray-600">There are no {filter !== 'all' ? filter : ''} reservations at the moment.</p>
            </div>
          ) : (
            filteredReservations.map((reservation: Booking) => (
              <div key={reservation.id} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {reservation.guest_first_name} {reservation.guest_last_name}
                        </h3>
                        <p className="text-sm text-gray-500">Booking ID: {reservation.booking_id}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reservation.status)}`}>
                        {reservation.status.toUpperCase().replace("-", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {reservation.guest_email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {reservation.guest_phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {reservation.room_name || 'Room not specified'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {(reservation.adults || 0) + (reservation.children || 0) + (reservation.infants || 0)} Guests ({reservation.adults || 0} Adults, {reservation.children || 0} Children, {reservation.infants || 0} Infants)
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Check-in:</span>
                        {new Date(reservation.check_in_date || '').toLocaleDateString()} at {reservation.check_in_time}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">Check-out:</span>
                        {new Date(reservation.check_out_date || '').toLocaleDateString()} at {reservation.check_out_time}
                      </div>
                    </div>

                    {reservation.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-red-700 mb-1">Rejection Reason:</p>
                        <p className="text-red-600">{reservation.rejection_reason as string}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col justify-between items-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">₱{Number(reservation.total_amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Down Payment: ₱{Number(reservation.down_payment).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Balance: ₱{Number(reservation.remaining_balance).toLocaleString()}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-end">
                      {reservation.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Approve
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
      </div>
    </>
  );
};

export default ReservationsPage;