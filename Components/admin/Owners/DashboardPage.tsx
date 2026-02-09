"use client";

import { Calendar, DollarSign, Users, Package, CreditCard, Sparkles, XCircle, TrendingUp, TrendingDown, Home, Clock, AlertTriangle, CheckCircle, RefreshCw, Building2, Star, BarChart3, Target, UserCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGetRoomBookingsQuery } from "@/redux/api/bookingsApi";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import { useGetBookingPaymentsQuery } from "@/redux/api/bookingPaymentsApi";
import { useGetReviewsQuery } from "@/redux/api/reviewsApi";

// Export Haven type for use in other components
export type Haven = {
  id?: number;
  uuid_id?: string;
  haven_name: string;
  name?: string;
  tower: string;
  floor: string;
  view_type?: string;
  capacity?: number;
  room_size?: number;
  beds?: string;
  description?: string;
  youtube_url?: string;
  six_hour_rate?: number;
  ten_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  six_hour_check_in?: string;
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amenities?: any;
  created_at?: string;
  updated_at?: string;
  blocked_dates?: Array<{
    from_date: string;
    to_date: string;
  }>;
  [key: string]: unknown;
};

interface Booking {
  id: string;
  booking_id: string;
  user_id?: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "confirmed"
    | "checked-in"
    | "completed"
    | "cancelled";
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Payment data from booking_payments
  booking_payments?: {
    total_amount: number;
    down_payment: number;
    remaining_balance: number;
    payment_method: string;
  }[];
  // Guest data from booking_guests
  booking_guests?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }[];
}

interface Review {
  id: string;
  booking_id: string;
  rating: number;
  comment: string;
  created_at: string;
  booking?: {
    room_name: string;
    booking_guests?: {
      first_name: string;
      last_name: string;
    }[];
  };
}

interface DashboardPageProps {
  onAddUnitClick: () => void;
  onPaymentClick: () => void;
  onBookingClick: () => void;
  onPoliciesClick: () => void;
  havens: Haven[];
}

interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  Icon: any;
  color: string;
  loading?: boolean;
}

interface ActivityItem {
  id: string;
  time: string;
  action: string;
  customer: string;
  details: string;
  status: string;
  statusColor: string;
  Icon: any;
  iconColor: string;
}

const DashboardPage = ({
  onAddUnitClick,
  onPaymentClick,
  onBookingClick,
  onPoliciesClick,
  havens,
}: DashboardPageProps) => {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch real data from APIs
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useGetRoomBookingsQuery();
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = useGetBookingPaymentsQuery();
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useGetReviewsQuery();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBookings(),
        refetchPayments(),
        refetchReviews()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate owner-specific metrics
  const bookings: Booking[] = bookingsData?.data || [];
  const payments = paymentsData?.data || [];
  const reviews: Review[] = reviewsData?.data || [];

  // Calculate revenue from approved payments
  const totalRevenue = payments
    .filter((payment: any) => payment.payment_status === 'approved')
    .reduce((sum: number, payment: any) => sum + (Number(payment.total_amount) || 0), 0);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum: number, review: any) => sum + (review.overall_rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Calculate today's tasks
  const today = new Date().toDateString();
  const todayTasks = {
    checkins: bookings.filter((booking) => 
      new Date(booking.check_in_date).toDateString() === today
    ).length,
    checkouts: bookings.filter((booking) => 
      new Date(booking.check_out_date).toDateString() === today
    ).length,
    pending: bookings.filter((booking) => booking.status === 'pending').length
  };

  // Calculate occupancy rate
  const activeBookings = bookings.filter((booking) =>
    ['approved', 'confirmed', 'checked-in'].includes(booking.status)
  ).length;
  const occupancyRate = havens.length > 0 ? Math.round((activeBookings / (havens.length * 30)) * 100) : 0;

  // KPI data for owner
  const kpiData: KPICard[] = [
    {
      title: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      Icon: DollarSign,
      color: "bg-green-500",
      loading: paymentsLoading
    },
    {
      title: "Active Bookings",
      value: activeBookings,
      Icon: Calendar,
      color: "bg-blue-500",
      loading: bookingsLoading
    },
    {
      title: "Average Rating",
      value: `${averageRating} ⭐`,
      Icon: Star,
      color: "bg-yellow-500",
      loading: reviewsLoading
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      Icon: Building2,
      color: "bg-purple-500",
      loading: bookingsLoading
    }
  ];

  // Recent bookings for activity
  const activityItems: ActivityItem[] = bookings.slice(0, 5).map((booking, index) => {
    const guest = booking.booking_guests?.[0];
    const guestName = guest ? `${guest.first_name} ${guest.last_name}` : 'Guest';
    
    return {
      id: booking.id || `booking-${index}`,
      time: new Date(booking.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      action: 'New Booking',
      customer: guestName,
      details: `${booking.room_name} - ${booking.adults + booking.children} guests`,
      status: booking.status,
      statusColor: booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-gray-100 text-gray-700',
      Icon: Calendar,
      iconColor: 'text-blue-600'
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Owner Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor your property performance and guest satisfaction</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {kpiData.map((kpi, i) => {
          const IconComponent = kpi.Icon;
          return (
            <div
              key={i}
              className={`${kpi.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm opacity-90">{kpi.title}</p>
                  <div className="text-3xl font-bold mt-2">
                    {kpi.loading ? (
                      <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                    ) : (
                      kpi.value
                    )}
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50 flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-brand-primary" />
            Today&apos;s Overview
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Check-ins</span>
              </div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {bookingsLoading ? (
                  <div className="w-8 h-6 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" />
                ) : (
                  todayTasks.checkins
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Check-outs</span>
              </div>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {bookingsLoading ? (
                  <div className="w-8 h-6 bg-orange-200 dark:bg-orange-800 rounded animate-pulse" />
                ) : (
                  todayTasks.checkouts
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Pending</span>
              </div>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {bookingsLoading ? (
                  <div className="w-8 h-6 bg-yellow-200 dark:bg-yellow-800 rounded animate-pulse" />
                ) : (
                  todayTasks.pending
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-primary" />
            Guest Satisfaction
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Average Rating</span>
              </div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {reviewsLoading ? (
                  <div className="w-12 h-6 bg-green-200 dark:bg-green-800 rounded animate-pulse" />
                ) : (
                  `${averageRating} ⭐`
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Reviews</span>
              </div>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {reviewsLoading ? (
                  <div className="w-8 h-6 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" />
                ) : (
                  reviews.length
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            Property Stats
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Havens</span>
              </div>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {havens.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Occupancy Rate</span>
              </div>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {bookingsLoading ? (
                  <div className="w-12 h-6 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse" />
                ) : (
                  `${occupancyRate}%`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Bookings</h3>
          {bookingsLoading && (
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Time
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Guest
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Details
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Haven
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {bookingsLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-4 px-4">
                      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto" />
                    </td>
                  </tr>
                ))
              ) : activityItems.length > 0 ? (
                activityItems.map((item) => {
                  const ActivityIcon = item.Icon;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-in fade-in duration-500"
                    >
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {item.time}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {item.customer}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {item.details}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <ActivityIcon className={`w-4 h-4 ${item.iconColor}`} />
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {item.action}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${item.statusColor}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No recent bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing {activityItems.length} of {bookings.length} bookings
          </p>
          <button 
            onClick={onBookingClick}
            className="text-sm font-semibold bg-gradient-to-r from-brand-primary to-brand-primaryDark bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            View All Bookings
          </button>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
