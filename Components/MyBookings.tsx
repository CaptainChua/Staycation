'use client';

import { useState, useMemo } from 'react';
import { Calendar, MapPin, Users, ChevronRight, Clock, CheckCircle, XCircle, Loader2, Home, Ban, FileText } from 'lucide-react';
import SidebarLayout from './SidebarLayout';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { useGetUserBookingsQuery, useUpdateBookingStatusMutation } from '@/redux/api/bookingsApi';

interface Booking {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  room_name: string;
  room_images?: string[];
  tower?: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  status: string;
  total_amount: number;
  created_at?: string;
}

interface MyBookingsPageProps {
  initialData: {
    success: boolean;
    data: Booking[];
  };
  userId: string;
}

const MyBookingsPage = ({ initialData, userId }: MyBookingsPageProps) => {
  const [filterStatus, setFilterStatus] = useState('all'); // all, upcoming, past, cancelled

  const formatTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // RTK Query hooks - fetch all bookings, filter on client side
  const { data: bookingsData, refetch } = useGetUserBookingsQuery(
    { userId, status: undefined } // Always fetch all bookings
  );

  const [updateBookingStatus, { isLoading: isUpdating }] = useUpdateBookingStatusMutation();

  // Map database status to display status
  const getDisplayStatus = (booking: Booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    const checkInDate = new Date(booking.check_in_date);
    checkInDate.setHours(0, 0, 0, 0);

    const checkOutDate = new Date(booking.check_out_date);
    checkOutDate.setHours(0, 0, 0, 0);

    // Cancelled bookings
    if (booking.status === 'cancelled' || booking.status === 'rejected') return 'cancelled';

    // Completed bookings or past check-out date
    if (booking.status === 'completed' || checkOutDate < today) return 'past';

    // Active/Upcoming bookings (pending, approved, confirmed, check_in, checked-in)
    if (['pending', 'approved', 'confirmed', 'check_in', 'checked-in'].includes(booking.status)) {
      // If check-in date is today or in the future, it's upcoming
      if (checkInDate >= today) return 'upcoming';
      // If we're between check-in and check-out, it's still upcoming (active stay)
      if (checkInDate <= today && checkOutDate >= today) return 'upcoming';
    }

    return 'past';
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await updateBookingStatus({
        id: bookingId,
        status: 'cancelled'
      }).unwrap();
      toast.success('Booking cancelled successfully');
      refetch();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  // Filter bookings based on status
  const bookings = useMemo(() => {
    // Use RTK Query data if available, otherwise use SSR initialData
    const dataSource = bookingsData?.data || initialData?.data || [];
    if (filterStatus === 'all') return dataSource;

    return dataSource.filter((booking: Booking) => {
      const displayStatus = getDisplayStatus(booking);
      return displayStatus === filterStatus;
    });
  }, [bookingsData, initialData, filterStatus]);

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: "bg-brand-primary/10 text-brand-primary",
      past: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      cancelled: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
    };
    return badges[status as keyof typeof badges] || badges.past;
  };

  const getBookingStatusBadge = (status: string) => {
    const statusBadges = {
      pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700",
      approved: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
      confirmed: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
      check_in: "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
      'checked-in': "bg-brand-primary/10 text-brand-primary border border-brand-primary/20",
      completed: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600",
      cancelled: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700",
      rejected: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700"
    };
    return statusBadges[status as keyof typeof statusBadges] || statusBadges.pending;
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5" />;
      case 'approved':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'confirmed':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'check_in':
      case 'checked-in':
        return <Home className="w-3.5 h-3.5" />;
      case 'completed':
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'rejected':
        return <Ban className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      pending: "Waiting for admin approval",
      approved: "Booking approved by admin",
      confirmed: "Booking confirmed - Ready for check-in",
      check_in: "Currently checked in - Enjoy your stay!",
      'checked-in': "Currently checked in - Enjoy your stay!",
      completed: "Stay completed",
      cancelled: "Booking cancelled",
      rejected: "Booking rejected by admin"
    };
    return descriptions[status as keyof typeof descriptions] || "";
  };

  return (
    <SidebarLayout>
      <Toaster position="top-center" />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-16 overflow-hidden border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-primary rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary rounded-full translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-400 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <Calendar className="w-8 h-8 text-brand-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            My Bookings
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            View and manage your staycation reservations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { label: 'All Bookings', value: 'all', icon: null },
            { label: 'Upcoming', value: 'upcoming', icon: <Clock className="w-4 h-4" /> },
            { label: 'Past', value: 'past', icon: <CheckCircle className="w-4 h-4" /> },
            { label: 'Cancelled', value: 'cancelled', icon: <XCircle className="w-4 h-4" /> }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                filterStatus === filter.value
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filter.icon && <span className="flex-shrink-0">{filter.icon}</span>}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No {filterStatus !== 'all' ? filterStatus : ''} bookings found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filterStatus === 'all' 
                ? "You don't have any bookings yet." 
                : `You don't have any ${filterStatus} bookings.`}
            </p>
            <Link href="/rooms">
              <button className="px-8 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors">
                Browse Havens
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking: Booking) => {
              const displayStatus = getDisplayStatus(booking);
              // Get first image from room_images array, fallback to default
              const firstImage = Array.isArray(booking.room_images) && booking.room_images.length > 0
                ? booking.room_images[0]
                : '/Images/bg.jpg';
              const totalGuests = booking.adults + booking.children + booking.infants;

              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                    {/* Room Image */}
                    <div className="md:col-span-1">
                      <Image
                        src={firstImage}
                        alt={booking.room_name}
                        width={400}
                        height={300}
                        className="w-full h-48 md:h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="md:col-span-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                              {booking.room_name}
                            </h3>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Booking Ref: <span className="font-mono font-semibold">{booking.booking_id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-3">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">
                                {booking.tower || 'Quezon City'}
                              </span>
                            </div>
                            {/* Booking Status Badge */}
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit ${getBookingStatusBadge(booking.status)}`}>
                                <span className="text-xs">{getStatusIcon(booking.status)}</span>
                                <span>{booking.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {getStatusDescription(booking.status)}
                              </span>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${getStatusBadge(displayStatus)}`}>
                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                            <div className="p-2 rounded-lg bg-brand-primary/10">
                              <Calendar className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Check-in</p>
                              <p className="font-semibold text-gray-800 dark:text-white">
                                {new Date(booking.check_in_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatTo12Hour(booking.check_in_time)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                            <div className="p-2 rounded-lg bg-brand-primary/10">
                              <Calendar className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Check-out</p>
                              <p className="font-semibold text-gray-800 dark:text-white">
                                {new Date(booking.check_out_date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatTo12Hour(booking.check_out_time)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                            <div className="p-2 rounded-lg bg-brand-primary/10">
                              <Users className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Guests</p>
                              <p className="font-semibold text-gray-800 dark:text-white">{totalGuests} {totalGuests === 1 ? 'person' : 'people'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Price</p>
                          <p className="text-2xl font-bold text-brand-primary">₱{booking.total_amount.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <Link href={`/bookings/${booking.id}`} className="w-full sm:w-auto">
                            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-all duration-300 w-full sm:w-auto">
                              View Details
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </Link>
                          {displayStatus === 'upcoming' && booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={isUpdating}
                              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 w-full sm:w-auto"
                            >
                              {isUpdating ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Cancelling...</span>
                                </>
                              ) : 'Cancel Booking'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default MyBookingsPage;
