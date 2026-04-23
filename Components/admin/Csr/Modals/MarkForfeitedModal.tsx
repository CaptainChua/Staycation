"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, XCircle, AlertTriangle, User, DollarSign, FileText } from "lucide-react";
import { DepositRecord } from "@/app/admin/csr/actions";
import toast from 'react-hot-toast';

interface MarkForfeitedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (depositId: string, forfeitureReason: string) => void;
  deposit: DepositRecord | null;
  isLoading?: boolean;
}

export default function MarkForfeitedModal({ isOpen, onClose, onConfirm, deposit, isLoading }: MarkForfeitedModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [forfeitureReason, setForfeitureReason] = useState<string>("");

  useEffect(() => {
    if (deposit && isOpen) {
      setForfeitureReason("");
    }
  }, [deposit, isOpen]);

  const handleConfirm = () => {
    if (!deposit) return;
    
    if (!forfeitureReason.trim()) {
      toast.error("Please provide a reason for forfeiture");
      return;
    }
    
    onConfirm(deposit.id, forfeitureReason.trim());
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

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Confirm Forfeiture
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Forfeit the entire deposit amount
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

          {/* Forfeiture Details */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
              <DollarSign className="w-4 h-4" />
              Forfeiture Details
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Deposit Amount:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {deposit.formatted_amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Forfeited Amount:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {deposit.formatted_amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Refunded Amount:</span>
                <span className="text-lg font-bold text-gray-400 dark:text-gray-500">
                  ₱0
                </span>
              </div>
            </div>
          </div>

          {/* Forfeiture Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forfeiture Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={forfeitureReason}
              onChange={(e) => setForfeitureReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Explain why the deposit is being forfeited (e.g., severe damages, policy violations, etc.)"
            />
          </div>

          {/* Status Explanation */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Forfeited Status
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  <strong>Forfeited:</strong> The entire security deposit will be forfeited with no refund to the guest. This is typically due to severe damages, major policy violations, or other serious issues. This action should only be taken when absolutely necessary.
                </p>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>⚠️ CRITICAL WARNING:</strong> This action will forfeit the entire deposit amount of {deposit.formatted_amount} 
                  from {deposit.guest}. The guest will receive NO refund. This action cannot be undone once confirmed.
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
            disabled={isLoading || !forfeitureReason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Confirm Forfeiture
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
