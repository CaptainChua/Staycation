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
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
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
    <div className="w-full h-[400px] rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "amenities" | "location">("overview");

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
                  disabled={isLoadingWishlist}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                    <span className="text-gray-500 dark:text-gray-400">({room.reviews} reviews)</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>Quezon City{room.tower && `, ${room.tower}`}</span>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sleeping</p>
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
                <div className="flex gap-8">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "amenities", label: "Amenities" },
                    { id: "location", label: "Location" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-brand-primary text-brand-primary"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {displayedAmenities.map((amenity, index) => (
                        <AmenityBadge key={index} amenity={amenity} />
                      ))}
                    </div>
                    {amenities.length > 6 && (
                      <button
                        onClick={() => setShowAllAmenities(!showAllAmenities)}
                        className="mt-4 px-6 py-2.5 border border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
              <div className="sticky top-32">
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
                    <span className="text-gray-500 dark:text-gray-400">({room.reviews} reviews)</span>
                  </div>

                  {/* Booking Info */}
                  {bookingData.isFromSearch && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                        <div className="p-3">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Check-in</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {bookingData.checkInDate ? formatDateSafe(bookingData.checkInDate, { month: 'short', day: 'numeric' }) : 'Select date'}
                          </p>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Check-out</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {bookingData.checkOutDate ? formatDateSafe(bookingData.checkOutDate, { month: 'short', day: 'numeric' }) : 'Select date'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Guests</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {bookingData.guests ? `${bookingData.guests.adults + (bookingData.guests.children || 0)} guests` : 'Select guests'}
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
                    disabled={isLoadingWishlist}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                        room={{
                          ...recRoom,
                          uuid_id: recRoom.id,
                        }}
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

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-40">
        <div className="flex flex-col items-center gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{room.price}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {room.pricePerNight}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{room.rating}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-xs text-brand-primary font-medium">₱500 down payment</span>
          </div>
          <button
            onClick={handleBookNow}
            className="w-1/2 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold rounded-lg shadow-md"
          >
            Book
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
