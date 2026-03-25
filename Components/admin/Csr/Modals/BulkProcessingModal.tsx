"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, Play, X, User, AlertCircle } from "lucide-react";
import { DepositRecord } from "@/app/admin/csr/actions";

interface BulkProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDeposits: string[];
  deposits: DepositRecord[];
  isLoading: boolean;
}

export default function BulkProcessingModal({
  isOpen,
  onClose,
  onConfirm,
  selectedDeposits,
  deposits,
  isLoading
}: BulkProcessingModalProps) {
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
    sessionStorage.setItem('bulkHeldNotes', JSON.stringify(notes));
    onConfirm();
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
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Mark Deposits as Held
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mark {selectedDeposits.length} deposit{selectedDeposits.length !== 1 ? 's' : ''} as Held
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
          {/* Summary */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              <AlertCircle className="w-4 h-4" />
              Hold Status Summary
            </div>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              You are about to mark <strong>{selectedDeposits.length}</strong> deposit{selectedDeposits.length !== 1 ? 's' : ''} as "Held". 
              This will update their status to indicate they are currently being held and will be processed after checkout.
            </p>
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
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({deposit?.formatted_amount || 'N/A'})
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
                        Hold Notes (Optional)
                      </label>
                      <textarea
                        value={notes[id] || ''}
                        onChange={(e) => handleNoteChange(id, e.target.value)}
                        placeholder="Add notes for holding this deposit..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <>Mark {selectedDeposits.length} Deposit{selectedDeposits.length !== 1 ? 's' : ''} as Held</>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
