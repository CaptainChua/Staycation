'use client';

const BookingDetailsSkeleton = () => {
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
        {/* Status Badge with Back Button Skeleton */}
        <div className="flex items-center justify-between py-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
          </div>
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
        </div>

        {/* Room Info with Image Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Image Skeleton */}
              <div className="relative h-64 lg:h-80 bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
              
              {/* Room Info Skeleton */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 animate-pulse"></div>
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg mb-1 animate-pulse"></div>
                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                
                {/* Quick Info Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="text-center">
                      <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-1 animate-pulse"></div>
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto mb-1 animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stay Details Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Info Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex justify-between">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Add-ons Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((item) => (
              <div key={item} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-12 w-40 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
          <div className="h-12 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsSkeleton;
