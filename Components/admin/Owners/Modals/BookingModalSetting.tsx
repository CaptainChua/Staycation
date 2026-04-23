"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { TimeInput } from "@nextui-org/date-input";
import { parseTime, type Time } from "@internationalized/date";


interface BookingModalSettingProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModalSetting = ({ isOpen, onClose }: BookingModalSettingProps) => {
//   if (!isOpen) return null;
  const [isLoading, setIsLoading] = useState(false);

  // Time states for NextUI TimeInput (stores in HH:mm format)
  const [sixHourCheckIn, setSixHourCheckIn] = useState("12:00");
  const [sixHourCheckOut, setSixHourCheckOut] = useState("18:00");

  const [twelveHourCheckIn, setTwelveHourCheckIn] = useState("14:00");
  const [twelveHourCheckOut, setTwelveHourCheckOut] = useState("02:00");

  const [twentyFourHourCheckIn, setTwentyFourHourCheckIn] = useState("15:00");
  const [twentyFourHourCheckOut, setTwentyFourHourCheckOut] = useState("15:00");


    if (!isOpen) return null;

  const handleSubmit = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // onClose();
    }, 2000);
  };

  return (
    <>
      {/* Backdrop with animation */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl animate-in zoom-in-95 fade-in duration-300 flex flex-col">
          {/* Header - Sticky */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-2xl font-bold text-gray-800">
              Booking Settings
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 6-Hour Booking */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                6-Hour Booking
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TimeInput
                    label="Check-in Time *"
                    value={sixHourCheckIn ? parseTime(sixHourCheckIn) : undefined}
                    onChange={(time: Time | null) => {
                      if (time) {
                        const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                        setSixHourCheckIn(timeStr);
                      }
                    }}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />
                </div>
                <div>
                  <TimeInput
                    label="Check-out Time *"
                    value={sixHourCheckOut ? parseTime(sixHourCheckOut) : undefined}
                    onChange={(time: Time | null) => {
                      if (time) {
                        const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                        setSixHourCheckOut(timeStr);
                      }
                    }}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Current Schedule:</span>{" "}
                  Check-in at {sixHourCheckIn} • Check-out at {sixHourCheckOut}
                </p>
              </div>
            </div>

            {/* 12-Hour Booking */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                12-Hour Booking
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TimeInput
                    label="Check-in Time *"
                    value={twelveHourCheckIn ? parseTime(twelveHourCheckIn) : undefined}
                    onChange={(time: Time | null) => {
                      if (time) {
                        const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                        setTwelveHourCheckIn(timeStr);
                      }
                    }}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />
                </div>
                <div>
                  <TimeInput
                    label="Check-out Time *"
                    value={twelveHourCheckOut ? parseTime(twelveHourCheckOut) : undefined}
                    onChange={(time: Time | null) => {
                      if (time) {
                        const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                        setTwelveHourCheckOut(timeStr);
                      }
                    }}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Current Schedule:</span>{" "}
                  Check-in at {twelveHourCheckIn} • Check-out at {twelveHourCheckOut}
                </p>
              </div>
            </div>

            {/* 24-Hour Booking */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                24-Hour Booking
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <TimeInput
                    label="Check-in Time *"
                    value={twentyFourHourCheckIn ? parseTime(twentyFourHourCheckIn) : undefined}
                    onChange={(time: Time | null) => {
                      if (time) {
                        const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                        setTwentyFourHourCheckIn(timeStr);
                      }
                    }}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />
                </div>
                <div>
                  <TimeInput
                    label="Check-out Time *"
                    value={twentyFourHourCheckOut ? parseTime(twentyFourHourCheckOut) : undefined}
                    onChange={(time: Time | null) => {
                      if (time) {
                        const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                        setTwentyFourHourCheckOut(timeStr);
                      }
                    }}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700",
                    }}
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Current Schedule:</span>{" "}
                  Check-in at {twentyFourHourCheckIn} • Check-out at {twentyFourHourCheckOut} (next day)
                </p>
              </div>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl border border-gray-200 animate-in zoom-in-95 fade-in duration-300">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold text-lg">
              Saving Booking Settings...
            </p>
            <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModalSetting;
