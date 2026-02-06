"use client";

import { Calendar, DollarSign, Users, Package, CreditCard, Sparkles, XCircle, TrendingUp, TrendingDown, Home, Clock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGetAnalyticsSummaryQuery } from "@/redux/api/analyticsApi";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import { useGetActivityLogsQuery } from "@/redux/api/activityLogApi";
import { useGetBookingPaymentsQuery } from "@/redux/api/bookingPaymentsApi";

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch real data from APIs
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useGetAnalyticsSummaryQuery({ period: '30' });
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useGetBookingsQuery();
  const { data: activityData, isLoading: activityLoading, refetch: refetchActivity } = useGetActivityLogsQuery({ limit: 10, employee_id: userId });
  const { data: paymentsData, isLoading: paymentsLoading, refetch: refetchPayments } = useGetBookingPaymentsQuery();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAnalytics(),
        refetchBookings(),
        refetchActivity(),
        refetchPayments()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate payment totals (amounts) from all payments data
  const paymentTotals = {
    pending: paymentsData?.filter((payment: any) => payment.payment_status === 'pending').reduce((sum: number, payment: any) => sum + (Number(payment.total_amount) || 0), 0) || 0,
    approved: paymentsData?.filter((payment: any) => payment.payment_status === 'approved').reduce((sum: number, payment: any) => sum + (Number(payment.total_amount) || 0), 0) || 0,
    rejected: paymentsData?.filter((payment: any) => payment.payment_status === 'rejected').reduce((sum: number, payment: any) => sum + (Number(payment.total_amount) || 0), 0) || 0,
    refunded: paymentsData?.filter((payment: any) => payment.payment_status === 'refunded').reduce((sum: number, payment: any) => sum + (Number(payment.total_amount) || 0), 0) || 0,
  };

  // Calculate payment counts from all payments data
  const paymentCounts = {
    pending: paymentsData?.filter((payment: any) => payment.payment_status === 'pending').length || 0,
    approved: paymentsData?.filter((payment: any) => payment.payment_status === 'approved').length || 0,
    rejected: paymentsData?.filter((payment: any) => payment.payment_status === 'rejected').length || 0,
    refunded: paymentsData?.filter((payment: any) => payment.payment_status === 'refunded').length || 0,
  };

  // Calculate total revenue from approved payments only (booking_payments where status = approved)
  const totalRevenue = paymentTotals.approved;

  // Calculate KPI data from real API responses
  const kpiData: KPICard[] = [
    {
      title: "Total Bookings",
      value: bookingsData?.length || 0,
      change: analyticsData?.data?.bookings_change || 0,
      Icon: Calendar,
      color: "bg-blue-500",
      loading: bookingsLoading
    },
    {
      title: "Pending Payments",
      value: paymentCounts.pending,
      Icon: DollarSign,
      color: "bg-yellow-500",
      loading: paymentsLoading
    },
    {
      title: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      change: analyticsData?.data?.revenue_change || 0,
      Icon: CreditCard,
      color: "bg-purple-500",
      loading: analyticsLoading || paymentsLoading
    },
    {
      title: "New Guests",
      value: analyticsData?.data?.new_guests || 0,
      change: analyticsData?.data?.guests_change || 0,
      Icon: Users,
      color: "bg-orange-500",
      loading: analyticsLoading
    }
  ];

  // Transform activity data for display
  const activityItems: ActivityItem[] = activityData?.data?.logs?.slice(0, 5).map((log: any, index: number) => {
    const actionIcons: { [key: string]: any } = {
      'LOGIN': Users,
      'LOGOUT': Users,
      'BOOKING': Calendar,
      'PAYMENT': DollarSign,
      'CLEANING': Sparkles,
      'INVENTORY': Package,
      'CANCEL': XCircle,
    };

    const statusColors: { [key: string]: string } = {
      'completed': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'failed': 'bg-red-100 text-red-700',
      'processing': 'bg-blue-100 text-blue-700',
    };

    const iconColors: { [key: string]: string } = {
      'LOGIN': 'text-blue-600',
      'LOGOUT': 'text-gray-600',
      'BOOKING': 'text-green-600',
      'PAYMENT': 'text-purple-600',
      'CLEANING': 'text-orange-600',
      'INVENTORY': 'text-indigo-600',
      'CANCEL': 'text-red-600',
    };

    return {
      id: log.id || `activity-${index}`,
      time: new Date(log.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      action: log.activity_type || 'System Activity',
      customer: `${log.first_name || 'System'} ${log.last_name || ''}`.trim() || 'System',
      details: log.description || 'Activity logged',
      status: 'Completed',
      statusColor: statusColors.completed,
      Icon: actionIcons[log.activity_type] || Users,
      iconColor: iconColors[log.activity_type] || iconColors.LOGIN
    };
  }) || [];

  // Calculate today's tasks from bookings data
  const todayTasks = {
    checkins: bookingsData?.filter((booking: any) => {
      const today = new Date().toDateString();
      const checkinDate = new Date(booking.check_in_date).toDateString();
      return checkinDate === today;
    }).length || 0,
    checkouts: bookingsData?.filter((booking: any) => {
      const today = new Date().toDateString();
      const checkoutDate = new Date(booking.check_out_date).toDateString();
      return checkoutDate === today;
    }).length || 0,
    cleanings: bookingsData?.filter((booking: any) => {
      const today = new Date().toDateString();
      const checkoutDate = new Date(booking.check_out_date).toDateString();
      return checkoutDate === today; // Assuming cleaning needed after checkout
    }).length || 0
  };

  // Calculate payment status from payments data
  const paymentStatus = {
    paid: paymentsData?.filter((payment: any) => payment.payment_status === 'approved').length || 0,
    pending: paymentsData?.filter((payment: any) => payment.payment_status === 'pending').length || 0,
    approved: paymentsData?.filter((payment: any) => payment.payment_status === 'approved').length || 0,
    rejected: paymentsData?.filter((payment: any) => payment.payment_status === 'rejected').length || 0
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor key metrics and recent activities</p>
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
                  {kpi.change !== undefined && !kpi.loading && (
                    <div className="flex items-center gap-1 mt-2">
                      {kpi.change >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-xs">
                        {Math.abs(kpi.change)}% from last period
                      </span>
                    </div>
                  )}
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
            Today&apos;s Tasks
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
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cleanings</span>
              </div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {bookingsLoading ? (
                  <div className="w-8 h-6 bg-green-200 dark:bg-green-800 rounded animate-pulse" />
                ) : (
                  todayTasks.cleanings
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-primary" />
            Payment Status
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Paid</span>
              </div>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {paymentsLoading ? (
                  <div className="w-8 h-6 bg-green-200 dark:bg-green-800 rounded animate-pulse" />
                ) : (
                  paymentStatus.paid
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Pending</span>
              </div>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {paymentsLoading ? (
                  <div className="w-8 h-6 bg-yellow-200 dark:bg-yellow-800 rounded animate-pulse" />
                ) : (
                  paymentStatus.pending
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Rejected</span>
              </div>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">
                {paymentsLoading ? (
                  <div className="w-8 h-6 bg-red-200 dark:bg-red-800 rounded animate-pulse" />
                ) : (
                  paymentStatus.rejected
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-primary" />
            Quick Stats
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Occupancy Rate</span>
                {analyticsData?.data?.occupancy_change !== undefined && !analyticsLoading && (
                  <div className="flex items-center gap-1">
                    {analyticsData?.data?.occupancy_change >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.abs(analyticsData?.data?.occupancy_change)}%
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {analyticsLoading ? (
                  <div className="w-12 h-6 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
                ) : (
                  `${analyticsData?.data?.occupancy_rate || 0}%`
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Active Bookings</span>
                {analyticsData?.data?.bookings_change !== undefined && !analyticsLoading && (
                  <div className="flex items-center gap-1">
                    {analyticsData?.data?.bookings_change >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.abs(analyticsData?.data?.bookings_change)}%
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {bookingsLoading ? (
                  <div className="w-8 h-6 bg-indigo-200 dark:bg-indigo-800 rounded animate-pulse" />
                ) : (
                  bookingsData?.filter((b: any) => b.status === 'confirmed').length || 0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Revenue</span>
                {analyticsData?.data?.revenue_change !== undefined && !analyticsLoading && !paymentsLoading && (
                  <div className="flex items-center gap-1">
                    {analyticsData?.data?.revenue_change >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.abs(analyticsData?.data?.revenue_change)}%
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
                {analyticsLoading || paymentsLoading ? (
                  <div className="w-16 h-6 bg-teal-200 dark:bg-teal-800 rounded animate-pulse" />
                ) : (
                  `₱${totalRevenue.toLocaleString()}`
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Activity</h3>
          {activityLoading && (
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
                  Action
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Customer
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Details
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {activityLoading ? (
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
                        <div className="flex items-center gap-2">
                          <ActivityIcon className={`w-5 h-5 ${item.iconColor}`} />
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {item.action}
                          </span>
                        </div>
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
                    No recent activity found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing {activityItems.length} of {activityData?.data?.length || 0} activities
          </p>
          <button 
            onClick={() => window.location.href = '/admin/csr/activity-logs'}
            className="text-sm font-semibold bg-gradient-to-r from-brand-primary to-brand-primaryDark bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            View All Activity
          </button>
        </div>
      </div>

    </div>
  );
}

export { default as BookingsPage } from "./BookingPage";

export { default as PaymentsPage } from "./PaymentPage.tsx";

export { default as DeliverablesPage } from "./DeliverablesPage";

export { default as CleanersPage } from "./CleanersPage";

export { default as DepositsPage } from "./DepositPage";

export { default as InventoryPage } from "./InventoryPage";