"use client";

import { createPortal } from "react-dom";
import { CheckCircle, X, DollarSign } from "lucide-react";
import type { PaymentRow } from "../types";
import TotalBreakdown from "../TotalBreakdown";

export default function ApproveModal({
  isOpen,
  payment,
  onCancelAction,
  onConfirmAction,
  updatingPaymentId,
  updatingAction,
}: {
  isOpen: boolean;
  payment: PaymentRow | null;
  onCancelAction: () => void;
  onConfirmAction: (payment: PaymentRow) => Promise<void>;
  updatingPaymentId: string | null;
  updatingAction?: "approve" | "reject" | null;
}) {
  if (!isOpen || !payment) return null;

  const handleConfirm = () => {
    onConfirmAction(payment);
  };

  const isProcessing = updatingPaymentId === payment.id && updatingAction === "approve";

  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onCancelAction}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="fixed z-[9991] w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
                <svg
                  className="animate-spin h-5 w-5 text-green-600"
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
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Processing...
                </span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Down Payment
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Confirm approval of the down payment.
                </p>
              </div>
            </div>
            <button
              onClick={onCancelAction}
              disabled={isProcessing}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Breakdown Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <DollarSign className="w-4 h-4" />
                Booking Breakdown
              </div>
              <TotalBreakdown
                roomRate={payment.roomRate ?? 0}
                securityDeposit={payment.security_deposit ?? 0}
                depositStatus={payment.deposit_status ?? "pending"}
                addOnsTotal={payment.addOnsTotal ?? 0}
                totalAmount={payment.totalAmountValue ?? 0}
                downPayment={payment.downPaymentValue ?? 0}
                remainingBalance={payment.remainingValue ?? 0}
                paymentStatus={payment.status.includes("approved") ? "Approved" : "Pending"}
                isCompact={true}
              />
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              {payment.payment_method && (
                <div>
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {payment.payment_method}
                  </span>
                </div>
              )}
              {payment.payment_proof && (
                <div>
                  <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Proof
                  </span>
                  <a
                    href={payment.payment_proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View Proof
                  </a>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={onCancelAction}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 text-sm min-w-[140px] transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
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
