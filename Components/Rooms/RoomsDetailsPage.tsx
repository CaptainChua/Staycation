"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Users,
  X,
  Play,
  Heart,
  Share,
  Grid3X3,
  Bed,
  Bath,
  Maximize,
  Shield,
  Clock,
  Award,
  MessageCircle,
  LayoutGrid,
  Sparkles,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedRoom } from "@/redux/slices/bookingSlice";
import { formatDateSafe } from "@/lib/dateUtils";
import { useSession } from "next-auth/react";
import { useCheckWishlistStatusQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from "@/redux/api/wishlistApi";
import { useGetHavenReviewsQuery } from "@/redux/api/reviewsApi";
import toast from "react-hot-toast";
import AmenityBadge from "./AmenityBadge";
import RoomCard from "./RoomCard";
import dynamic from "next/dynamic";
import Footer from "../Footer";
import DateRangePicker from "../HeroSection/DateRangePicker";
import GuestSelector from "../HeroSection/GuestSelector";
import {
  setCheckInDate as setReduxCheckInDate,
  setCheckOutDate as setReduxCheckOutDate,
  setGuests as setReduxGuests,
} from '@/redux/slices/bookingSlice'

// Define proper type for session user
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Dynamically import RoomMap to avoid SSR issues with Leaflet
const RoomMap = dynamic(() => import("./RoomMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
    </div>
  ),
});

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

interface RoomsDetailsPageProps {
  room: Room;
  onBack: () => void;
  recommendedRooms?: Room[];
}

const RoomsDetailsPage = ({ room, onBack, recommendedRooms = [] }: RoomsDetailsPageProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const bookingData = useAppSelector((state) => state.booking);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "amenities" | "location" | "reviews">("overview");
  
  // Local state for date and guest selection
  const [localCheckInDate, setLocalCheckInDate] = useState(bookingData.checkInDate || "");
  const [localCheckOutDate, setLocalCheckOutDate] = useState(bookingData.checkOutDate || "");
  const [localGuests, setLocalGuests] = useState(bookingData.guests || {
    adults: 1,
    children: 0,
    infants: 0,
  });

  // Type-safe user id extraction
  const userId = (session?.user as SessionUser)?.id || null;

  // RTK Query hooks
  const { data: wishlistStatus, error: wishlistError } = useCheckWishlistStatusQuery(
    { userId: userId, havenId: room.id },
    { skip: !userId }
  );
  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();
  
  // Fetch reviews for this haven
  const { data: reviewsResponse, isLoading: isLoadingReviews } = useGetHavenReviewsQuery({ haven_id: room.id });
  const reviewsData = reviewsResponse?.success ? reviewsResponse : { reviews: [], total: 0, hasMore: false };

  // Initialize local state with booking data when component mounts or booking data changes
  useEffect(() => {
    if (bookingData.checkInDate) setLocalCheckInDate(bookingData.checkInDate);
    if (bookingData.checkOutDate) setLocalCheckOutDate(bookingData.checkOutDate);
    if (bookingData.guests) setLocalGuests(bookingData.guests);
  }, [bookingData.checkInDate, bookingData.checkOutDate, bookingData.guests]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dateDropdown = document.getElementById('mobile-date-dropdown');
      const guestDropdown = document.getElementById('mobile-guest-dropdown');
      
      // Check if click is outside both dropdowns and not on the trigger buttons
      if (dateDropdown && !dateDropdown.contains(target) && 
          guestDropdown && !guestDropdown.contains(target) &&
          !target.closest('[data-dropdown-trigger="date"]') &&
          !target.closest('[data-dropdown-trigger="guest"]')) {
        
        // Hide both dropdowns
        dateDropdown.classList.add('hidden');
        guestDropdown.classList.add('hidden');
      }
    };

    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle wishlist errors - log only, no toast notifications
  useEffect(() => {
    if (wishlistError) {
      console.error('Wishlist API Error:', wishlistError);
      // No toast notification - handle errors silently
    }
  }, [wishlistError]);

  const isInWishlist = wishlistStatus?.isInWishlist || false;
  const isLoadingWishlist = isAdding || isRemoving;
  
  // Disable wishlist functionality if API is not available
  const isWishlistDisabled = !!wishlistError && 'status' in wishlistError && wishlistError.status === 404;

  // Safe defaults
  const images = Array.isArray(room.images) ? room.images : [];
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const displayedAmenities = showAllAmenities ? amenities : amenities.slice(0, 6);

  // Get all photo tour images for the gallery
  const photoTour = room.photoTour || {};
  const allPhotoTourImages = Object.values(photoTour).flat().filter(Boolean) as string[];
  const allImages = [...images, ...allPhotoTourImages];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextLightboxImage = () => {
    setLightboxIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevLightboxImage = () => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const videoIdMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : url;
  };

  const handleWishlistToggle = async () => {
    if (!userId) {
      toast.error('Please login to add to wishlist');
      router.push('/login');
      return;
    }

    try {
      if (isInWishlist) {
        const result = await removeFromWishlist(wishlistStatus?.wishlistId).unwrap();
        if (result.success) {
          toast.success('Removed from wishlist');
        }
      } else {
        const result = await addToWishlist({
          user_id: userId,
          haven_id: room.id,
        }).unwrap();
        if (result.success) {
          toast.success('Added to wishlist');
        }
      }
    } catch (error: unknown) {
      const apiError = error as { data?: { error?: string } };
      console.error('Error toggling wishlist:', error);
      toast.error(apiError?.data?.error || 'An error occurred. Please try again.');
    }
  };

  const handleBookNow = () => {
    // Update Redux store with current selections
    dispatch(setReduxCheckInDate(localCheckInDate));
    dispatch(setReduxCheckOutDate(localCheckOutDate));
    dispatch(setReduxGuests(localGuests));
    
    dispatch(
      setSelectedRoom({
        id: room.id,
        name: room.name,
        price: room.price,
        pricePerNight: room.pricePerNight,
        location: room.location,
        tower: room.tower,
      })
    );
    router.push("/checkout");
  };

  const handleGuestChange = (type: keyof typeof localGuests, value: number) => {
    setLocalGuests((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: room.name,
          text: `Check out ${room.name} at Staycation Haven!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Main Content with Top Padding for Navbar */}
      <div className="pt-14 sm:pt-16 flex-1">

        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 sm:top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">Back to Havens</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Share className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>
                <button
                  onClick={handleWishlistToggle}
                  disabled={isLoadingWishlist || isWishlistDisabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isWishlistDisabled ? "Wishlist feature temporarily unavailable" : userId ? "Add to wishlist" : "Login to add to wishlist"}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="hidden sm:inline">{isInWishlist ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Airbnb-Style Image Gallery */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Desktop: 5-image grid */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] lg:h-[480px] rounded-xl overflow-hidden">
              {/* Main large image */}
              <div
                className="col-span-2 row-span-2 relative cursor-pointer group"
                onClick={() => openLightbox(0)}
              >
                {images[0] && (
                  <>
                    <Image
                      src={images[0]}
                      alt={room.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 600px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </>
                )}
              </div>
              {/* 4 smaller images */}
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group"
                  onClick={() => images[index] && openLightbox(index)}
                >
                  {images[index] ? (
                    <>
                      <Image
                        src={images[index]}
                        alt={`${room.name} ${index + 1}`}
                        fill
                        sizes="(max-width: 1024px) 25vw, 300px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>
              ))}
            </div>
            {/* Show all photos button - positioned outside grid */}
            <button
              onClick={() => openLightbox(0)}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            >
              <Grid3X3 className="w-4 h-4" />
              Show all {allImages.length} photos
            </button>
          </div>

          {/* Mobile: Carousel */}
          <div className="md:hidden relative h-72 sm:h-80 rounded-xl overflow-hidden">
            <div
              className="w-full h-full flex transition-transform duration-500"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {images.map((image, index) => (
                <div key={index} className="w-full h-full flex-shrink-0 relative">
                  <Image
                    src={image}
                    alt={`${room.name} ${index + 1}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
            {/* Mobile navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.slice(0, 5).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Mobile show all photos */}
            <button
              onClick={() => openLightbox(0)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white text-xs font-medium rounded-lg"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              {allImages.length} photos
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">

            {/* Left Column - Details */}
            <div className="lg:col-span-2">

              {/* Title & Rating Section */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {room.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{room.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400">({reviewsData?.total || room.reviews} reviews)</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>Staycation Haven PH, Quezon City{room.tower && `, ${room.tower}`}</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Bar */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{room.capacity} guests</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Max capacity</p>
                    </div>
                  </div>
                  {room.beds && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                        <Bed className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{room.beds}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Bed</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                      <Bath className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">1 bathroom</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Full bath</p>
                    </div>
                  </div>
                  {room.roomSize && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center">
                        <Maximize className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{room.roomSize}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Space</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-8 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "overview", label: "Overview", icon: <LayoutGrid className="w-4 h-4" /> },
                    { id: "amenities", label: "Amenities", icon: <Sparkles className="w-4 h-4" /> },
                    { id: "location", label: "Location", icon: <MapPin className="w-4 h-4" /> },
                    { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-brand-primary text-brand-primary"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="py-6">
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* About */}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        About this haven
                      </h2>
                      <p className={`text-gray-600 dark:text-gray-300 leading-relaxed ${!showFullDescription && 'line-clamp-4'}`}>
                        {room.fullDescription || room.description}
                      </p>
                      {(room.fullDescription || room.description).length > 200 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="mt-2 text-brand-primary font-medium text-sm hover:underline"
                        >
                          {showFullDescription ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {/* Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Shield className="w-6 h-6 text-brand-primary flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Self check-in</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Check yourself in with the keypad</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <Clock className="w-6 h-6 text-brand-primary flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">24/7 Support</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">We&apos;re here to help anytime you need</p>
                        </div>
                      </div>
                    </div>

                    {/* Video Tour */}
                    {room.youtubeUrl && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Play className="w-5 h-5 text-brand-primary" />
                          Video Tour
                        </h2>
                        <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden">
                          <iframe
                            src={getYouTubeEmbedUrl(room.youtubeUrl)}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Room Video Tour"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "amenities" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      What this place offers
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {displayedAmenities.map((amenity, index) => (
                        <AmenityBadge key={index} amenity={amenity} />
                      ))}
                    </div>
                    {amenities.length > 6 && (
                      <button
                        onClick={() => setShowAllAmenities(!showAllAmenities)}
                        className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {showAllAmenities ? 'Show less' : `Show all ${amenities.length} amenities`}
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "location" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      Where you&apos;ll be
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Staycation Haven PH, Quezon City{room.tower && `, ${room.tower}`}
                    </p>
                    <div className="rounded-xl overflow-hidden">
                      <RoomMap
                        roomName={room.name}
                        tower={room.tower}
                        location={room.location}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div>
                    {/* Reviews Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{room.rating}</span>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-lg text-gray-600 dark:text-gray-400">{reviewsData?.total || room.reviews} reviews</span>
                    </div>

                    {/* Rating Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      {[
                        { label: "Cleanliness", rating: 4.9 },
                        { label: "Communication", rating: 5.0 },
                        { label: "Check-in", rating: 4.8 },
                        { label: "Accuracy", rating: 4.9 },
                        { label: "Location", rating: 4.7 },
                        { label: "Value", rating: 4.8 },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                          <div className="flex items-center gap-2 flex-1 max-w-[150px]">
                            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-900 dark:bg-white rounded-full"
                                style={{ width: `${(item.rating / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">{item.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-6">
                      {isLoadingReviews ? (
                        // Loading skeleton
                        [1, 2, 3].map((index) => (
                          <div key={index} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <div key={i} className="w-3.5 h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                    ))}
                                  </div>
                                </div>
                                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : reviewsData?.reviews?.length > 0 ? (
                        reviewsData.reviews
                          .slice(0, showAllReviews ? undefined : 3)
                          .map((review) => (
                            <div key={review.id} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-orange-400 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-white">
                                    {review.guest_first_name?.[0]}{review.guest_last_name?.[0]}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {review.guest_first_name} {review.guest_last_name?.[0]}***
                                    </h4>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3.5 h-3.5 ${i < Math.round(review.overall_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    {new Date(review.created_at).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'long' 
                                    })}
                                  </p>
                                  {review.comment && (
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                                  )}
                                  {review.is_verified && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <Shield className="w-3 h-3 text-green-600" />
                                      <span className="text-xs text-green-600 font-medium">Verified Review</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Be the first to share your experience!</p>
                        </div>
                      )}
                    </div>

                    {/* Show More Reviews Button */}
                    {(reviewsData?.reviews?.length > 3 || (reviewsData?.total || 0) > 3) && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="w-full mt-6 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {showAllReviews ? 'Show less' : `Show all ${reviewsData?.total || room.reviews} reviews`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Host Info Section */}
              <div className="py-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-white">SH</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Hosted by Staycation Haven
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-brand-primary" />
                        <span>Superhost</span>
                      </div>
                      <span>|</span>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>Usually responds within 1 hour</span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                      Staycation Haven provides premium accommodations in Quezon City.
                      We ensure every guest has a comfortable and memorable stay with 24/7 support.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-32" data-booking-card>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{room.price}</span>
                    <span className="text-gray-500 dark:text-gray-400">/ {room.pricePerNight}</span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-6">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{room.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400">({reviewsData?.total || room.reviews} reviews)</span>
                  </div>

                  {/* Date and Guest Selection */}
                  <div className="space-y-3 mb-6">
                    {/* Date Range Picker */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Dates
                      </label>
                      <DateRangePicker
                        checkInDate={localCheckInDate}
                        checkOutDate={localCheckOutDate}
                        onCheckInChange={setLocalCheckInDate}
                        onCheckOutChange={setLocalCheckOutDate}
                      />
                    </div>
                    
                    {/* Guest Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Number of Guests
                      </label>
                      <GuestSelector
                        guests={localGuests}
                        onGuestChange={handleGuestChange}
                      />
                    </div>
                  </div>

                  {/* Booking Info */}
                  {bookingData.isFromSearch && (localCheckInDate || localCheckOutDate) && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 p-3 bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Previously selected from search:
                      </p>
                      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-600">
                        <div className="p-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Check-in</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {localCheckInDate ? formatDateSafe(localCheckInDate, { month: 'short', day: 'numeric' }) : 'Select date'}
                          </p>
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Check-out</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {localCheckOutDate ? formatDateSafe(localCheckOutDate, { month: 'short', day: 'numeric' }) : 'Select date'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 p-2 mt-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Guests</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {localGuests.adults + localGuests.children + localGuests.infants} guests
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBookNow}
                    className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Book
                  </button>

                  <div className="mt-3 p-3 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                    <p className="text-center text-sm font-medium text-brand-primary dark:text-brand-primary">
                      Down payment: ₱500
                    </p>
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Pay the remaining balance upon check-in
                    </p>
                  </div>

                  {/* Wishlist Button */}
                  <button
                    onClick={handleWishlistToggle}
                    disabled={isLoadingWishlist || isWishlistDisabled}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isWishlistDisabled ? "Wishlist feature temporarily unavailable" : userId ? "Add to wishlist" : "Login to add to wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-sm font-medium">
                      {isLoadingWishlist ? 'Loading...' : isInWishlist ? 'Saved to wishlist' : 'Save to wishlist'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Rooms Section */}
          {recommendedRooms.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    You may also like
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Explore other havens that might interest you
                  </p>
                </div>
                <button
                  onClick={() => router.push('/rooms')}
                  className="text-sm text-brand-primary hover:text-brand-primaryDark font-medium transition-colors hidden sm:block"
                >
                  View all →
                </button>
              </div>

              <div className="overflow-x-auto pb-4 scrollbar-thin">
                <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                  {recommendedRooms.slice(0, 5).map((recRoom) => (
                    <div key={recRoom.id} className="w-[200px] sm:w-[220px] lg:w-[240px] flex-shrink-0">
                      <RoomCard
                        room={recRoom}
                        mode="browse"
                        compact={false}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push('/rooms')}
                className="w-full mt-4 py-2.5 text-sm text-brand-primary border border-brand-primary rounded-lg font-medium hover:bg-brand-primary hover:text-white transition-colors sm:hidden"
              >
                View all rooms
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Container - Appears at Top */}
      <div className="lg:hidden fixed top-20 left-0 right-0 z-50 px-4 py-2">
        {/* Date Dropdown */}
        <div id="mobile-date-dropdown" className="hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Dates</h3>
            <button 
              onClick={() => {
                const dropdown = document.getElementById('mobile-date-dropdown');
                dropdown?.classList.add('hidden');
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <DateRangePicker
            checkInDate={localCheckInDate}
            checkOutDate={localCheckOutDate}
            onCheckInChange={setLocalCheckInDate}
            onCheckOutChange={setLocalCheckOutDate}
          />
        </div>

        {/* Guest Dropdown */}
        <div id="mobile-guest-dropdown" className="hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Number of Guests</h3>
            <button 
              onClick={() => {
                const dropdown = document.getElementById('mobile-guest-dropdown');
                dropdown?.classList.add('hidden');
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <GuestSelector
            guests={localGuests}
            onGuestChange={handleGuestChange}
          />
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-40">
        <div className="flex flex-col gap-3 max-w-7xl mx-auto">
          {/* Price and Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{room.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ {room.pricePerNight}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>{room.rating}</span>
              </div>
            </div>
            <span className="text-xs text-brand-primary font-medium">₱500 down payment</span>
          </div>
          
          {/* Date and Guest Selection Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Date Button */}
            <button
              data-dropdown-trigger="date"
              onClick={() => {
                // Close guest dropdown if open
                const guestDropdown = document.getElementById('mobile-guest-dropdown');
                guestDropdown?.classList.add('hidden');
                
                // Toggle date dropdown
                const dateDropdown = document.getElementById('mobile-date-dropdown');
                dateDropdown?.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-brand-primary transition-colors"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <div className="flex-1 text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">Dates</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {localCheckInDate && localCheckOutDate 
                    ? `${formatDateSafe(localCheckInDate, { month: 'short', day: 'numeric' })} - ${formatDateSafe(localCheckOutDate, { month: 'short', day: 'numeric' })}`
                    : localCheckInDate 
                    ? formatDateSafe(localCheckInDate, { month: 'short', day: 'numeric' })
                    : 'Add dates'
                  }
                </p>
              </div>
            </button>
            
            {/* Guest Button */}
            <button
              data-dropdown-trigger="guest"
              onClick={() => {
                // Close date dropdown if open
                const dateDropdown = document.getElementById('mobile-date-dropdown');
                dateDropdown?.classList.add('hidden');
                
                // Toggle guest dropdown
                const guestDropdown = document.getElementById('mobile-guest-dropdown');
                guestDropdown?.classList.toggle('hidden');
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-brand-primary transition-colors"
            >
              <Users className="w-4 h-4 text-gray-500" />
              <div className="flex-1 text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">Guests</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {localGuests.adults + localGuests.children + localGuests.infants} guests
                </p>
              </div>
            </button>
          </div>
          
          {/* Booking Info from Search */}
          {bookingData.isFromSearch && (localCheckInDate || localCheckOutDate) && (
            <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
              📅 Previously selected from search
            </div>
          )}
          
          <button
            onClick={handleBookNow}
            className="w-full py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold rounded-lg shadow-md"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Full Gallery Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between p-4 text-white">
            <button
              onClick={closeLightbox}
              className="flex items-center gap-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
              <span className="text-sm font-medium">Close</span>
            </button>
            <span className="text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </span>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>

          {/* Lightbox Image */}
          <div className="flex-1 relative flex items-center justify-center px-4 pb-4">
            <button
              onClick={prevLightboxImage}
              className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <div className="relative w-full max-w-5xl h-full">
              <Image
                src={allImages[lightboxIndex]}
                alt={`${room.name} ${lightboxIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            <button
              onClick={nextLightboxImage}
              className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Lightbox Thumbnails */}
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-2 justify-center">
              {allImages.slice(0, 10).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setLightboxIndex(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                    index === lightboxIndex ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
              {allImages.length > 10 && (
                <div className="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm">
                  +{allImages.length - 10}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RoomsDetailsPage;
