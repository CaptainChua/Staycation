import RoomCardSkeleton from "@/Components/Rooms/RoomCardSkeleton";

export default function RoomsLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* SearchBar Skeleton */}
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[150px] sm:pt-[230px] md:pt-[250px] lg:pt-[270px] bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Welcome Section Skeleton */}
          <div className="mb-2 sm:mb-8 text-center">
            <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mx-auto animate-pulse"></div>
          </div>

          {/* Room Listings Skeleton */}
          <div className="py-6 sm:py-8">
            <div className="space-y-12">
              {[1, 2, 3].map((havenGroup) => (
                <div key={havenGroup}>
                  {/* Haven Header Skeleton */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="h-7 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  </div>

                  {/* Desktop Layout Skeleton */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((skeleton) => (
                      <div key={skeleton}>
                        <RoomCardSkeleton compact={false} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
