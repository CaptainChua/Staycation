'use client';

import { X, AlertCircle } from "lucide-react";
import { useEffect, useState, useTransition, useRef } from "react";

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const ValidationModal = ({ isOpen, onClose, message }: ValidationModalProps) => {
  const [, startTransition] = useTransition();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isOpen) {
      startTransition(() => {
        setShouldRender(true);
      });

      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);

        startTransition(() => {
          setShouldRender(false);
        });
      }, 300);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, startTransition]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto transform transition-all duration-300 ${
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-gray-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-2xl" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  Incomplete Information
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
                       text-white font-semibold py-3 rounded-lg
                       active:scale-[0.98] shadow-md hover:shadow-lg
                       text-sm sm:text-base transition-all duration-200"
            >
              OK, Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ValidationModal;
