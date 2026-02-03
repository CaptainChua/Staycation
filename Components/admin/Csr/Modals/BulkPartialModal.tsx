"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, RotateCcw, X, User, AlertCircle, DollarSign } from "lucide-react";
import { DepositRecord } from "@/app/admin/csr/actions";

interface BulkPartialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (refundData: Array<{ depositId: string; refundAmount: number; deductionReason: string }>) => void;
  selectedDeposits: string[];
  deposits: DepositRecord[];
  isLoading: boolean;
}

export default function BulkPartialModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDeposits,
  deposits,
  isLoading
}: BulkPartialModalProps) {
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});
  const [deductionReasons, setDeductionReasons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, { amount?: string; reason?: string }>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter deposits to only include Held status
  const heldDeposits = selectedDeposits
    .map(id => deposits.find(d => d.id === id))
    .filter(deposit => deposit && deposit.status === "Held") as DepositRecord[];

  const handleAmountChange = (depositId: string, amount: string) => {
    setRefundAmounts(prev => ({
      ...prev,
      [depositId]: amount
    }));
    
    // Clear error for this deposit if amount is valid
    if (errors[depositId]?.amount) {
      setErrors(prev => ({
        ...prev,
        [depositId]: { ...prev[depositId], amount: undefined }
      }));
    }
  };

  const handleReasonChange = (depositId: string, reason: string) => {
    setDeductionReasons(prev => ({
      ...prev,
      [depositId]: reason
    }));
    
    // Clear error for this deposit if reason is valid
    if (errors[depositId]?.reason) {
      setErrors(prev => ({
        ...prev,
        [depositId]: { ...prev[depositId], reason: undefined }
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, { amount?: string; reason?: string }> = {};
    let isValid = true;

    heldDeposits.forEach(deposit => {
      const depositErrors: { amount?: string; reason?: string } = {};
      
      const amount = parseFloat(refundAmounts[deposit.id] || "0");
      if (!refundAmounts[deposit.id] || amount <= 0) {
        depositErrors.amount = "Refund amount must be greater than 0";
        isValid = false;
      } else if (amount > deposit.deposit_amount) {
        depositErrors.amount = `Cannot exceed deposit amount of ₱${deposit.deposit_amount.toFixed(2)}`;
        isValid = false;
      }

      if (!deductionReasons[deposit.id]?.trim()) {
        depositErrors.reason = "Deduction reason is required";
        isValid = false;
      }

      if (Object.keys(depositErrors).length > 0) {
        newErrors[deposit.id] = depositErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    const refundData = heldDeposits.map(deposit => ({
      depositId: deposit.id,
      refundAmount: parseFloat(refundAmounts[deposit.id] || "0"),
      deductionReason: deductionReasons[deposit.id]?.trim() || ""
    }));

    onConfirm(refundData);
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Calculate total refund amount
  const totalRefundAmount = heldDeposits.reduce((total, deposit) => {
    const amount = parseFloat(refundAmounts[deposit.id] || "0");
    return total + amount;
  }, 0);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Bulk Partial Refund
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Process partial refunds for {heldDeposits.length} held deposit{heldDeposits.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Refund Summary */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3">
              <DollarSign className="w-4 h-4" />
              Refund Summary
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Number of Held Deposits:</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {heldDeposits.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Refund Amount:</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  ₱{totalRefundAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This action will process partial refunds for {heldDeposits.length} held deposit{heldDeposits.length !== 1 ? 's' : ''}. 
                  The remaining amount will be automatically forfeited. This action cannot be undone once confirmed.
                </p>
              </div>
            </div>
          </div>

          {/* Deposits List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4" />
              Held Deposits ({heldDeposits.length})
            </div>
            <div className="space-y-3">
              {heldDeposits.map((deposit, index) => (
                <div key={deposit.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {deposit.deposit_id}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • {deposit.haven}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Guest: {deposit.guest}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Booking: {deposit.booking_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Deposit Amount</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ₱{deposit.deposit_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Refund Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                          ₱
                        </span>
                        <input
                          type="number"
                          value={refundAmounts[deposit.id] || ""}
                          onChange={(e) => handleAmountChange(deposit.id, e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          max={deposit.deposit_amount}
                          className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm ${
                            errors[deposit.id]?.amount
                              ? 'border-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                          disabled={isLoading}
                        />
                      </div>
                      {errors[deposit.id]?.amount && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[deposit.id]?.amount}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deduction Reason
                      </label>
                      <input
                        type="text"
                        value={deductionReasons[deposit.id] || ""}
                        onChange={(e) => handleReasonChange(deposit.id, e.target.value)}
                        placeholder="Reason for deduction"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm ${
                          errors[deposit.id]?.reason
                            ? 'border-red-500 dark:border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        disabled={isLoading}
                      />
                      {errors[deposit.id]?.reason && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors[deposit.id]?.reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || heldDeposits.length === 0}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Process Partial Refunds
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
