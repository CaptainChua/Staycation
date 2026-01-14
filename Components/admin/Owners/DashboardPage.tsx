"use client";

import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Plus,
  Settings,
  TrendingUp,
  FileText,
  Users,
  Target,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useGetRoomBookingsQuery } from "@/redux/api/bookingsApi";

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
  check_in_date: string;
  check_out_date: string;
  status: 'approved' | 'checked-in' | 'confirmed' | string;
}

interface CalendarDay {
  date: number;
  status: "available" | "booked" | "blocked" | "past";
}

interface DashboardPageProps {
  onAddUnitClick: () => void;
  onPaymentClick: () => void;
  onBookingClick: () => void;
  onPoliciesClick: () => void;
  onDateClick: (date: Date, haven: Haven) => void;
  havens: Haven[];
}

const DashboardPage = ({
  onAddUnitClick,
  onPaymentClick,
  onBookingClick,
  onPoliciesClick,
  onDateClick,
  havens,
}: DashboardPageProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);
  const hasSetInitialHaven = useRef(false);

  // Set initial selected haven when havens data loads - fixed to avoid cascading renders
useEffect(() => {
  if (havens.length > 0 && !selectedHaven && !hasSetInitialHaven.current) {
    // Check if the value would actually change
    const newHaven = havens[0] as Haven;
    const shouldUpdate = !selectedHaven || ((selectedHaven as Haven).uuid_id !== newHaven.uuid_id);
    
    if (shouldUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedHaven(newHaven);
    }
    hasSetInitialHaven.current = true;
  }
}, [havens, selectedHaven]);

  // Fetch bookings for the selected haven with polling to auto-refresh
  const { data: bookingsData } = useGetRoomBookingsQuery(
    selectedHaven?.uuid_id || '',
    {
      skip: !selectedHaven?.uuid_id,
      pollingInterval: 30000 // Refresh every 30 seconds
    }
  );

  const bookings: Booking[] = bookingsData?.data || [];

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const today = new Date();
  const isCurrentMonth =
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear();

  // Helper function to check if a date is booked
  const isDateBooked = (date: Date) => {
    return bookings.some((booking) => {
      // Normalize check-in and check-out dates to midnight
      const checkIn = new Date(booking.check_in_date);
      checkIn.setHours(0, 0, 0, 0);

      const checkOut = new Date(booking.check_out_date);
      checkOut.setHours(0, 0, 0, 0);

      // Normalize the comparison date
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      // Check if date falls within booking range and status is approved/confirmed/checked-in
      return compareDate >= checkIn && compareDate <= checkOut &&
             (booking.status === 'approved' || booking.status === 'checked-in' || booking.status === 'confirmed');
    });
  };

  // Helper function to check if a date is blocked
  const isDateBlocked = (date: Date) => {
    if (!selectedHaven?.blocked_dates) return false;
    return selectedHaven.blocked_dates.some((blocked) => {
      const fromDate = new Date(blocked.from_date);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = new Date(blocked.to_date);
      toDate.setHours(0, 0, 0, 0);

      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);

      return compareDate >= fromDate && compareDate <= toDate;
    });
  };

  const calendarDays: CalendarDay[] = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1;
    const currentDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      dayNumber
    );
    const isPast = isCurrentMonth && dayNumber < today.getDate();

    let status: CalendarDay["status"] = "available";
    if (isPast) {
      status = "past";
    } else if (isDateBooked(currentDate)) {
      status = "booked";
    } else if (isDateBlocked(currentDate)) {
      status = "blocked";
    }

    return {
      date: dayNumber,
      status,
    };
  });

  const handleDateClick = (day: CalendarDay) => {
    if (day.status === "past" || day.status === "booked" || day.status === "blocked") {
      return; // Don't allow clicking on unavailable dates
    }

    const clickedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day.date
    );
    if (selectedHaven) {
      onDateClick(clickedDate, selectedHaven);
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 text-white";
      case "booked":
        return "bg-red-500 text-white";
      case "blocked":
        return "bg-orange-500 text-white";
      case "past":
        return "bg-gray-300 text-gray-600";
      default:
        return "bg-white";
    }
  };

  const revenueData = [
    { month: "Jan", revenue: 12000 },
    { month: "Feb", revenue: 18000 },
    { month: "Mar", revenue: 16000 },
    { month: "Apr", revenue: 22000 },
    { month: "May", revenue: 25000 },
    { month: "Jun", revenue: 28000 },
  ];

  // Define KPI type for better type safety
  interface KpiItem {
    title: string;
    value: string;
    icon: any; // Lucide React icon component
    color: string;
  }

  const kpis: KpiItem[] = [
    {
      title: "Total Revenue",
      value: "₱121,000",
      icon: DollarSign,
      color: "bg-blue-500"
    },
    {
      title: "Occupancy",
      value: "78%",
      icon: Users,
      color: "bg-green-500",
    },
    { 
      title: "Pending", 
      value: "12", 
      icon: Clock, 
      color: "bg-orange-500" 
    },
    {
      title: "Target",
      value: "₱30,000",
      icon: Target,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const IconComponent = kpi.icon;
          return (
            <div
              key={kpi.title}
              className={`${kpi.color} text-white rounded-lg p-6 shadow hover:shadow-lg animate-in fade-in slide-in-from-bottom duration-500`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Select Haven
            </label>
            <select
              value={selectedHaven?.uuid_id || ''}
              onChange={(e) => {
                const selected = havens.find((h) => h.uuid_id === e.target.value);
                if (selected) {
                  setSelectedHaven(selected);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {havens.map((h) => (
                <option key={h.uuid_id} value={h.uuid_id}>
                  {h.haven_name || h.name}
                </option>
              ))}
            </select>
          </div>

          <h3 className="text-xl font-bold mb-4">Haven Booking Calendar</h3>

          {/* Legend - At Top */}
          <div className="flex justify-center flex-wrap gap-4 mb-4 pb-4 border-b border-gray-200">
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Available - Click to book</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Booked</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Blocked</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Past</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  )
                )
              }
              className="p-1 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm">{monthName}</span>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1
                  )
                )
              }
              className="p-1 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-sm font-bold text-center text-gray-700 py-2"
              >
                {d}
              </div>
            ))}
            {calendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => handleDateClick(day)}
                disabled={day.status === "past" || day.status === "booked" || day.status === "blocked"}
                className={`text-sm p-3 rounded-lg text-center font-bold transition-all ${getColor(
                  day.status
                )} ${
                  day.status === "available"
                    ? "hover:shadow-lg hover:scale-105 cursor-pointer"
                    : "cursor-not-allowed opacity-75"
                }`}
              >
                {day.date}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <button
            onClick={onAddUnitClick}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-6 text-center transition-all"
          >
            <Plus className="w-6 h-6 mx-auto mb-2" />
            <p className="font-bold text-sm">Add Unit</p>
          </button>
          <button
            onClick={onBookingClick}
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-6 text-center transition-all"
          >
            <Settings className="w-6 h-6 mx-auto mb-2" />
            <p className="font-bold text-sm">Booking Settings</p>
          </button>
          <button
            onClick={onPaymentClick}
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-6 text-center transition-all"
          >
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <p className="font-bold text-sm">Payment Settings</p>
          </button>
          <button
            onClick={onPoliciesClick}
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg p-6 text-center transition-all"
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <p className="font-bold text-sm">Policies</p>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-6 text-center transition-all">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="font-bold text-sm">Finance</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  Time
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  Action
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
                  Details
                </th>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">
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
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-in fade-in duration-500"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <td className="py-4 px-4">
                    <span className="text-sm font-medium text-gray-600">
                      {item.time}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {item.action}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.user}
                      </p>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
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
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">Showing 8 of 127 activities</p>
          <button className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
            View All Activity →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;