const RoomDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Back Button Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-400 dark:bg-gray-600 rounded"></div>
          </div>
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery Skeleton */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative h-[400px] bg-gray-300 dark:bg-gray-700 rounded-xl overflow-hidden animate-pulse">
                {/* Image overlay elements */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full animate-pulse"></div>
                  <div className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Thumbnail Images */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse relative">
                    <div className="absolute inset-0 bg-gray-400 dark:bg-gray-600 opacity-20 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Information */}
            <div className="space-y-6">
              {/* Title and Location */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/5 animate-pulse"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>

              {/* Room Features Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: 'users', label: 'Guests' },
                  { icon: 'bed', label: 'Bed' },
                  { icon: 'ruler', label: 'Size' },
                  { icon: 'home', label: 'Type' }
                ].map((feature, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                      <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking and Map */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6 sticky top-4">
              {/* Price Section */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
              </div>

              {/* Date Pickers */}
              <div className="space-y-3">
                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>

              {/* Guest Selector */}
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>

              {/* Book Button */}
              <div className="h-14 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"></div>

              {/* Features List */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Skeleton */}
            <div className="h-[300px] bg-gray-300 dark:bg-gray-700 rounded-xl overflow-hidden animate-pulse relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              {/* Map controls */}
              <div className="absolute top-4 right-4 space-y-2">
                <div className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded animate-pulse"></div>
                <div className="w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Host Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse relative">
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsSkeleton;
