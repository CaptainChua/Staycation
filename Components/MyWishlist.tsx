"use client";

import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  useGetUserWishlistQuery,
  useRemoveFromWishlistMutation,
} from "@/redux/api/wishlistApi";
import SidebarLayout from "@/Components/SidebarLayout";
import RoomCardSkeleton from "@/Components/Rooms/RoomCardSkeleton";
import RoomCard from "@/Components/Rooms/RoomCard";
import { useState, useEffect } from "react";
import { getGuestIdentifier, getOrCreateGuestIdentifier } from "../lib/guest";

interface WishlistItem {
  id: string;
  room_name: string;
  images?: string[];
  tower?: string;
  price: number;
  haven_id: string;
}

interface MyWishlistPageProps {
  initialData: {
    success: boolean;
    data: WishlistItem[];
  };
  userId?: string;
}

const MyWishlistPage = ({ initialData, userId }: MyWishlistPageProps) => {
  // Client-side user identifier (supports guest users)
  const [clientUserId, setClientUserId] = useState<string>(userId || "");
  useEffect(() => {
    // If a logged-in user id is available, set it asynchronously to avoid synchronous setState in effect
    if (userId) {
      Promise.resolve().then(() => setClientUserId(userId));
      return;
    }

    // For guests: try to read an existing guest identifier (no side-effects)
    const guest = getGuestIdentifier();
    if (guest) {
      Promise.resolve().then(() => setClientUserId(guest));
      return;
    }

    // No guest token yet - create one client-side and set it in a microtask
    Promise.resolve().then(() => {
      const created = getOrCreateGuestIdentifier(0);
      if (created) setClientUserId(created);
    });
  }, [userId]);

  // RTK Query hooks (skip until we have a client-side identifier)
  const {
    data: wishlistData,
    isLoading,
    refetch,
  } = useGetUserWishlistQuery(clientUserId, { skip: !clientUserId });
  const [removeFromWishlist, { isLoading: isRemoving }] =
    useRemoveFromWishlistMutation();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const ROOMS_PER_PAGE = 5;

  // Set responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Use SSR data if RTK Query hasn't loaded yet, otherwise use RTK Query data
  const wishlistItems = wishlistData?.data || initialData?.data || [];

  // Pagination logic
  const totalRooms = wishlistItems.length;
  const totalPages = Math.ceil(totalRooms / ROOMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
  const endIndex = startIndex + ROOMS_PER_PAGE;
  const displayedRooms = wishlistItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    try {
      await removeFromWishlist(wishlistId).unwrap();
      toast.success("Removed from wishlist");
      refetch(); // Refetch the wishlist
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  };

  return (
    <SidebarLayout>
      <Toaster position="top-center" />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <Heart className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">My Wishlist</h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            View and manage your saved staycation havens
          </p>
        </div>
      </div>

      {/* Guest Banner (when using guest session) */}
      {!userId && clientUserId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="rounded-lg p-3 bg-yellow-50 border border-yellow-200 text-yellow-900 flex items-center justify-between">
            <div className="text-sm">
              <strong className="font-medium">
                You are browsing as a guest.
              </strong>{" "}
              Your wishlist is stored only in this browser. Sign in to save
              &amp; sync across devices.
            </div>
            <div>
              <Link href="/login?callbackUrl=/my-wishlist">
                <button className="px-3 py-1 bg-yellow-600 text-white rounded">
                  Sign in to sync
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div>
            {/* Mobile Layout Skeleton - Horizontal Scroll */}
            {isMobile ? (
              <div>
                {/* Scroll hint skeleton */}
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                <div className="overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex gap-3" style={{ width: "max-content" }}>
                    {[1, 2, 3, 4, 5].map((skeleton) => (
                      <div key={skeleton} className="flex-shrink-0 w-40">
                        <RoomCardSkeleton compact={false} />
                        <div className="w-full mt-2 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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
                    <div className="w-full mt-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-600 mb-6">
              Start adding havens you love to your wishlist!
            </p>

            {!userId && clientUserId && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-3">
                  You are in a guest session — your wishlist is stored locally
                  in this browser only.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link href="/login?callbackUrl=/my-wishlist">
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-md">
                      Sign in to save &amp; sync
                    </button>
                  </Link>
                </div>
              </div>
            )}

            <Link href="/rooms">
              <button className="px-8 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors">
                Browse Havens
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Layout - Horizontal Scroll */}
            {isMobile ? (
              <div>
                {/* Scroll hint */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  <span>Scroll right to see more rooms</span>
                </p>
                <div className="overflow-x-auto pb-2 -mx-4 px-4">
                  <div className="flex gap-3" style={{ width: "max-content" }}>
                    {displayedRooms.map((item: WishlistItem) => (
                      <div key={item.id} className="flex-shrink-0 w-40">
                        <RoomCard
                          room={{
                            id: item.haven_id,
                            uuid_id: item.haven_id,
                            name: item.room_name,
                            price: `₱${item.price}`,
                            pricePerNight: "per night",
                            images: item.images || [],
                            rating: 4.5,
                            reviews: 0,
                            capacity: 2,
                            amenities: [],
                            description: "",
                            tower: item.tower,
                            floor: "",
                            roomSize: "",
                            location: item.tower || "Quezon City",
                            youtubeUrl: "",
                          }}
                          mode="browse"
                          compact={false}
                        />
                        <button
                          onClick={() => handleRemoveFromWishlist(item.id)}
                          disabled={isRemoving}
                          className="w-full mt-2 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {displayedRooms.map((item: WishlistItem) => (
                  <div key={item.id}>
                    <RoomCard
                      room={{
                        id: item.haven_id,
                        uuid_id: item.haven_id,
                        name: item.room_name,
                        price: `₱${item.price}`,
                        pricePerNight: "per 6 hours",
                        images: item.images || [],
                        rating: 4.5,
                        reviews: 0,
                        capacity: 2,
                        amenities: [],
                        description: "",
                        tower: item.tower,
                        floor: "",
                        roomSize: "",
                        location: item.tower || "Quezon City",
                        youtubeUrl: "",
                      }}
                      mode="browse"
                      compact={false}
                    />
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      disabled={isRemoving}
                      className="w-full mt-2 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      Remove from Wishlist
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Global Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    currentPage === 1
                      ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                      : "bg-brand-primary hover:bg-brand-primaryDark"
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft
                    className={`w-5 h-5 ${
                      currentPage === 1
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-white"
                    }`}
                  />
                </button>

                {/* Page Dots */}
                <div className="flex gap-2 items-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`transition-all duration-200 rounded-full ${
                          currentPage === pageNum
                            ? "w-8 h-3 bg-brand-primary"
                            : "w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-brand-primary/50 dark:hover:bg-brand-primary/50"
                        }`}
                        aria-label={`Go to page ${pageNum}`}
                      />
                    ),
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    currentPage === totalPages
                      ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50"
                      : "bg-brand-primary hover:bg-brand-primaryDark"
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight
                    className={`w-5 h-5 ${
                      currentPage === totalPages
                        ? "text-gray-400 dark:text-gray-500"
                        : "text-white"
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
};

export default MyWishlistPage;
