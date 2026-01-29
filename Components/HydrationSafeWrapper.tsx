"use client";

import { useEffect, useState } from 'react';

interface HydrationSafeWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wrapper component to prevent hydration mismatches caused by browser extensions
 * or client-side only attributes that differ from server-rendered HTML
 */
const HydrationSafeWrapper: React.FC<HydrationSafeWrapperProps> = ({ 
  children, 
  fallback = null 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Return fallback during SSR, actual children after hydration
  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default HydrationSafeWrapper;
