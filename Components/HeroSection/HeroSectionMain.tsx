"use client";

import { useState, useEffect } from "react";
import SearchButton from "./SearchButton";
import { Users } from "lucide-react";
import DatePicker from "./DatePicker";
import LocationSelector from "./LocationSelector";
import GuestSelectorModal from "./GuestSelectionModal";
import StayTypeSelectorModal from "./StayTypeSelectorModal";
import ValidationModal from "./ValidationModal";
import { useRouter } from "next/navigation";
import {
  setLocation as setReduxLocation,
  setCheckInDate as setReduxCheckInDate,
  setCheckOutDate as setReduxCheckOutDate,
  setGuests as setReduxGuests,
  setIsFromSearch,
} from '@/redux/slices/bookingSlice'
import { useAppDispatch } from "@/redux/hooks";

interface StayType {
  id: string;
  duration: string;
  price: string;
  description: string;
}

interface Location {
  id: number;
  name: string;
  branch: string;
}

interface Guests {
  adults: number;
  children: number;
  infants: number;
}

const HeroSectionMain = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [showSearchBar, setShowSearchBar] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [locationOpen, setLocationOpen] = useState<boolean>(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [isStayTypeModalOpen, setIsStayTypeModalOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [selectedStay, setSelectedStay] = useState<StayType | null>(null);
  const [guests, setGuests] = useState<Guests>({
    adults: 1,
    children: 0,
    infants: 0,
  });

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
        const res = await fetch(`${baseUrl}/api/haven`, { cache: 'no-cache' });
        if (res.ok) {
          const response = await res.json();
          const havens = response?.data || [];

          // Extract unique haven numbers (e.g., "Haven 1", "Haven 2")
          const havenMap = new Map<string, Location>();

          havens.forEach((haven: {
            id?: number;
            haven_name?: string;
            tower?: string;
          }) => {
            if (haven.haven_name) {
              // Extract haven number from haven_name (e.g., "Haven 1" from "Haven 1 - Tower A")
              const havenNumber = haven.haven_name.match(/Haven\s+\d+/i)?.[0] || haven.haven_name;

              if (!havenMap.has(havenNumber)) {
                havenMap.set(havenNumber, {
                  id: haven.id || havenMap.size + 1,
                  name: havenNumber,
                  branch: '' // Empty branch since we're only showing haven number
                });
              }
            }
          });

          const uniqueLocations = Array.from(havenMap.values()).sort((a, b) => {
            // Sort by haven number
            const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
            return numA - numB;
          });

          setLocations(uniqueLocations);
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };

    fetchLocations();
  }, []);

  // Scroll detection for sticky search bar with hide/show behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const heroHeight = window.innerHeight - 100; // Approximate hero section height

      // If within hero section, don't show sticky bar
      if (currentScrollY < heroHeight) {
        setIsScrolled(false);
        setShowSearchBar(false);
      }
      // If scrolled past hero section
      else {
        setIsScrolled(true);

        // Show on scroll up, hide on scroll down
        if (currentScrollY < lastScrollY) {
          // Scrolling up
          setShowSearchBar(true);
        } else if (currentScrollY > lastScrollY + 5) {
          // Scrolling down (with small threshold to prevent jitter)
          setShowSearchBar(false);
        }
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  const handleGuestChange = (type: keyof Guests, value: number) => {
    setGuests((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const calculateDaysDifference = (checkIn: string, checkOut: string): number => {
    if (!checkIn || !checkOut) return 0;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSearch = () => {
    // Validation - only check for location
    if (!selectedLocation) {
      const message = "Please select a location.";
      setValidationMessage(message);
      setIsValidationModalOpen(true);
      return;
    }

    // Save to redux and navigate to rooms page
    dispatch(setReduxLocation(selectedLocation));
    dispatch(setReduxCheckInDate(checkInDate));
    dispatch(setReduxCheckOutDate(checkOutDate));
    dispatch(setReduxGuests(guests));
    dispatch(setIsFromSearch(true));

    // Navigate to rooms page with filter applied
    router.push('/rooms');
  }

  const totalGuests = guests.adults + guests.children + guests.infants;

  return (
    <>
      {/* Hero Section - Only visible when at top */}
      <div
        className={`
          relative w-full min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center overflow-hidden pt-20 pb-10 sm:pt-0 sm:pb-0
          transition-all duration-500 ease-in-out
          ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        style={{ backgroundImage: "url('/Images/bg.jpg')" }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/30 bg-opacity-40"></div>

        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12 w-full max-w-4xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Find Your Perfect Stay
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-100">
              Discover amazing hotels at unbeatable prices
            </p>
          </div>

          {/* Search Card - Original Position */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 w-full max-w-6xl overflow-visible">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 overflow-visible">
              {/* Location Selector */}
              <div className="sm:col-span-1 h-14">
                <LocationSelector
                  selectedLocation={selectedLocation}
                  onLocationSelect={(location) => {
                    setSelectedLocation(location);
                    setLocationOpen(false);
                  }}
                  isOpen={locationOpen}
                  onToggle={() => setLocationOpen(!locationOpen)}
                  locations={locations}
                />
              </div>

              {/* Check In Date */}
              <div className="sm:col-span-1">
                <DatePicker
                  label="Check In"
                  date={checkInDate}
                  onDateChange={setCheckInDate}
                />
              </div>

              {/* Check Out Date */}
              <div className="sm:col-span-1">
                <DatePicker
                  label="Check Out"
                  date={checkOutDate}
                  onDateChange={setCheckOutDate}
                />
              </div>

              {/* Guest Selector Button */}
              <div className="sm:col-span-1">
                <button
                  onClick={() => setIsGuestModalOpen(true)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-orange-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 h-14 min-h-[56px] hover:shadow-md"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      Who
                    </p>
                    <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 truncate">
                      {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}
                    </p>
                  </div>
                </button>
              </div>

              {/* Search Button */}
              <div className="sm:col-span-2 lg:col-span-1">
                <SearchButton onSearch={handleSearch} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Search Bar - Shows on scroll up */}
      {isScrolled && (
        <div
          className={`
            fixed left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-5xl
            bg-white/95 backdrop-blur-md shadow-xl rounded-xl p-3 sm:p-4
            transition-all duration-500 ease-in-out
            ${showSearchBar ? 'top-20 opacity-100' : '-top-32 opacity-0'}
          `}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-2 overflow-visible">
            {/* Location Selector */}
            <div className="sm:col-span-1 h-14">
              <LocationSelector
                selectedLocation={selectedLocation}
                onLocationSelect={(location) => {
                  setSelectedLocation(location);
                  setLocationOpen(false);
                }}
                isOpen={locationOpen}
                onToggle={() => setLocationOpen(!locationOpen)}
                locations={locations}
              />
            </div>

            {/* Check In Date */}
            <div className="sm:col-span-1">
              <DatePicker
                label="Check In"
                date={checkInDate}
                onDateChange={setCheckInDate}
              />
            </div>

            {/* Check Out Date */}
            <div className="sm:col-span-1">
              <DatePicker
                label="Check Out"
                date={checkOutDate}
                onDateChange={setCheckOutDate}
              />
            </div>

            {/* Guest Selector Button */}
            <div className="sm:col-span-1">
              <button
                onClick={() => setIsGuestModalOpen(true)}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-orange-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 h-14 min-h-[56px] hover:shadow-md"
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    Who
                  </p>
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 truncate">
                    {totalGuests} {totalGuests === 1 ? "Guest" : "Guests"}
                  </p>
                </div>
              </button>
            </div>

            {/* Search Button */}
            <div className="sm:col-span-2 lg:col-span-1">
              <SearchButton onSearch={handleSearch} />
            </div>
          </div>
        </div>
      )}

      {/* Guest Selector Modal */}
      <GuestSelectorModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        guests={guests}
        onGuestChange={handleGuestChange}
      />

      <StayTypeSelectorModal
        isOpen={isStayTypeModalOpen}
        onClose={() => setIsStayTypeModalOpen(false)}
        selectedStay={selectedStay}
        onSelectStay={setSelectedStay}
        daysDifference={calculateDaysDifference(checkInDate, checkOutDate)}
        router={router}
      />

      {/* Validation Modal */}
      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        message={validationMessage}
      />
    </>
  );
};

export default HeroSectionMain;
