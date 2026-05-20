"use client";

import React from "react";

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
