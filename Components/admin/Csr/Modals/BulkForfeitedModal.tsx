"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, XCircle, X, User, AlertCircle, DollarSign } from "lucide-react";
import { DepositRecord } from "@/app/admin/csr/actions";

interface BulkForfeitedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  selectedDeposits: string[];
  deposits: DepositRecord[];
  isLoading: boolean;
}

export default function BulkForfeitedModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDeposits,
  deposits,
  isLoading
}: BulkForfeitedModalProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);

  const handleNoteChange = (depositId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [depositId]: note
    }));
  };

  const handleConfirm = () => {
    // Store notes in sessionStorage for retrieval during processing
    sessionStorage.setItem('bulkForfeitedNotes', JSON.stringify(notes));
    onConfirm("Bulk forfeiture processed");
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

  if (!isOpen) return null;

  // Calculate total forfeiture amount
  const totalForfeitureAmount = selectedDeposits.reduce((total, id) => {
    const deposit = deposits.find(r => r.id === id);
    return total + (deposit?.deposit_amount || 0);
  }, 0);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
                Bulk Forfeit Deposits
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Forfeit {selectedDeposits.length} deposit{selectedDeposits.length !== 1 ? 's' : ''} with no refund
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
          {/* Forfeiture Summary */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
              <DollarSign className="w-4 h-4" />
              Forfeiture Summary
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Number of Deposits:</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {selectedDeposits.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Forfeiture Amount:</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  ₱{totalForfeitureAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>CRITICAL WARNING:</strong> This action will forfeit ₱{totalForfeitureAmount.toLocaleString()} from {selectedDeposits.length} guest{selectedDeposits.length !== 1 ? 's' : ''} with NO REFUND. 
                  This action is IRREVERSIBLE and cannot be undone once confirmed.
                </p>
              </div>
            </div>
          </div>

          {/* Deposits List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4" />
              Selected Deposits ({selectedDeposits.length})
            </div>
            <div className="space-y-3">
              {selectedDeposits.map((id, index) => {
                const deposit = deposits.find(r => r.id === id);
                return (
                  <div key={id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {index + 1}. {deposit?.deposit_id || id}
                          </span>
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            {deposit?.formatted_amount || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Guest: {deposit?.guest || 'Unknown Guest'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Booking: {deposit?.booking_id || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Forfeiture Reason (Optional)
                      </label>
                      <textarea
                        value={notes[id] || ''}
                        onChange={(e) => handleNoteChange(id, e.target.value)}
                        placeholder="Add specific reason for this forfeiture..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <>Forfeit {selectedDeposits.length} Deposit{selectedDeposits.length !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
