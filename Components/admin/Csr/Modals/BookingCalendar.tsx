"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingCalendarProps {
  /** Selected check-in date (YYYY-MM-DD) */
  checkInDate: string;
  /** Selected check-out date (YYYY-MM-DD) */
  checkOutDate: string;
  /** List of unavailable date strings (YYYY-MM-DD) — already booked / blocked */
  unavailableDates: string[];
  /** Minimum selectable date (default = today) */
  minDate?: string;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
  /**
   * When true the calendar acts as a single-date picker for fixed-duration stays
   * (10h / 21h). Clicking a date fires both onSelectCheckIn and onSelectCheckOut
   * with the same date — the parent's auto-derive effect handles next-day rollover.
   */
  lockCheckOut?: boolean;
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmtYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseYMD = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

interface MonthGridProps {
  monthDate: Date;
  checkInDate: string;
  checkOutDate: string;
  unavailableSet: Set<string>;
  today: Date;
  minDateObj: Date;
  onPick: (date: Date, ymd: string) => void;
}

function MonthGrid({
  monthDate,
  checkInDate,
  checkOutDate,
  unavailableSet,
  today,
  minDateObj,
  onPick,
}: MonthGridProps) {
  const days = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const startWeekday = firstDay.getDay();
    const grid: Array<{ date: Date | null; ymd: string | null }> = [];
    for (let i = 0; i < startWeekday; i++) grid.push({ date: null, ymd: null });
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      grid.push({ date, ymd: fmtYMD(date) });
    }
    return grid;
  }, [monthDate]);

  const checkIn = parseYMD(checkInDate);
  const checkOut = parseYMD(checkOutDate);

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    return date > checkIn && date < checkOut;
  };

  return (
    <div className="flex-1 min-w-0">
      <p className="text-center text-base font-bold text-white mb-3">
        {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
      </p>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-[11px] font-semibold text-center text-gray-400 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((cell, i) => {
          if (!cell.date || !cell.ymd) {
            return <div key={`blank-${i}`} className="h-10" />;
          }
          const ymd = cell.ymd;
          const isUnavailable = unavailableSet.has(ymd);
          const isBelowMin = cell.date < minDateObj;
          const isDisabled = isUnavailable || isBelowMin;
          const isCheckIn = ymd === checkInDate;
          const isCheckOut = ymd === checkOutDate;
          const isRange = isInRange(cell.date);
          const isToday = ymd === fmtYMD(today);

          // Build class for the circular pill
          let pillClass =
            "w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-semibold transition-all border-2 ";
          if (isCheckIn || isCheckOut) {
            // Selected — solid amber
            pillClass += "bg-amber-500 border-amber-500 text-white shadow-md hover:bg-amber-600 cursor-pointer ";
          } else if (isRange) {
            // Between check-in & check-out — light amber fill
            pillClass += "bg-amber-100 border-amber-300 text-amber-700 cursor-pointer hover:bg-amber-200 ";
          } else if (isUnavailable) {
            // Unavailable — solid red
            pillClass += "bg-red-600 border-red-600 text-white cursor-not-allowed opacity-90 ";
          } else if (isBelowMin) {
            // Past date — gray ghost
            pillClass += "border-gray-600 text-gray-500 cursor-not-allowed bg-transparent ";
          } else if (isToday) {
            // Today — green outline + ring
            pillClass += "border-green-500 text-white bg-transparent hover:bg-green-500/20 cursor-pointer ring-2 ring-green-400/40 ";
          } else {
            // Available — green outline, transparent fill
            pillClass += "border-green-500 text-white bg-transparent hover:bg-green-500/20 cursor-pointer ";
          }

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => !isDisabled && onPick(cell.date as Date, ymd)}
              disabled={isDisabled}
              aria-label={`${ymd}${isUnavailable ? " (unavailable)" : ""}`}
              title={isUnavailable ? "This date is unavailable" : ymd}
              className={pillClass}
            >
              {cell.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingCalendar({
  checkInDate,
  checkOutDate,
  unavailableDates,
  minDate,
  onSelectCheckIn,
  onSelectCheckOut,
  lockCheckOut = false,
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDateObj = useMemo(() => parseYMD(minDate || "") || today, [minDate, today]);

  // Left month (the user navigates this; right month is always the next one).
  const [leftMonth, setLeftMonth] = useState<Date>(() => {
    const initial = parseYMD(checkInDate) || today;
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const rightMonth = useMemo(
    () => new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1),
    [leftMonth]
  );

  const [pickingMode, setPickingMode] = useState<"checkIn" | "checkOut">(
    checkInDate && !checkOutDate ? "checkOut" : "checkIn"
  );

  const unavailableSet = useMemo(() => new Set(unavailableDates), [unavailableDates]);

  const handlePick = (date: Date, ymd: string) => {
    if (unavailableSet.has(ymd) || date < minDateObj) return;

    if (lockCheckOut) {
      // Single-date mode — parent computes the real check-out date from
      // stayType + check-in time, so we just hand it the same date for both.
      onSelectCheckIn(ymd);
      onSelectCheckOut(ymd);
      return;
    }

    const checkIn = parseYMD(checkInDate);
    const checkOut = parseYMD(checkOutDate);

    if (pickingMode === "checkIn") {
      onSelectCheckIn(ymd);
      if (checkOut && date >= checkOut) {
        onSelectCheckOut("");
      }
      setPickingMode("checkOut");
    } else {
      if (checkIn && date <= checkIn) {
        onSelectCheckIn(ymd);
        onSelectCheckOut("");
        setPickingMode("checkOut");
        return;
      }
      onSelectCheckOut(ymd);
      setPickingMode("checkIn");
    }
  };

  const goPrev = () =>
    setLeftMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goNext = () =>
    setLeftMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const headerText = lockCheckOut
    ? "Select date"
    : pickingMode === "checkIn"
    ? "Select check-in date"
    : "Select check-out date";

  return (
    <div className="rounded-2xl bg-gray-900 dark:bg-gray-900 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous month"
          title="Previous month"
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-medium text-white">{headerText}</p>
        <button
          type="button"
          onClick={goNext}
          aria-label="Next month"
          title="Next month"
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Two months side-by-side */}
      <div className="flex flex-col md:flex-row gap-6">
        <MonthGrid
          monthDate={leftMonth}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          unavailableSet={unavailableSet}
          today={today}
          minDateObj={minDateObj}
          onPick={handlePick}
        />
        <MonthGrid
          monthDate={rightMonth}
          checkInDate={checkInDate}
          checkOutDate={checkOutDate}
          unavailableSet={unavailableSet}
          today={today}
          minDateObj={minDateObj}
          onPick={handlePick}
        />
      </div>

      {/* Selected summary + mode toggle */}
      <div className="mt-5 pt-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {lockCheckOut ? (
          <div className="text-xs text-gray-300">
            {checkInDate
              ? `Selected · ${new Date(checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Pick a date — check-out is set automatically"}
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPickingMode("checkIn")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                pickingMode === "checkIn"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Check-in
              {checkInDate && ` · ${new Date(checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </button>
            <button
              type="button"
              onClick={() => setPickingMode("checkOut")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                pickingMode === "checkOut"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Check-out
              {checkOutDate && ` · ${new Date(checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-green-500" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600" />
            Unavailable
          </span>
        </div>
      </div>
    </div>
  );
}
