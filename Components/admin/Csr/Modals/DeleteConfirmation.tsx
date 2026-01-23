"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationProps {
  itemName: string;
  itemId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
  error?: string | null;
  success?: string | null;
}

export default function DeleteConfirmation({
  itemName,
  itemId,
  onConfirm,
  onCancel,
  isDeleting = false,
  error = null,
  success = null,
}: DeleteConfirmationProps) {
  const [isMounted] = useState(true);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={() => {
          if (isDeleting) return;
          onCancel();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999] pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-md overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Confirm Deletion
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="px-8 py-6 space-y-4">
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Warning:</strong> You are about to permanently delete
                this inventory item.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">
                  Item Name:
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {itemName}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">
                  Item ID:
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {itemId}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this item? This will permanently
              remove it from the inventory system.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 px-8 py-5 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-2">
                {isDeleting && (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                )}
                {isDeleting ? "Deleting..." : "Delete Item"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}