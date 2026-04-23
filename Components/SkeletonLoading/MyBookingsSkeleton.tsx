'use client';

const MyBookingsSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Hero Section Skeleton */}
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full mb-6 animate-pulse"></div>
          <div className="h-12 w-64 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 w-96 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto animate-pulse"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          <div className="flex gap-4 sm:gap-8 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4, 5].map((tab) => (
              <div key={tab} className="h-10 w-20 sm:w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Booking Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((booking) => (
            <div key={booking} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Booking Header Skeleton */}
              <div className="p-3 sm:p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Room Image Skeleton */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse flex-shrink-0"></div>
                  
                  {/* Booking Info Skeleton */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Quick Info Skeleton */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expanded Details Skeleton */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Room Details Skeleton */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Contact Info Skeleton */}
                  <div className="space-y-3">
                    <div className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                      <div className="h-4 w-36 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons Skeleton */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="h-9 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  <div className="h-9 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  <div className="h-9 w-28 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsSkeleton;
