"use client";

import { formatDate } from "../utils";

interface DateRangeWithDaysProps {
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  isCompact?: boolean;
}

export default function DateRangeWithDays({
  checkInDate,
  checkInTime,
  checkOutDate,
  checkOutTime,
  isCompact = false,
}: DateRangeWithDaysProps) {
  // Calculate total days and hours
  const calculateDuration = () => {
    if (!checkInDate || !checkOutDate) return { days: 0, hours: 0, isSameDay: false };
    try {
      // Parse dates more robustly - handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss" formats
      const parseDate = (dateStr: string, timeStr?: string) => {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
          const day = parseInt(parts[2], 10);

          const timeParts = (timeStr || "00:00").split(":");
          const hours = parseInt(timeParts[0], 10);
          const minutes = parseInt(timeParts[1], 10);

          // Create date in local timezone
          return new Date(year, month, day, hours, minutes, 0);
        }
        return new Date(`${dateStr}T${timeStr || "00:00"}`);
      };

      const checkInDateTime = parseDate(checkInDate, checkInTime);
      const checkOutDateTime = parseDate(checkOutDate, checkOutTime);

      const diffTime = checkOutDateTime.getTime() - checkInDateTime.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      // Check if same day using local date components
      const checkInDate_only = parseDate(checkInDate);
      const checkOutDate_only = parseDate(checkOutDate);
      const isSameDay =
        checkInDate_only.getFullYear() === checkOutDate_only.getFullYear() &&
        checkInDate_only.getMonth() === checkOutDate_only.getMonth() &&
        checkInDate_only.getDate() === checkOutDate_only.getDate();

      return {
        days: Math.max(0, diffDays),
        hours: Math.max(0, diffHours),
        isSameDay,
      };
    } catch (error) {
      console.error("Error calculating duration:", error, { checkInDate, checkOutDate, checkInTime, checkOutTime });
      return { days: 0, hours: 0, isSameDay: false };
    }
  };

  const { days: totalDays, hours: totalHours, isSameDay } = calculateDuration();

  // Format duration string
  const getDurationString = () => {
    if (totalDays === 0 && totalHours === 0) return "";
    if (isSameDay && totalHours > 0) {
      return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
    }
    if (totalDays === 0 && totalHours > 0) {
      return `${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
    }
    if (totalDays > 0 && totalHours > 0) {
      return `${totalDays} ${totalDays === 1 ? "day" : "days"}, ${totalHours} ${totalHours === 1 ? "hour" : "hours"}`;
    }
    return `${totalDays} ${totalDays === 1 ? "day" : "days"}`;
  };

  if (isCompact) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Check-In:</span>
          <span className="whitespace-nowrap">
            {formatDate(checkInDate)} {checkInTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">Check-Out:</span>
          <span className="whitespace-nowrap">
            {formatDate(checkOutDate)} {checkOutTime}
          </span>
        </div>
        {(totalDays > 0 || totalHours > 0) && (
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              Duration:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {getDurationString()}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs font-semibold text-gray-500">Check-In:</span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {formatDate(checkInDate)}
        </p>
        <p className="text-xs text-gray-500">{checkInTime}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-gray-500">Check-Out:</span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {formatDate(checkOutDate)}
        </p>
        <p className="text-xs text-gray-500">{checkOutTime}</p>
      </div>
      {(totalDays > 0 || totalHours > 0) && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Duration:
          </p>
          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {getDurationString()}
          </p>
        </div>
      )}
    </div>
  );
}
