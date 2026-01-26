"use client";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useGetRoomBookingsQuery } from "@/redux/api/bookingsApi";
import BookingDateModal from "./Modals/BookingDateModal";

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

interface CalendarPageProps {
  havens: Haven[];
}

const CalendarPage = ({ havens }: CalendarPageProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);
  const [bookingDateModal, setBookingDateModal] = useState<{
    isOpen: boolean;
    selectedDate: Date | null;
    havenName: string;
  }>({
    isOpen: false,
    selectedDate: null,
    havenName: "",
  });
  const hasSetInitialHaven = useRef(false);

  // Set initial selected haven when havens data loads
  useEffect(() => {
    if (havens.length > 0 && !selectedHaven && !hasSetInitialHaven.current) {
      const newHaven = havens[0] as Haven;
      const shouldUpdate = !selectedHaven || ((selectedHaven as Haven).uuid_id !== newHaven.uuid_id);
      
      if (shouldUpdate) {
        setSelectedHaven(newHaven);
        hasSetInitialHaven.current = true;
      }
    }
  }, [havens, selectedHaven]);

  // Fetch bookings for the selected haven
  const { data: bookingsData } = useGetRoomBookingsQuery(
    { havenId: selectedHaven?.uuid_id || "" },
    { skip: !selectedHaven?.uuid_id }
  );

  const bookings = bookingsData?.data || [];

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: 0, status: "available" });
    }

    // Add days of the month
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let date = 1; date <= daysInMonth; date++) {
      const currentDate = new Date(year, month, date);
      currentDate.setHours(0, 0, 0, 0);

      // Check if date is in the past
      if (currentDate < today) {
        days.push({ date, status: "past" });
        continue;
      }

      // Check if date is booked
      const isBooked = bookings.some((booking: Booking) => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return currentDate >= checkIn && currentDate <= checkOut;
      });

      if (isBooked) {
        days.push({ date, status: "booked" });
        continue;
      }

      // Check if date is blocked
      const isBlocked = selectedHaven?.blocked_dates?.some((blockedDate) => {
        const from = new Date(blockedDate.from_date);
        const to = new Date(blockedDate.to_date);
        from.setHours(0, 0, 0, 0);
        to.setHours(0, 0, 0, 0);
        return currentDate >= from && currentDate <= to;
      });

      if (isBlocked) {
        days.push({ date, status: "blocked" });
        continue;
      }

      days.push({ date, status: "available" });
    }

    return days;
  };

  const handleDateClick = (day: CalendarDay) => {
    if (day.status === "available" && selectedHaven) {
      const selectedDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day.date
      );
      setBookingDateModal({
        isOpen: true,
        selectedDate,
        havenName: selectedHaven.haven_name || selectedHaven.name || "Unknown Haven",
      });
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getColor = (status: CalendarDay["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800";
      case "booked":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "blocked":
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
      case "past":
        return "bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
      default:
        return "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100";
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Booking Calendar
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedHaven?.uuid_id || ""}
            onChange={(e) => {
              const haven = havens.find((h) => h.uuid_id === e.target.value);
              setSelectedHaven(haven || null);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {havens.map((haven) => (
              <option key={haven.uuid_id} value={haven.uuid_id}>
                {haven.haven_name} - {haven.tower} - Floor {haven.floor}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-bold text-sm text-gray-600 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
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
              {day.date > 0 ? day.date : ""}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 dark:bg-red-900 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 dark:bg-gray-800 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Past</span>
          </div>
        </div>
      </div>

      {/* Booking Date Modal */}
      <BookingDateModal
        isOpen={bookingDateModal.isOpen}
        onClose={() =>
          setBookingDateModal({
            isOpen: false,
            selectedDate: null,
            havenName: "",
          })
        }
        selectedDate={bookingDateModal.selectedDate || new Date()}
        havenName={bookingDateModal.havenName}
      />
    </div>
  );
};

export default CalendarPage;
