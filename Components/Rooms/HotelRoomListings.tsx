"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import RoomCard from "./RoomCard";
import RoomCardSkeleton from "./RoomCardSkeleton";
import { SlidersHorizontal, ChevronRight, ChevronLeft, Eye, X, Filter, ChevronDown } from "lucide-react";
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
  uuid_id?: string;
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
  images?: Array<{ image_url: string }>;
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
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [selectedFilters, setSelectedFilters] = useState({
    priceRange: '',
    capacity: '',
    amenities: [] as string[],
    rating: '',
    tower: ''
  });
  const [sortBy, setSortBy] = useState<string>('recommended');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const ROOMS_PER_PAGE = 12;
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

  // Helper function to extract haven number for sorting
  const extractHavenNumber = (name: string): number => {
    const match = name.match(/Haven\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : 999;
  };

  // Helper function to extract numeric price from price string
  const extractPrice = (priceString: string): number => {
    const match = priceString.match(/₱(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Get unique values for filter options
  const uniqueTowers = useMemo(() => {
    const towers = new Set(initialHavens.map(haven => haven.tower).filter((tower): tower is string => Boolean(tower)));
    return Array.from(towers);
  }, [initialHavens]);

  const uniqueAmenities = useMemo(() => {
    const amenities = new Set<string>();
    initialHavens.forEach(haven => {
      if (haven.amenities) {
        Object.entries(haven.amenities).forEach(([amenity, hasAmenity]) => {
          if (hasAmenity) amenities.add(amenity);
        });
      }
    });
    return Array.from(amenities);
  }, [initialHavens]);

  // Apply filters and sorting
  const processedRooms = useMemo(() => {
    let filtered = filteredHavens.map((haven: Haven) => ({
      id: haven.uuid_id ?? haven.id ?? '',
      uuid_id: haven.uuid_id,
      name: haven.haven_name ?? haven.name ?? "Unnamed Haven",
      price: `₱${haven.six_hour_rate ?? haven.weekday_rate ?? haven.weekend_rate ?? "N/A"}`,
      pricePerNight: "per night",
      images: haven.images?.map((img: any) => img.image_url) ?? [],
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
      sixHourCheckIn: haven.six_hour_check_in,
      sixHourCheckOut: haven.six_hour_check_out,
      tenHourCheckIn: haven.ten_hour_check_in,
      tenHourCheckOut: haven.ten_hour_check_out,
      twentyOneHourCheckIn: haven.twenty_one_hour_check_in,
      twentyOneHourCheckOut: haven.twenty_one_hour_check_out,
      photoTour: haven.photo_tours
        ? haven.photo_tours.reduce((acc: Record<string, string[]>, item: any) => {
            acc[item.category] = acc[item.category] || [];
            acc[item.category].push(item.image_url);
            return acc;
          }, {} as Record<string, string[]>)
        : {},
      youtubeUrl: haven.youtube_url,
    }));

    // Apply filters
    if (selectedFilters.priceRange) {
      filtered = filtered.filter(room => {
        const price = extractPrice(room.price);
        switch (selectedFilters.priceRange) {
          case '0-2000': return price <= 2000;
          case '2000-4000': return price > 2000 && price <= 4000;
          case '4000-6000': return price > 4000 && price <= 6000;
          case '6000+': return price > 6000;
          default: return true;
        }
      });
    }

    if (selectedFilters.capacity) {
      filtered = filtered.filter(room => {
        switch (selectedFilters.capacity) {
          case '1-2': return room.capacity <= 2;
          case '3-4': return room.capacity >= 3 && room.capacity <= 4;
          case '5+': return room.capacity >= 5;
          default: return true;
        }
      });
    }

    if (selectedFilters.amenities.length > 0) {
      filtered = filtered.filter(room => 
        selectedFilters.amenities.every(amenity => 
          room.amenities.includes(amenity)
        )
      );
    }

    if (selectedFilters.rating) {
      filtered = filtered.filter(room => {
        switch (selectedFilters.rating) {
          case '4+': return room.rating >= 4;
          case '4.5+': return room.rating >= 4.5;
          default: return true;
        }
      });
    }

    if (selectedFilters.tower) {
      filtered = filtered.filter(room => room.tower === selectedFilters.tower);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low-high':
        filtered.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
        break;
      case 'price-high-low':
        filtered.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'capacity':
        filtered.sort((a, b) => b.capacity - a.capacity);
        break;
      case 'recommended':
      default:
        filtered.sort((a, b) => extractHavenNumber(a.name) - extractHavenNumber(b.name));
        break;
    }

    return filtered;
  }, [filteredHavens, selectedFilters, sortBy]);

  const rooms: Room[] = processedRooms;

  // Show all rooms without haven grouping
  const allRooms = rooms;
  const totalRooms = allRooms.length;
  const totalPages = Math.ceil(totalRooms / ROOMS_PER_PAGE);
  const currentPageGlobal = currentPage.global || 1;
  const startIndex = (currentPageGlobal - 1) * ROOMS_PER_PAGE;
  const endIndex = startIndex + ROOMS_PER_PAGE;
  const displayedRooms = allRooms.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(prev => ({ ...prev, global: 1 }));
  }, [selectedFilters, sortBy]);

  // Filter handlers
  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: (prev as any)[filterType] === value ? '' : value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      priceRange: '',
      capacity: '',
      amenities: [],
      rating: '',
      tower: ''
    });
    setSortBy('recommended');
  };

  const hasActiveFilters = Object.values(selectedFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== ''
  ) || sortBy !== 'recommended';

  const handlePageChange = (page: number) => {
    setCurrentPage(prev => ({ ...prev, global: page }));
  };

  const handleHavenClick = (havenNumber: string) => {
    // Navigate to haven-specific page
    const havenId = havenNumber.replace('Haven ', '');
    router.push(`/havens/${havenId}`);
  };

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      <div className={`bg-white dark:bg-gray-900 ${
        totalRooms <= 5 ? 'pt-2 sm:pt-4 pb-8' : 'py-4 sm:py-6'
      }`}>
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

          {/* Filter Section */}
          {!isLoading && (
            <div className="mb-6">
              {/* Mobile Filter Toggle */}
              {isMobile && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-primary dark:hover:border-brand-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters & Sort</span>
                      {hasActiveFilters && (
                        <span className="px-2 py-1 bg-brand-primary text-white text-xs rounded-full">
                          {Object.values(selectedFilters).filter(v => Array.isArray(v) ? v.length > 0 : v !== '').length + (sortBy !== 'recommended' ? 1 : 0)}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* Filter Content */}
              <div className={`${isMobile ? (showMobileFilters ? 'block' : 'hidden') : 'block'}`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by:</span>
                    
                    {/* Price Range Filter */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          const options = ['0-2000', '2000-4000', '4000-6000', '6000+'];
                          const currentIndex = options.indexOf(selectedFilters.priceRange);
                          const nextIndex = (currentIndex + 1) % (options.length + 1);
                          const nextValue: string = nextIndex === options.length ? '' : options[nextIndex];
                          handleFilterChange('priceRange', nextValue);
                        }}
                        className={`px-3 py-1.5 bg-white dark:bg-gray-800 border rounded-full transition-colors text-sm whitespace-nowrap cursor-pointer ${
                          selectedFilters.priceRange
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                        }`}
                      >
                        Price Range
                        {selectedFilters.priceRange && (
                          <span className="ml-1 text-xs">({selectedFilters.priceRange.replace('-', ' to ')})</span>
                        )}
                      </button>
                      {!isMobile && selectedFilters.priceRange && (
                        <button
                          onClick={() => handleFilterChange('priceRange', selectedFilters.priceRange)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-brand-primaryDark"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Capacity Filter */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          const options = ['1-2', '3-4', '5+'];
                          const currentIndex = options.indexOf(selectedFilters.capacity);
                          const nextIndex = (currentIndex + 1) % (options.length + 1);
                          const nextValue: string = nextIndex === options.length ? '' : options[nextIndex];
                          handleFilterChange('capacity', nextValue);
                        }}
                        className={`px-3 py-1.5 bg-white dark:bg-gray-800 border rounded-full transition-colors text-sm whitespace-nowrap cursor-pointer ${
                          selectedFilters.capacity
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                        }`}
                      >
                        Capacity
                        {selectedFilters.capacity && (
                          <span className="ml-1 text-xs">({selectedFilters.capacity})</span>
                        )}
                      </button>
                      {!isMobile && selectedFilters.capacity && (
                        <button
                          onClick={() => handleFilterChange('capacity', selectedFilters.capacity)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-brand-primaryDark"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Amenities Filter */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          if (selectedFilters.amenities.length === 0) {
                            // Select first available amenity
                            const firstAmenity = uniqueAmenities[0];
                            if (firstAmenity) handleAmenityToggle(firstAmenity);
                          } else {
                            // Clear all amenities
                            setSelectedFilters(prev => ({ ...prev, amenities: [] }));
                          }
                        }}
                        className={`px-3 py-1.5 bg-white dark:bg-gray-800 border rounded-full transition-colors text-sm whitespace-nowrap cursor-pointer ${
                          selectedFilters.amenities.length > 0
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                        }`}
                      >
                        Amenities
                        {selectedFilters.amenities.length > 0 && (
                          <span className="ml-1 text-xs">({selectedFilters.amenities.length})</span>
                        )}
                      </button>
                      {!isMobile && selectedFilters.amenities.length > 0 && (
                        <button
                          onClick={() => setSelectedFilters(prev => ({ ...prev, amenities: [] }))}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-brand-primaryDark"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Rating Filter */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          const options = ['4+', '4.5+'];
                          const currentIndex = options.indexOf(selectedFilters.rating);
                          const nextIndex = (currentIndex + 1) % (options.length + 1);
                          const nextValue: string = nextIndex === options.length ? '' : options[nextIndex];
                          handleFilterChange('rating', nextValue);
                        }}
                        className={`px-3 py-1.5 bg-white dark:bg-gray-800 border rounded-full transition-colors text-sm whitespace-nowrap cursor-pointer ${
                          selectedFilters.rating
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                        }`}
                      >
                        {selectedFilters.rating || '4+ Stars'}
                      </button>
                      {!isMobile && selectedFilters.rating && (
                        <button
                          onClick={() => handleFilterChange('rating', selectedFilters.rating)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-brand-primaryDark"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    {/* Tower Filter */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          const options = uniqueTowers;
                          const currentIndex = options.indexOf(selectedFilters.tower);
                          const nextIndex = (currentIndex + 1) % (options.length + 1);
                          const nextValue: string = nextIndex === options.length ? '' : options[nextIndex];
                          handleFilterChange('tower', nextValue);
                        }}
                        className={`px-3 py-1.5 bg-white dark:bg-gray-800 border rounded-full transition-colors text-sm whitespace-nowrap cursor-pointer ${
                          selectedFilters.tower
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                        }`}
                      >
                        Tower
                        {selectedFilters.tower && (
                          <span className="ml-1 text-xs">({selectedFilters.tower})</span>
                        )}
                      </button>
                      {!isMobile && selectedFilters.tower && (
                        <button
                          onClick={() => handleFilterChange('tower', selectedFilters.tower)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-brand-primaryDark"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-brand-primary"
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price-low-high">Price: Low to High</option>
                      <option value="price-high-low">Price: High to Low</option>
                      <option value="rating">Rating</option>
                      <option value="capacity">Capacity</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Filter Details */}
                {isMobile && showMobileFilters && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {/* Price Range Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</h4>
                      <div className="space-y-2">
                        {['0-2000', '2000-4000', '4000-6000', '6000+'].map(range => (
                          <label key={range} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="priceRange"
                              checked={selectedFilters.priceRange === range}
                              onChange={() => handleFilterChange('priceRange', range)}
                              className="text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {range === '0-2000' ? '₱0 - ₱2,000' :
                               range === '2000-4000' ? '₱2,000 - ₱4,000' :
                               range === '4000-6000' ? '₱4,000 - ₱6,000' :
                               '₱6,000+'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Capacity Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacity</h4>
                      <div className="space-y-2">
                        {['1-2', '3-4', '5+'].map(capacity => (
                          <label key={capacity} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="capacity"
                              checked={selectedFilters.capacity === capacity}
                              onChange={() => handleFilterChange('capacity', capacity)}
                              className="text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {capacity === '1-2' ? '1-2 Guests' :
                               capacity === '3-4' ? '3-4 Guests' :
                               '5+ Guests'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Rating Options */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</h4>
                      <div className="space-y-2">
                        {['4+', '4.5+'].map(rating => (
                          <label key={rating} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="rating"
                              checked={selectedFilters.rating === rating}
                              onChange={() => handleFilterChange('rating', rating)}
                              className="text-brand-primary focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{rating} Stars</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Tower Options */}
                    {uniqueTowers.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tower</h4>
                        <div className="space-y-2">
                          {uniqueTowers.map(tower => (
                            <label key={tower} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="tower"
                                checked={selectedFilters.tower === tower}
                                onChange={() => handleFilterChange('tower', tower)}
                                className="text-brand-primary focus:ring-brand-primary"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{tower}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities Options */}
                    {uniqueAmenities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amenities</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {uniqueAmenities.slice(0, 10).map(amenity => (
                            <label key={amenity} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedFilters.amenities.includes(amenity)}
                                onChange={() => handleAmenityToggle(amenity)}
                                className="text-brand-primary focus:ring-brand-primary"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {amenity.replace(/_/g, ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                )}

                {/* Desktop Clear Filters */}
                {!isMobile && hasActiveFilters && (
                  <div className="mt-3">
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
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

                  {/* Mobile Layout Skeleton - Horizontal Scroll */}
                  {isMobile ? (
                    <div>
                      {/* Scroll hint skeleton */}
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                      <div className="overflow-x-auto pb-2 -mx-4 px-4">
                        <div className="flex gap-3" style={{ width: 'max-content' }}>
                          {[1, 2, 3, 4, 5].map((skeleton) => (
                            <div key={skeleton} className="flex-shrink-0 w-40">
                              <RoomCardSkeleton compact={false} />
                            </div>
                          ))}
                        </div>
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

          {/* All Rooms Grid - No Haven Grouping */}
          {!isLoading && (
            <>
              {/* Mobile Layout - Horizontal Scroll (5 rooms per row) */}
              {isMobile ? (
                <div className="space-y-6">
                  {/* Split rooms into groups of 5 for horizontal scroll rows */}
                  {Array.from({ length: Math.ceil(displayedRooms.length / 5) }, (_, rowIndex) => {
                    const rowRooms = displayedRooms.slice(rowIndex * 5, (rowIndex + 1) * 5);
                    return (
                      <div key={rowIndex}>
                        {/* Scroll hint */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          <span>Scroll right to see more rooms</span>
                        </p>
                        <div className="overflow-x-auto pb-2 -mx-4 px-4">
                          <div className="flex gap-3" style={{ width: 'max-content' }}>
                            {rowRooms.map((room) => (
                              <div key={room.id} className="flex-shrink-0 w-40">
                                <RoomCard room={room} mode="browse" compact={false} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Desktop Layout */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {displayedRooms.map((room) => (
                    <div key={room.id}>
                      <RoomCard room={room} mode="browse" compact={false} />
                    </div>
                  ))}
                </div>
              )}

              {/* Global Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-8">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPageGlobal - 1))}
                    disabled={currentPageGlobal === 1}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      currentPageGlobal === 1
                        ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50'
                        : 'bg-brand-primary hover:bg-brand-primaryDark'
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className={`w-5 h-5 ${
                      currentPageGlobal === 1
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-white'
                    }`} />
                  </button>

                  {/* Page Dots */}
                  <div className="flex gap-2 items-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`transition-all duration-200 rounded-full ${
                          currentPageGlobal === pageNum
                            ? 'w-8 h-3 bg-brand-primary'
                            : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-brand-primary/50 dark:hover:bg-brand-primary/50'
                        }`}
                        aria-label={`Go to page ${pageNum}`}
                      />
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPageGlobal + 1))}
                    disabled={currentPageGlobal === totalPages}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      currentPageGlobal === totalPages
                        ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50'
                        : 'bg-brand-primary hover:bg-brand-primaryDark'
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className={`w-5 h-5 ${
                      currentPageGlobal === totalPages
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-white'
                    }`} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default HotelRoomListings;