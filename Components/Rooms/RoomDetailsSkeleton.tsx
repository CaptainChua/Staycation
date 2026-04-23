const RoomDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Main Content with Top Padding for Navbar */}
      <div className="pt-14 sm:pt-16 flex-1">

        {/* Header Bar Skeleton */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 sm:top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse hidden sm:block"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Airbnb-Style Image Gallery Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Desktop: 5-image grid */}
          <div className="hidden md:block relative">
            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] lg:h-[480px] rounded-xl overflow-hidden">
              {/* Main large image */}
              <div className="col-span-2 row-span-2 bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
              {/* 4 smaller images */}
              {[1, 2, 3, 4].map((index) => (
                <div key={index} className="bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
              ))}
            </div>
            {/* Show all photos button skeleton */}
            <div className="absolute bottom-4 right-4 w-36 h-10 bg-white dark:bg-gray-800 rounded-lg animate-pulse"></div>
          </div>

          {/* Mobile: Carousel Skeleton */}
          <div className="md:hidden relative h-72 sm:h-80 rounded-xl overflow-hidden bg-gray-300 dark:bg-gray-700 animate-pulse">
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/50"></div>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 w-20 h-7 bg-white/90 dark:bg-gray-800/90 rounded-lg"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">

            {/* Left Column - Details */}
            <div className="lg:col-span-2">

              {/* Title & Rating Section Skeleton */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse mb-3"></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
              </div>

              {/* Quick Info Bar Skeleton */}
              <div className="py-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                      <div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse mb-1"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs Skeleton */}
              <div className="py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="py-6 space-y-4">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>

              {/* Highlights Skeleton */}
              <div className="py-6 border-t border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse mb-4"></div>
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card (Desktop) Skeleton */}
            <div className="hidden lg:block">
              <div className="sticky top-32">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </div>

                  {/* Book Button Skeleton */}
                  <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse mb-3"></div>

                  {/* Down Payment Info Skeleton */}
                  <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mx-auto animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-48 mx-auto animate-pulse"></div>
                  </div>

                  {/* Wishlist Button Skeleton */}
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar Skeleton */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-40">
        <div className="flex flex-col items-center gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
          <div className="w-1/2 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsSkeleton;
