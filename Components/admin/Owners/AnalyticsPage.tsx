'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import OwnerPageHeader from "./OwnerPageHeader";
import AnalyticsClient from "./AnalyticsClient";
import StatusChart from "./StatusChart";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import type { AnalyticsSummary, RevenueByRoom, MonthlyRevenue } from "@/backend/controller/analyticsController";
import type { Booking } from "@/types/booking";

const ANALYTICS_ENDPOINTS = {
  summary: "/api/admin/analytics/summary?period=30",
  revenueByRoom: "/api/admin/analytics/revenue-by-room?period=30",
  monthlyRevenue: "/api/admin/analytics/monthly-revenue?months=6",
};

interface BookingPayment {
  payment_status?: string;
  down_payment?: number;
  total_amount?: number;
}

interface BookingRecord {
  id?: string;
  room_name?: string;
  created_at?: string;
  check_in_date?: string;
  check_out_date?: string;
  guest_email?: string;
  payment_status?: string;
  down_payment?: number;
  total_amount?: number;
  booking_payments?: BookingPayment[];
}

const AnalyticsPage = () => {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueByHaven, setRevenueByHaven] = useState<RevenueByRoom[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHaven, setSelectedHaven] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");

  const { data: bookings = [] } = useGetBookingsQuery({});

  const bookingRecords = bookings as BookingRecord[];

  const havenOptions = useMemo(() => {
    return Array.from(
      new Set(
        bookingRecords
          .map((booking) => booking.room_name?.trim())
          .filter((name): name is string => Boolean(name))
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  }, [bookingRecords]);

  const normalizeHavenName = (name?: string | null) => (name || "").trim().toLowerCase();

  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const yearOptions = useMemo(() => {
    const dataYears = Array.from(
      new Set(
        bookingRecords
          .map((booking) => {
            const rawDate = booking.check_in_date ?? booking.created_at;
            if (!rawDate) return null;
            const date = new Date(rawDate);
            return Number.isNaN(date.getTime()) ? null : date.getFullYear();
          })
          .filter((year): year is number => year !== null)
      )
    );

    const currentYear = new Date().getFullYear();
    const baselineYears = Array.from({ length: 7 }, (_, index) => currentYear - index);

    return Array.from(new Set([...dataYears, ...baselineYears])).sort((a, b) => b - a);
  }, [bookingRecords]);

  useEffect(() => {
    const selectedYearNum = Number(selectedYear);
    if (!yearOptions.includes(selectedYearNum) || selectedYear === String(new Date().getFullYear())) {
      setSelectedYear(String(yearOptions[0]));
    }
  }, [selectedYear, yearOptions]);

  const getBookingRevenue = (booking: BookingRecord) => {
    const payments = booking.booking_payments || [];
    if (payments.length === 0) {
      const bookingStatus = booking.payment_status || "";
      const bookingDownPayment = Number(booking.down_payment || 0);
      const bookingTotalAmount = Number(booking.total_amount || 0);
      if (bookingStatus === "approved_full_payment") return bookingTotalAmount;
      if (bookingStatus === "approved_down_payment" || bookingStatus === "pending_down_payment") {
        return bookingDownPayment;
      }
      return bookingDownPayment || bookingTotalAmount || 0;
    }
    return payments.reduce((total, payment) => {
      const downPayment = Number(payment.down_payment || 0);
      const totalAmount = Number(payment.total_amount || 0);
      if (payment.payment_status === "approved_full_payment") {
        return total + totalAmount;
      }
      if (payment.payment_status === "approved_down_payment" || payment.payment_status === "pending_down_payment") {
        return total + downPayment;
      }
      return total + (downPayment || totalAmount || 0);
    }, 0);
  };

  const getPercentChange = (currentValue: number, previousValue: number) => {
    if (previousValue <= 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const bookingDate = (booking: BookingRecord) => {
    const rawDate = booking.check_in_date ?? booking.created_at;
    if (!rawDate) return null;
    const date = new Date(rawDate);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const dateRangeForSelection = useMemo(() => {
    const selectedYearNum = Number(selectedYear);
    if (selectedMonth === "all") {
      return {
        currentStart: new Date(selectedYearNum, 0, 1),
        currentEnd: new Date(selectedYearNum + 1, 0, 1),
        previousStart: new Date(selectedYearNum - 1, 0, 1),
        previousEnd: new Date(selectedYearNum, 0, 1),
      };
    }
    const monthIndex = Number(selectedMonth);
    return {
      currentStart: new Date(selectedYearNum, monthIndex, 1),
      currentEnd: new Date(selectedYearNum, monthIndex + 1, 1),
      previousStart: new Date(selectedYearNum, monthIndex - 1, 1),
      previousEnd: new Date(selectedYearNum, monthIndex, 1),
    };
  }, [selectedMonth, selectedYear]);

  const sourceBookings = useMemo(
    () =>
      bookingRecords.filter((booking) =>
        selectedHaven === "all"
          ? true
          : normalizeHavenName(booking.room_name) === normalizeHavenName(selectedHaven)
      ),
    [bookingRecords, selectedHaven]
  );

  const filteredBookingsForPeriod = useMemo(
    () =>
      sourceBookings.filter((booking) => {
        const date = bookingDate(booking);
        if (!date) return false;
        return date >= dateRangeForSelection.currentStart && date < dateRangeForSelection.currentEnd;
      }),
    [dateRangeForSelection.currentEnd, dateRangeForSelection.currentStart, sourceBookings]
  );

  const previousBookingsForPeriod = useMemo(
    () =>
      sourceBookings.filter((booking) => {
        const date = bookingDate(booking);
        if (!date) return false;
        return date >= dateRangeForSelection.previousStart && date < dateRangeForSelection.previousEnd;
      }),
    [dateRangeForSelection.previousEnd, dateRangeForSelection.previousStart, sourceBookings]
  );

  const calculateOccupancyRate = (bookingsList: BookingRecord[], start: Date, end: Date) => {
    const totalRooms = new Set(
      sourceBookings.map((booking) => normalizeHavenName(booking.room_name)).filter(Boolean)
    ).size || 1;
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalAvailableDays = totalRooms * totalDays;
    const bookedDays = bookingsList.reduce((sum, booking) => {
      const from = booking.check_in_date ? new Date(booking.check_in_date) : bookingDate(booking);
      const to = booking.check_out_date ? new Date(booking.check_out_date) : null;
      if (!from || Number.isNaN(from.getTime())) return sum + 1;
      if (to && !Number.isNaN(to.getTime())) {
        return sum + Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
      }
      return sum + 1;
    }, 0);
    return (bookedDays / totalAvailableDays) * 100;
  };

  const filteredSummary = useMemo<AnalyticsSummary>(() => {
    const currentRevenue = filteredBookingsForPeriod.reduce((total, booking) => total + getBookingRevenue(booking), 0);
    const previousRevenue = previousBookingsForPeriod.reduce((total, booking) => total + getBookingRevenue(booking), 0);
    const currentBookings = filteredBookingsForPeriod.length;
    const previousBookings = previousBookingsForPeriod.length;

    const currentGuests = new Set(
      filteredBookingsForPeriod
        .map((booking) => booking.guest_email || booking.id)
        .filter((value): value is string => Boolean(value))
    ).size;
    const previousGuests = new Set(
      previousBookingsForPeriod
        .map((booking) => booking.guest_email || booking.id)
        .filter((value): value is string => Boolean(value))
    ).size;

    const currentOccupancy = calculateOccupancyRate(
      filteredBookingsForPeriod,
      dateRangeForSelection.currentStart,
      dateRangeForSelection.currentEnd
    );
    const previousOccupancy = calculateOccupancyRate(
      previousBookingsForPeriod,
      dateRangeForSelection.previousStart,
      dateRangeForSelection.previousEnd
    );

    return {
      total_revenue: Number(currentRevenue.toFixed(2)),
      total_bookings: currentBookings,
      occupancy_rate: Number(currentOccupancy.toFixed(1)),
      new_guests: currentGuests,
      revenue_change: Number(getPercentChange(currentRevenue, previousRevenue).toFixed(1)),
      bookings_change: Number(getPercentChange(currentBookings, previousBookings).toFixed(1)),
      occupancy_change: Number(getPercentChange(currentOccupancy, previousOccupancy).toFixed(1)),
      guests_change: Number(getPercentChange(currentGuests, previousGuests).toFixed(1)),
    };
  }, [dateRangeForSelection.currentEnd, dateRangeForSelection.currentStart, dateRangeForSelection.previousEnd, dateRangeForSelection.previousStart, filteredBookingsForPeriod, previousBookingsForPeriod, sourceBookings]);

  const filteredMonthlyRevenue = useMemo<MonthlyRevenue[]>(() => {
    const selectedYearNum = Number(selectedYear);
    if (selectedMonth === "all") {
      const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return labels.map((label, monthIndex) => {
        const monthRevenue = sourceBookings.reduce((total, booking) => {
          const date = bookingDate(booking);
          if (!date) return total;
          if (date.getFullYear() === selectedYearNum && date.getMonth() === monthIndex) {
            return total + getBookingRevenue(booking);
          }
          return total;
        }, 0);
        return { month: label, revenue: Number(monthRevenue.toFixed(2)) };
      });
    }

    const monthIndex = Number(selectedMonth);
    const monthStart = new Date(selectedYearNum, monthIndex, 1);
    const monthEnd = new Date(selectedYearNum, monthIndex + 1, 1);
    const monthDays = monthEnd.getDate();
    const weekCount = Math.ceil(monthDays / 7);
    const weeklySeries: MonthlyRevenue[] = [];

    for (let week = 0; week < weekCount; week += 1) {
      const weekStart = new Date(selectedYearNum, monthIndex, week * 7 + 1);
      const weekEnd = new Date(selectedYearNum, monthIndex, Math.min((week + 1) * 7 + 1, monthDays + 1));
      const weeklyRevenue = sourceBookings.reduce((total, booking) => {
        const date = bookingDate(booking);
        if (!date) return total;
        if (date >= weekStart && date < weekEnd) {
          return total + getBookingRevenue(booking);
        }
        return total;
      }, 0);
      weeklySeries.push({
        month: `Week ${week + 1}`,
        revenue: Number(weeklyRevenue.toFixed(2)),
      });
    }

    return weeklySeries;
  }, [selectedMonth, selectedYear, sourceBookings]);

  const tableRevenueByHaven = useMemo<RevenueByRoom[]>(() => {
    const selectedYearNum = Number(selectedYear);
    const monthFilter = selectedMonth === "all" ? null : Number(selectedMonth);
    const grouped = new Map<string, { revenue: number; bookings: number }>();

    bookingRecords.forEach((booking) => {
      const havenName = booking.room_name?.trim();
      if (!havenName) return;
      const date = bookingDate(booking);
      if (!date) return;
      if (date.getFullYear() !== selectedYearNum) return;
      if (monthFilter !== null && date.getMonth() !== monthFilter) return;

      const current = grouped.get(havenName) || { revenue: 0, bookings: 0 };
      current.revenue += getBookingRevenue(booking);
      current.bookings += 1;
      grouped.set(havenName, current);
    });

    return Array.from(grouped.entries())
      .map(([room_name, values]) => ({
        room_name,
        revenue: Number(values.revenue.toFixed(2)),
        bookings: values.bookings,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [bookingRecords, selectedMonth, selectedYear]);

  const fetchAnalyticsData = useCallback(async () => {
    if (status !== 'authenticated' || !session) {
      setError("Please log in to access analytics");
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const [summaryRes, revenueRes, monthlyRes] = await Promise.all([
        fetch(ANALYTICS_ENDPOINTS.summary, {
          credentials: 'include', // Include cookies automatically
        }),
        fetch(ANALYTICS_ENDPOINTS.revenueByRoom, {
          credentials: 'include',
        }),
        fetch(ANALYTICS_ENDPOINTS.monthlyRevenue, {
          credentials: 'include',
        }),
      ]);

      // Check response status
      if (!summaryRes.ok) {
        throw new Error(`Summary API error: ${summaryRes.status} ${summaryRes.statusText}`);
      }
      if (!revenueRes.ok) {
        throw new Error(`Revenue API error: ${revenueRes.status} ${revenueRes.statusText}`);
      }
      if (!monthlyRes.ok) {
        throw new Error(`Monthly API error: ${monthlyRes.status} ${monthlyRes.statusText}`);
      }

      const summaryData = await summaryRes.json();
      const revenueData = await revenueRes.json();
      const monthlyData = await monthlyRes.json();

      if (summaryData.success && summaryData.data) {
        setSummary(summaryData.data);
      } else {
        setError(summaryData.error || "Unable to load summary data");
      }

      if (revenueData.success && revenueData.data) {
        setRevenueByHaven(revenueData.data);
      }

      if (monthlyData.success && monthlyData.data) {
        setMonthlyRevenue(monthlyData.data);
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError(error instanceof Error ? error.message : "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading') {
      // Wait for session to be loaded
      return;
    }
    
    void fetchAnalyticsData();
  }, [fetchAnalyticsData, status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAnalyticsData();
    } finally {
      setRefreshing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold">You must be logged in to access analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <p className="font-semibold">Error loading analytics</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => fetchAnalyticsData()}
            className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      <OwnerPageHeader
        title="Analytics & Reports"
        description="Track your business performance and insights"
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh Data"
            type="button"
          >
            <RefreshCw className={`w-4 h-4 text-white ${refreshing ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedHaven}
            onChange={(e) => setSelectedHaven(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
          >
            <option value="all">All Havens</option>
            {havenOptions.map((havenName) => (
              <option key={havenName} value={havenName}>
                {havenName}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
          >
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AnalyticsClient
        summary={filteredSummary}
        revenueByHaven={tableRevenueByHaven}
        monthlyRevenue={filteredMonthlyRevenue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart
          data={filteredBookingsForPeriod as Booking[]}
          title="Booking"
          statusFilter={["confirmed", "checked-in", "completed", "rejected", "cancelled"]}
        />
        <StatusChart
          data={filteredBookingsForPeriod as Booking[]}
          title="Reservations"
          statusFilter={["pending", "approved"]}
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;