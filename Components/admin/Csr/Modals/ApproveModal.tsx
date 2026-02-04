"use client";

import { createPortal } from "react-dom";
import { CheckCircle, X, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { PaymentRow } from "../types";
import { formatCurrency } from "../utils";

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
  onConfirmAction: (payment: PaymentRow, amount: number) => Promise<void>;
  updatingPaymentId: string | null;
  updatingAction?: "approve" | "reject" | null;
}) {
  const [localAmount, setLocalAmount] = useState<string>("");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (payment && isOpen) {
      // Default the input to the submitted payment amount (if present), otherwise
      // fallback to the remaining balance. This makes approving a submitted proof
      // fast (amount prefilled) while still being convenient for check-in
      // collections (remaining balance prefilled).
      timeoutId = setTimeout(() => {
        const explicitRemaining = payment.booking?.remaining_balance;
        const remaining =
          typeof explicitRemaining !== "undefined" && explicitRemaining !== null
            ? Number(explicitRemaining)
            : !Number.isNaN(Number(payment.booking?.total_amount ?? NaN))
              ? Math.max(
                  0,
                  Number(payment.booking?.total_amount ?? 0) -
                    Number(
                      payment.booking?.amount_paid ??
                        payment.booking?.down_payment ??
                        0,
                    ),
                )
              : 0;
        setLocalAmount(remaining > 0 ? String(remaining) : "");
      }, 0);
    }
    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const amountNum = parseFloat(localAmount || "0");

  // Compute previous remaining (prefer server value, otherwise derive).
  // We require full settlement when this modal is being used to collect the
  // remaining balance (i.e. when there is no submitted down payment).
  const submitted = Number(payment.booking?.down_payment ?? 0);
  const explicitRemaining = payment.booking?.remaining_balance;
  const prevRemaining =
    typeof explicitRemaining !== "undefined" && explicitRemaining !== null
      ? Number(explicitRemaining)
      : !Number.isNaN(Number(payment.booking?.total_amount ?? NaN))
        ? Math.max(
            0,
            Number(payment.booking?.total_amount ?? 0) -
              Number(
                payment.booking?.amount_paid ??
                  payment.booking?.down_payment ??
                  0,
              ),
          )
        : 0;

  // Underpay = this is a direct collection (no submitted down payment) AND
  // the entered amount is less than the remaining balance.
  const isUnderpay = submitted <= 0 && amountNum < prevRemaining;

  const handleConfirm = () => {
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (isUnderpay) {
      toast.error(`Amount must be at least ${formatCurrency(prevRemaining)}`);
      return;
    }
    onConfirmAction(payment, amountNum);
  };

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
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Approve Payment
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the amount to be recorded and approve the payment.
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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4" />
                Payment Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {payment.totalAmount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Remaining Balance</div>
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {payment.remaining}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to collect
              </label>
              <input
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder=""
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {isUnderpay && (
                <div className="text-sm text-red-600 mt-2">
                  Amount must be at least {formatCurrency(prevRemaining)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={onCancelAction}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                updatingPaymentId === payment.id ||
                isNaN(amountNum) ||
                amountNum < 0 ||
                isUnderpay
              }
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
            >
              {updatingPaymentId === payment.id &&
              updatingAction === "approve" ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Approve
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
