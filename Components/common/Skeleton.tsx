interface SkeletonProps {
  className?: string;
  label?: string;
}

const Skeleton = ({ className = "", label }: SkeletonProps) => (
  <div
    role="status"
    aria-label={label ?? "Loading..."}
    className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
  />
);

export default Skeleton;