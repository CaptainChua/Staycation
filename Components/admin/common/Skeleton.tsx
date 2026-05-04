"use client";

import React from "react";

/**
 * Generic Skeleton loader component
 *
 * Usage:
 *   <Skeleton className="h-4 w-40 rounded" />
 *   <Skeleton as="span" className="h-3 w-full rounded" label="Loading tasks" />
 */
type SkeletonProps = {
  className?: string;
  as?: React.ElementType;
  label?: string;
};

export default function Skeleton({
  className = "",
  as: Component = "div",
  label = "Loading",
}: SkeletonProps) {
  return (
    <Component
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`animate-pulse bg-gray-300 dark:bg-gray-700 ${className}`}
    >
      <span className="sr-only">{label}</span>
    </Component>
  );
}
