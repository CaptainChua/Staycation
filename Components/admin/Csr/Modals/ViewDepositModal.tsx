"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DepositRecord } from "@/app/admin/csr/actions";
import { 
  X, 
  Wallet, 
  MapPin, 
  User, 
  Eye, 
  ExternalLink,
  Calendar,
  DollarSign
} from "lucide-react";

interface ViewDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposit: DepositRecord | null;
}

export default function ViewDepositModal({ 
  isOpen, 
  onClose, 
  deposit 
}: ViewDepositModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
        className="fixed z-[9991] w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Security Deposit Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View complete deposit information
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
          {/* Deposit Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Wallet className="w-4 h-4" />
              Deposit Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {deposit.deposit_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                  deposit.status === "Pending"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    : deposit.status === "Held"
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : deposit.status === "Returned"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : deposit.status === "Partial"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : deposit.status === "Forfeited"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}>
                  {deposit.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {deposit.formatted_amount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {deposit.payment_method || 'No payment yet'}
                </span>
              </div>
              {deposit.payment_proof_url && (
                <div className="md:col-span-2">
                  <a
                    href={deposit.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Payment Proof
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              Booking Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {deposit.haven}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tower:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {deposit.tower}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Booking ID:</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {deposit.booking_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-in:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {deposit.checkin_date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-out:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {deposit.checkout_date}
                </span>
              </div>
            </div>
          </div>

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
              {deposit.guest_email && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <a href={`mailto:${deposit.guest_email}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                    {deposit.guest_email}
                  </a>
                </div>
              )}
              {deposit.guest_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                  <a href={`tel:${deposit.guest_phone}`} className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline">
                    {deposit.guest_phone}
                  </a>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {deposit.guest_facebook_link && (
                  <a
                    href={deposit.guest_facebook_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Facebook
                  </a>
                )}
                {deposit.guest_valid_id_url && (
                  <a
                    href={deposit.guest_valid_id_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Valid ID
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          {(deposit.refunded_amount > 0 || deposit.forfeited_amount > 0) && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                <DollarSign className="w-4 h-4" />
                Financial Summary
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Original Amount:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {deposit.formatted_amount}
                  </span>
                </div>
                {deposit.refunded_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Refunded Amount:</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        minimumFractionDigits: 0
                      }).format(deposit.refunded_amount)}
                    </span>
                  </div>
                )}
                {deposit.forfeited_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Forfeited Amount:</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP',
                        minimumFractionDigits: 0
                      }).format(deposit.forfeited_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}