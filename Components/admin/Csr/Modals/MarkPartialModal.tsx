"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, AlertCircle, User, DollarSign, FileText } from "lucide-react";
import { DepositRecord } from "@/app/admin/csr/actions";
import toast from 'react-hot-toast';

interface MarkPartialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (depositId: string, refundAmount: number, deductionReason: string) => void;
  deposit: DepositRecord | null;
  isLoading?: boolean;
}

export default function MarkPartialModal({ isOpen, onClose, onConfirm, deposit, isLoading }: MarkPartialModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [deductionReason, setDeductionReason] = useState<string>("");

  useEffect(() => {
    if (deposit && isOpen) {
      setRefundAmount(deposit.deposit_amount.toString());
      setDeductionReason("");
    }
  }, [deposit, isOpen]);

  const handleConfirm = () => {
    if (!deposit) return;
    
    const refund = parseFloat(refundAmount);
    if (isNaN(refund) || refund < 0) {
      toast.error("Please enter a valid refund amount");
      return;
    }
    
    if (refund > deposit.deposit_amount) {
      toast.error("Refund amount cannot exceed deposit amount");
      return;
    }
    
    if (!deductionReason.trim()) {
      toast.error("Please provide a reason for the deduction");
      return;
    }
    
    onConfirm(deposit.id, refund, deductionReason.trim());
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

  if (!isOpen || !deposit) return null;

  const refund = parseFloat(refundAmount) || 0;
  const forfeited = deposit.deposit_amount - refund;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Process Partial Refund
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Return part of the deposit with deductions
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
          {/* Guest Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4" />
              Guest Information
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {deposit.guest}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Booking ID:</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {deposit.booking_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {deposit.haven}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Calculation */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3">
              <DollarSign className="w-4 h-4" />
              Refund Calculation
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Deposit Amount
                </label>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {deposit.formatted_amount}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  min="0"
                  max={deposit.deposit_amount}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter refund amount"
                />
              </div>
              
              <div className="pt-2 border-t border-orange-200 dark:border-orange-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Forfeited Amount:</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    ₱{forfeited.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deduction Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deduction Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deductionReason}
              onChange={(e) => setDeductionReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Explain why deductions were made (e.g., damages, extra cleaning, etc.)"
            />
          </div>

          {/* Status Explanation */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Partial Refund Status
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Partial:</strong> Only part of the security deposit will be refunded to the guest. The remaining amount is forfeited due to damages, violations, or other deductions. This status helps track both refunded and forfeited amounts for transparency.
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This will refund ₱{refund.toLocaleString()} and forfeit ₱{forfeited.toLocaleString()} 
                  from the total deposit. This action cannot be undone once confirmed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !refundAmount || !deductionReason.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Confirm Partial Refund
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
