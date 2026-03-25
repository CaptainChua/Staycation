'use client';

import { TrendingUp, Calendar, Edit2, Tag, DollarSign, Plus, TrendingDown, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { AnalyticsSummary, RevenueByRoom, MonthlyRevenue } from "@/backend/controller/analyticsController";

const RevenueManagementPage = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [revenueByHaven, setRevenueByHaven] = useState<RevenueByRoom[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setError(null);
        const [summaryRes, revenueRes, monthlyRes] = await Promise.all([
          fetch('/api/admin/analytics/summary?period=30'),
          fetch('/api/admin/analytics/revenue-by-room?period=30'),
          fetch('/api/admin/analytics/monthly-revenue?months=6'),
        ]);

        const summaryData = await summaryRes.json();
        const revenueData = await revenueRes.json();
        const monthlyData = await monthlyRes.json();

        if (summaryData.success && summaryData.data) {
          setSummary(summaryData.data);
        }
        if (revenueData.success && revenueData.data) {
          setRevenueByHaven(revenueData.data);
        }
        if (monthlyData.success && monthlyData.data) {
          setMonthlyRevenue(monthlyData.data);
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
    const interval = setInterval(fetchRevenueData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const pricingRules = [
    { id: 1, name: "6-Hour Rate", haven: "All Havens", price: 3000, checkInTime: "09:00", active: true },
    { id: 2, name: "10-Hour Rate", haven: "All Havens", price: 5000, checkInTime: "09:00", active: true },
    { id: 3, name: "Weekday Rate (21 hours)", haven: "All Havens", price: 7000, checkInTime: "14:00", active: true },
    { id: 4, name: "Weekend Rate (21 hours)", haven: "All Havens", price: 9000, checkInTime: "14:00", active: true },
  ];

  const discounts = [
    { id: 1, code: "WELCOME10", description: "10% off for new guests", discount: "10%", validUntil: "2024-12-31", used: 45, active: true },
    { id: 2, code: "SUMMER2024", description: "Summer special discount", discount: "15%", validUntil: "2024-06-30", used: 89, active: false },
    { id: 3, code: "LONGSTAY", description: "Discount for 5+ nights", discount: "20%", validUntil: "2024-12-31", used: 23, active: true },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);
  
  const revenueStats = [
    {
      label: "Total Revenue (30 days)",
      value: formatCurrency(summary?.total_revenue || 0),
      change: `${summary?.revenue_change?.toFixed(1) || 0}%`,
      color: "bg-blue-500",
      icon: DollarSign,
      positive: (summary?.revenue_change || 0) >= 0
    },
    {
      label: "Total Bookings (30 days)",
      value: summary?.total_bookings || 0,
      change: `${summary?.bookings_change?.toFixed(1) || 0}%`,
      color: "bg-green-500",
      icon: Calendar,
      positive: (summary?.bookings_change || 0) >= 0
    },
    {
      label: "Occupancy Rate",
      value: `${(summary?.occupancy_rate || 0).toFixed(1)}%`,
      change: `${summary?.occupancy_change?.toFixed(1) || 0}%`,
      color: "bg-yellow-500",
      icon: TrendingUp,
      positive: (summary?.occupancy_change || 0) >= 0
    },
    {
      label: "New Guests (30 days)",
      value: summary?.new_guests || 0,
      change: `${summary?.guests_change?.toFixed(1) || 0}%`,
      color: "bg-purple-500",
      icon: Tag,
      positive: (summary?.guests_change || 0) >= 0
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Revenue Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Real-time revenue data, pricing rules, and optimization</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {revenueStats.map((stat, index) => {
              const IconComponent = stat.icon;
              const ChangeIcon = stat.positive ? ArrowUpRight : ArrowDownRight;
              return (
                <div
                  key={index}
                  className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${stat.positive ? 'text-green-100' : 'text-red-100'}`}>
                        <ChangeIcon className="w-3 h-3" />
                        {stat.change}
                      </div>
                    </div>
                    <IconComponent className="w-12 h-12 opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>

          {revenueByHaven.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Revenue by Haven</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {revenueByHaven.map((haven, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{haven.room_name}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-2">{formatCurrency(haven.revenue)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{haven.bookings} bookings</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monthlyRevenue.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Monthly Revenue Trend</h2>
              <div className="space-y-3">
                {monthlyRevenue.map((month, index) => {
                  const widthPercent = (month.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-20">{month.month}</span>
                      <div className="flex-1 mx-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brand-primary to-brand-primaryDark h-2 rounded-full transition-all"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100 ml-2 w-24 text-right">{formatCurrency(month.revenue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="flex border-b-2 border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setActiveTab("pricing")}
            className={activeTab === "pricing" ? "flex-1 px-6 py-4 font-semibold bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white transition-all" : "flex-1 px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"}
          >
            Pricing Rules
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={activeTab === "discounts" ? "flex-1 px-6 py-4 font-semibold bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white transition-all" : "flex-1 px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"}
          >
            Discounts & Promos
          </button>
        </div>

        <div className="p-6">
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Pricing Rules</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold">
                  <Plus className="w-5 h-5" />
                  Add Pricing Rule
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Rule Name</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Haven</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Check-In Time</th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Price</th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Status</th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingRules.map((rule) => (
                        <tr key={rule.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="py-4 px-4"><span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{rule.name}</span></td>
                          <td className="py-4 px-4"><span className="text-sm text-gray-700 dark:text-gray-200">{rule.haven}</span></td>
                          <td className="py-4 px-4"><span className="text-sm text-gray-700 dark:text-gray-200">{rule.checkInTime}</span></td>
                          <td className="py-4 px-4 text-right"><span className="text-sm font-bold text-gray-800 dark:text-gray-100">₱{rule.price.toLocaleString()}</span></td>
                          <td className="py-4 px-4 text-center"><span className={rule.active ? "inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" : "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}>{rule.active ? "Active" : "Inactive"}</span></td>
                          <td className="py-4 px-4"><div className="flex items-center justify-center gap-1"><button className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "discounts" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Discounts & Promotions</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all font-semibold">
                  <Plus className="w-5 h-5" />
                  Add Discount Code
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Code</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Description</th>
                        <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Valid Until</th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Used</th>
                        <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Discount</th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Status</th>
                        <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((discount) => (
                        <tr key={discount.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="py-4 px-4"><div className="flex items-center gap-2"><Tag className="w-4 h-4 text-brand-primary" /><span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{discount.code}</span></div></td>
                          <td className="py-4 px-4"><span className="text-sm text-gray-700 dark:text-gray-200">{discount.description}</span></td>
                          <td className="py-4 px-4"><div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300"><Calendar className="w-3 h-3" /><span>{new Date(discount.validUntil).toLocaleDateString()}</span></div></td>
                          <td className="py-4 px-4 text-center"><span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{discount.used} times</span></td>
                          <td className="py-4 px-4 text-right"><span className="text-sm font-bold text-gray-800 dark:text-gray-100">{discount.discount}</span></td>
                          <td className="py-4 px-4 text-center"><span className={discount.active ? "inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200" : "inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}>{discount.active ? "Active" : "Inactive"}</span></td>
                          <td className="py-4 px-4"><div className="flex items-center justify-center gap-1"><button className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueManagementPage;
