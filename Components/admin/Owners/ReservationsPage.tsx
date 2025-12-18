'use client';

import { Calendar, User, MapPin, Phone, Mail, Check, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useGetBookingsQuery, useUpdateBookingStatusMutation } from "@/redux/api/bookingsApi";

const ReservationsPage = () => {
  const [filter, setFilter] = useState("all");
  const { data, isLoading, refetch } = useGetBookingsQuery({});
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  const reservations = data?.data || [];

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
      await updateBookingStatus({
        id: bookingId,
        status: 'checked-in'
      }).unwrap();

      alert('Guest checked in successfully!');
      refetch();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      await updateBookingStatus({
        id: bookingId,
        status: 'completed'
      }).unwrap();

      alert('Guest checked out successfully!');
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
    : reservations.filter((r: any) => r.status === filter);

  return (
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
          filteredReservations.map((reservation: any) => (
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
                      {reservation.adults + reservation.children + reservation.infants} Guests ({reservation.adults} Adults, {reservation.children} Children, {reservation.infants} Infants)
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Check-in:</span>
                      {new Date(reservation.check_in_date).toLocaleDateString()} at {reservation.check_in_time}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="font-medium">Check-out:</span>
                      {new Date(reservation.check_out_date).toLocaleDateString()} at {reservation.check_out_time}
                    </div>
                  </div>

                  {reservation.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-red-700 mb-1">Rejection Reason:</p>
                      <p className="text-red-600">{reservation.rejection_reason}</p>
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
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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
  );
};

export default ReservationsPage;
