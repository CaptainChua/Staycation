"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDateSafe } from "@/lib/dateUtils";

interface AdminDateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  blockedDates?: { fromDate: string; toDate: string }[];
}

const AdminDateRangePicker = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  blockedDates = []
}: AdminDateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingToDate, setSelectingToDate] = useState(false);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingToDate(false);
        setHoveredDate(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatDateRange = () => {
    if (!fromDate && !toDate) return "Select date range";
    if (fromDate && toDate) {
      return `${formatDateSafe(fromDate)} - ${formatDateSafe(toDate)}`;
    } else if (fromDate) {
      return `${formatDateSafe(fromDate)} - ...`;
    }
    return "Select date range";
  };

  const isDateBlocked = (dateString: string) => {
    return blockedDates.some(range => {
      const date = new Date(dateString);
      const start = new Date(range.fromDate);
      const end = new Date(range.toDate);
      date.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      return date >= start && date <= end;
    });
  };

  const handleDateClick = (dateString: string) => {
    if (isDateBlocked(dateString)) return;

    if (!fromDate || selectingToDate) {
      if (!fromDate) {
        onFromDateChange(dateString);
        setSelectingToDate(true);
      } else {
        const start = new Date(fromDate);
        const selected = new Date(dateString);

        if (selected <= start) {
          onFromDateChange(dateString);
          onToDateChange("");
          setSelectingToDate(true);
        } else {
          // Check if any blocked dates are in between
          const hasBlockedInRange = blockedDates.some(range => {
            const bStart = new Date(range.fromDate);
            const bEnd = new Date(range.toDate);
            bStart.setHours(0,0,0,0);
            bEnd.setHours(0,0,0,0);
            return bStart > start && bStart < selected;
          });

          if (hasBlockedInRange) {
            onFromDateChange(dateString);
            onToDateChange("");
            setSelectingToDate(true);
          } else {
            onToDateChange(dateString);
            setSelectingToDate(false);
            setHoveredDate(null);
            setIsOpen(false);
          }
        }
      }
    } else {
      onFromDateChange(dateString);
      onToDateChange("");
      setSelectingToDate(true);
    }
  };

  const generateCalendarForMonth = (monthOffset: number) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Use current year/month based on offset from today
    const calendarDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month, day);
      date.setHours(0,0,0,0);

      const isPast = date < today;
      const isFrom = fromDate === dateString;
      const isTo = toDate === dateString;
      const isBlocked = isDateBlocked(dateString);
      const isInRange = fromDate && toDate &&
        date > new Date(fromDate) &&
        date < new Date(toDate);

      let isHoveredRange = false;
      if (fromDate && hoveredDate && !toDate) {
        const hoverDate = new Date(hoveredDate);
        const start = new Date(fromDate);
        if (date > start && date < hoverDate) {
          // Only show hover range if no blocked dates are in between
          const hasBlockedInHover = blockedDates.some(range => {
            const bStart = new Date(range.fromDate);
            bStart.setHours(0,0,0,0);
            return bStart > start && bStart < hoverDate;
          });
          if (!hasBlockedInHover) {
            isHoveredRange = true;
          }
        }
      }

      days.push({
        day,
        dateString,
        isPast,
        isFrom,
        isTo,
        isBlocked,
        isInRange,
        isHoveredRange
      });
    }

    return days;
  };

  const getMonthName = (monthOffset: number) => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const canGoBack = currentMonthOffset > -12; // Allow looking back up to a year
  const canGoForward = currentMonthOffset < 24; // Allow looking forward up to 2 years

  const renderMonth = (monthOffset: number) => {
    const calendarDays = generateCalendarForMonth(monthOffset);

    return (
      <div className="flex-1 min-w-0">
        <div className="mb-4 text-center">
          <h3 className="text-sm font-bold text-gray-900">
            {getMonthName(monthOffset)}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={`empty-${index}`} className="aspect-square"></div>;
            }

            const { day, dateString, isPast, isFrom, isTo, isBlocked, isInRange, isHoveredRange } = dayInfo;
            const isHovered = hoveredDate === dateString;

            return (
              <button
                key={dateString}
                type="button"
                onClick={() => handleDateClick(dateString)}
                onMouseEnter={() => !isPast && !isBlocked && setHoveredDate(dateString)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={isPast || isBlocked}
                className={`
                  aspect-square w-full flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200
                  relative
                  ${isPast
                    ? "text-gray-300 cursor-not-allowed"
                    : isBlocked
                    ? "text-gray-300 bg-gray-50 cursor-not-allowed line-through"
                    : "cursor-pointer hover:bg-gray-100"
                  }
                  ${isFrom || isTo
                    ? "!bg-brand-primary text-white shadow-md z-10"
                    : isInRange || isHoveredRange
                    ? "bg-brand-primary/10 text-brand-primary"
                    : ""
                  }
                  ${isHovered && !isFrom && !isTo
                    ? "ring-2 ring-brand-primary ring-inset"
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Date Range</label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full h-12 flex items-center gap-3 px-4 bg-white border rounded-lg transition-all duration-200 text-left
            ${isOpen ? "border-brand-primary ring-1 ring-brand-primary/20" : "border-gray-300 hover:border-brand-primary/60"}
          `}
        >
          <CalendarIcon className={`w-5 h-5 ${isOpen ? "text-brand-primary" : "text-gray-400"}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${fromDate ? "text-gray-900" : "text-gray-400"}`}>
              {formatDateRange()}
            </p>
          </div>
          {(fromDate || toDate) && (
             <X 
              className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                onFromDateChange("");
                onToDateChange("");
                setSelectingToDate(false);
              }}
             />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 p-6 w-full sm:w-[600px] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => canGoBack && setCurrentMonthOffset(currentMonthOffset - 1)}
              disabled={!canGoBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <div className="text-center">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                {selectingToDate ? "Select End Date" : "Select Start Date"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => canGoForward && setCurrentMonthOffset(currentMonthOffset + 1)}
              disabled={!canGoForward}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex gap-8">
            {renderMonth(currentMonthOffset)}
            <div className="hidden sm:block flex-1">
              {renderMonth(currentMonthOffset + 1)}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-brand-primary rounded-sm"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-sm"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Blocked</span>
                </div>
             </div>
             <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all"
             >
               Done
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDateRangePicker;
