"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SubModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onSave?: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  children: ReactNode;
  maxWidth?: string; // e.g., "max-w-2xl"
}

const SubModalWrapper = ({
  isOpen,
  onClose,
  title,
  subtitle,
  onSave,
  isSaving = false,
  saveLabel = "Save Changes",
  children,
  maxWidth = "max-w-2xl",
}: SubModalWrapperProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const content = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[10000] backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4 pointer-events-none">
        <div 
          className={`bg-white rounded-2xl w-full ${maxWidth} shadow-2xl flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200`}
          style={{ maxHeight: 'calc(100vh - 4rem)' }}
        >
          {/* Header - System Gold Theme */}
          <div className="flex justify-between items-center p-6 border-b border-brand-primary/20 bg-brand-primary text-white rounded-t-2xl flex-shrink-0 shadow-sm">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              {subtitle && <p className="text-sm opacity-90 mt-1">{subtitle}</p>}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              disabled={isSaving}
            >
              Cancel
            </button>
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`
                  px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2
                  ${isSaving 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-brand-primary hover:bg-[#b57603] hover:shadow-lg transform active:scale-95'}
                `}
              >
                {isSaving ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isSaving ? "Saving..." : saveLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default SubModalWrapper;