'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Home, Calendar } from "lucide-react";
import type { AnalyticsSummary, RevenueByRoom, MonthlyRevenue } from "@/backend/controller/analyticsController";
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import type { ScriptableContext } from 'chart.js';
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

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

  const xLabels = monthlyRevenue.map((item) => item.month);
  const revenueData = monthlyRevenue.map((item) => (item.revenue > 0 ? item.revenue : null));
  const highestRevenue: number = revenueData.reduce((max: number, value) => {
    if (typeof value !== "number") return max;
    return value > max ? value : max;
  }, 0);
  const yAxisMax = highestRevenue > 0 ? Math.ceil(highestRevenue * 1.1) : 1000;

  const lineData = {
    labels: xLabels,
    datasets: [
      {
        label: 'Revenue',
        data: revenueData,
        borderColor: '#22c55e', // Green
        backgroundColor: 'rgba(29, 158, 117, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: (context: ScriptableContext<"line">) => (typeof context.raw === "number" ? 4 : 0),
        pointHoverRadius: (context: ScriptableContext<"line">) => (typeof context.raw === "number" ? 6 : 0),
        pointHitRadius: 8,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#22c55e',
        pointBorderWidth: 0,
        spanGaps: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: { size: 12 },
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: { 
        mode: 'index' as const, 
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { 
          font: { size: 12 },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: { display: false, drawBorder: false },
        ticks: { 
          font: { size: 12 },
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return '₱' + value.toLocaleString();
            }
            return value;
          }
        },
        beginAtZero: true,
        min: 0,
        max: yAxisMax,
        title: { 
          display: true, 
          text: 'Revenue (₱)',
          font: { size: 11, weight: 'bold' as const },
        },
      },
    },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
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

      {/* Revenue table and chart in one compact row */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden w-full lg:w-1/2">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Top Performing Havens</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-200 whitespace-nowrap">
                    Haven
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-200 whitespace-nowrap">
                    Total Revenue
                  </th>
                  <th className="text-center py-2.5 px-3 text-xs font-bold text-gray-200 whitespace-nowrap">
                    Bookings
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-200 whitespace-nowrap">
                    Occupancy
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueByHaven.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-gray-400">
                      No revenue data available for this period.
                    </td>
                  </tr>
                ) : (
                  revenueByHaven.map((haven, index) => {
                    const maxBookings = Math.max(...revenueByHaven.map(h => h.bookings), 1);
                    const occupancyPercent = Math.round((haven.bookings / maxBookings) * 100);
                    const occupancyBarColor =
                      occupancyPercent >= 75
                        ? "bg-[#1D9E75]"
                        : occupancyPercent >= 50
                          ? "bg-amber-500"
                          : "bg-[#E24B4A]";
                    const havenNumberMatch = haven.room_name?.match(/\d+/);
                    const havenLabel = `Haven ${havenNumberMatch ? havenNumberMatch[0] : index + 1}`;
                    return (
                      <tr
                        key={index}
                        className={`${index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900/40"} border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-100 text-sm">{havenLabel}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-gray-100 text-sm whitespace-nowrap">
                            ₱{haven.revenue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-sm font-semibold text-gray-100">
                            {haven.bookings}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1">
                            <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden w-full">
                              <div
                                className={`h-full ${occupancyBarColor} rounded-full`}
                                style={{ width: `${occupancyPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-300">{occupancyPercent}%</span>
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden w-full lg:w-1/2">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Revenue</h2>
          </div>
          <div className="px-3 py-2 h-[300px]">
            {monthlyRevenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                No analytics data available.
              </div>
            ) : (
              <Line data={lineData} options={lineOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
