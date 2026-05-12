"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { useGetBookingsQuery } from "@/redux/api/bookingsApi";
import { Booking } from "@/types/booking";
import { Calendar, ChevronLeft, ChevronRight, Filter, X, User, MapPin, CalendarDays, DollarSign } from "lucide-react";
import { createPortal } from "react-dom";

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
    status: string;
  };
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  duration: number;
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
      case "on-going":
        return "bg-teal-500 text-white";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
      case "rejected":
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(booking.status || "")}`}>
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

const HAVEN_COLORS: Record<string, { bg: string; border: string }> = {
  "Haven 1":  { bg: "#0EA5E9", border: "#0284C7" },
  "Haven 2":  { bg: "#7C3AED", border: "#6D28D9" },
  "Haven 3":  { bg: "#F43F5E", border: "#E11D48" },
  "Haven 4":  { bg: "#0D9488", border: "#0F766E" },
  "Haven 5":  { bg: "#D946EF", border: "#C026D3" },
  "Haven 7":  { bg: "#B45309", border: "#92400E" },
  "Haven 8":  { bg: "#64748B", border: "#475569" },
  "Haven 10": { bg: "#65A30D", border: "#4D7C0F" },
};

const getRoomColor = (roomName: string) =>
  HAVEN_COLORS[roomName] ?? { bg: "#6B7280", border: "#4B5563" };

const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase() || "") {
    case "pending":     return { color: "rgba(255,255,255,0.80)", bg: "rgba(202,138,4,0.80)",   border: "rgba(161,98,7,0.9)" };
    case "approved":
    case "confirmed":   return { color: "rgba(255,255,255,0.80)", bg: "rgba(22,163,74,0.80)",   border: "rgba(21,128,61,0.9)" };
    case "checked-in":  return { color: "rgba(255,255,255,0.80)", bg: "rgba(37,99,235,0.80)",   border: "rgba(29,78,216,0.9)" };
    case "checked-out": return { color: "rgba(255,255,255,0.80)", bg: "rgba(79,70,229,0.80)",   border: "rgba(67,56,202,0.9)" };
    case "completed":   return { color: "rgba(255,255,255,0.80)", bg: "rgba(5,150,105,0.80)",   border: "rgba(4,120,87,0.9)" };
    case "on-going":    return { color: "rgba(255,255,255,0.80)", bg: "rgba(20,184,166,0.80)",  border: "rgba(15,118,110,0.9)" };
    case "declined":
    case "rejected":    return { color: "rgba(255,255,255,0.80)", bg: "rgba(220,38,38,0.80)",   border: "rgba(185,28,28,0.9)" };
    case "cancelled":   return { color: "rgba(255,255,255,0.80)", bg: "rgba(234,88,12,0.80)",   border: "rgba(194,65,12,0.9)" };
    default:            return { color: "rgba(255,255,255,0.80)", bg: "rgba(107,114,128,0.80)", border: "rgba(75,85,99,0.9)" };
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase() || "") {
    case "pending":     return "Pending";
    case "on-going":    return "On-going";
    case "approved":
    case "confirmed":   return "Approved";
    case "checked-in":  return "Checked-in";
    case "checked-out": return "Checked-out";
    case "completed":   return "Completed";
    case "declined":
    case "rejected":    return "Declined";
    case "cancelled":   return "Cancelled";
    default:            return status;
  }
};

export default function CalendarPage() {
  const { data: bookings = [], isLoading, error } = useGetBookingsQuery({});

  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">("dayGridMonth");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<{ booking: Booking; duration: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonthYear, setCurrentMonthYear] = useState<string>("");

  // Calculate duration in nights
  const calculateDuration = (checkIn: string, checkOut: string): number => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get unique room names for the dropdown
  const roomOptions = useMemo(() => {
    const rooms = new Set(bookings.map((b) => b.room_name).filter(Boolean));
    return Array.from(rooms) as string[];
  }, [bookings]);

  // Convert bookings to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    // Filter out bookings without valid dates
    let filteredBookings = bookings.filter(
      (booking) => booking.check_in_date && booking.check_out_date
    );

    if (selectedRoom !== "all") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.room_name === selectedRoom
      );
    }

    if (filterStatus !== "all") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    // Strip time and normalize to local YYYY-MM-DD so FullCalendar treats every event as an all-day block.
    // Uses LOCAL timezone methods â€” dates from the API can arrive as "2026-04-27T16:00:00.000Z"
    // (UTC+8 midnight serialized as UTC), so splitting on "T" would give the wrong day.
    // Normalize to local YYYY-MM-DD so FullCalendar treats events as all-day blocks
    const toDateOnly = (d: unknown): string => {
      if (!d) return "";
      const s = String(d);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const dt = new Date(d as string);
      if (isNaN(dt.getTime())) return s;
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    return filteredBookings.map((booking) => {
      const roomColors = getRoomColor(booking.room_name || "");
      const checkInDate = toDateOnly(booking.check_in_date);
      const checkOutDate = toDateOnly(booking.check_out_date);
      const duration = calculateDuration(checkInDate, checkOutDate);

      return {
        id: booking.id,
        title: `${booking.guest_first_name} ${booking.guest_last_name} - ${booking.room_name || "Unknown Room"}`,
        start: checkInDate,
        end: checkOutDate,
        backgroundColor: roomColors.bg,
        borderColor: roomColors.border,
        textColor: "#FFFFFF",
        extendedProps: {
          booking,
          duration,
          status: booking.status || "",
        },
      };
    });
  }, [bookings, filterStatus, selectedRoom]);

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const { booking, duration } = clickInfo.event.extendedProps;
    setSelectedEvent({ booking, duration });
    setIsModalOpen(true);
  };

  // Custom event content
  const renderEventContent = (eventInfo: EventContentArg) => {
    const { duration, status } = eventInfo.event.extendedProps;
    const isMonthView = currentView === "dayGridMonth";
    const badge = getStatusBadgeStyle(status);

    return (
      <div className="px-1.5 py-0.5 overflow-hidden">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          <div className="font-bold text-xs truncate min-w-0" style={{ color: "#FFFFFF" }}>
            {eventInfo.event.title}
          </div>
          {status && (
            <span
              style={{
                color: badge.color,
                backgroundColor: badge.bg,
                border: `1px solid ${badge.border}`,
                fontSize: "9px",
                padding: "1px 5px",
                borderRadius: "999px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {getStatusLabel(status)}
            </span>
          )}
        </div>
        {isMonthView && (
          <div className="text-xs truncate" style={{ color: "#FFFFFF", opacity: 0.80 }}>
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
    const statuses = new Set(bookings.map((b) => b.status?.toLowerCase()));
    return Array.from(statuses).filter((s): s is string => !!s);
  }, [bookings]);

  // Initialize month/year display when component mounts
  useEffect(() => {
    // Set initial display immediately
    updateMonthYearDisplayFallback();
    
    // Then try to update with calendar data when ready
    const timer = setTimeout(() => {
      updateMonthYearDisplay();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isLoading]); // Add isLoading dependency to update when data loads

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
      {/* Header - Match BookingPage style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Booking Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage all bookings in calendar view</p>
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

          {/* Room Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="all">All Rooms</option>
              {roomOptions.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rooms:</span>
            {Object.entries(HAVEN_COLORS).map(([name, colors]) => (
              <div key={name} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.bg }}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status:</span>
            {[
              { label: "Pending",     color: "#EAB308" },
              { label: "On-going",    color: "#14B8A6" },
              { label: "Approved",    color: "#22C55E" },
              { label: "Checked-in",  color: "#3B82F6" },
              { label: "Checked-out", color: "#6366F1" },
              { label: "Completed",   color: "#10B981" },
              { label: "Declined",    color: "#EF4444" },
              { label: "Cancelled",   color: "#F97316" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
              </div>
            ))}
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
              nextDayThreshold="00:00:00" // Show events until the end of the check-out day
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
}