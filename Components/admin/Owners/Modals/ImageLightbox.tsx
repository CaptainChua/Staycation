'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download, Maximize2 } from "lucide-react";

interface ImageLightboxProps {
  images: Array<{
    image_url: string;
    cloudinary_public_id?: string;
  }>;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Pan state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const positionRef = useRef({ x: 0, y: 0 });

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransform();
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    resetTransform();
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && scale === 1) handlePrev();
      if (e.key === "ArrowRight" && scale === 1) handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, handlePrev, handleNext, scale]);

  // ── Mouse drag ──────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    positionRef.current = { x: newX, y: newY };
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ── Touch drag ──────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1) return;
    const touch = e.touches[0];
    dragStart.current = {
      x: touch.clientX - positionRef.current.x,
      y: touch.clientY - positionRef.current.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current || scale <= 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.current.x;
    const newY = touch.clientY - dragStart.current.y;
    positionRef.current = { x: newX, y: newY };
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    dragStart.current = null;
  };

  // ── Scroll to zoom ───────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((s) => Math.min(4, Math.max(0.5, parseFloat((s + delta).toFixed(2)))));
  };

  // ── Click to zoom toggle ─────────────────────────────────────
  const handleImageClick = () => {
    if (isDragging) return;
    if (scale > 1) {
      resetTransform();
    } else {
      setScale(2);
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const isZoomed = scale > 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center w-full h-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2 backdrop-blur-sm">
          <button
            onClick={() => setScale((s) => Math.max(0.5, parseFloat((s - 0.25).toFixed(2))))}
            className="p-1.5 text-white hover:text-orange-400 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[3rem] text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(4, parseFloat((s + 0.25).toFixed(2))))}
            className="p-1.5 text-white hover:text-orange-400 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="w-px h-5 bg-white/30 mx-1" />
          <button
            onClick={() => setRotation((r) => r + 90)}
            className="p-1.5 text-white hover:text-orange-400 transition-colors"
            title="Rotate"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <div className="w-px h-5 bg-white/30 mx-1" />
          <button
            onClick={resetTransform}
            className="p-1.5 text-white hover:text-orange-400 transition-colors"
            title="Reset view"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <div className="w-px h-5 bg-white/30 mx-1" />
          <a
            href={currentImage.image_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-white hover:text-orange-400 transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm select-none">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Hint text */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-white/40 text-xs select-none pointer-events-none whitespace-nowrap">
          {isZoomed
            ? "Drag to pan · Scroll to zoom · Click to reset"
            : "Click or scroll to zoom · Drag after zooming"}
        </div>

        {/* Main image area */}
        <div
          className="flex-1 flex items-center justify-center w-full overflow-hidden mt-14 mb-20"
          onWheel={handleWheel}
        >
          <img
            src={currentImage.image_url}
            alt={`Report image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "zoom-in",
              transition: isDragging ? "none" : "transform 0.15s ease",
              willChange: "transform",
            }}
            draggable={false}
            onClick={handleImageClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Prev / Next — only shown when not zoomed in */}
        {images.length > 1 && !isZoomed && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded-xl px-3 py-2 backdrop-blur-sm max-w-[90vw] overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  idx === currentIndex
                    ? "border-orange-400"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img.image_url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageLightbox;