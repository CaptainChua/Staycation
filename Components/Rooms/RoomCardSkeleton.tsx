const RoomCardSkeleton = ({ compact = false }: { compact?: boolean }) => {
  return (
    <div className="group cursor-pointer animate-pulse">
      {/* Image Skeleton */}
      <div className={`bg-gray-300 dark:bg-gray-700 rounded-xl mb-3 ${compact ? 'h-32' : 'h-48'}`}></div>

      {/* Content Skeleton */}
      <div className="space-y-2">
        {/* Location and Name */}
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>

        {/* Rating */}
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>

        {/* Price */}
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mt-2"></div>
      </div>
    </div>
  );
};

export default RoomCardSkeleton;
