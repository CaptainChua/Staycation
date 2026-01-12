import { X } from "lucide-react";
import GuestCounter from "./GuestCounter";
import { useEffect, useState } from "react";

interface Guests {
  adults: number;
  children: number;
  infants: number;
}

interface GuestSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guests;
  onGuestChange: (type: keyof Guests, value: number) => void;
}

const GuestSelectorModal = ({ isOpen, onClose, guests, onGuestChange }: GuestSelectorModalProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen && !shouldRender) {
      // When opening, set shouldRender first, then animate in
      const timer = setTimeout(() => {
        setShouldRender(true);
        // Trigger animation after render
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsAnimating(true);
          }, 0);
        });
      }, 0);
      return () => clearTimeout(timer);
    } else if (!isOpen && shouldRender) {
      // When closing, animate out first, then remove from DOM
      const renderTimer = setTimeout(() => {
        setIsAnimating(false);
        // Remove from DOM after animation completes
        setTimeout(() => setShouldRender(false), 500);
      }, 0);
      return () => clearTimeout(renderTimer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop with fade-in animation */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal with slide-up animation */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className={`bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto transform transition-all duration-500 ease-out ${
            isAnimating
              ? 'translate-y-0 opacity-100 scale-100'
              : 'translate-y-full sm:translate-y-8 opacity-0 sm:scale-95'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div className="relative px-6 py-4 border-b border-gray-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-3xl sm:rounded-t-2xl" />
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600">
                Select Guests
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-full transition-all duration-300"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 hover:text-orange-600 transition-colors" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Guest Counters with staggered animation */}
          <div className="px-6 py-2">
            <div
              className={`transform transition-all duration-500 delay-100 ${
                isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}
            >
              <GuestCounter
                label="Adults"
                description="Ages 18 or above"
                count={guests.adults}
                minValue={1}
                onIncrement={() => onGuestChange('adults', guests.adults + 1)}
                onDecrement={() => guests.adults > 1 && onGuestChange('adults', guests.adults - 1)}
              />
            </div>
            <div
              className={`transform transition-all duration-500 delay-200 ${
                isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}
            >
              <GuestCounter
                label="Children"
                description="Ages 4 – 17"
                count={guests.children}
                minValue={0}
                onIncrement={() => onGuestChange('children', guests.children + 1)}
                onDecrement={() => guests.children > 0 && onGuestChange('children', guests.children - 1)}
              />
            </div>
            <div
              className={`transform transition-all duration-500 delay-300 ${
                isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`}
            >
              <GuestCounter
                label="Infants"
                description="Ages 0 – 3"
                count={guests.infants}
                minValue={0}
                onIncrement={() => onGuestChange('infants', guests.infants + 1)}
                onDecrement={() => guests.infants > 0 && onGuestChange('infants', guests.infants - 1)}
              />
            </div>
          </div>

          {/* Footer with gradient button */}
          <div className="px-6 py-4 border-t border-gray-200 mt-2">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
                       text-white font-semibold py-3 rounded-lg
                       transition-all duration-300 active:scale-[0.98] shadow-md hover:shadow-lg
                       text-sm sm:text-base transform hover:scale-[1.02]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuestSelectorModal;