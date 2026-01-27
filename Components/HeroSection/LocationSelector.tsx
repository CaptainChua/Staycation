"use client";

import { useEffect, useRef } from "react";
import { MapPin, ChevronDown } from "lucide-react";

interface Location {
  id: number;
  name: string;
  branch: string;
  uuid_id?: string;
}

interface LocationSelectorProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  isOpen: boolean;
  onToggle: () => void;
  locations: Location[];
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedLocation,
  onLocationSelect,
  isOpen,
  onToggle,
  locations,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    onToggle(); // close after selection
  };

  return (
    <div ref={containerRef} className="relative w-full h-12 sm:h-14">
      {/* Trigger */}
      <button
        onClick={onToggle}
        className={`group w-full h-full flex items-center gap-2 px-3 sm:px-4 bg-white dark:bg-gray-800 border rounded-full transition-all duration-200 focus:outline-none
          ${isOpen ? "border-[#8B4513]" : "border-gray-300 dark:border-gray-600 hover:border-[#8B4513]"}`}
      >
        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 group-hover:text-[#8B4513] transition-colors" />

        <div className="flex-1 text-left min-w-0">
          <span className="block text-xs text-gray-500 dark:text-gray-400">Location</span>
          <span className="block text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
            {selectedLocation ? selectedLocation.name : "Where?"}
          </span>
        </div>

        <ChevronDown
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200
            ${isOpen ? "rotate-180 text-[#8B4513]" : "text-gray-500 dark:text-gray-400"}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full mt-1 z-50 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {locations.length > 0 ? (
            locations.map((location) => {
              const isSelected = selectedLocation?.id === location.id;

              return (
                <div
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-all
                    ${isSelected ? "bg-amber-50 dark:bg-amber-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                >
                  <MapPin
                    className={`w-3 h-3 ${
                      isSelected ? "text-[#8B4513]" : "text-gray-500"
                    }`}
                  />

                  <div className="flex flex-col">
                    <span
                      className={`font-medium ${
                        isSelected ? "text-[#8B4513]" : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {location.name}
                    </span>

                    {location.branch && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {location.branch}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading locations...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;