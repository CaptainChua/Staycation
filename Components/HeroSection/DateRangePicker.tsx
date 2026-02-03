"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { formatDateSafe } from "@/lib/dateUtils";
import { useGetRoomBookingsQuery } from "@/redux/api/bookingsApi";
import { useGetBlockedDatesQuery } from "@/redux/api/blockedDatesApi";

interface BookedDateRange {
  check_in_date: string;
  check_out_date: string;
  status: string;
}

interface BlockedDateRange {
  from_date: string;
  to_date: string;
  reason?: string;
}

interface DateRangePickerProps {
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  havenId?: string; // Optional: if provided, will fetch and block booked dates
  expanded?: boolean; // Optional: if true, always show calendar inline
}

const DateRangePicker = ({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  havenId,
  expanded = false
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(1); // Start from February (month 1)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  // Fetch booked dates for the room if havenId is provided
  const { data: roomBookingsData, isLoading } = useGetRoomBookingsQuery(havenId, {
    skip: !havenId, // Skip the query if no havenId is provided
  });

  // Fetch blocked dates (maintenance) for the room if havenId is provided
  const { data: blockedDatesData, isLoading: isLoadingBlockedDates } = useGetBlockedDatesQuery(
    { haven_id: havenId },
    { skip: !havenId }
  );

  // Calculate blocked dates from booked ranges
  const blockedDates = useMemo(() => {
    const blocked = new Set<string>();

    if (!roomBookingsData?.data) return blocked;

    const bookings = roomBookingsData.data as BookedDateRange[];

    bookings.forEach((booking) => {
      // Only block dates for approved, confirmed, or checked-in bookings
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);

      // Add all dates in the range (including check-in, excluding check-out for turnover)
      const currentDate = new Date(checkIn);
      while (currentDate < checkOut) {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        blocked.add(dateString);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    console.log("🗓️ [DateRangePicker] blockedDates:", Array.from(blocked));
    return blocked;
  }, [roomBookingsData]);

  // Calculate maintenance dates from blocked_dates table
  const maintenanceDates = useMemo(() => {
    const maintenance = new Set<string>();

    if (!blockedDatesData?.data) return maintenance;

    const blockedRanges = blockedDatesData.data as BlockedDateRange[];

    blockedRanges.forEach((range) => {
      const fromDate = new Date(range.from_date);
      const toDate = new Date(range.to_date);

      // Add all dates in the range (including from_date, including to_date)
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        maintenance.add(dateString);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    console.log("🔧 [DateRangePicker] maintenanceDates:", Array.from(maintenance));
    return maintenance;
  }, [blockedDatesData]);

  // Validate selected dates when location changes or blocked dates update
  useEffect(() => {
    // Check if selected check-in date is blocked or maintenance
    if (checkInDate && (blockedDates.has(checkInDate) || maintenanceDates.has(checkInDate))) {
      onCheckInChange("");
      onCheckOutChange("");
      setSelectingCheckOut(false);
    }

    // Check if selected check-out date is blocked or maintenance
    if (checkOutDate && (blockedDates.has(checkOutDate) || maintenanceDates.has(checkOutDate))) {
      onCheckOutChange("");
      setSelectingCheckOut(false);
    }
  }, [blockedDates, maintenanceDates, havenId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingCheckOut(false);
        setHoveredDate(null);
      }
    };

    // Only add listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDateRange = () => {
    if (!checkInDate && !checkOutDate) return "Add dates";

    if (checkInDate && checkOutDate) {
      return `${formatDateSafe(checkInDate)} - ${formatDateSafe(checkOutDate)}`;
    } else if (checkInDate) {
      return formatDateSafe(checkInDate);
    }
    return "Add dates";
  };

  const handleDateClick = (dateString: string) => {
    // Get the date info to verify it's not blocked or in the past
    const dateObj = new Date(dateString);
    const currentDate = new Date();
    const todayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const isPastDate = dateObj < todayDate;
    const isBlockedDate = blockedDates.has(dateString);
    const isMaintenanceDate = maintenanceDates.has(dateString);

    // Don't allow selecting past, blocked, or maintenance dates
    if (isPastDate || isBlockedDate || isMaintenanceDate) {
      return;
    }

    if (!checkInDate || selectingCheckOut) {
      if (!checkInDate) {
        onCheckInChange(dateString);
        setSelectingCheckOut(true);
      } else {
        const checkIn = new Date(checkInDate);
        const selected = new Date(dateString);

        if (selected <= checkIn) {
          onCheckInChange(dateString);
          onCheckOutChange("");
          setSelectingCheckOut(true);
        } else {
          onCheckOutChange(dateString);
          setSelectingCheckOut(false);
          setHoveredDate(null);
        }
      }
    } else {
      onCheckInChange(dateString);
      onCheckOutChange("");
      setSelectingCheckOut(true);
    }
  };

  const generateCalendarForMonth = (monthOffset: number) => {
    const today = new Date();
    const year = 2026;
    const month = monthOffset;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Create date string in local time to avoid timezone shift
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = date < todayDate;
      const isBlocked = blockedDates.has(dateString); // Check if date is blocked (already booked)
      const isMaintenance = maintenanceDates.has(dateString); // Check if date is maintenance
      const isCheckIn = checkInDate === dateString;
      const isCheckOut = checkOutDate === dateString;
      const isInRange = checkInDate && checkOutDate &&
        date > new Date(checkInDate) &&
        date < new Date(checkOutDate);

      // Check if date should be in hover range
      let isHoveredRange = false;
      if (checkInDate && hoveredDate && !checkOutDate) {
        const hoverDate = new Date(hoveredDate);
        const checkIn = new Date(checkInDate);
        if (date > checkIn && date < hoverDate) {
          isHoveredRange = true;
        }
      }

      days.push({
        day,
        dateString,
        isPast,
        isBlocked,
        isMaintenance,
        isCheckIn,
        isCheckOut,
        isInRange,
        isHoveredRange
      });
    }

    return days;
  };

  const getMonthName = (monthOffset: number) => {
    const date = new Date(2026, monthOffset, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const canGoBack = currentMonthOffset > 1; // Prevent going back before February
  const canGoForward = currentMonthOffset < 11;

  const renderMonth = (monthOffset: number) => {
    const calendarDays = generateCalendarForMonth(monthOffset);

    return (
      <div className="flex-1 min-w-0">
        {/* Month Header */}
        <div className="mb-2 sm:mb-4 text-center">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {getMonthName(monthOffset)}
          </h3>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1 sm:py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-0">
          {calendarDays.map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const { day, dateString, isPast, isBlocked, isMaintenance, isCheckIn, isCheckOut, isInRange, isHoveredRange } = dayInfo;

            // Determine if this date should show hover effect
            const isHovered = hoveredDate === dateString;
            const isDisabled = isPast || isBlocked || isMaintenance;
            const shouldShowHover = !isDisabled && !isCheckIn && !isCheckOut && !isInRange && !isHoveredRange;

            return (
              <button
                type="button"
                key={dateString}
                onClick={() => !isDisabled && handleDateClick(dateString)}
                onMouseEnter={() => {
                  if (!isDisabled) {
                    setHoveredDate(dateString);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredDate(null);
                }}
                disabled={isDisabled}
                className={`
                  aspect-square w-full h-full flex items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-all duration-200
                  relative border
                  ${isCheckIn || isCheckOut
                    ? "bg-brand-primary text-white font-bold z-10 border-brand-primary"
                    : isPast
                    ? "text-gray-500 dark:text-gray-400 cursor-not-allowed bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    : isBlocked
                    ? "text-red-800 dark:text-red-200 cursor-not-allowed bg-red-300 dark:bg-red-800/70 border-red-500 dark:border-red-600"
                    : isMaintenance
                    ? "text-orange-800 dark:text-orange-200 cursor-not-allowed bg-orange-300 dark:bg-orange-700/60 border-orange-500 dark:border-orange-600"
                    : isInRange || isHoveredRange
                    ? "bg-orange-100 dark:bg-orange-900/30 text-gray-900 dark:text-white border-orange-300 dark:border-orange-700"
                    : "cursor-pointer text-gray-900 dark:text-white bg-green-100 dark:bg-green-800/40 border-green-400 dark:border-green-600"
                  }
                  ${shouldShowHover && !isCheckIn && !isCheckOut
                    ? "hover:scale-110 hover:shadow-lg"
                    : ""
                  }
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render calendar content
  const renderCalendarContent = () => (
    <div className="w-full flex flex-col h-full">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-4 flex-shrink-0">
        <button
          type="button"
          onClick={() => canGoBack && setCurrentMonthOffset(currentMonthOffset - 1)}
          disabled={!canGoBack}
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
            canGoBack
              ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              : "opacity-30 cursor-not-allowed"
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {checkInDate && !checkOutDate && (
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Select check-out date
          </p>
        )}

        <button
          type="button"
          onClick={() => canGoForward && setCurrentMonthOffset(currentMonthOffset + 1)}
          disabled={!canGoForward}
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
            canGoForward
              ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              : "opacity-30 cursor-not-allowed"
          }`}
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Responsive Calendar Layout */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        <div className="flex gap-1 sm:gap-8 flex-col sm:flex-row flex-1 overflow-y-auto relative">
          {(isLoading || isLoadingBlockedDates) && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-700/50 flex items-center justify-center z-20 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Loading availability...</p>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {renderMonth(currentMonthOffset)}
          </div>
          {currentMonthOffset < 11 && (
            <div className="flex-1 min-w-0">
              {renderMonth(currentMonthOffset + 1)}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 flex flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm flex-shrink-0 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Past dates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-300 dark:bg-red-800/70 border border-red-500 dark:border-red-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-300 dark:bg-orange-700/60 border border-orange-500 dark:border-orange-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-100 dark:bg-green-800/40 border border-green-400 dark:border-green-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Available</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2 sm:mt-3 flex-shrink-0">
        {/* Reset to Default Button */}
        <button
          type="button"
          onClick={() => {
            onCheckInChange("");
            onCheckOutChange("");
            setSelectingCheckOut(false);
            setHoveredDate(null);
            setCurrentMonthOffset(1); // Reset to February
          }}
          className="flex-1 py-1.5 sm:py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-medium hover:border-[#8B4513] transition-all duration-200 text-xs sm:text-sm"
        >
          Reset to Default
        </button>

        {/* OK Button */}
        <button
          type="button"
          onClick={() => {
            if (!expanded) {
              setIsOpen(false);
            }
            setSelectingCheckOut(false);
            setHoveredDate(null);
          }}
          className="flex-1 py-1.5 sm:py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm"
        >
          {expanded ? "Done" : "OK"}
        </button>
      </div>
    </div>
  );

  // If expanded mode, show calendar inline
  if (expanded) {
    return <div ref={containerRef} className="h-[500px]">{renderCalendarContent()}</div>;
  }

  // Normal dropdown mode
  return (
    <div ref={containerRef} className="relative sm:col-span-1 h-12 sm:h-14 md:h-16 lg:h-14">
      {/* Date Range Display Button - Airbnb Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full hover:border-[#8B4513] transition-all duration-200 focus:outline-none"
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#8B4513';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '';
          }
        }}
        style={{
          borderColor: isOpen ? '#8B4513' : undefined
        }}
      >
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-[#8B4513] transition-colors duration-200" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs truncate text-gray-500 dark:text-gray-400">When</p>
          <p className="text-sm sm:text-base font-semibold truncate text-gray-900 dark:text-white">
            {formatDateRange()}
          </p>
        </div>
      </button>

      {/* Calendar Dropdown - Responsive Absolute Positioning */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-2xl z-50 p-3 sm:p-6 w-full sm:w-[680px] max-w-[90vw] sm:max-w-none h-[380px] sm:h-[450px] md:h-[500px] lg:h-[550px] flex flex-col overflow-hidden">
          {renderCalendarContent()}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;