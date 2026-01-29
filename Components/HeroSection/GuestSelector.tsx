"use client";

import { useState, useEffect, useRef } from "react";
import { Users, ChevronDown, Plus, Minus } from "lucide-react";

interface Guests {
  adults: number;
  children: number;
  infants: number;
}

interface GuestSelectorProps {
  guests: Guests;
  onGuestChange: (type: keyof Guests, value: number) => void;
}

const GuestSelector = ({ guests, onGuestChange }: GuestSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const totalGuests = guests.adults + guests.children + guests.infants;

  const renderGuestCounter = (
    label: string,
    description: string,
    type: keyof Guests,
    minValue: number = 0
  ) => {
    const count = guests[type];
    const isMinimum = count <= minValue;

    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => !isMinimum && onGuestChange(type, count - 1)}
            disabled={isMinimum}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              isMinimum
                ? "border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                : "border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white active:scale-95"
            }`}
          >
            <Minus className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <span className="w-8 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">
            {count}
          </span>
          <button
            onClick={() => onGuestChange(type, count + 1)}
            className="w-8 h-8 rounded-full border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white flex items-center justify-center transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-12 sm:h-14">
      <button
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
        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 group-hover:text-[#8B4513] flex-shrink-0 transition-colors duration-200" />
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Who</p>
          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
            {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-brand-primary' : 'text-gray-500 dark:text-gray-400'
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg z-50 p-3 sm:p-4 w-full sm:w-80">
          {renderGuestCounter("Adults", "Ages 18 or above", "adults", 1)}
          {renderGuestCounter("Children", "Ages 4 – 17", "children", 0)}
          {renderGuestCounter("Infants", "Ages 0 – 3", "infants", 0)}
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            {/* Reset to Default Button */}
            <button
              onClick={() => {
                onGuestChange('adults', 1);
                onGuestChange('children', 0);
                onGuestChange('infants', 0);
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg
                       transition-all duration-300 active:scale-[0.98]
                       text-xs sm:text-sm"
            >
              Reset Default
            </button>
            
            {/* OK Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 bg-brand-primary hover:bg-brand-primaryDark dark:bg-brand-primary dark:hover:bg-brand-primaryDark
                       text-white font-semibold py-2 rounded-lg
                       transition-all duration-300 active:scale-[0.98] shadow-md hover:shadow-lg
                       text-xs sm:text-base"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestSelector;
