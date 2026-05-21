"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, CheckCircle, UserCheck, AlertCircle,
  Loader2, MapPin, User, ExternalLink,
} from "lucide-react";

interface Booking {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  security_deposit: number;
  deposit_status?: string;
  security_deposit_payment_method?: string;
  security_deposit_notes?: string;
  security_deposit_payment_proof_url?: string;
  down_payment: number;
  payment_method?: string;
}

interface CleanerInfo {
  first_name: string;
  last_name: string;
  employment_id: string;
  cleaning_status: string;
}

interface CheckInModalProps {
  booking: Booking;
  onClose: () => void;
  onConfirm: (bookingId: string) => void;
  isLoading?: boolean;
}

export default function CheckInModal({ booking, onClose, onConfirm, isLoading = false }: CheckInModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const depositStatus = booking.deposit_status?.toLowerCase();
  const isDepositAlreadyCollected =
    depositStatus === "held" ||
    depositStatus === "paid" ||
    depositStatus === "pending_verification";
  const [cleaner, setCleaner] = useState<CleanerInfo | null>(null);
  const [cleanerLoading, setCleanerLoading] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsMounted(true));
    return () => { cancelAnimationFrame(rafId); setIsMounted(false); };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (isLoading) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMounted, onClose, isLoading]);

  // Fetch assigned cleaner
  useEffect(() => {
    if (!booking.booking_id) return;
    setCleanerLoading(true);
    fetch(`/api/admin/cleaners/tasks/by-booking/${booking.booking_id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.cleaner_first_name) {
          setCleaner({
            first_name: res.data.cleaner_first_name,
            last_name: res.data.cleaner_last_name,
            employment_id: res.data.cleaner_employment_id,
            cleaning_status: res.data.cleaning_status,
          });
        }
      })
      .catch(() => {})
      .finally(() => setCleanerLoading(false));
  }, [booking.booking_id]);

  if (!isMounted) return null;

  const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`.trim();

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  const handleCheckIn = () => {
    onConfirm(booking.id);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Check In Guest
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Confirm guest has arrived and is checked in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
            title="Close"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Booking Info — always visible */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 col-span-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-200">{guestName}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{booking.room_name}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Check-in</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(booking.check_in_date)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Check-out</span>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(booking.check_out_date)}</p>
              </div>
            </div>
          </div>

          {/* Assigned Cleaner */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <UserCheck className="w-4 h-4" /> Assigned Cleaner
            </div>
            {cleanerLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : cleaner ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cleaner.first_name} {cleaner.last_name}</p>
                  <p className="text-xs text-gray-500">ID: {cleaner.employment_id}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize
                  ${cleaner.cleaning_status === "cleaned" || cleaner.cleaning_status === "inspected"
                    ? "bg-green-100 text-green-700" : cleaner.cleaning_status === "in-progress"
                    ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {cleaner.cleaning_status}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" /> No cleaner assigned yet
              </div>
            )}
          </div>

          {/* Deposit status (read-only) — cleaner is the collector now */}
          {isDepositAlreadyCollected ? (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 space-y-2 border border-green-200 dark:border-green-900/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" /> Security Deposit Collected
              </div>
              <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-400">
                <span>{formatCurrency(booking.security_deposit || 1000)} — collected by cleaner</span>
                {depositStatus === "pending_verification" && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 font-semibold">
                    Awaiting your verification
                  </span>
                )}
              </div>
              {(booking.security_deposit_payment_method || booking.security_deposit_notes || booking.security_deposit_payment_proof_url) && (
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-green-900/10 p-3 space-y-2 text-sm mt-2">
                  {booking.security_deposit_payment_method && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Payment Method</span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{booking.security_deposit_payment_method}</span>
                    </div>
                  )}
                  {(() => {
                    const ref = booking.security_deposit_notes?.match(/Ref:\s*([^|]+)/)?.[1]?.trim();
                    if (!ref) return null;
                    return (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Reference No.</span>
                        <span className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-100">{ref}</span>
                      </div>
                    );
                  })()}
                  {booking.security_deposit_payment_proof_url && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Proof of Payment</span>
                      <a
                        href={booking.security_deposit_payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Proof
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 space-y-1 border border-amber-200 dark:border-amber-900/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" /> Deposit not yet collected
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                The assigned cleaner is responsible for collecting the security deposit ({formatCurrency(booking.security_deposit || 1000)}) at guest arrival. You can still check the guest in.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
            Click <span className="font-semibold text-blue-600">Check In Guest</span> to confirm the guest has arrived and is now checked in.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking In...</> : <><CheckCircle className="w-4 h-4" /> Check In Guest</>}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
