"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import RoomCard from "./RoomCard";
import RoomCardSkeleton from "./RoomCardSkeleton";
import { SlidersHorizontal, ChevronRight, ChevronLeft, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setIsFromSearch } from "@/redux/slices/bookingSlice";

// Custom scrollbar styles
const scrollbarStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

interface Room {
  id: string;
  name: string;
  price: string;
  pricePerNight: string;
  images: string[];
  rating: number;
  reviews: number;
  capacity: number;
  amenities: string[];
  description: string;
  fullDescription?: string;
  beds?: string;
  roomSize?: string;
  location?: string;
  tower?: string;
  floor?: string;
  photoTour?: {
    livingArea?: string[];
    kitchenette?: string[];
    diningArea?: string[];
    fullBathroom?: string[];
    garage?: string[];
    exterior?: string[];
    pool?: string[];
    bedroom?: string[];
    additional?: string[];
  };
  youtubeUrl?: string;
}

interface Haven {
  uuid_id?: string;
  id?: string;
  haven_name?: string;
  name?: string;
  six_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  images?: Array<{ url: string }>;
  rating?: number;
  review_count?: number;
  capacity?: number;
  amenities?: Record<string, boolean>;
  description?: string;
  full_description?: string;
  beds?: string;
  room_size?: string;
  location?: string;
  tower?: string;
  floor?: string;
  photo_tours?: Array<{ category: string; url: string }>;
  youtube_url?: string;
}

interface HotelRoomListingsProps {
  initialHavens: Haven[];
}

const HotelRoomListings = ({ initialHavens }: HotelRoomListingsProps) => {
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const ROOMS_PER_PAGE = 5;
  const scrollContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get search parameters from Redux
  const searchLocation = useAppSelector((state) => state.booking.location);
  const isFromSearch = useAppSelector((state) => state.booking.isFromSearch);

  // Set responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, initialHavens.length > 0 ? 500 : 0);
    return () => clearTimeout(timer);
  }, [initialHavens]);

  // Filter havens based on location when coming from search - use useMemo
  const filteredHavens = useMemo(() => {
    if (isFromSearch && searchLocation) {
      return initialHavens.filter((haven) => {
        const havenName = haven.haven_name || haven.name || '';

        // Extract haven number from full haven_name (e.g., "Haven 1" from "Haven 1 - Tower A")
        const havenNumber = havenName.match(/Haven\s+\d+/i)?.[0] || havenName;

        // Match by haven number only (e.g., "Haven 1" matches all towers)
        return havenNumber === searchLocation.name;
      });
    }
    return initialHavens;
  }, [searchLocation, isFromSearch, initialHavens]);

  const rooms: Room[] = filteredHavens.map((haven: Haven) => ({
    id: haven.uuid_id ?? haven.id ?? '',
    name: haven.haven_name ?? haven.name ?? "Unnamed Haven",
    price: `₱${haven.six_hour_rate ?? haven.weekday_rate ?? haven.weekend_rate ?? "N/A"}`,
    pricePerNight: "per night",
    images: haven.images?.map((img) => img.url) ?? [],
    rating: haven.rating ?? 4.5,
    reviews: haven.review_count ?? 0,
    capacity: haven.capacity ?? 2,
    amenities: Object.entries(haven.amenities || {})
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    description: haven.description ?? "",
    fullDescription: haven.full_description,
    beds: haven.beds,
    roomSize: haven.room_size,
    location: haven.location,
    tower: haven.tower,
    floor: haven.floor,
    photoTour: haven.photo_tours
      ? haven.photo_tours.reduce((acc: Record<string, string[]>, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item.url);
          return acc;
        }, {} as Record<string, string[]>)
      : {},
    youtubeUrl: haven.youtube_url,
  })) ?? [];

  // Group rooms by haven number
  const groupedRooms = rooms.reduce((acc, room) => {
    // Extract haven number from room name or location
    const havenMatch = room.name.match(/Haven (\d+)/) || room.location?.match(/Haven (\d+)/);
    const havenNumber = havenMatch ? `Haven ${havenMatch[1]}` : 'Other Havens';
    
    if (!acc[havenNumber]) {
      acc[havenNumber] = [];
    }
    acc[havenNumber].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  // Sort haven numbers
  const sortedHavenNumbers = Object.keys(groupedRooms).sort((a, b) => {
    const aNum = parseInt(a.replace('Haven ', '')) || 999;
    const bNum = parseInt(b.replace('Haven ', '')) || 999;
    return aNum - bNum;
  });

  const handlePageChange = (havenNumber: string, page: number) => {
    setCurrentPage(prev => ({
      ...prev,
      [havenNumber]: page
    }));
  };

  const handleHavenClick = (havenNumber: string) => {
    // Navigate to haven-specific page
    const havenId = havenNumber.replace('Haven ', '');
    router.push(`/havens/${havenId}`);
  };

  // Function to get rooms for current page
  const getCurrentPageRooms = (havenNumber: string) => {
    const havenRooms = groupedRooms[havenNumber];
    const page = currentPage[havenNumber] || 1;
    const totalPages = Math.ceil(havenRooms.length / ROOMS_PER_PAGE);
    const startIndex = (page - 1) * ROOMS_PER_PAGE;
    const endIndex = startIndex + ROOMS_PER_PAGE;
    
    return {
      displayedRooms: havenRooms.slice(startIndex, endIndex),
      currentPage: page,
      totalPages: totalPages,
      hasMoreRooms: havenRooms.length > ROOMS_PER_PAGE,
      remainingRooms: havenRooms.length - ROOMS_PER_PAGE
    };
  };

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      <div className="min-h-screen bg-white dark:bg-gray-900 py-6 sm:py-8">
        <div className="w-full">
          {/* Active Filter Indicator */}
          {isFromSearch && searchLocation && !isLoading && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-lg w-fit">
              <span className="text-sm font-medium text-brand-primary">
                Showing results for: {searchLocation.name} - {searchLocation.branch}
              </span>
              <button
                onClick={() => {
                  dispatch(setIsFromSearch(false));
                }}
                className="text-xs text-brand-primary hover:text-brand-primaryDark underline"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Header Section - Airbnb style */}
          {!isLoading && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              {/* Results Count */}
              <h2 className="text-sm text-gray-600 dark:text-gray-400">
                {rooms.length} {rooms.length === 1 ? 'haven' : 'havens'}
                {isFromSearch && searchLocation && (
                  <span className="ml-1">
                    in {searchLocation.name} - {searchLocation.branch}
                  </span>
                )}
              </h2>

              {/* Filter Dropdown - Airbnb style */}
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500">
                  <SlidersHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-12">
              {[1, 2, 3].map((havenGroup) => (
                <div key={havenGroup}>
                  {/* Haven Header Skeleton */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  </div>

                  {/* Mobile Layout Skeleton */}
                  {isMobile ? (
                    <div className="overflow-x-auto scrollbar-hide pb-4">
                      <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                        {[1, 2, 3, 4, 5].map((skeleton) => (
                          <div key={skeleton} className="flex-shrink-0 w-[200px] sm:w-[240px]">
                            <RoomCardSkeleton compact={true} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Desktop Layout Skeleton */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5].map((skeleton) => (
                        <div key={skeleton}>
                          <RoomCardSkeleton compact={false} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {!isLoading && rooms.length === 0 && (
            <div className="text-center py-20">
              <div className="mb-4">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No havens found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {isFromSearch && searchLocation
                  ? `We couldn't find any havens matching "${searchLocation.name} - ${searchLocation.branch}"`
                  : "No havens available at the moment"}
              </p>
              {isFromSearch && searchLocation && (
                <button
                  onClick={() => {
                    dispatch(setIsFromSearch(false));
                  }}
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors"
                >
                  View all havens
                </button>
              )}
            </div>
          )}

          {/* Room Groups by Haven */}
          {!isLoading && sortedHavenNumbers.map((havenNumber) => {
            const { displayedRooms, currentPage, totalPages, hasMoreRooms, remainingRooms } = getCurrentPageRooms(havenNumber);
            
            // Only show pagination if there are more than 5 rooms
            const showPagination = hasMoreRooms;

            return (
              <div key={havenNumber} className="mb-12">
                {/* Haven Header - Clickable WITH PAGE NUMBER */}
                <div
                  className="mb-6 flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity w-full"
                  onClick={() => handleHavenClick(havenNumber)}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {havenNumber}
                    </h2>
                    <ChevronRight className="w-5 h-5 text-brand-primary" />
                  </div>
                  
                  {/* Page info - KEEP THIS */}
                  {showPagination && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                  )}
                </div>

                {/* Mobile Layout with Show All Overlay */}
                {isMobile ? (
                  <div className="relative">
                    <div
                      ref={(el) => { scrollContainerRefs.current[havenNumber] = el; }}
                      className="overflow-x-auto scrollbar-hide pb-4"
                    >
                      <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                        {displayedRooms.map((room, index) => (
                          <div 
                            key={room.id} 
                            className="flex-shrink-0 w-[200px] sm:w-[240px] relative"
                          >
                            {/* Show All overlay on last room - MOBILE ONLY */}
                            {hasMoreRooms && index === displayedRooms.length - 1 && (
                              <div className="absolute top-0 left-0 right-0 h-48 rounded-t-2xl overflow-hidden">
                                {/* Dark overlay over image */}
                                <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center p-4">
                                  <div className="text-center text-white mb-3">
                                    <Eye className="w-8 h-8 mx-auto mb-1" />
                                    <p className="font-semibold text-sm">+{remainingRooms} more</p>
                                    <p className="text-xs opacity-90">View all rooms</p>
                                  </div>
                                  <button
                                    onClick={() => handleHavenClick(havenNumber)}
                                    className="px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-xs"
                                  >
                                    Show All
                                  </button>
                                </div>
                                {/* Keep the image visible but darkened */}
                                {room.images && room.images[0] && (
                                  <div className="h-full w-full">
                                    <Image
                                      src={room.images[0]}
                                      alt={room.name}
                                      width={240}
                                      height={192}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Pass the room to RoomCard - it will handle the rest */}
                            <RoomCard room={room} mode="browse" compact={true} />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Scroll indicator for mobile */}
                    {displayedRooms.length > 2 && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Scroll horizontally to view more rooms →
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Desktop Layout with Pagination */
                  <>
                    {/* Grid layout for desktop/tablet */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {displayedRooms.map((room) => (
                        <div key={room.id}>
                          <RoomCard room={room} mode="browse" compact={false} />
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls - Desktop Only (icons only with dots) */}
                    {showPagination && (
                      <div className="flex justify-center items-center gap-3 mt-6">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(havenNumber, Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-full transition-all duration-200 ${
                            currentPage === 1
                              ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50'
                              : 'bg-brand-primary hover:bg-brand-primaryDark'
                          }`}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className={`w-5 h-5 ${
                            currentPage === 1
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-white'
                          }`} />
                        </button>

                        {/* Page Dots */}
                        <div className="flex gap-2 items-center">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(havenNumber, pageNum)}
                              className={`transition-all duration-200 rounded-full ${
                                currentPage === pageNum
                                  ? 'w-8 h-3 bg-brand-primary'
                                  : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-brand-primary/50 dark:hover:bg-brand-primary/50'
                              }`}
                              aria-label={`Go to page ${pageNum}`}
                            />
                          ))}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(havenNumber, Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-full transition-all duration-200 ${
                            currentPage === totalPages
                              ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50'
                              : 'bg-brand-primary hover:bg-brand-primaryDark'
                          }`}
                          aria-label="Next page"
                        >
                          <ChevronRight className={`w-5 h-5 ${
                            currentPage === totalPages
                              ? 'text-gray-400 dark:text-gray-500'
                              : 'text-white'
                          }`} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default HotelRoomListings;