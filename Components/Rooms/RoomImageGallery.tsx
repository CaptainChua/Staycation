"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useCallback, useEffect, useRef } from "react";

interface RoomImageGalleryProps {
  images: string[];
  hoverInterval?: number; // interval in milliseconds for cycling images on hover
}

const RoomImageGallery = ({ images, hoverInterval = 1500 }: RoomImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false); // Track when hovering on nav buttons
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out failed images
  const validImages = images.filter((_, index) => !failedImages.has(index));
  
  // If no valid images, show fallback
  if (validImages.length === 0) {
    return (
      <div className="relative w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No images available</p>
        </div>
      </div>
    );
  }

  const nextImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1
    );
  }, [validImages.length]);

  // Continuously cycle images while hovering (but not when hovering on nav buttons)
  useEffect(() => {
    if (isHovered && !isNavHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, hoverInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHovered, isNavHovered, images.length, hoverInterval]);

  return (
    <div
      className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images Slider */}
      <div className="relative w-full h-full overflow-hidden">
        {validImages.map((image, originalIndex) => {
          const actualIndex = images.indexOf(image);
          return (
            <div
              key={actualIndex}
              className={`w-full h-full flex-shrink-0 relative ${
                currentImageIndex === originalIndex ? 'block' : 'hidden'
              }`}
            >
              <Image
                src={image}
                alt={`Room ${actualIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', image);
                  setFailedImages(prev => new Set(prev).add(actualIndex));
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', image);
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Navigations Arrows */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={prevImage}
            onMouseEnter={() => setIsNavHovered(true)}
            onMouseLeave={() => setIsNavHovered(false)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextImage}
            onMouseEnter={() => setIsNavHovered(true)}
            onMouseLeave={() => setIsNavHovered(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Image Indicators */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2"
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
      >
        {validImages.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(index);
            }}
            className={`rounded-full transition-all duration-300 shadow-lg ${
              index === currentImageIndex
                ? "bg-brand-primary w-6 h-2"
                : "bg-white/60 hover:bg-white w-2 h-2"
            }`}
            style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)' }}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter */}
      <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
        {currentImageIndex + 1} / {validImages.length}
      </div>
    </div>
  );
};

export default RoomImageGallery;
