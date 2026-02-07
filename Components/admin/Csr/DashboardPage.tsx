"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  DollarSign,
  Users,
  Package,
  CreditCard,
  Sparkles,
  XCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // 🔹 Replace these with real API calls later

    setKpis([
      { title: "Total Bookings", value: "156", Icon: Calendar, color: "bg-blue-500"},
      { title: "Pending Payments", value: "₱45,000", Icon: DollarSign, color: "bg-green-500"},
      { title: "Active Cleaners", value: "24", Icon: Users, color: "bg-orange-500"},
      { title: "Total Deposits", value: "₱120,000", Icon: CreditCard, color: "bg-purple-500"},
    ]);

    setActivities([
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
    ]);

    setStats({
      tasks: { checkins: 8, checkouts: 12, cleanings: 15 },
      payments: { paid: 45, pending: 18, overdue: 3 },
      inventory: { low: 5, reorder: 8, stock: 42 },
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor key metrics and recent activities
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
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

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {activities.map((item, i) => {
                const ActivityIcon = item.Icon;
                return (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-in fade-in duration-500"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <td className="py-4 px-4">{item.time}</td>
                    <td className="py-4 px-4 flex items-center gap-2">
                      <ActivityIcon className={`w-5 h-5 ${item.iconColor}`} />
                      {item.action}
                    </td>
                    <td className="py-4 px-4">{item.customer}</td>
                    <td className="py-4 px-4">{item.details}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between">
          <p className="text-sm">Showing {activities.length} of 48 activities</p>
          <button className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-primaryDark">
            View All Activity
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox title="Today's Tasks" data={[
            ["Check-ins", stats.tasks.checkins],
            ["Check-outs", stats.tasks.checkouts],
            ["Cleanings", stats.tasks.cleanings],
          ]} />

          <StatBox title="Payment Status" data={[
            ["Paid", stats.payments.paid],
            ["Pending", stats.payments.pending],
            ["Overdue", stats.payments.overdue],
          ]} />

          <StatBox title="Inventory Alerts" data={[
            ["Low Stock", stats.inventory.low],
            ["Reorder", stats.inventory.reorder],
            ["In Stock", stats.inventory.stock],
          ]} />
        </div>
      )}
    </div>
  );
}

function StatBox({ title, data }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h4 className="text-lg font-bold mb-4">{title}</h4>
      <div className="space-y-3">
        {data.map(([label, value]: any, i: number) => (
          <div key={i} className="flex justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            <span>{label}</span>
            <span className="font-bold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { default as BookingsPage } from "./BookingPage";
export { default as PaymentsPage } from "./PaymentPage";
export { default as DeliverablesPage } from "./DeliverablesPage";
export { default as CleanersPage } from "./CleanersPage";
export { default as DepositsPage } from "./DepositPage";
export { default as InventoryPage } from "./InventoryPage";
