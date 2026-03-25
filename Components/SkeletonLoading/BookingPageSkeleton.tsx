'use client';

interface BookingPageSkeletonProps {
  entriesPerPage?: number;
}

const BookingPageSkeleton = ({ entriesPerPage = 5 }: BookingPageSkeletonProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-600 rounded-lg mb-2 animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-600 text-white rounded-lg p-6 shadow dark:shadow-gray-900 animate-pulse border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-500 rounded mb-2"></div>
                <div className="h-8 w-16 bg-gray-300 dark:bg-gray-500 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Guide Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
          <div className="flex gap-1">
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded-full mt-1 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded mb-1 animate-pulse"></div>
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Manage Bookings Guide Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
          <div className="flex gap-1">
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-1 animate-pulse"></div>
                <div className="h-3 w-36 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter Bar Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="w-full h-10 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-10 w-16 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton - Desktop View */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700 hidden lg:flex">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <th key={i} className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: entriesPerPage }).map((_, idx) => (
                <tr
                  key={`skeleton-${idx}`}
                  className="border-b border-gray-100 dark:border-gray-700 animate-pulse"
                >
                  <td className="py-4 px-4">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-2 min-w-[200px]">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-36"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-8 mx-auto"></div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-full w-20 mx-auto"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 ml-auto"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 ml-auto"></div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Card View Skeleton */}
      <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-4 flex-1 flex flex-col min-h-0">
        {Array.from({ length: entriesPerPage }).map((_, idx) => (
          <div
            key={`mobile-skeleton-${idx}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
            </div>

            {/* Guest Info */}
            <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
              </div>
              <div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
              </div>
              <div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
              </div>
            </div>

            {/* Total and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-9 w-9 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-9 w-9 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPageSkeleton;
