"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, CheckCircle, Shield, UserCheck, AlertCircle,
  Loader2, MapPin, User, ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { updateDepositStatusByBookingId } from "@/app/admin/csr/actions";
import { useSession } from "next-auth/react";

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

const STEPS = ["Security Deposit", "Check In Guest"] as const;

export default function CheckInModal({ booking, onClose, onConfirm, isLoading = false }: CheckInModalProps) {
  const { data: session } = useSession();
  const employeeId = session?.user?.id;
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const isDepositAlreadyCollected =
    booking.deposit_status?.toLowerCase() === "held" ||
    booking.deposit_status?.toLowerCase() === "paid";
  const [currentStep, setCurrentStep] = useState(0);
  const [stepLoading, setStepLoading] = useState(false);
  const [depositDone, setDepositDone] = useState(isDepositAlreadyCollected);
  const [cleaner, setCleaner] = useState<CleanerInfo | null>(null);
  const [cleanerLoading, setCleanerLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then(r => r.json())
      .then(data => setPaymentMethods(Array.isArray(data.data) ? data.data.filter((m: any) => m.is_active) : []))
      .catch(() => setPaymentMethods([]));
  }, []);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsMounted(true));
    return () => { cancelAnimationFrame(rafId); setIsMounted(false); };
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (stepLoading) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMounted, onClose, stepLoading]);

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

  const handleCollectDeposit = async () => {
    setStepLoading(true);
    try {
      const selectedPm = paymentMethods.find((m: any) => m.id === paymentMethod);
      const methodLabel = paymentMethod === "cash" ? "Cash" : (selectedPm?.payment_name ?? paymentMethod);
      const notes = referenceNumber.trim() ? `Ref: ${referenceNumber.trim()} | Method: ${methodLabel}` : `Method: ${methodLabel}`;
      await updateDepositStatusByBookingId(booking.id, "Paid", employeeId, notes, booking.security_deposit || 1000, methodLabel);
      setDepositDone(true);
      toast.success("Security deposit collected");
      setCurrentStep(1);
    } catch {
      toast.error("Failed to record security deposit");
    } finally {
      setStepLoading(false);
    }
  };

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
                {currentStep === 0 ? "Collect Security Deposit" : "Check In Guest"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentStep === 0 ? "Cleaner collects deposit from guest at entrance" : "Confirm guest has arrived and checked in"}
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={stepLoading} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-start px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-start flex-1">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0
                  ${i < currentStep ? "bg-blue-500 border-blue-500 text-white"
                    : i === currentStep ? "bg-white dark:bg-gray-800 border-blue-500 text-blue-600"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"}`}>
                  {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap text-center ${i <= currentStep ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-4 transition-all ${i < currentStep ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-600"}`} />
              )}
            </div>
          ))}
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

          {/* STEP 0: Security Deposit Collection */}
          {currentStep === 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-4 space-y-3 border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                <Shield className="w-4 h-4" /> Security Deposit
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount to collect from guest</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(booking.security_deposit || 1000)}
                </p>
              </div>

              {isDepositAlreadyCollected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-xs font-medium text-green-700 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Deposit already collected by the assigned cleaner. Please confirm to proceed.
                  </div>
                  {(booking.security_deposit_payment_method || booking.security_deposit_notes || booking.security_deposit_payment_proof_url) && (
                    <div className="rounded-lg border border-indigo-100 dark:border-indigo-800 bg-white dark:bg-indigo-900/10 p-3 space-y-2 text-sm">
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
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => { setPaymentMethod(e.target.value); setReferenceNumber(""); }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                    >
                      <option value="cash">Cash</option>
                      {paymentMethods.filter((m: any) => m.payment_method !== "cash").map((m: any) => (
                        <option key={m.id} value={m.id}>{m.payment_name}</option>
                      ))}
                    </select>
                  </div>

                  {paymentMethod !== "cash" && (() => {
                    const pm = paymentMethods.find((m: any) => m.id === paymentMethod);
                    if (!pm) return null;
                    return (
                      <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-indigo-900/20 p-3 space-y-2">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{pm.payment_name} Details</p>
                        {pm.payment_qr_link && (
                          <div className="flex justify-center">
                            <img src={pm.payment_qr_link} alt={`${pm.payment_name} QR`} className="w-32 h-32 object-contain rounded border border-indigo-100 dark:border-indigo-700 bg-white p-1" />
                          </div>
                        )}
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Provider</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{pm.provider}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Account</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{pm.account_details}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {paymentMethod !== "cash" && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reference Number</label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={e => setReferenceNumber(e.target.value)}
                        placeholder="Transaction / reference no."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  )}
                </>
              )}

              <p className="text-xs text-gray-500 italic">
                This deposit will be returned to the guest after checkout if there are no damages.
              </p>
            </div>
          )}

          {/* STEP 1: Confirm Check-In */}
          {currentStep === 1 && (
            <>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Security deposit already collected</p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    {isDepositAlreadyCollected
                      ? `${formatCurrency(booking.security_deposit || 1000)} — collected by cleaner`
                      : `${formatCurrency(booking.security_deposit || 1000)} via ${paymentMethod === "cash" ? "Cash" : (paymentMethods.find((m: any) => m.id === paymentMethod)?.payment_name ?? paymentMethod)}`}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
                Click <span className="font-semibold text-blue-600">Check In Guest</span> to confirm the guest has arrived and is now checked in.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button onClick={onClose} disabled={stepLoading || isLoading} className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50">
            Cancel
          </button>
          {currentStep === 0 && (
            <button onClick={handleCollectDeposit} disabled={stepLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
              {stepLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Shield className="w-4 h-4" /> Confirm Deposit Collected</>}
            </button>
          )}
          {currentStep === 1 && (
            <button onClick={handleCheckIn} disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking In...</> : <><CheckCircle className="w-4 h-4" /> Check In Guest</>}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
