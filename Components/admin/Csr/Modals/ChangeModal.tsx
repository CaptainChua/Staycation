"use client";

import { DollarSign } from "lucide-react";
import { createPortal } from "react-dom";
import { formatCurrency } from "../utils";

export default function ChangeModal({
  isOpen,
  amount,
  onCloseAction,
}: {
  isOpen: boolean;
  amount: number;
  onCloseAction: () => void;
}) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      <div className="fixed inset-0 bg-black/50" onClick={onCloseAction} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="fixed z-[9991] w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Change
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please return the following change to the guest
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500">Change Amount</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {formatCurrency(amount)}
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4">
            <button
              onClick={onCloseAction}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
