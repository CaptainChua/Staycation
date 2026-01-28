'use client';

import { useState, useMemo } from 'react';
import { Calendar, MapPin, Users, ChevronRight, Clock, CheckCircle, XCircle, Loader2, Home, Ban, FileText, Star, X, List, History, MessageSquare, ThumbsUp, Eye } from 'lucide-react';
import SidebarLayout from './SidebarLayout';
import Link from 'next/link';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { useGetUserBookingsQuery, useUpdateBookingStatusMutation } from '@/redux/api/bookingsApi';
import { useSubmitReviewMutation, useGetHavenReviewsQuery } from '@/redux/api/reviewsApi';

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
  haven_id?: string;
  has_reviewed?: boolean;
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'to_review' | 'past' | 'cancelled'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<{[key: string]: number}>({});
  const [reviewComment, setReviewComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState<{[key: string]: number}>({});
  const [isPublic, setIsPublic] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const formatTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // RTK Query hooks
  const { data: bookingsData, refetch } = useGetUserBookingsQuery(
    { userId, status: undefined }
  );

  const [updateBookingStatus, { isLoading: isUpdating }] = useUpdateBookingStatusMutation();
  const [submitReview, { isLoading: isSubmittingReview }] = useSubmitReviewMutation();

  // Map database status to display status
  const getDisplayStatus = (booking: Booking) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInDate = new Date(booking.check_in_date);
    checkInDate.setHours(0, 0, 0, 0);

    const checkOutDate = new Date(booking.check_out_date);
    checkOutDate.setHours(0, 0, 0, 0);

    // Cancelled bookings
    if (booking.status === 'cancelled' || booking.status === 'rejected') return 'cancelled';

    // Completed bookings - eligible for review
    if (booking.status === 'completed') {
      if (booking.has_reviewed) return 'past';
      return 'to_review';
    }

    // Past check-out date (not completed status) - also past
    if (checkOutDate < today) return 'past';

    // Active/Upcoming bookings
    if (['pending', 'approved', 'confirmed', 'check_in', 'checked_in'].includes(booking.status)) {
      if (checkInDate >= today) return 'upcoming';
      if (checkInDate <= today && checkOutDate >= today) return 'upcoming';
    }

    return 'past';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'checked-in':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'upcoming': return "Upcoming stay";
      case 'completed': return "Completed";
      case 'cancelled': return "Cancelled";
      case 'rejected': return "Booking rejected by admin";
      case 'pending': return "Pending approval";
      case 'confirmed': return "Confirmed";
      case 'checked-in': return "Currently checked in";
      default: return status;
    }
  };

  // Review modal handlers
  const openReviewModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewRating({});
    setReviewComment('');
    setIsPublic(true);
    setIsVerified(false);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedBooking(null);
    setReviewRating({});
    setReviewComment('');
    setHoveredRating({});
    setIsPublic(true);
    setIsVerified(false);
  };

  const handleSubmitReview = async () => {
    const hasRatings = Object.keys(reviewRating).length > 0;
    if (!hasRatings) {
      toast.error('Please select at least one rating');
      return;
    }

    if (!selectedBooking) {
      toast.error('No booking selected');
      return;
    }

    try {
      const result = await submitReview({
        booking_id: selectedBooking.id,
        haven_id: selectedBooking.haven_id || selectedBooking.id,
        user_id: userId,
        comment: reviewComment || undefined,
        cleanliness_rating: reviewRating.cleanliness || undefined,
        communication_rating: reviewRating.communication || undefined,
        checkin_rating: reviewRating.checkIn || undefined,
        accuracy_rating: reviewRating.accuracy || undefined,
        location_rating: reviewRating.location || undefined,
        value_rating: reviewRating.value || undefined,
        is_public: isPublic,
        is_verified: isVerified,
      }).unwrap();

      if (result.success) {
        toast.success('Thank you for your review!');
        closeReviewModal();
        refetch();
      } else {
        toast.error(result.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.data?.error || 'Failed to submit review. Please try again.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus({ id: bookingId, status: 'cancelled' }).unwrap();
      toast.success('Booking cancelled successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  // Filter bookings based on status
  const bookings = useMemo(() => {
    if (!bookingsData?.data) return [];
    
    return bookingsData.data.filter((booking: Booking) => {
      const displayStatus = getDisplayStatus(booking);
      if (filterStatus === 'all') return true;
      return displayStatus === filterStatus;
    });
  }, [bookingsData, filterStatus]);

  // Review categories
  const reviewCategories = [
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'communication', label: 'Communication' },
    { key: 'checkIn', label: 'Check-in' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'location', label: 'Location' },
    { key: 'value', label: 'Value' }
  ];

  return (
    <SidebarLayout>
      <Toaster position="top-center" />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide pb-2">
            {[
              { label: 'All', value: 'all', icon: <List className="w-4 h-4" /> },
              { label: 'Upcoming', value: 'upcoming', icon: <Clock className="w-4 h-4" /> },
              { label: 'To Review', value: 'to_review', icon: <Star className="w-4 h-4" /> },
              { label: 'Past', value: 'past', icon: <History className="w-4 h-4" /> },
              { label: 'Cancelled', value: 'cancelled', icon: <XCircle className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value as typeof filterStatus)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  filterStatus === tab.value
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {bookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            {filterStatus === 'to_review' ? (
              <Star className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            ) : (
              <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {filterStatus === 'to_review'
                ? 'No bookings to review'
                : filterStatus !== 'all'
                  ? `No ${filterStatus} bookings found`
                  : 'No bookings found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filterStatus === 'all'
                ? "You don't have any bookings yet."
                : filterStatus === 'to_review'
                  ? "Complete a stay to leave a review."
                  : `You don't have any ${filterStatus} bookings.`}
            </p>
            <Link href="/rooms">
              <button className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors text-sm">
                Browse Havens
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: Booking) => {
              const displayStatus = getDisplayStatus(booking);
              const firstImage = Array.isArray(booking.room_images) && booking.room_images.length > 0
                ? booking.room_images[0]
                : '/Images/bg.jpg';
              const totalGuests = booking.adults + booking.children + booking.infants;
              const isExpanded = expandedBooking === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  {/* Compact Booking Header */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Room Image */}
                      <div className="flex-shrink-0">
                        <Image
                          src={firstImage}
                          alt={booking.room_name}
                          width={80}
                          height={80}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* Booking Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0 flex-1 pr-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {booking.room_name}
                            </h3>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Ref: {booking.booking_id}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${getBookingStatusBadge(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="hidden sm:inline">{getStatusDescription(booking.status)}</span>
                            <span className="sm:hidden">{booking.status}</span>
                          </span>
                        </div>

                        {/* Quick Details */}
                        <div className="grid grid-cols-1 sm:flex sm:items-center sm:gap-4 gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="truncate">
                              {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{totalGuests} guests</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{booking.tower || 'QC'}</span>
                          </div>
                          <div className="font-semibold text-brand-primary">
                            ₱{(booking.total_amount ?? 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mt-1"
                      >
                        <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Booking Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Booking Details</h4>
                          <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                              <span className="text-gray-900 dark:text-white text-right">
                                {new Date(booking.check_in_date).toLocaleDateString()} at {formatTo12Hour(booking.check_in_time)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                              <span className="text-gray-900 dark:text-white text-right">
                                {new Date(booking.check_out_date).toLocaleDateString()} at {formatTo12Hour(booking.check_out_time)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                              <span className="text-gray-900 dark:text-white text-right">
                                {booking.adults} adults, {booking.children} children, {booking.infants} infants
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-gray-600 dark:text-gray-400">Guest:</span>
                              <div className="text-right">
                                <div className="text-gray-900 dark:text-white font-medium">
                                  {booking.guest_first_name} {booking.guest_last_name}
                                </div>
                                <div className="text-gray-900 dark:text-white text-sm break-all">
                                  {booking.guest_email}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Review Section */}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Review Status</h4>
                          {booking.has_reviewed ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">Review Submitted</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Your review has been submitted and is helping other guests make informed decisions.
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                <Eye className="w-3 h-3" />
                                <span>Public review - visible to other guests</span>
                              </div>
                            </div>
                          ) : displayStatus === 'to_review' ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-medium">Review Your Stay</span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Share your experience to help other guests choose the perfect stay.
                              </div>
                              <button
                                onClick={() => openReviewModal(booking)}
                                className="w-full px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors text-sm"
                              >
                                Write Review
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Reviews are available for completed stays.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Link href={`/bookings/${booking.id}`} className="flex-1">
                            <button className="w-full px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors text-xs sm:text-sm">
                              View Details
                            </button>
                          </Link>
                          {displayStatus === 'upcoming' && booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={isUpdating}
                              className="flex-1 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-xs sm:text-sm"
                            >
                              {isUpdating ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeReviewModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Write Your Review
                </h2>
                <button
                  onClick={closeReviewModal}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-6">
              {/* Room Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={Array.isArray(selectedBooking.room_images) && selectedBooking.room_images.length > 0
                      ? selectedBooking.room_images[0]
                      : '/Images/bg.jpg'}
                    alt={selectedBooking.room_name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedBooking.room_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(selectedBooking.check_in_date).toLocaleDateString()} - {new Date(selectedBooking.check_out_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Rating Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Rate your experience
                </label>
                <div className="space-y-3">
                  {reviewCategories.map((category) => (
                    <div key={category.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {category.label}
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(prev => ({...prev, [category.key]: star}))}
                            onMouseEnter={() => setHoveredRating(prev => ({...prev, [category.key]: star}))}
                            onMouseLeave={() => setHoveredRating(prev => ({...prev, [category.key]: 0}))}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                star <= (hoveredRating[category.key] || reviewRating[category.key] || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Share your experience (optional)
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us about your stay..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:focus:border-brand-primary resize-none transition-all"
                />
              </div>

              {/* Review Options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Review Options</p>
                
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <label htmlFor="isPublic" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      Make this review public
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your review will be visible to other guests on the room page
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary focus:ring-2"
                  />
                  <div className="flex-1">
                    <label htmlFor="isVerified" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      Verify this review
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Confirm this is a genuine review based on your actual stay
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex gap-3">
              <button
                onClick={closeReviewModal}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={Object.keys(reviewRating).length === 0 || isSubmittingReview}
                className="flex-1 px-4 py-2 text-sm bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingReview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

export default MyBookingsPage;
