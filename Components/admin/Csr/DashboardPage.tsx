"use client";

import { Calendar, DollarSign, Users, Package, CreditCard, Sparkles, XCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor key metrics and recent activities</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Bookings",
            value: "156",
            Icon: Calendar,
            color: "bg-blue-500"
          },
          {
            title: "Pending Payments",
            value: "₱45,000",
            Icon: DollarSign,
            color: "bg-green-500"
          },
          {
            title: "Active Cleaners",
            value: "24",
            Icon: Users,
            color: "bg-orange-500"
          },
          {
            title: "Total Deposits",
            value: "₱120,000",
            Icon: CreditCard,
            color: "bg-purple-500"
          },
        ].map((kpi, i) => {
          const IconComponent = kpi.Icon;
          return (
            <div
              key={i}
              className={`${kpi.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Recent Activity</h3>
        <div className="overflow-x-auto">
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
              {[
                {
                  time: "2:30 PM",
                  action: "New Booking",
                  customer: "John Smith",
                  details: "Haven 2 - March 15-20",
                  status: "Confirmed",
                  statusColor: "bg-green-100 text-green-700",
                  Icon: Calendar,
                  iconColor: "text-blue-600",
                },
                {
                  time: "1:45 PM",
                  action: "Payment Received",
                  customer: "Sarah Johnson",
                  details: "₱8,000 deposit payment",
                  status: "Completed",
                  statusColor: "bg-blue-100 text-blue-700",
                  Icon: DollarSign,
                  iconColor: "text-green-600",
                },
                {
                  time: "12:30 PM",
                  action: "Cleaner Assigned",
                  customer: "Maria Santos",
                  details: "Haven 1 - Check-out cleaning",
                  status: "Assigned",
                  statusColor: "bg-orange-100 text-orange-700",
                  Icon: Sparkles,
                  iconColor: "text-orange-600",
                },
                {
                  time: "11:15 AM",
                  action: "Inventory Updated",
                  customer: "System",
                  details: "Towels restocked - Haven 3",
                  status: "Updated",
                  statusColor: "bg-purple-100 text-purple-700",
                  Icon: Package,
                  iconColor: "text-purple-600",
                },
                {
                  time: "10:00 AM",
                  action: "Booking Cancelled",
                  customer: "Mike Wilson",
                  details: "Haven 4 - April 5-8",
                  status: "Refunded",
                  statusColor: "bg-red-100 text-red-700",
                  Icon: XCircle,
                  iconColor: "text-red-600",
                },
              ].map((item, i) => {
                const ActivityIcon = item.Icon;
                return (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-in fade-in duration-500"
                    style={{ animationDelay: `${i * 50}ms` }}
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
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">Showing 5 of 48 activities</p>
          <button className="text-sm font-semibold bg-gradient-to-r from-brand-primary to-brand-primaryDark bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Today&apos;s Tasks</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Check-ins</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Check-outs</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cleanings</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">15</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Payment Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Paid</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">45</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Pending</span>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">18</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Overdue</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">3</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Inventory Alerts</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Low Stock</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">5</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Reorder</span>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">8</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">In Stock</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">42</span>
            </div>
          </div>
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