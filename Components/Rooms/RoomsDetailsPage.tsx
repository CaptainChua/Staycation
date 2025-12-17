"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Home,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
  X,
  Play,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { setSelectedRoom } from "@/redux/slices/bookingSlice";
import AmenityBadge from "./AmenityBadge";

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
}

const RoomsDetailsPage = ({ room, onBack }: RoomsDetailsPageProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Living Area");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [showAllPhotos, setShowAllPhotos] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Rooms
          </button>
          <div className="flex items-center gap-2 text-gray-600">
            <Home className="w-4 h-5" />
            <span>Room Details</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column Images */}
          <div className="lg:col-span-2 animate-fade-in slide-in-from-left duration-500">
            {/* Main Image */}
            <div className="relative w-full h-96 sm:h-[500px] bg-gray-200 rounded-lg overflow-hidden mb-4 group">
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
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentImageIndex
                      ? "border-orange-500 scale-105"
                      : "border-gray-300 hover:border-orange-300"
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
            <div
              className="mt-8 bg-white rounded-lg p-6 shadow-md animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: "100ms" }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                About This Room
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                {room.fullDescription || room.description}
              </p>
              <p className="text-gray-600">
                Experience ultimate comfort and luxury in this beautifully
                designed room. Perfect for both business and leisure travelers,
                this room offers everything you need for a memorable stay.
              </p>
            </div>

            {/* Amenities Section */}
            <div
              className="mt-8 bg-white rounded-lg p-6 shadow-md animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: "200ms" }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Room Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenities.map((amenity, index) => (
                  <AmenityBadge key={index} amenity={amenity} />
                ))}
              </div>
            </div>

            {/* Photo Tour Section */}
            {photoTour && (
              <div
                className="mt-8 bg-white rounded-lg p-6 shadow-md animate-in fade-in slide-in-from-bottom duration-500"
                style={{ animationDelay: "250ms" }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Photo Tour
                </h2>
                <p className="text-gray-600 mb-6">
                  Explore every corner of this haven
                </p>

                {/* Tab navigation */}
                <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                  {photoTourCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                        activeCategory === category
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                            className="relative break-inside-avoid mb-4 rounded-lg overflow-hidden cursor-pointer group"
                          >
                            <Image
                              src={photo}
                              alt={`${activeCategory} ${index + 1}`}
                              width={400}
                              height={Math.floor(Math.random() * 200) + 250}
                              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                          </div>
                        ))}
                      </div>

                      {hasMore && !showAllPhotos && (
                        <div className="text-center mt-6">
                          <button
                            onClick={() => setShowAllPhotos(true)}
                            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                          >
                            View All {photos.length} Photos
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No photos available for this category
                    </div>
                  );
                })()}
              </div>
            )}

            {/* YouTube Video */}
            {room.youtubeUrl && (
              <div
                className="mt-8 bg-white rounded-lg p-6 shadow-md animate-in fade-in slide-in-from-bottom duration-500"
                style={{ animationDelay: "300ms" }}
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Play className="w-6 h-6 text-orange-600" />
                  Video Tour
                </h2>
                <p className="text-gray-600 mb-6">
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
          </div>

          {/* Right Column */}
          <div className="animate-fade-in slide-in-from-right duration-500">
            {/* Price & Booking Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 sticky top-24">
              <div className="flex items-start gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`w-5 h-5 ${
                        index < Math.floor(room.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-800"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {room.rating} ({room.reviews} reviews)
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-6">
                {room.name}
              </h1>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Starting from</p>
                <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-500 mb-1">
                  {room.price}
                </p>
                <p className="text-sm text-gray-600">{room.pricePerNight}</p>
              </div>

              <div className="mb-4 pb-4 border-b border-gray-200 space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">
                    Up to {room.capacity} guests
                  </span>
                </div>
                {room.beds && (
                  <div className="flex items-center gap-3">
                    <Home className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">{room.roomSize}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-xl"
                >
                  Book Now
                </button>
                <button className="w-full border-2 border-gray-300 hover:border-orange-500 text-gray-800 hover:text-orange-600 font-semibold py-3 rounded-lg transition-all duration-300">
                  Add to Wishlist
                </button>
              </div>
            </div>
          </div>
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
    </div>
  );
};

export default RoomsDetailsPage;
