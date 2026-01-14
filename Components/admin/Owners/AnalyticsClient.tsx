'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Home, Calendar } from "lucide-react";
import type { AnalyticsSummary, RevenueByRoom, MonthlyRevenue } from "@/backend/controller/analyticsController";

interface AnalyticsClientProps {
  summary: AnalyticsSummary;
  revenueByHaven: RevenueByRoom[];
  monthlyRevenue: MonthlyRevenue[];
}

export default function AnalyticsClient({ summary, revenueByHaven, monthlyRevenue }: AnalyticsClientProps) {
  // Build stats array from backend data - matching Bookings page card colors
  const stats = [
    {
      label: "Total Revenue",
      value: `₱${summary.total_revenue.toLocaleString()}`,
      change: `${summary.revenue_change >= 0 ? '+' : ''}${summary.revenue_change.toFixed(1)}%`,
      trending: summary.revenue_change >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "bg-green-500" // Match Bookings "Confirmed" card color
    },
    {
      label: "Total Bookings",
      value: summary.total_bookings.toString(),
      change: `${summary.bookings_change >= 0 ? '+' : ''}${summary.bookings_change.toFixed(1)}%`,
      trending: summary.bookings_change >= 0 ? "up" : "down",
      icon: Calendar,
      color: "bg-blue-500" // Match Bookings "Total Bookings" card color
    },
    {
      label: "Occupancy Rate",
      value: `${summary.occupancy_rate}%`,
      change: `${summary.occupancy_change >= 0 ? '+' : ''}${summary.occupancy_change.toFixed(1)}%`,
      trending: summary.occupancy_change >= 0 ? "up" : "down",
      icon: Home,
      color: "bg-indigo-500" // Match Bookings "Checked-In" card color
    },
    {
      label: "New Guests",
      value: summary.new_guests.toString(),
      change: `${summary.guests_change >= 0 ? '+' : ''}${summary.guests_change.toFixed(1)}%`,
      trending: summary.guests_change >= 0 ? "up" : "down",
      icon: Users,
      color: "bg-yellow-500" // Match Bookings "Pending" card color
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching Bookings page style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your business performance and insights</p>
        </div>
      </div>

      {/* Stats Cards - Matching Bookings page style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  {/* Show trend indicator below value */}
                  <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${stat.trending === 'up' ? 'text-green-100' : 'text-red-100'}`}>
                    {stat.trending === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue by Haven - Matching Bookings page table style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Haven
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Total Revenue
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Bookings
                </th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Avg Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {revenueByHaven.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No revenue data available for this period.
                  </td>
                </tr>
              ) : (
                revenueByHaven.map((haven, index) => {
                  const maxRevenue = Math.max(...revenueByHaven.map(h => h.revenue));
                  const avgRevenue = haven.bookings > 0 ? Math.round(haven.revenue / haven.bookings) : 0;
                  return (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{haven.room_name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">
                          ₱{haven.revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {haven.bookings}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                          ₱{avgRevenue.toLocaleString()}
                        </span>
                        {/* Progress bar indicator */}
                        <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-primary to-brand-primaryDark rounded-full"
                            style={{ width: `${maxRevenue > 0 ? (haven.revenue / maxRevenue) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Chart - Matching Bookings page card style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Monthly Revenue Trend</h2>
        </div>
        <div className="p-6">
          {monthlyRevenue.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No monthly revenue data available.
            </div>
          ) : (
            <div className="flex items-end justify-between gap-4 h-64">
              {monthlyRevenue.map((data, index) => {
                const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
                const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg flex items-end justify-center" style={{ height: '100%' }}>
                      <div
                        className="w-full bg-gradient-to-t from-brand-primary to-brand-primaryDark rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                        style={{ height: `${height}%` }}
                      >
                        {data.revenue > 0 && (
                          <span className="text-xs font-semibold text-white">₱{(data.revenue / 1000).toFixed(0)}k</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{data.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
