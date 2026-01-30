"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { XCircle, X, User } from "lucide-react";
import type { PaymentRow } from "../types";
import { formatCurrency } from "../utils";

export default function RejectModal({
  isOpen,
  payment,
  onCancelAction,
  onConfirmAction,
  updatingPaymentId,
}: {
  isOpen: boolean;
  payment: PaymentRow | null;
  onCancelAction: () => void;
  onConfirmAction: (id: string, reason: string) => Promise<void>;
  updatingPaymentId: string | null;
}) {
  const [localReason, setLocalReason] = useState("");

  if (!isOpen || !payment) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancelAction}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="fixed z-[9991] w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Reject Payment
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provide a reason for rejecting the payment (optional).
                </p>
              </div>
            </div>
            <button
              onClick={onCancelAction}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Payment Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
                Payment Information
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Payer:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {payment.guest}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Payment ID:
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {payment.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Amount:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(Number(payment.booking?.down_payment ?? 0))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason (optional)
              </label>
              <textarea
                value={localReason}
                onChange={(e) => setLocalReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Rejection reason (optional)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={onCancelAction}
              type="button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirmAction(payment.id!, localReason)}
              type="button"
              disabled={updatingPaymentId === payment.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {updatingPaymentId === payment.id ? (
                <svg
                  className="animate-spin inline-block align-middle h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span className="font-semibold ml-1">Reject</span>
                </>
              )}
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
