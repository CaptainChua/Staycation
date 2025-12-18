'use client';

import { TrendingUp, TrendingDown, DollarSign, Users, Home, Calendar } from "lucide-react";

const AnalyticsPage = () => {
  // Dummy data
  const stats = [
    { label: "Total Revenue", value: "₱1,245,000", change: "+12.5%", trending: "up", icon: DollarSign, color: "text-green-500" },
    { label: "Total Bookings", value: "342", change: "+8.3%", trending: "up", icon: Calendar, color: "text-blue-500" },
    { label: "Occupancy Rate", value: "78%", change: "-2.1%", trending: "down", icon: Home, color: "text-purple-500" },
    { label: "New Guests", value: "156", change: "+15.7%", trending: "up", icon: Users, color: "text-orange-500" },
  ];

  const revenueByHaven = [
    { name: "Haven A - City View", revenue: 345000, bookings: 89 },
    { name: "Haven B - Ocean View", revenue: 298000, bookings: 76 },
    { name: "Haven C - Pool View", revenue: 267000, bookings: 68 },
    { name: "Haven D - Garden View", revenue: 335000, bookings: 109 },
  ];

  const monthlyRevenue = [
    { month: "Jan", revenue: 98000 },
    { month: "Feb", revenue: 112000 },
    { month: "Mar", revenue: 105000 },
    { month: "Apr", revenue: 128000 },
    { month: "May", revenue: 145000 },
    { month: "Jun", revenue: 138000 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">Track your business performance and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-semibold ${stat.trending === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trending === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue by Haven */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Revenue by Haven</h2>
        <div className="space-y-4">
          {revenueByHaven.map((haven, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">{haven.name}</h3>
                <span className="text-lg font-bold text-green-600">₱{haven.revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{haven.bookings} bookings</span>
                <span>Avg: ₱{Math.round(haven.revenue / haven.bookings).toLocaleString()}/booking</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                  style={{ width: `${(haven.revenue / 350000) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Monthly Revenue Trend</h2>
        <div className="flex items-end justify-between gap-4 h-64">
          {monthlyRevenue.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-100 rounded-t-lg flex items-end justify-center" style={{ height: '100%' }}>
                <div
                  className="w-full bg-gradient-to-t from-orange-500 to-yellow-500 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                  style={{ height: `${(data.revenue / 150000) * 100}%` }}
                >
                  <span className="text-xs font-semibold text-white">₱{(data.revenue / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600">{data.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
