"use client";

import {
  DollarSign,
  Plus,
  Settings,
  TrendingUp,
  FileText,
  Users,
  Target,
  Clock,
  Calendar,
  Building2,
  Star,
  ArrowUp,
  ArrowDown,
  UserCheck,
  UserPlus,
  AlertCircle,
  Package,
  Wrench,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useGetRoomBookingsQuery } from "@/redux/api/bookingsApi";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";

// Export Haven type for use in other components
export type Haven = {
  id?: number;
  uuid_id?: string;
  haven_name: string;
  name?: string;
  tower: string;
  floor: string;
  view_type?: string;
  capacity?: number;
  room_size?: number;
  beds?: string;
  description?: string;
  youtube_url?: string;
  six_hour_rate?: number;
  ten_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  six_hour_check_in?: string;
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
  amenities?: any;
  created_at?: string;
  updated_at?: string;
  blocked_dates?: Array<{
    from_date: string;
    to_date: string;
  }>;
  [key: string]: unknown;
};

interface Booking {
  id: string;
  booking_id: string;
  user_id?: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  status: 'pending' | 'approved' | 'rejected' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Payment data from booking_payments
  booking_payments?: {
    total_amount: number;
    down_payment: number;
    remaining_balance: number;
    payment_method: string;
  }[];
  // Guest data from booking_guests
  booking_guests?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  }[];
}

interface User {
  user_id: string;
  email: string;
  user_role: string;
  name: string;
  register_as: 'guest' | 'haven' | 'facebook' | 'google';
  created_at: string;
  last_login: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Owner' | 'CSR' | 'Cleaner' | 'Partner';
  department: string;
  hire_date: string;
  monthly_salary?: number;
  created_at: string;
}

interface DashboardPageProps {
  onAddUnitClick: () => void;
  onPaymentClick: () => void;
  onBookingClick: () => void;
  onPoliciesClick: () => void;
  havens: Haven[];
}

const DashboardPage = ({
  onAddUnitClick,
  onPaymentClick,
  onBookingClick,
  onPoliciesClick,
  havens,
}: DashboardPageProps) => {
  // Fetch real data from booking table
  const { data: bookingsData } = useGetRoomBookingsQuery({}, { pollingInterval: 30000 });
  const { data: employeesData } = useGetEmployeesQuery({}, { pollingInterval: 30000 });

  // Mock user data for now (you may need to create a users API)
  const mockUsers: User[] = [
    { user_id: '1', email: 'guest1@email.com', user_role: 'Guest', name: 'Guest One', register_as: 'guest', created_at: '2026-01-01', last_login: '2026-01-25' },
    { user_id: '2', email: 'owner1@email.com', user_role: 'Owner', name: 'Owner One', register_as: 'haven', created_at: '2026-01-02', last_login: '2026-01-25' },
    { user_id: '3', email: 'guest2@email.com', user_role: 'Guest', name: 'Guest Two', register_as: 'facebook', created_at: '2026-01-03', last_login: '2026-01-24' },
    { user_id: '4', email: 'partner1@email.com', user_role: 'Partner', name: 'Partner One', register_as: 'google', created_at: '2026-01-04', last_login: '2026-01-25' },
  ];

  const bookings: Booking[] = bookingsData?.data || [];
  const employees: Employee[] = employeesData?.data || [];
  const users: User[] = mockUsers; // Replace with actual API call when available

  // Calculate comprehensive KPIs
  const calculateKPIs = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Revenue from booking_payments
    const totalRevenue = bookings.reduce((sum, booking) => {
      const payment = booking.booking_payments?.[0];
      return sum + (payment?.total_amount || 0);
    }, 0);

    // Current Month Revenue
    const currentMonthRevenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, booking) => {
        const payment = booking.booking_payments?.[0];
        return sum + (payment?.total_amount || 0);
      }, 0);

    // Pending Bookings (from booking table)
    const pendingBookings = bookings.filter(booking => booking.status === 'pending').length;

    // Total Bookings
    const totalBookings = bookings.length;

    // Confirmed Bookings
    const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed').length;

    // Checked-in Bookings
    const checkedInBookings = bookings.filter(booking => booking.status === 'checked-in').length;

    // Occupancy Rate
    const totalDays = havens.length * 30;
    const activeBookings = bookings.filter(booking =>
      ['approved', 'confirmed', 'checked-in'].includes(booking.status)
    ).length;
    const occupancyRate = totalDays > 0 ? Math.round((activeBookings / totalDays) * 100) : 0;

    // User Statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const lastLogin = new Date(user.last_login);
      const daysSinceLogin = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLogin <= 7;
    }).length;

    // Employee Statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.role).length;

    // Department Distribution
    const departmentStats = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Role Distribution
    const roleStats = employees.reduce((acc, emp) => {
      const role = emp.role || 'Unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // User Registration Types
    const registrationStats = users.reduce((acc, user) => {
      const type = user.register_as || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      currentMonthRevenue,
      pendingBookings,
      totalBookings,
      confirmedBookings,
      checkedInBookings,
      occupancyRate,
      totalUsers,
      activeUsers,
      totalEmployees,
      activeEmployees,
      departmentStats,
      roleStats,
      registrationStats,
    };
  };

  const kpis = calculateKPIs();

  // Generate revenue data for chart
  const generateRevenueData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === index;
      });
      const revenue = monthBookings.reduce((sum, booking) => {
        const payment = booking.booking_payments?.[0];
        return sum + (payment?.total_amount || 0);
      }, 0);
      return { month, revenue };
    });
  };

  // Generate booking status data
  const generateBookingStatusData = () => {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors = {
      'pending': '#f59e0b',
      'confirmed': '#10b981',
      'checked-in': '#3b82f6',
      'completed': '#8b5cf6',
      'cancelled': '#ef4444',
      'rejected': '#ef4444',
      'approved': '#10b981'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '),
      value: count,
      color: statusColors[status as keyof typeof statusColors] || '#6b7280'
    }));
  };

  // Generate department distribution data
  const generateDepartmentData = () => {
    return Object.entries(kpis.departmentStats).map(([dept, count]) => ({
      name: dept,
      value: count,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)]
    }));
  };

  // Generate user registration data
  const generateRegistrationData = () => {
    return Object.entries(kpis.registrationStats).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: type === 'guest' ? '#3b82f6' :
             type === 'haven' ? '#10b981' :
             type === 'facebook' ? '#1877f2' : 
             type === 'google' ? '#ea4335' : '#6b7280'
    }));
  };

  const revenueData = generateRevenueData();
  const bookingStatusData = generateBookingStatusData();
  const departmentData = generateDepartmentData();
  const registrationData = generateRegistrationData();

  // Define KPI type for better type safety
  interface KpiItem {
    title: string;
    value: string;
    icon: any; // Lucide React icon component
    color: string;
  }

  const kpiItems: KpiItem[] = [
    {
      title: "Total Revenue",
      value: `₱${kpis.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      title: "Total Bookings",
      value: kpis.totalBookings.toString(),
      icon: Calendar,
      color: "bg-blue-500"
    },
    {
      title: "Pending Bookings",
      value: kpis.pendingBookings.toString(),
      icon: Clock,
      color: "bg-yellow-500"
    },
    {
      title: "Confirmed",
      value: kpis.confirmedBookings.toString(),
      icon: UserCheck,
      color: "bg-emerald-500"
    },
    {
      title: "Checked In",
      value: kpis.checkedInBookings.toString(),
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      title: "Occupancy Rate",
      value: `${kpis.occupancyRate}%`,
      icon: TrendingUp,
      color: "bg-indigo-500"
    },
  ];

  // Recent bookings with real data
  const recentBookings = bookings
    .slice(0, 5)
    .map(booking => {
      const guest = booking.booking_guests?.[0];
      const payment = booking.booking_payments?.[0];
      return {
        haven: booking.room_name,
        date: new Date(booking.check_in_date).toLocaleDateString(),
        status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
        guest: guest ? `${guest.first_name} ${guest.last_name}` : 'Guest',
        amount: payment ? `₱${payment.total_amount.toLocaleString()}` : 'N/A',
        color: booking.status === 'pending' ? 'text-orange-600' : 'text-red-600'
      };
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your business performance and key metrics</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {kpiItems.map((kpi, i) => {
          const IconComponent = kpi.icon;
          return (
            <div
              key={kpi.title}
              className={`${kpi.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom duration-500`}
              style={{ animationDelay: `${i * 100}ms` }}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            Revenue Overview
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" stroke="#6b7280" className="dark:text-gray-400" fontSize={12} />
              <YAxis stroke="#6b7280" className="dark:text-gray-400" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '0.5rem',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Booking Status
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={bookingStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            User Registration
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={registrationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {registrationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            Department Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                className="dark:text-gray-400"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6b7280" className="dark:text-gray-400" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '0.5rem',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Bookings
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentBookings.length > 0 ? recentBookings.map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{booking.haven}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{booking.date} - {booking.guest}</p>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{booking.amount}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${booking.color} bg-opacity-10`}>
                  {booking.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={onAddUnitClick}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-4 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mx-auto mb-1" />
              <p className="font-bold text-xs">Add Unit</p>
            </button>
            <button
              onClick={onBookingClick}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg p-4 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Settings className="w-5 h-5 mx-auto mb-1" />
              <p className="font-bold text-xs">Booking Settings</p>
            </button>
            <button
              onClick={onPaymentClick}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg p-4 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <DollarSign className="w-5 h-5 mx-auto mb-1" />
              <p className="font-bold text-xs">Payment Settings</p>
            </button>
            <button
              onClick={onPoliciesClick}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg p-4 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FileText className="w-5 h-5 mx-auto mb-1" />
              <p className="font-bold text-xs">Policies</p>
            </button>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg p-4 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={(e) => e.preventDefault()}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1" />
              <p className="font-bold text-xs">Finance</p>
            </button>
            <button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg p-4 text-center transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              onClick={(e) => e.preventDefault()}
            >
              <Users className="w-5 h-5 mx-auto mb-1" />
              <p className="font-bold text-xs">Staff</p>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Details
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  time: "2:30 PM",
                  action: "User Login",
                  user: "Maria Santos",
                  role: "Cleaner",
                  details: "Logged in from Admin Portal",
                  status: "Success",
                  statusColor: "bg-green-100 text-green-700",
                  icon: "✓",
                },
                {
                  time: "1:15 PM",
                  action: "Booking Created",
                  user: "Juan Dela Cruz",
                  role: "CSR",
                  details: "New booking for Haven 2 - March 15",
                  status: "Completed",
                  statusColor: "bg-blue-100 text-blue-700",
                  icon: "📅",
                },
                {
                  time: "12:45 PM",
                  action: "Payment Received",
                  user: "Guest #1234",
                  role: "Guest",
                  details: "₱5,000 payment for Haven 1",
                  status: "Success",
                  statusColor: "bg-green-100 text-green-700",
                  icon: "💰",
                },
                {
                  time: "12:00 PM",
                  action: "User Login",
                  user: "Rosa Garcia",
                  role: "Cleaner",
                  details: "Logged in from Mobile App",
                  status: "Success",
                  statusColor: "bg-green-100 text-green-700",
                  icon: "✓",
                },
                {
                  time: "11:30 AM",
                  action: "Unit Updated",
                  user: "Carlos Reyes",
                  role: "Manager",
                  details: "Updated Haven 3 availability",
                  status: "Completed",
                  statusColor: "bg-blue-100 text-blue-700",
                  icon: "🏠",
                },
                {
                  time: "10:45 AM",
                  action: "User Logout",
                  user: "Anna Martinez",
                  role: "Partner",
                  details: "Logged out from Admin Portal",
                  status: "Success",
                  statusColor: "bg-gray-100 text-gray-700",
                  icon: "↩",
                },
                {
                  time: "10:15 AM",
                  action: "Booking Cancelled",
                  user: "Guest #5678",
                  role: "Guest",
                  details: "Cancelled booking for Haven 4",
                  status: "Cancelled",
                  statusColor: "bg-red-100 text-red-700",
                  icon: "✕",
                },
                {
                  time: "9:30 AM",
                  action: "Staff Created",
                  user: "Admin",
                  role: "Owner",
                  details: "New employee added: Pedro Cruz",
                  status: "Completed",
                  statusColor: "bg-blue-100 text-blue-700",
                  icon: "👤",
                },
              ].map((item, i) => (
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
                    <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-semibold">
                        {item.action}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {item.user}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.role}</p>
                    </div>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination or View All button */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">Showing 8 of 127 activities</p>
          <button className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
            View All Activity →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;