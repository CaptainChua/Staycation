'use client';

import { useEffect, useState } from "react";
import AnalyticsClient from "./AnalyticsClient";
import StatusChart from "./StatusChart";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import type { AnalyticsSummary, RevenueByRoom, MonthlyRevenue } from "@/backend/controller/analyticsController";
import { ADMIN_API_ENDPOINTS } from "@/lib/apiEndpoints";

const AnalyticsPage = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueByHaven, setRevenueByHaven] = useState<RevenueByRoom[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: bookings = [] } = useGetBookingsQuery({});

  // get your token here
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, revenueRes, monthlyRes] = await Promise.all([
          fetch(`${ADMIN_API_ENDPOINTS.ANALYTICS_SUMMARY}?period=30`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch("https://staycationhavenph.com/api/admin/analytics/revenue-by-room?period=30", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch("https://staycationhavenph.com/api/admin/analytics/monthly-revenue?months=6", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
        ]);

        const summaryData = await summaryRes.json();
        const revenueData = await revenueRes.json();
        const monthlyData = await monthlyRes.json();

        if (summaryData.success) {
          setSummary(summaryData.data);
        } else {
          setError(summaryData.error || "Unable to load summary");
        }

        if (revenueData.success) {
          setRevenueByHaven(revenueData.data);
        }

        if (monthlyData.success) {
          setMonthlyRevenue(monthlyData.data);
        }

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [bookings, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [summaryRes, revenueRes, monthlyRes] = await Promise.all([
        fetch(`${ADMIN_API_ENDPOINTS.ANALYTICS_SUMMARY}?period=30`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("https://staycationhavenph.com/api/admin/analytics/revenue-by-room?period=30", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch("https://staycationhavenph.com/api/admin/analytics/monthly-revenue?months=6", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
      ]);

      const summaryData = await summaryRes.json();
      const revenueData = await revenueRes.json();
      const monthlyData = await monthlyRes.json();

      if (summaryData.success) setSummary(summaryData.data);
      if (revenueData.success) setRevenueByHaven(revenueData.data);
      if (monthlyData.success) setMonthlyRevenue(monthlyData.data);

    } catch (error) {
      console.error("Error refreshing analytics:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
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

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded">
          Error loading summary: {error}
        </div>
      )}

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