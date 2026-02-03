"use client";

import { Star, Video, X, Heart, Sparkles, MapPin, Tag } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAddToWishlistMutation, useRemoveFromWishlistMutation, useCheckWishlistStatusQuery } from "@/redux/api/wishlistApi";
import toast from "react-hot-toast";

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
  originalPrice?: string; // Original price before discount
  discountPercentage?: number; // Discount percentage (e.g., 20 for 20% off)
}
interface RoomCardsProps {
  room: Room & { uuid_id?: string }; // Add uuid_id for wishlist
  mode?: "select" | "browse"; // 'select' for filtered search, 'browse' for homepage
  compact?: boolean; // Optional compact mode for smaller card display
}
const RoomCard = ({ room, mode = "browse", compact = false }: RoomCardsProps) => {
  const router = useRouter();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  // Wishlist mutations and queries
  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation();

  // Check if this room is in user's wishlist
  const { data: wishlistStatus, isLoading: isCheckingWishlist, error: wishlistError, refetch: refetchWishlistStatus } = useCheckWishlistStatusQuery(
    { userId: userId || '', havenId: room.uuid_id || room.id },
    { 
      skip: !userId || !(room.uuid_id || room.id),
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true
    }
  );

  // Local state for optimistic updates
  const [optimisticFavorite, setOptimisticFavorite] = useState(false);
  const isFavorite = wishlistStatus?.isInWishlist || optimisticFavorite;
  
  // Disable wishlist functionality if API is not available
  const isWishlistDisabled = !!wishlistError && 'status' in wishlistError && wishlistError.status === 404;

  // Sync optimistic state with actual wishlist status when data loads
  useEffect(() => {
    if (wishlistStatus?.isInWishlist !== undefined) {
      setOptimisticFavorite(false); // Reset optimistic state when real data arrives
    }
  }, [wishlistStatus?.isInWishlist]);

  // Handle wishlist errors - log only, no toast notifications
  useEffect(() => {
    if (wishlistError) {
      console.error('Wishlist API Error:', wishlistError);
      // No toast notification - handle errors silently
    }
  }, [wishlistError]);

  const handleSelect = () => {
    // Navigate to room details for booking
    router.push(`/rooms/${room.id}`);
  };

  const handleImageClick = () => {
    // Navigate to room details when image is clicked
    router.push(`/rooms/${room.id}`);
  };

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!userId) {
      toast.error("Please login to add to wishlist");
      router.push('/login');
      return;
    }

    const roomId = room.uuid_id || room.id;
    if (!roomId) {
      toast.error("Room ID not found");
      console.error("Room data:", room);
      return;
    }

    // Optimistic update - instantly change heart color
    const newFavoriteState = !isFavorite;
    setOptimisticFavorite(newFavoriteState);

    try {
      if (newFavoriteState) {
        // Add to wishlist
        await addToWishlist({
          user_id: userId,
          haven_id: roomId
        }).unwrap();
        toast.success("Added to wishlist");
        // Force refetch to update UI immediately
        refetchWishlistStatus();
      } else {
        // Remove from wishlist
        const wishlistId = wishlistStatus?.wishlistId;
        if (wishlistId) {
          await removeFromWishlist(wishlistId).unwrap();
          toast.success("Removed from wishlist");
          // Force refetch to update UI immediately
          refetchWishlistStatus();
        } else {
          toast.error("Wishlist item not found");
          // Revert optimistic update on error
          setOptimisticFavorite(!newFavoriteState);
        }
      }
    } catch (error: any) {
      console.error('Wishlist error:', error);
      toast.error(error?.data?.message || "Failed to update wishlist");
      // Revert optimistic update on error
      setOptimisticFavorite(!newFavoriteState);
    }
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
    <div className="group cursor-pointer flex flex-col h-full">
      {/* Single Image - Clickable with Airbnb-style rounded corners */}
      <div onClick={handleImageClick} className="relative overflow-hidden rounded-xl mb-3 flex-shrink-0 w-full h-40 sm:h-48 bg-gray-200 dark:bg-gray-700">
        {room.images && room.images.length > 0 ? (
          <Image
            src={room.images[0]}
            alt={room.name}
            fill
            className="object-cover w-full h-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">No image</span>
          </div>
        )}

        {/* Discount Badge - Top Right Corner */}
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
          {room.discountPercentage && room.discountPercentage > 0
            ? `-${room.discountPercentage}% OFF`
            : '-15% OFF'}
        </div>

        {/* Heart icon - top left */}
        <button
          onClick={handleHeartClick}
          disabled={isAdding || isRemoving || isCheckingWishlist || isWishlistDisabled}
          className="absolute top-3 left-3 p-2 rounded-full bg-black/60 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-black/80 dark:hover:bg-gray-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          title={isWishlistDisabled ? "Wishlist feature temporarily unavailable" : userId ? "Add to wishlist" : "Login to add to wishlist"}
        >
          {isAdding || isRemoving || isCheckingWishlist ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-white"
              }`}
            />
          )}
        </button>

        {/* Video button overlay - shows on hover */}
        {room.youtubeUrl && mode === "browse" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleVideoClick();
            }}
            className="absolute bottom-3 right-3 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 shadow-lg hover:scale-105"
          >
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary" />
            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Video Tour</span>
          </button>
        )}
      </div>

      {/* Content - Clean structure */}
      <div className="flex flex-col flex-grow space-y-2" onClick={handleImageClick}>
        {/* Price Section - Current price with original price next to it */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {/* Current Price with Original Price */}
            <div className="flex items-center gap-2">
              <div className="text-lg sm:text-xl font-bold text-brand-primary">
                {room.price}
              </div>
              {room.originalPrice && room.discountPercentage && room.discountPercentage > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-brand-primary flex-shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                    {room.originalPrice}
                  </span>
                </div>
              )}
            </div>
            {/* Per Night Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {room.pricePerNight}
            </p>
          </div>

          {/* Savings Amount */}
          <div className="text-right flex flex-col items-end justify-center bg-green-50 dark:bg-green-900/20 px-2.5 py-2 rounded-lg">
            <div className="text-xs font-semibold text-green-600 dark:text-green-400">
              Save
            </div>
            <div className="text-sm font-bold text-green-600 dark:text-green-400">
              ₱{room.originalPrice && room.discountPercentage && room.discountPercentage > 0
                ? (
                    (parseFloat(room.originalPrice.replace('₱', '').replace(/,/g, '')) -
                     parseFloat(room.price.replace('₱', '').replace(/,/g, '')))
                  ).toLocaleString('en-PH')
                : '525'}
            </div>
          </div>
        </div>

        {/* Room Name */}
        <div className="flex-grow">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate leading-tight">
            {room.name}
          </h3>
        </div>

        {/* Location and Reviews in one row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{room.tower || room.floor ? `${room.tower || ''}${room.tower && room.floor ? ', ' : ''}${room.floor || ''}` : 'Location'}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-brand-primary text-brand-primary" />
            <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
              {room.rating.toFixed(1)}
            </span>
            {room.reviews > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({room.reviews})
              </span>
            )}
          </div>
        </div>

        {/* Quick Info Badges */}
        <div className="flex gap-1 overflow-x-auto pt-1">
          {room.youtubeUrl && (
            <div className="bg-brand-primary/10 text-brand-primary text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
              Video Tour
            </div>
          )}
          {room.amenities && room.amenities.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
              {room.amenities.length} amenities
            </div>
          )}
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
              Reserve Now
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