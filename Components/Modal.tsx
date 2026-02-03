'use client';

import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer: React.ReactNode;
    size?: "sm" | "md" | "lg";
}
const Modal = ({ isOpen, onClose, title, children, footer, size = "md"}: ModalProps) => {

    if (!isOpen) return null;

    const sizeClass = size === "sm"
        ? "max-w-md"
        : size === "lg"
        ? "max-w-3xl"
        : "max-w-2xl"

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full ${sizeClass} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-700 dark:text-gray-300">{children}</div>

        {/* Footer */}
        {footer && <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export default Modal