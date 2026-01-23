"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Star,
  Users,
  X,
  Play,
  Heart,
  Sparkles,
  Clock,
  Tag,
  Calendar,
  LogIn,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedRoom } from "@/redux/slices/bookingSlice";
import { formatDateSafe } from "@/lib/dateUtils";
import { useSession } from "next-auth/react";
import { useCheckWishlistStatusQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } from "@/redux/api/wishlistApi";
import toast from "react-hot-toast";
import AmenityBadge from "./AmenityBadge";
import RoomCard from "./RoomCard";
import dynamic from "next/dynamic";
import Footer from "../Footer";

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
    <div className="w-full h-[400px] rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
    </div>
  ),
});

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
  const [activeCategory, setActiveCategory] = useState("Living Area");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Debug: Log booking data when component mounts or booking data changes
  useEffect(() => {
    console.log('[RoomDetailsPage] Booking Data from Redux:', bookingData);
    console.log('[RoomDetailsPage] isFromSearch:', bookingData.isFromSearch);
    console.log('[RoomDetailsPage] Check-in Date:', bookingData.checkInDate);
    console.log('[RoomDetailsPage] Check-out Date:', bookingData.checkOutDate);
    console.log('[RoomDetailsPage] Guests:', bookingData.guests);
  }, [bookingData]);

  // Type-safe user id extraction
  const userId = (session?.user as SessionUser)?.id || null;

  // RTK Query hooks
  const { data: wishlistStatus } = useCheckWishlistStatusQuery(
    { userId: userId, havenId: room.id },
    { skip: !userId }
  );
  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();

  const isInWishlist = wishlistStatus?.isInWishlist || false;
  const isLoadingWishlist = isAdding || isRemoving;

  // Safe defaults
  const images = Array.isArray(room.images) ? room.images : [];
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];
  const photoTour = room.photoTour || {};

  const photoTourCategories = [
    "Living Area",
    "Kitchenette",
    "Dining Area",
    "Full Bathroom",
    "Garage",
    "Exterior",
    "Pool",
    "Bedroom",
    "Additional",
  ];

  const photoTourData: Record<string, string[]> = {
    "Living Area": photoTour.livingArea ?? [],
    Kitchenette: photoTour.kitchenette ?? [],
    "Dining Area": photoTour.diningArea ?? [],
    "Full Bathroom": photoTour.fullBathroom ?? [],
    Garage: photoTour.garage ?? [],
    Exterior: photoTour.exterior ?? [],
    Pool: photoTour.pool ?? [],
    Bedroom: photoTour.bedroom ?? [],
    Additional: photoTour.additional ?? [],
  };

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const openLightbox = (image: string) => {
    setLightboxImage(image);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImage("");
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setShowAllPhotos(false);
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
        // Remove from wishlist - need to get wishlist item id first
        const result = await removeFromWishlist(wishlistStatus?.wishlistId).unwrap();
        if (result.success) {
          toast.success('Removed from wishlist');
        }
      } else {
        // Add to wishlist
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Main Content with Top Padding for Navbar */}
      <div className="pt-14 sm:pt-16 flex-1">
        {/* Back Button and Breadcrumb */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-brand-primary dark:text-brand-primary hover:text-brand-primaryDark dark:hover:text-brand-primaryDark font-medium transition-colors duration-300 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs sm:text-sm">Back to Rooms</span>
              </button>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">/</span>
                <span className="hidden sm:inline">Rooms</span>
                <span className="hidden sm:inline">/</span>
                <span>Details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Room Details Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column Images */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="relative w-full h-96 sm:h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
              {/* Images Slider */}
              <div
                className="w-full h-full flex transition-transform duration-500"
                style={{
                  transform: `translateX(-${currentImageIndex * 100}%)`,
                }}
              >
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="w-full h-full flex-shrink-0 relative"
                  >
                    <Image
                      src={image}
                      alt={`Room ${index + 1}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {images.length > 0 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold z-10">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex
                      ? "border-brand-primary"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Description Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
                About This Room
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                {room.fullDescription || room.description}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Experience ultimate comfort and luxury in this beautifully
                designed room. Perfect for both business and leisure travelers,
                this room offers everything you need for a memorable stay.
              </p>
            </div>

            {/* Amenities Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3">
                Room Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {amenities.map((amenity, index) => (
                  <AmenityBadge key={index} amenity={amenity} />
                ))}
              </div>
            </div>

            {/* Photo Tour Section */}
            {photoTour && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Photo Tour
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Explore every corner of this haven
                </p>

                {/* Tab navigation */}
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto mb-4 pb-2">
                  {photoTourCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-xs sm:text-sm ${
                        activeCategory === category
                          ? "bg-brand-primary text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Pinterest-style Masonry Grid */}
                {(() => {
                  const photos = photoTourData[activeCategory] ?? [];
                  const displayPhotos = showAllPhotos ? photos : photos.slice(0, 12);
                  const hasMore = photos.length > 12;

                  return photos.length > 0 ? (
                    <>
                      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {displayPhotos.map((photo, index) => (
                          <div
                            key={index}
                            onClick={() => openLightbox(photo)}
                            className="relative break-inside-avoid mb-4 rounded-lg overflow-hidden cursor-pointer"
                          >
                            <Image
                              src={photo}
                              alt={`${activeCategory} ${index + 1}`}
                              width={400}
                              height={Math.floor(Math.random() * 200) + 250}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      {hasMore && !showAllPhotos && (
                        <div className="text-center mt-4">
                          <button
                            onClick={() => setShowAllPhotos(true)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primaryDark transition-colors text-xs sm:text-sm"
                          >
                            View All {photos.length} Photos
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No photos available for this category
                    </div>
                  );
                })()}
              </div>
            )}

            {/* YouTube Video */}
            {room.youtubeUrl && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary dark:text-brand-primary" />
                  Video Tour
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Watch a virtual tour of this beautiful room
                </p>
                <div className="relative w-full pb-[56.25%] rounded-lg overflow-hidden">
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

            {/* Location Map */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 shadow-sm">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary dark:text-brand-primary" />
                Location
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="font-semibold">Staycation Haven PH Quezon City</span>
                {room.tower && <span>, {room.tower}</span>}
              </p>
              <RoomMap
                roomName={room.name}
                tower={room.tower}
                location={room.location}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {/* Promotional Banner */}
            <div className="bg-brand-primary dark:bg-brand-primaryDark rounded-lg shadow-md p-3 sm:p-4 mb-3 sm:mb-4 overflow-hidden relative">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 dark:bg-white/5 rounded-full -translate-y-10 sm:-translate-y-12 translate-x-10 sm:translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 dark:bg-white/5 rounded-full translate-y-8 sm:translate-y-10 -translate-x-8 sm:-translate-x-10"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-1 sm:gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white">Limited Time Offer</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold mb-1.5 sm:mb-2 text-white">Book Now & Save!</h3>
                <div className="space-y-1 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                    <span className="text-white">Free cancellation up to 24 hours</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                    <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                    <span className="text-white">Best price guarantee</span>
                  </div>
                </div>
                <p className="text-[9px] sm:text-[10px] text-white opacity-90">Don&apos;t miss out on this exclusive deal!</p>
              </div>
            </div>

            {/* Price & Booking Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 mb-4">
              <div className="flex items-start gap-1.5 mb-2 sm:mb-3">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                        index < Math.floor(room.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                  {room.rating} ({room.reviews} reviews)
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                {room.name}
              </h1>

              <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Starting from</p>
                <p className="text-2xl sm:text-3xl font-bold text-brand-primary dark:text-brand-primary mb-0.5">
                  {room.price}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{room.pricePerNight}</p>
              </div>

              {/* Your Search Section */}
              {bookingData.isFromSearch && (
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary" />
                    Your Search
                  </h3>
                  <div className="space-y-1.5">
                    {/* Check-in Date */}
                    {bookingData.checkInDate ? (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Check-in:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatDateSafe(bookingData.checkInDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                    )}

                    {/* Check-out Date */}
                    {bookingData.checkOutDate ? (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Check-out:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatDateSafe(bookingData.checkOutDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                    )}

                    {/* Guest Counts */}
                    {bookingData.guests ? (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">Guests:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {bookingData.guests.adults} Adult{bookingData.guests.adults !== 1 ? 's' : ''}
                          {bookingData.guests.children > 0 && `, ${bookingData.guests.children} Child${bookingData.guests.children !== 1 ? 'ren' : ''}`}
                          {bookingData.guests.infants > 0 && `, ${bookingData.guests.infants} Infant${bookingData.guests.infants !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary dark:text-brand-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    Up to {room.capacity} guests
                  </span>
                </div>
                {room.beds && (
                  <div className="flex items-center gap-2">
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary dark:text-brand-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{room.roomSize}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleBookNow}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base shadow-md"
                >
                  Book Now
                </button>
                <button
                  onClick={handleWishlistToggle}
                  disabled={isLoadingWishlist}
                  className={`w-full border-2 font-medium py-2 sm:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm ${
                    isInWishlist
                      ? 'border-brand-primary bg-white text-brand-primary hover:bg-brand-primary/10'
                      : 'border-brand-primary bg-white text-brand-primary hover:bg-brand-primary/10'
                  } ${isLoadingWishlist ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isInWishlist ? 'fill-brand-primary text-brand-primary' : 'fill-brand-primary text-brand-primary'}`} />
                  <span className="truncate">{isLoadingWishlist ? 'Loading...' : isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Recommended Rooms Section */}
          {recommendedRooms.length > 0 && (
            <div className="mt-8 sm:mt-12">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                    You May Also Like
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Explore other havens that might interest you
                  </p>
                </div>
                <button
                  onClick={() => router.push('/rooms')}
                  className="text-sm text-brand-primary hover:text-brand-primaryDark font-medium transition-colors hidden sm:block"
                >
                  View All Rooms →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {recommendedRooms.slice(0, 5).map((recRoom) => (
                  <RoomCard
                    key={recRoom.id}
                    room={{
                      ...recRoom,
                      uuid_id: recRoom.id,
                    }}
                    mode="browse"
                    compact={false}
                  />
                ))}
              </div>

              {/* Mobile View All Button */}
              <button
                onClick={() => router.push('/rooms')}
                className="w-full mt-4 py-2.5 text-sm text-brand-primary border border-brand-primary rounded-lg font-medium hover:bg-brand-primary hover:text-white transition-colors sm:hidden"
              >
                View All Rooms
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImage}
              alt="Fullscreen view"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RoomsDetailsPage;