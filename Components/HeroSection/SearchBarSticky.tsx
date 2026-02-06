"use client";

import { useState, useEffect } from "react";
import SearchButton from "./SearchButton";
import DateRangePicker from "./DateRangePicker";
import LocationSelector from "./LocationSelector";
import GuestSelector from "./GuestSelector";
import StayTypeSelectorModal from "./StayTypeSelectorModal";
import { useRouter } from "next/navigation";
import { MapPin, Calendar as CalendarIcon, Users, Sparkles } from "lucide-react";
import {
  setLocation as setReduxLocation,
  setCheckInDate as setReduxCheckInDate,
  setCheckOutDate as setReduxCheckOutDate,
  setGuests as setReduxGuests,
  setIsFromSearch,
} from '@/redux/slices/bookingSlice'
import { useAppDispatch } from "@/redux/hooks";
import toast from "react-hot-toast";

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
  uuid_id?: string;
}

interface Guests {
  adults: number;
  children: number;
  infants: number;
}

const SearchBarSticky = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationOpen, setLocationOpen] = useState<boolean>(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");
  const [isStayTypeModalOpen, setIsStayTypeModalOpen] = useState<boolean>(false);
  const [selectedStay, setSelectedStay] = useState<StayType | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
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
            uuid_id?: string;
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
                  branch: '', // Empty branch since we're only showing haven number
                  uuid_id: haven.uuid_id // Store the uuid_id for direct navigation
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

  // Make search bar compact when scrolling down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Make search bar compact after scrolling 100px
      if (currentScrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      toast.error("Please select a location.");
      return;
    }

    // Save to redux (persists across pages for later use)
    dispatch(setReduxLocation(selectedLocation));
    dispatch(setReduxCheckInDate(checkInDate));
    dispatch(setReduxCheckOutDate(checkOutDate));
    dispatch(setReduxGuests(guests));
    dispatch(setIsFromSearch(false)); // Set to false to avoid showing search results

    // If we have a uuid_id, navigate directly to room details page
    if (selectedLocation.uuid_id) {
      router.push(`/rooms/${selectedLocation.uuid_id}`);
    } else {
      // Fallback to rooms page without search filter
      router.push('/rooms');
    }
  };

  return (
    <div
      className={`fixed left-0 right-0 z-40 w-full transition-all duration-500 ease-in-out bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 shadow-sm ${
        isScrolled
          ? 'top-14 sm:top-16 py-2 pb-4 sm:pb-5'
          : 'top-14 sm:top-16 py-3 sm:py-4 md:py-6 lg:py-8'
      }`}
    >
      {/* Search Card - Responsive Design */}
      <div className={`max-w-5xl mx-auto transition-all duration-500 ease-in-out relative ${
        isScrolled ? 'px-3 sm:px-4' : 'px-3 sm:px-4 md:px-6'
      }`}>
        {/* Mobile: Single Find Room Button */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-medium py-3 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm">Find Room</span>
            <svg 
              className={`w-3 h-3 transition-transform duration-300 ${isSearchExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Expanded Search Fields - Mobile Only */}
          {isSearchExpanded && (
            <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
              {/* Location Selector */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Location</span>
                </div>
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

              {/* Date Range Picker */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Dates</span>
                </div>
                <DateRangePicker
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onCheckInChange={setCheckInDate}
                  onCheckOutChange={setCheckOutDate}
                  havenId={selectedLocation?.uuid_id}
                />
              </div>

              {/* Guest Selector */}
              <div className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-brand-primary" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Guests</span>
                </div>
                <GuestSelector
                  guests={guests}
                  onGuestChange={handleGuestChange}
                />
              </div>

              {/* Search Button */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSearchExpanded(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-full transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearch}
                  className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-white font-medium py-2 px-4 rounded-full transition-colors text-sm"
                >
                  Search Rooms
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tablet: Compact Search Bar */}
        <div className="hidden sm:flex md:hidden">
          <div className={`w-full bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 relative overflow-visible ${
            isScrolled ? 'p-2' : 'p-3'
          }`}>
            {/* Floating badge */}
            <div className="absolute -top-2 left-4 bg-brand-primary text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Search</span>
            </div>
            <div className="space-y-2">
              {/* Location Selector */}
              <div className="relative px-3 py-2 border-b border-gray-200 dark:border-gray-700">
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

              {/* Date Range Picker */}
              <div className="relative px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <DateRangePicker
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onCheckInChange={setCheckInDate}
                  onCheckOutChange={setCheckOutDate}
                  havenId={selectedLocation?.uuid_id}
                />
              </div>

              {/* Guest Selector */}
              <div className="relative px-3 py-2">
                <GuestSelector
                  guests={guests}
                  onGuestChange={handleGuestChange}
                  compact={true}
                />
              </div>

              {/* Search Button */}
              <div className="relative px-3 py-2 flex items-center justify-center">
                <button
                  onClick={handleSearch}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-medium py-2 px-4 rounded-full transition-colors text-sm"
                >
                  Search Rooms
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Full Search Bar */}
        <div className="hidden md:block">
          <div className={`bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 relative overflow-visible ${
            isScrolled ? 'p-2' : 'p-3'
          }`}>
            {/* Floating badge */}
            <div className="absolute -top-2 left-6 bg-brand-primary text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Find Your Haven</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 items-center">
              {/* Location Selector */}
              <div className="relative px-3 md:px-4 py-2 border-r border-gray-200 dark:border-gray-700">
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

              {/* Date Range Picker - Check In & Check Out */}
              <div className="relative px-3 md:px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                <DateRangePicker
                  checkInDate={checkInDate}
                  checkOutDate={checkOutDate}
                  onCheckInChange={setCheckInDate}
                  onCheckOutChange={setCheckOutDate}
                  havenId={selectedLocation?.uuid_id}
                />
              </div>

              {/* Guest Selector */}
              <div className="relative px-3 md:px-4 py-2 border-r border-gray-200 dark:border-gray-700">
                <GuestSelector
                  guests={guests}
                  onGuestChange={handleGuestChange}
                />
              </div>

              {/* Search Button */}
              <div className="relative px-3 md:px-4 py-2 flex items-center justify-center">
                <SearchButton onSearch={handleSearch} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <StayTypeSelectorModal
        isOpen={isStayTypeModalOpen}
        onClose={() => setIsStayTypeModalOpen(false)}
        selectedStay={selectedStay}
        onSelectStay={setSelectedStay}
        daysDifference={calculateDaysDifference(checkInDate, checkOutDate)}
        router={router}
      />
    </div>
  );
};

export default SearchBarSticky;