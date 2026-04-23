"use client";

import { X, Calendar, MapPin, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookingDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  havenName: string;
}

const BookingDateModal = ({
  isOpen,
  onClose,
  selectedDate,
  havenName,
}: BookingDateModalProps) => {
  const router = useRouter();

  if (!isOpen) return null;

  // Format the date in a readable way
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleBookNow = () => {
    // Navigate to checkout page
    router.push("/checkout");
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[99999]"
        onClick={onClose}
      ></div>
      <div className="fixed inset-0 flex items-center justify-center z-[99999] p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
          {/* Header - Sticky */}
          <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  Date Available!
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Create Booking for {formatDate(selectedDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Selected Date Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Selected Date
                  </p>
                  <p className="text-lg font-bold text-blue-950">
                    {formatDate(selectedDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Haven Info */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    Selected Haven
                  </p>
                  <p className="text-lg font-bold text-purple-950">
                    {havenName}
                  </p>
                </div>
              </div>
            </div>

            {/* Availability Status */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Available for Booking</p>
                  <p className="text-sm text-green-700">
                    This date is open and ready for reservation
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span className="font-semibold text-gray-800">2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span className="font-semibold text-gray-800">12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Guests:</span>
                  <span className="font-semibold text-gray-800">6 people</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBookNow}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium transition-all shadow-md hover:shadow-lg"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingDateModal;
