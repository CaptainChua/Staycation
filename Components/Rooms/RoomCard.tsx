"use client";

import { Star, Video, X, Heart, Sparkles } from "lucide-react";
import RoomImageGallery from "./RoomImageGallery";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  youtubeUrl?: string;
}
interface RoomCardsProps {
  room: Room;
  mode?: "select" | "browse"; // 'select' for filtered search, 'browse' for homepage
  compact?: boolean; // Optional compact mode for smaller card display
}
const RoomCard = ({ room, mode = "browse", compact = false }: RoomCardsProps) => {

  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleSelect = () => {
    // Navigate to room details for booking
    router.push(`/rooms/${room.id}`);
  };

  const handleImageClick = () => {
    // Navigate to room details when image is clicked
    router.push(`/rooms/${room.id}`);
  };

  const handleVideoClick = () => {
    // Open video modal
    if (room.youtubeUrl) {
      setIsVideoModalOpen(true);
    }
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="group cursor-pointer">
      {/* Image Gallery - Clickable with Airbnb-style rounded corners */}
      <div onClick={handleImageClick} className="relative overflow-hidden rounded-xl mb-3">
        <RoomImageGallery images={room.images} />

        {/* Heart icon - top left */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 left-3 p-2 rounded-full bg-black/60 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-black/80 dark:hover:bg-gray-800 transition-all duration-200 shadow-lg"
        >
          <Heart
            className={`w-5 h-5 transition-all duration-200 ${
              isFavorite
                ? "fill-red-500 text-red-500"
                : "text-white"
            }`}
          />
        </button>

        {/* Video button overlay - shows on hover */}
        {room.youtubeUrl && mode === "browse" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVideoClick();
            }}
            className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5"
          >
            <Video className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tour</span>
          </button>
        )}
      </div>

      {/* Content - Minimal style with only name, price, and rating */}
      <div className="space-y-1.5" onClick={handleImageClick}>
        {/* Room Name */}
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 truncate">
          {room.name}
        </h3>

        {/* Tower and Floor */}
        {(room.tower || room.floor) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {room.tower && room.floor
              ? `${room.tower} · Floor ${room.floor}`
              : room.tower
              ? room.tower
              : `Floor ${room.floor}`
            }
          </p>
        )}

        {/* Rating and Price Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Star Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-gray-700 text-gray-700 dark:fill-gray-300 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {room.rating.toFixed(1)}
            </span>
          </div>

          {/* Price Per Night with Special Offer Icon */}
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary dark:text-brand-primary" />
            <p className="text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{room.price}</span>
              <span className="text-gray-600 dark:text-gray-400 font-normal"> {room.pricePerNight}</span>
            </p>
          </div>
        </div>

        {/* Action Button - Only for select mode */}
        {mode === "select" && (
          <div className="pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelect();
              }}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-primaryDark hover:from-brand-primaryDark hover:to-brand-primary text-white font-semibold px-4 py-2.5 rounded-lg transition-all duration-300"
            >
              Reserve
            </button>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && room.youtubeUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeVideoModal}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeVideoModal}
              className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video Title */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Video className="w-5 h-5" />
                {room.name} - Virtual Tour
              </h3>
            </div>

            {/* YouTube Video Embed */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(room.youtubeUrl)}?autoplay=1`}
                title={`${room.name} Video Tour`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomCard;