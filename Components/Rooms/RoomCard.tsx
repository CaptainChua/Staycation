"use client";

import { Star, Video, X, Heart, MapPin, Tag, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAddToWishlistMutation, useRemoveFromWishlistMutation, useCheckWishlistStatusQuery } from "@/redux/api/wishlistApi";
import { useRoomDiscounts } from "@/hooks/useRoomDiscounts";
import toast from "react-hot-toast";
import { ensureGuestToken, getGuestIdentifier } from "@/lib/guest";

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
const RoomCard = ({
  room,
  mode = "browse",
  compact: _compact = false,
}: RoomCardsProps) => {
  const router = useRouter();
  void _compact;
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  // Wishlist mutations and queries
  const [addToWishlist, { isLoading: isAdding }] = useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: isRemoving }] =
    useRemoveFromWishlistMutation();

  // Check if this room is in user's wishlist (supports guest users)
  const [userIdentifier, setUserIdentifier] = useState<string>(
    () => userId || getGuestIdentifier() || "",
  );
  useEffect(() => {
    if (!userId) return;
    // Sync the identifier only when a logged-in user id becomes available.
    // Schedule the update asynchronously to avoid cascading renders.
    Promise.resolve().then(() => {
      setUserIdentifier((prev) => (prev === userId ? prev : userId));
    });
  }, [userId]);
  const {
    data: wishlistStatus,
    isLoading: isCheckingWishlist,
    error: wishlistError,
    refetch: refetchWishlistStatus,
  } = useCheckWishlistStatusQuery(
    { userId: userIdentifier, havenId: room.uuid_id || room.id },
    {
      skip: !userIdentifier || !(room.uuid_id || room.id),
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
    },
  );

  // Local state for optimistic updates
  const [optimisticFavorite, setOptimisticFavorite] = useState(false);
  const isFavorite = wishlistStatus?.isInWishlist || optimisticFavorite;

  // Disable wishlist functionality if API is not available
  const isWishlistDisabled =
    !!wishlistError &&
    "status" in wishlistError &&
    wishlistError.status === 404;

  // Sync optimistic state with actual wishlist status when data loads
  useEffect(() => {
    if (wishlistStatus?.isInWishlist !== undefined) {
      Promise.resolve().then(() => setOptimisticFavorite(false)); // Reset optimistic state when real data arrives
    }
  }, [wishlistStatus?.isInWishlist]);

  // Handle wishlist errors - log only, no toast notifications
  useEffect(() => {
    if (wishlistError) {
      console.error("Wishlist API Error:", wishlistError);
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
        // Add to wishlist (support both logged-in and guest users)
        if (userId) {
          await addToWishlist({
            user_id: userId,
            haven_id: roomId,
          }).unwrap();
        } else {
          // Guest user - ensure a guest token exists and use it
          const guestToken = ensureGuestToken();
          await addToWishlist({
            guest_token: guestToken,
            haven_id: roomId,
          }).unwrap();
          // Ensure hook sees the new guest identifier for subsequent checks
          setUserIdentifier(`guest_${guestToken}`);
        }
        toast.success("Added to wishlist");
        // Force refetch to update UI immediately (hook will refetch on arg change)
        try {
          refetchWishlistStatus();
        } catch {
          /* ignore refetch errors */
        }
      } else {
        // Remove from wishlist
        const wishlistId = wishlistStatus?.wishlistId;
        if (wishlistId) {
          await removeFromWishlist(wishlistId).unwrap();
          toast.success("Removed from wishlist");
          // Force refetch to update UI immediately
          try {
            refetchWishlistStatus();
          } catch {
            /* ignore refetch errors */
          }
        } else {
          toast.error("Wishlist item not found");
          // Revert optimistic update on error
          setOptimisticFavorite(!newFavoriteState);
        }
      }
    } catch (error: unknown) {
      console.error("Wishlist error:", error);
      let errorMessage = "Failed to update wishlist";
      if (typeof error === "object" && error !== null) {
        const e = error as { data?: { message?: string }; message?: string };
        if (e.data?.message) errorMessage = e.data.message;
        else if (e.message) errorMessage = e.message;
      } else {
        errorMessage = String(error);
      }
      toast.error(errorMessage);
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

  // Fetch discounts for this room
  const { data: discountsData, isLoading: isLoadingDiscounts } = useRoomDiscounts(
    room.uuid_id || room.id,
    userId
  );

  // Calculate the best discount for this room
  const bestDiscount = useMemo(() => {
    if (!discountsData?.data || discountsData.data.length === 0) return null;
    
    const basePrice = parseFloat(room.price.replace('₱', '').replace(/,/g, ''));
    
    // Find the discount that gives the best savings
    return discountsData.data.reduce((best, discount) => {
      let savings = 0;
      
      if (discount.discount_type === 'percentage') {
        savings = basePrice * (discount.discount_value / 100);
      } else {
        savings = discount.discount_value;
      }
      
      // Check minimum booking requirement
      if (discount.min_booking_amount && basePrice < discount.min_booking_amount) {
        return best; // Skip this discount
      }
      
      if (!best || savings > best.savings) {
        return { ...discount, savings };
      }
      
      return best;
    }, null as (typeof discountsData.data[0] & { savings?: number }) | null);
  }, [discountsData, room.price]);

  // Calculate discounted price
  const discountedPrice = useMemo(() => {
    if (!bestDiscount) return room.price;
    
    const basePrice = parseFloat(room.price.replace('₱', '').replace(/,/g, ''));
    let finalPrice = basePrice;
    
    if (bestDiscount.discount_type === 'percentage') {
      finalPrice = basePrice * (1 - bestDiscount.discount_value / 100);
    } else {
      finalPrice = Math.max(0, basePrice - bestDiscount.discount_value);
    }
    
    return `₱${finalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, [bestDiscount, room.price]);

  // Calculate original price (show the base price if there's a discount)
  const displayOriginalPrice = bestDiscount ? room.price : undefined;
  const displayCurrentPrice = bestDiscount ? discountedPrice : room.price;
  const displayDiscountPercentage = bestDiscount?.discount_type === 'percentage' ? bestDiscount.discount_value : undefined;

  // Extract YouTube video ID from URL and return a valid embed URL
  const getYouTubeEmbedUrl = (url: string | undefined) => {
    if (!url) return "";

    // Regular expressions for different YouTube URL formats
    const standardRegExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const shortsRegExp = /^.*youtube\.com\/shorts\/([^#&?]*).*/;

    let videoId = null;

    const shortsMatch = url.match(shortsRegExp);
    if (shortsMatch && shortsMatch[1].length === 11) {
      videoId = shortsMatch[1];
    } else {
      const standardMatch = url.match(standardRegExp);
      if (standardMatch && standardMatch[2].length === 11) {
        videoId = standardMatch[2];
      }
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`
      : "";
  };

  return (
    <div className="group cursor-pointer flex flex-col h-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Single Image - Clickable with Airbnb-style rounded corners */}
      <div className="relative">
        <div
          onClick={handleImageClick}
          className="relative overflow-hidden rounded-t-xl mb-0 flex-shrink-0 w-full h-32 sm:h-36 md:h-40 bg-gray-200 dark:bg-gray-700"
        >
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

          {/* Heart icon - top left */}
          <button
            onClick={handleHeartClick}
            disabled={
              isAdding || isRemoving || isCheckingWishlist || isWishlistDisabled
            }
            className="absolute top-3 left-3 p-2 rounded-full bg-black/60 dark:bg-gray-900/80 backdrop-blur-sm hover:bg-black/80 dark:hover:bg-gray-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title={
              isWishlistDisabled
                ? "Wishlist feature temporarily unavailable"
                : userId
                  ? "Add to wishlist"
                  : "Save to this device (guest) - sign in to sync"
            }
          >
            {isAdding || isRemoving || isCheckingWishlist ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-white"
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
              className="absolute top-3 right-3 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5 shadow-lg hover:scale-105"
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary" />
              <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                Video Tour
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Discount Section - Overlap Image and Details */}
      {(bestDiscount || (!discountsData?.data || discountsData.data.length === 0 && !bestDiscount) || isLoadingDiscounts) && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700 -mt-5 mx-3 relative z-10 mb-3 overflow-hidden">
          {isLoadingDiscounts ? (
            <>
              {/* Skeleton for discount badge */}
              <div className="bg-gray-200 dark:bg-gray-700 text-gray-200 text-xs font-bold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap animate-pulse">
                Loading...
              </div>
              {/* Skeleton for discount name */}
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="text-xs font-semibold text-gray-200 dark:text-gray-700 animate-pulse">
                  Loading discount...
                </div>
              </div>
            </>
          ) : bestDiscount ? (
            <>
              <div className="bg-brand-primary dark:bg-brand-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap">
                {bestDiscount.discount_type === 'percentage' 
                  ? `-${bestDiscount.discount_value}% OFF`
                  : `-₱${bestDiscount.discount_value.toLocaleString('en-PH')} OFF`}
              </div>
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-500" style={{animation: 'slideInScale 0.6s ease-out'}} />
                <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  {bestDiscount.name}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-brand-primary/20 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-primary text-xs font-bold px-2.5 py-1 rounded-full shadow-md whitespace-nowrap border border-brand-primary/30 dark:border-brand-primary/40">
                Guest Favorite
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary dark:text-brand-primary" style={{animation: 'slideInScale 0.6s ease-out'}} />
                <div className="text-xs font-semibold text-brand-primary dark:text-brand-primary">
                  Popular Choice
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Content - Clean structure */}
      <div
        className="flex flex-col flex-grow space-y-2 p-3"
        onClick={handleImageClick}
      >
        {/* Price Section - Current price with original price next to it */}
        <div className="flex items-center justify-between gap-2 -mt-3">
          <div className="flex flex-col">
            {/* Current Price with Original Price */}
            <div className="flex items-center gap-2">
              <div className="text-lg sm:text-xl font-bold text-brand-primary">
                {displayCurrentPrice}
                {room.price}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                  {room.originalPrice || "₱3,150"}
                </span>
              </div>
              {displayOriginalPrice && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                    {displayOriginalPrice}
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
          {bestDiscount && (
            <div className="text-right flex flex-col items-end justify-center bg-green-50 dark:bg-green-900/20 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg">
              <div className="text-xs sm:text-xs font-semibold text-green-600 dark:text-green-400">
                Save
              </div>
              <div className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                ₱{bestDiscount.savings?.toLocaleString('en-PH') || '0'}
              </div>
            </div>
          )}
        </div>

        {/* Room Name */}
        <div className="flex-grow">
          <div className="flex items-center gap-1 group/name">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {room.name}
            </h3>
            <ChevronRight className="w-4 h-4 text-brand-primary flex-shrink-0 opacity-0 group-hover/name:opacity-100 transition-all duration-300 -translate-x-2 group-hover/name:translate-x-0" />
          </div>
        </div>

        {/* Location and Reviews in one row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {room.tower || room.floor
                ? `${room.tower || ""}${room.tower && room.floor ? ", " : ""}${room.floor ? `${room.floor} flr` : ""}`
                : "Location"}
            </span>
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
            <div
              className="relative w-full"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={getYouTubeEmbedUrl(room.youtubeUrl)}
                title={`${room.name} Video Tour`}
                frameBorder="0"
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
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
