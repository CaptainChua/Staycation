'use client';

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AnalyticsClient from "./AnalyticsClient";
import StatusChart from "./StatusChart";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import type { AnalyticsSummary, RevenueByRoom, MonthlyRevenue } from "@/backend/controller/analyticsController";

const ANALYTICS_ENDPOINTS = {
  summary: "/api/admin/analytics/summary?period=30",
  revenueByRoom: "/api/admin/analytics/revenue-by-room?period=30",
  monthlyRevenue: "/api/admin/analytics/monthly-revenue?months=6",
};

const AnalyticsPage = () => {
  const { data: session, status } = useSession();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueByHaven, setRevenueByHaven] = useState<RevenueByRoom[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: bookings = [] } = useGetBookingsQuery({});

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

      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart
          data={bookings}
          title="Booking"
          statusFilter={["confirmed", "checked-in", "completed", "rejected", "cancelled"]}
        />
        <StatusChart
          data={bookings}
          title="Reservations"
          statusFilter={["pending", "approved"]}
        />
      </div>

      <AnalyticsClient
        summary={
          summary || {
            total_revenue: 0,
            total_bookings: 0,
            occupancy_rate: 0,
            new_guests: 0,
            revenue_change: 0,
            bookings_change: 0,
            occupancy_change: 0,
            guests_change: 0,
          }
        }
        revenueByHaven={revenueByHaven}
        monthlyRevenue={monthlyRevenue}
      />
    </div>
  );
};

export default AnalyticsPage;