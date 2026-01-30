"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, CreditCard, User, ExternalLink, MapPin } from "lucide-react";
import type { PaymentRow } from "../types";
import { formatDate } from "../utils";

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRow | null;
}

const getStatusColorClass = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "confirmed")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
  if (s === "pending")
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  if (s === "rejected" || s === "declined")
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
};

export default function ViewPaymentModal({
  isOpen,
  onClose,
  payment,
}: ViewPaymentModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, handleClickOutside]);

  if (!isOpen || !payment) return null;

  const booking: any = payment.booking ?? {};
  const statusSource = booking.status ?? payment.status;
  const statusClass = getStatusColorClass(statusSource);

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-5xl inset-y-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[70vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Payment Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Booking: {payment.booking_id}
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

        {/* Make the middle content area scrollable and constrained */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Payment Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Payment Information
              </h3>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${statusClass}`}
              >
                {statusSource ?? "—"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">Booking ID</span>
                  <div className="text-sm font-mono text-gray-900 dark:text-gray-100 mt-1">
                    {payment.booking_id}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Amount</span>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {payment.totalAmount}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Contact</span>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {payment.booking?.guest_email ?? "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">Guest</span>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
                    {payment.guest}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Payment Proof</span>
                  <div className="text-sm mt-1">
                    {booking?.payment_proof_url ? (
                      <a
                        href={booking.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" /> View Proof
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Payment Method</span>
                  <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {booking?.payment_method ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking & Guest Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <MapPin className="w-4 h-4" />
                Booking Information
              </div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span className="text-xs">Haven</span>
                  <span>{booking?.haven ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Booking ID</span>
                  <span className="font-mono">
                    {booking?.booking_id ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Updated At</span>
                  <span>
                    {formatDate(booking?.updated_at ?? booking?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <User className="w-4 h-4" />
                Guest Information
              </div>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span className="text-xs">Name</span>
                  <span>
                    {booking?.guest_first_name
                      ? `${booking.guest_first_name} ${booking.guest_last_name ?? ""}`
                      : (payment.guest ?? "—")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Email</span>
                  <span>{booking?.guest_email ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs">Phone</span>
                  <span>{booking?.guest_phone ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>

      {/* Floating Close Button - always visible */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="fixed z-[9999] bottom-6 right-6 p-3 rounded-full bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
      >
        <X className="w-5 h-5 text-gray-900 dark:text-gray-100" />
      </button>
    </>
  );

  return typeof window !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
}
