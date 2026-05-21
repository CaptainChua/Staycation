"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, ShieldX, Banknote, CreditCard, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import { verifyCleanerCollection } from "@/app/admin/csr/actions";
import toast from "react-hot-toast";

interface BookingData {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  room_name: string;
  security_deposit: number;
  remaining_balance: number;
  security_deposit_payment_method?: string;
  security_deposit_payment_proof_url?: string;
  security_deposit_notes?: string;
}

interface Props {
  booking: BookingData;
  employeeId: string;
  onClose: () => void;
  onDone: () => void;
}

export default function VerifyCollectionModal({ booking, employeeId, onClose, onDone }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const deposit = Number(booking.security_deposit) > 0 ? Number(booking.security_deposit) : 1000;
  const balance = Number(booking.remaining_balance) > 0 ? Number(booking.remaining_balance) : 0;
  const totalCollected = deposit + balance;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 }).format(n);

  const method = booking.security_deposit_payment_method || "—";
  const proofUrl = booking.security_deposit_payment_proof_url;
  const notes = booking.security_deposit_notes;

  const handle = async (action: "confirm" | "reject") => {
    const setter = action === "confirm" ? setIsConfirming : setIsRejecting;
    setter(true);
    try {
      await verifyCleanerCollection(booking.id, action, employeeId);
      toast.success(
        action === "confirm"
          ? "Collection confirmed — deposit marked as paid."
          : "Collection rejected — deposit reset to pending."
      );
      onDone();
    } catch {
      toast.error("Failed to process verification. Please try again.");
    } finally {
      setter(false);
    }
  };

  const busy = isConfirming || isRejecting;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Verify Payment Collection</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Submitted by cleaner — requires your confirmation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            title="Close"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Booking info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Booking</p>
            <p className="font-bold text-gray-800 dark:text-gray-100">{booking.booking_id}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {booking.guest_first_name} {booking.guest_last_name} — {booking.room_name}
            </p>
          </div>

          {/* Amount breakdown */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-2 border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
              Amount Collected by Cleaner
            </p>
            {balance > 0 && (
              <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                <span>Remaining Balance</span>
                <span>{fmt(balance)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Security Deposit</span>
              <span>{fmt(deposit)}</span>
            </div>
            <div className="flex justify-between font-bold text-green-700 dark:text-green-400 pt-1 border-t border-green-200 dark:border-green-700">
              <span>Total Collected</span>
              <span className="text-lg">{fmt(totalCollected)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            {method.toLowerCase() === "cash"
              ? <Banknote className="w-4 h-4 text-green-600" />
              : <CreditCard className="w-4 h-4 text-blue-600" />}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">{method}</p>
            </div>
          </div>

          {/* Notes / reference */}
          {notes && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes / Reference</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{notes}</p>
            </div>
          )}

          {/* Proof of payment */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Proof of Payment</p>
            {proofUrl ? (
              <div className="space-y-2">
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Full Proof Image
                </a>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofUrl}
                  alt="Proof of payment"
                  className="w-full max-h-40 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No proof uploaded</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={() => handle("reject")}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-semibold transition-colors"
          >
            {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
            Reject
          </button>
          <button
            type="button"
            onClick={() => handle("confirm")}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl font-semibold transition-colors"
          >
            {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
