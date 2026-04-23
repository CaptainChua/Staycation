"use client";

import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTransition } from "react";
import StayTypeCard from "../StayTypeCard";
import { useAppDispatch } from "@/redux/hooks";
import {
  setStayType,
  setSchedulePreference,
} from "@/redux/slices/bookingSlice";
import { useRouter } from "next/navigation";

interface StayType {
  id: string;
  duration: string;
  price: string;
  description: string;
}

interface StayTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStay: StayType | null;
  onSelectStay: (stay: StayType) => void;
  daysDifference: number;
  router: ReturnType<typeof useRouter>;
}

const StayTypeSelectorModal = ({
  isOpen,
  onClose,
  selectedStay,
  onSelectStay,
  daysDifference,
  router,
}: StayTypeSelectorModalProps) => {
  const [, startTransition] = useTransition();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");
  const dispatch = useAppDispatch();
  const scheduleRef = useRef<HTMLDivElement>(null);

  // Determine which stay types are available based on days difference
  const isHourlyAvailable = daysDifference === 1;
  const isMultiDayAvailable = daysDifference >= 2;

  const hourlyStayTypes: StayType[] = [
    { id: "6h", duration: "6 hours", price: "₱999", description: "Short stay" },
    {
      id: "10h",
      duration: "10 hours",
      price: "₱1,599",
      description: "Extended stay",
    },
    {
      id: "21h",
      duration: "21 hours",
      price: "₱1,799",
      description: "Full day",
    },
    {
      id: "weekdays",
      duration: "Weekdays",
      price: "₱1,999",
      description: "Monday - Thursday",
    },
    {
      id: "fri-sat",
      duration: "Fri - Sat",
      price: "Custom rates",
      description: "Weekend stay",
    },
  ];

  const multiDayStayTypes: StayType[] = [
    {
      id: "multi",
      duration: "Multi-day",
      price: "Custom rates",
      description: "Flexible rates",
    },
  ];

  const schedulePreferences = [
    {
      id: "standard",
      label: "Standard Check-in/Out",
      description: "Regular hours",
    },
    {
      id: "early-checkin",
      label: "Early Check-in (11:00 AM)",
      description: "Check in earlier",
    },
    {
      id: "late-checkout",
      label: "Late Check-out (2:00 PM)",
      description: "Check out later",
    },
    {
      id: "flexible",
      label: "Flexible Times (Call to arrange)",
      description: "Custom schedule",
    },
    {
      id: "custom",
      label: "Custom schedules",
      description: "Contact us for details",
    },
  ];

  useEffect(() => {
  let closeTimer: NodeJS.Timeout | null = null;

  if (isOpen && !shouldRender) {
    startTransition(() => {
      setShouldRender(true);
    });

    // Animate in after mount
    closeTimer = setTimeout(() => {
      setIsAnimating(true);
    }, 16); // ~1 frame
  }

  if (!isOpen && shouldRender) {
    // Animate out
    closeTimer = setTimeout(() => {
      setIsAnimating(false);

      startTransition(() => {
        setShouldRender(false);
      });
    }, 500); // match animation duration
  }

  return () => {
    if (closeTimer) clearTimeout(closeTimer);
  };
}, [isOpen, shouldRender, startTransition]);

  // Auto-scroll to schedule preference when multi-day is selected
  useEffect(() => {
    if (selectedStay?.id === "multi" && scheduleRef.current) {
      setTimeout(() => {
        scheduleRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 300); // Wait for the section to render
    }
  }, [selectedStay]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop with fade-in animation */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal with slide-up animation */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className={`bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto transform transition-all duration-500 ease-out ${
            isAnimating
              ? "translate-y-0 opacity-100 scale-100"
              : "translate-y-full sm:translate-y-8 opacity-0 sm:scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-4 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-3xl sm:rounded-t-2xl" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600">
                Select Stay Type
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-full transition-all duration-300"
                aria-label="Close"
              >
                <X
                  className="w-5 h-5 text-gray-600 hover:text-orange-600 transition-colors"
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {/* Stay Types Grid */}
          <div className="p-6 space-y-6">
            {/* Hourly Rates Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Hourly Rates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hourlyStayTypes.map((stay, index) => (
                  <div
                    key={stay.id}
                    className={`transform transition-all duration-500 ${
                      isAnimating
                        ? "translate-x-0 opacity-100"
                        : "translate-x-4 opacity-0"
                    }`}
                    style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                  >
                    <StayTypeCard
                      stay={stay}
                      isSelected={selectedStay?.id === stay.id}
                      onSelect={() => onSelectStay(stay)}
                      disabled={!isHourlyAvailable}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-day Section */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Multi-day (Custom Rates)
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {multiDayStayTypes.map((stay, index) => (
                  <div
                    key={stay.id}
                    className={`transform transition-all duration-500 ${
                      isAnimating
                        ? "translate-x-0 opacity-100"
                        : "translate-x-4 opacity-0"
                    }`}
                    style={{
                      transitionDelay: `${
                        (hourlyStayTypes.length + index + 1) * 100
                      }ms`,
                    }}
                  >
                    <StayTypeCard
                      stay={stay}
                      isSelected={selectedStay?.id === stay.id}
                      onSelect={() => onSelectStay(stay)}
                      disabled={!isMultiDayAvailable}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Preference Section - Only shown when Multi-day is selected */}
            {selectedStay?.id === "multi" && (
              <div
                ref={scheduleRef}
                className={`transform transition-all duration-500 ${
                  isAnimating
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Schedule Preference
                </h3>
                <div className="space-y-2">
                  {schedulePreferences.map((schedule, index) => (
                    <button
                      key={schedule.id}
                      onClick={() => setSelectedSchedule(schedule.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedSchedule === schedule.id
                          ? "border-orange-500 bg-orange-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio Button */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                            selectedSchedule === schedule.id
                              ? "border-orange-500"
                              : "border-gray-400"
                          }`}
                        >
                          {selectedSchedule === schedule.id && (
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm sm:text-base text-gray-800">
                            {schedule.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {schedule.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
            <button
              onClick={() => {
                //Save stay type to redux
                if (selectedStay) {
                  dispatch(setStayType(selectedStay));
                }

                //Save schedule preferencer to redux if multi day
                if (selectedStay?.id === "multi" && selectedSchedule) {
                  const schedule = schedulePreferences.find(
                    (s) => s.id === selectedSchedule
                  );
                  if (schedule) {
                    dispatch(setSchedulePreference(schedule));
                  }
                }

                // Close modal
                onClose();

                // Navigate to rooms page
                router.push("/rooms");
              }}
              disabled={
                !selectedStay ||
                (selectedStay?.id === "multi" && !selectedSchedule)
              }
              className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 active:scale-[0.98] shadow-md text-sm sm:text-base transform ${
                !selectedStay ||
                (selectedStay?.id === "multi" && !selectedSchedule)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white hover:shadow-lg hover:scale-[1.02]"
              }`}
            >
              Confirm to stay
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StayTypeSelectorModal;