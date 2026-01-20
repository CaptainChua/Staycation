"use client";

import { useState, useMemo } from "react";
import { DatePicker as HeroDatePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { Calendar } from "lucide-react";
import { formatDateWithYear } from "@/lib/dateUtils";

interface DatePickerProps {
  label: string;
  date: string;
  onDateChange: (date: string) => void;
}

const DatePicker = ({ label, date, onDateChange }: DatePickerProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Update selectedDate whenever `date` prop changes
  const selectedDate = useMemo<any>(() => {
    if (date) {
      try {
        const parsed = parseDate(date);
        return parsed as any;
      } catch (error) {
        console.error('[DatePicker] Error parsing date:', date, error);
        return null;
      }
    }
    return null;
  }, [date]);

  // Format date for display using timezone-safe utility
  const formatDisplayDate = (dateString: string) => {
    return formatDateWithYear(dateString);
  };

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Custom styled button wrapper */}
      <div className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#8B4513] transition-colors duration-200 group">
        <div className="flex items-center gap-3">
          <Calendar className={`w-5 h-5 transition-colors duration-200 ${
            isHovered ? "text-[#8B4513]" : "text-gray-500 dark:text-gray-400"
          }`} />
          <div className="flex-1">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            {date ? (
              <span className="block text-sm text-gray-900 dark:text-white mt-1">
                {formatDisplayDate(date)}
              </span>
            ) : (
              <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">Add date</span>
            )}
          </div>
        </div>
      </div>

      {/* Hidden DatePicker that opens on click */}
      <div className="absolute top-0 left-0 w-full h-full opacity-0">
        <HeroDatePicker
          value={selectedDate as any}
          onChange={(newDate) => {
            if (newDate) onDateChange((newDate as any).toString());
          }}
          className="w-full h-full"
          classNames={{
            base: "h-full",
            inputWrapper:
              "h-full bg-transparent border-0 shadow-none",
            input: "opacity-0 cursor-pointer",
            label: "hidden",
          }}
          variant="bordered"
          size="lg"
        />
      </div>
    </div>
  );
};

export default DatePicker;