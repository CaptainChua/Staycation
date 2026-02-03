"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import { Calendar, ChevronLeft, ChevronRight, Filter, X, User, MapPin, CalendarDays, DollarSign } from "lucide-react";
import { createPortal } from "react-dom";

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
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  room_name: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  adults: number;
  children: number;
  infants: number;
  total_amount: number;
  down_payment: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    booking: Booking;
    duration: number;
  };
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  duration: number;
}

interface CalendarPageProps {
  havens: Haven[];
}

// Event Details Modal
function EventDetailsModal({ isOpen, onClose, booking, duration }: EventModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
        return "bg-red-100 text-red-700";
      case "checked-in":
        return "bg-blue-100 text-blue-700";
      case "checked-out":
        return "bg-indigo-100 text-indigo-700";
      case "cancelled":
        return "bg-orange-100 text-orange-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Booking Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {booking.booking_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Status Badge */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>

          {/* Guest Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4" />
              Guest Information
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                {booking.guest_first_name} {booking.guest_last_name}
              </p>
              <p className="text-gray-600 dark:text-gray-400">{booking.guest_email || "N/A"}</p>
              <p className="text-gray-600 dark:text-gray-400">{booking.guest_phone || "N/A"}</p>
            </div>
          </div>

          {/* Room Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              Room
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {booking.room_name || "Unknown Room"}
            </p>
          </div>

          {/* Stay Duration */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
              <CalendarDays className="w-4 h-4" />
              Stay Duration
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {booking.check_in_date ? formatDate(booking.check_in_date) : "N/A"} at {booking.check_in_time || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {booking.check_out_date ? formatDate(booking.check_out_date) : "N/A"} at {booking.check_out_time || "N/A"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                <span className="text-blue-700 dark:text-blue-300 font-medium">Duration:</span>
                <span className="text-blue-700 dark:text-blue-300 font-bold">
                  {duration} {duration === 1 ? "night" : "nights"}
                </span>
              </div>
            </div>
          </div>

          {/* Guests Count */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              Guests
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Adults: <span className="font-medium text-gray-900 dark:text-gray-100">{booking.adults || 0}</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Children: <span className="font-medium text-gray-900 dark:text-gray-100">{booking.children || 0}</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Infants: <span className="font-medium text-gray-900 dark:text-gray-100">{booking.infants || 0}</span>
              </span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <DollarSign className="w-4 h-4" />
              Payment Summary
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(booking.total_amount || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Down Payment:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(booking.down_payment || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency((booking.total_amount || 0) - (booking.down_payment || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

const CalendarPage = ({ havens }: CalendarPageProps) => {
  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<{ booking: Booking; duration: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonthYear, setCurrentMonthYear] = useState<string>("");

  // Set initial selected haven when havens data loads
  useEffect(() => {
    if (havens.length > 0 && !selectedHaven) {
      setSelectedHaven(havens[0]);
    }
  }, [havens, selectedHaven]);

  // Fetch all bookings and filter for owner's havens
  const { data: bookings = [], isLoading, error } = useGetBookingsQuery({});

  // Filter bookings to show only those for owner's havens
  const filteredBookings = useMemo(() => {
    if (!selectedHaven) return bookings;
    
    return bookings.filter(booking => {
      // Match bookings by room_name with the selected haven's name
      return booking.room_name === selectedHaven.haven_name || 
             booking.room_name === selectedHaven.name;
    });
  }, [bookings, selectedHaven]);

  // Get status color for calendar events
  const getEventColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "approved":
        return { bg: "#22c55e", border: "#16a34a", text: "#ffffff" };
      case "pending":
        return { bg: "#eab308", border: "#ca8a04", text: "#ffffff" };
      case "declined":
        return { bg: "#ef4444", border: "#dc2626", text: "#ffffff" };
      case "checked-in":
        return { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" };
      case "checked-out":
        return { bg: "#6366f1", border: "#4f46e5", text: "#ffffff" };
      case "cancelled":
        return { bg: "#f97316", border: "#ea580c", text: "#ffffff" };
      case "completed":
        return { bg: "#10b981", border: "#059669", text: "#ffffff" };
      default:
        return { bg: "#6b7280", border: "#4b5563", text: "#ffffff" };
    }
  };

  // Calculate duration in nights
  const calculateDuration = (checkIn: string, checkOut: string): number => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Convert bookings to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    // Use filtered bookings for the selected haven
    let bookingsToUse = filteredBookings;

    // Filter out bookings without valid dates
    bookingsToUse = bookingsToUse.filter(
      (booking: Booking) => booking.check_in_date && booking.check_out_date
    );

    if (filterStatus !== "all") {
      bookingsToUse = bookingsToUse.filter(
        (booking: Booking) => booking.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    return bookingsToUse.map((booking: Booking) => {
      const colors = getEventColor(booking.status || "");
      const checkInDate = booking.check_in_date as string;
      const checkOutDate = booking.check_out_date as string;
      const duration = calculateDuration(checkInDate, checkOutDate);

      return {
        id: booking.id,
        title: `${booking.guest_first_name} ${booking.guest_last_name} - ${booking.room_name || "Unknown Room"}`,
        start: checkInDate,
        end: checkOutDate,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          booking,
          duration,
        },
      };
    });
  }, [filteredBookings, filterStatus]);

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const { booking, duration } = clickInfo.event.extendedProps;
    setSelectedEvent({ booking, duration });
    setIsModalOpen(true);
  };

  // Custom event content
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { duration } = eventInfo.event.extendedProps;
    const isMonthView = currentView === "dayGridMonth";

    return (
      <div className="p-1 overflow-hidden">
        <div className="font-semibold text-xs truncate">{eventInfo.event.title}</div>
        {isMonthView && (
          <div className="text-xs opacity-90">
            {duration} {duration === 1 ? "night" : "nights"}
          </div>
        )}
      </div>
    );
  };

  // Update month/year display when calendar changes
  const updateMonthYearDisplay = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const currentDate = calendarApi.getDate();
      const monthYear = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      setCurrentMonthYear(monthYear);
    }
  };

  // Alternative update function that doesn't rely on calendar ref
  const updateMonthYearDisplayFallback = () => {
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    setCurrentMonthYear(monthYear);
  };

  // Navigation handlers
  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
    setTimeout(updateMonthYearDisplay, 0);
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
    setTimeout(updateMonthYearDisplay, 0);
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
    setTimeout(updateMonthYearDisplay, 0);
  };

  const handleViewChange = (view: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
    setTimeout(updateMonthYearDisplay, 0);
  };

  // Get unique statuses for filter
  const statusOptions = useMemo(() => {
    const statuses = new Set(filteredBookings.map((b: Booking) => b.status?.toLowerCase()));
    return Array.from(statuses).filter(Boolean);
  }, [filteredBookings]);

  // Initialize month/year display when component mounts
  useEffect(() => {
    // Set initial display immediately
    updateMonthYearDisplayFallback();
    
    // Then try to update with calendar data when ready
    const timer = setTimeout(() => {
      updateMonthYearDisplay();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">Error loading calendar</p>
            <p className="text-sm mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Booking Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage your property bookings in calendar view</p>
        </div>
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

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Navigation with Month/Year Display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-medium text-sm"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Month/Year Display */}
            <div className="min-w-[200px] text-center">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {currentMonthYear || 'Loading...'}
              </h2>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleViewChange("dayGridMonth")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === "dayGridMonth"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange("timeGridWeek")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === "timeGridWeek"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange("timeGridDay")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === "timeGridDay"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              Day
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Checked-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Checked-out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Declined</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cancelled</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 flex-1 border border-gray-200 dark:border-gray-700 min-h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[500px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <div className="h-[600px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={currentView}
              events={calendarEvents}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              datesSet={updateMonthYearDisplay}
              headerToolbar={false}
              height="100%"
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventDisplay="block"
              displayEventTime={false}
              firstDay={0}
              fixedWeekCount={false}
              showNonCurrentDates={true}
              dayHeaderFormat={{ weekday: "short" }}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={true}
              nowIndicator={true}
              selectable={false}
              editable={false}
              nextDayThreshold="00:00:00"
            />
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        booking={selectedEvent?.booking || null}
        duration={selectedEvent?.duration || 0}
      />
    </div>
  );
};

export default CalendarPage;
