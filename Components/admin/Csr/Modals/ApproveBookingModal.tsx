"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Users as UsersIcon,
  CreditCard,
  Banknote,
  Phone,
  Mail,
  Home,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { approveDownPaymentByBookingId } from "@/app/admin/csr/actions";
import { useSession } from "next-auth/react";

interface Booking {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  guest_gender?: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  facebook_link?: string;
  payment_method: string;
  payment_proof_url?: string;
  valid_id_url?: string;
  room_rate: number;
  security_deposit: number;
  deposit_status?: string;
  security_deposit_payment_method?: string;
  security_deposit_payment_proof_url?: string;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  payment_status?: string;
  status: string;
  add_ons?: unknown;
  additional_guests?: unknown;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApproveBookingModalProps {
  booking?: Booking;
  bookings?: Booking[];
  onClose: () => void;
  onApprove: (bookingId: string) => void;
  onBulkApprove?: (bookingIds: string[]) => void;
  isLoading?: boolean;
  isBulk?: boolean;
}

const STEPS = ["Down Payment", "Approve Booking"] as const;

function getInitialStep(booking?: Booking): number {
  if (!booking) return 0;
  const downPaymentDone = booking.payment_status === "approved_down_payment";
  return downPaymentDone ? 1 : 0;
}

export default function ApproveBookingModal({
  booking,
  bookings,
  onClose,
  onApprove,
  onBulkApprove,
  isLoading = false,
  isBulk = false,
}: ApproveBookingModalProps) {
  const { data: session } = useSession();
  const employeeId = session?.user?.id;
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => getInitialStep(booking));
  const [stepLoading, setStepLoading] = useState(false);
  const [downPaymentDone, setDownPaymentDone] = useState(
    booking?.payment_status === "approved_down_payment"
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsMounted(true));
    return () => { cancelAnimationFrame(rafId); setIsMounted(false); };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stepLoading) return;
      const target = event.target as Node;
      if (modalRef.current && !modalRef.current.contains(target)) onClose();
    };
    if (isMounted) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isMounted, onClose, stepLoading]);

  if (!isMounted) return null;
  if (!isBulk && !booking) return null;

  const b = booking as Booking;
  const selectedBookings = bookings || (booking ? [booking] : []);
  const guestName = `${b?.guest_first_name || ""} ${b?.guest_last_name || ""}`.trim() || "N/A";

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    try { return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
    catch { return d; }
  };

  const formatTime = (t?: string) => {
    if (!t) return "";
    try { return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }
    catch { return t; }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);

  // Step 1: Approve Down Payment
  const handleApproveDownPayment = async () => {
    if (!b?.id) return;
    setStepLoading(true);
    try {
      await approveDownPaymentByBookingId(b.id);
      setDownPaymentDone(true);
      toast.success("Down payment approved");
      setCurrentStep(1);
    } catch {
      toast.error("Failed to approve down payment");
    } finally {
      setStepLoading(false);
    }
  };

  // Step 2: Final booking approval
  const handleFinalApprove = () => {
    if (isBulk && onBulkApprove) {
      onBulkApprove(selectedBookings.map((bk) => bk.id));
    } else if (b) {
      onApprove(b.id);
    }
  };

  // Bulk mode: simple direct approval
  if (isBulk) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
        <div
          ref={modalRef}
          className="fixed z-[9991] w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Approve {selectedBookings.length} Bookings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bulk approval</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You are about to approve <span className="font-semibold">{selectedBookings.length}</span> bookings.
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {selectedBookings.map((bk) => (
                <div key={bk.id} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                  <span className="font-mono">{bk.booking_id}</span> — {bk.room_name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button onClick={onClose} disabled={isLoading} className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleFinalApprove} disabled={isLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</> : <><CheckCircle className="w-4 h-4" /> Approve {selectedBookings.length} Bookings</>}
            </button>
          </div>
        </div>
      </>,
      document.body
    );
  }

  // Single booking: 3-step wizard
  const stepTitles = ["Approve Down Payment", "Approve Booking"];
  const stepDescriptions = [
    "Review and approve the guest's down payment",
    "Finalize and approve the booking",
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stepTitles[currentStep]}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stepDescriptions[currentStep]}</p>
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
                  ${i < currentStep ? "bg-green-500 border-green-500 text-white"
                    : i === currentStep ? "bg-white dark:bg-gray-800 border-green-500 text-green-600"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400"}`}>
                  {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-semibold whitespace-nowrap text-center ${i <= currentStep ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-4 transition-all ${i < currentStep ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 0: Down Payment */}
          {currentStep === 0 && (
            <>
              {/* Booking Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4" /> Booking Information
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-xs text-gray-500">Booking ID:</span><p className="font-mono font-medium text-gray-800 dark:text-gray-200">{b.booking_id}</p></div>
                  <div><span className="text-xs text-gray-500">Status:</span><p className="font-medium text-yellow-600 capitalize">{b.status}</p></div>
                  <div><span className="text-xs text-gray-500">Check-in:</span><p className="text-gray-800 dark:text-gray-200">{formatDate(b.check_in_date)} {formatTime(b.check_in_time)}</p></div>
                  <div><span className="text-xs text-gray-500">Check-out:</span><p className="text-gray-800 dark:text-gray-200">{formatDate(b.check_out_date)} {formatTime(b.check_out_time)}</p></div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" /> Guest Information
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><Home className="w-3.5 h-3.5 text-gray-400" /><span className="text-sm font-medium text-gray-800 dark:text-gray-200">{guestName}</span></div>
                  {b.room_name && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span className="text-sm text-gray-600 dark:text-gray-300">{b.room_name} — <UsersIcon className="w-3 h-3 inline" /> {b.adults}A {b.children}C {b.infants}I</span></div>}
                  {b.guest_email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${b.guest_email}`} className="text-sm text-blue-600 dark:text-blue-400">{b.guest_email}</a></div>}
                  {b.guest_phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><a href={`tel:${b.guest_phone}`} className="text-sm text-green-600 dark:text-green-400">{b.guest_phone}</a></div>}
                  {b.valid_id_url && <div className="flex items-center gap-2"><a href={b.valid_id_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400"><ExternalLink className="w-3 h-3" /> Valid ID</a></div>}
                </div>
              </div>

              {/* Down Payment Info */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 space-y-2 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  <CreditCard className="w-4 h-4" /> Down Payment Details
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {b.payment_method && (
                      <div className="flex items-center gap-2">
                        {b.payment_method.toLowerCase() === "cash" ? <Banknote className="w-4 h-4 text-green-600" /> : <CreditCard className="w-4 h-4 text-blue-600" />}
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{b.payment_method}</span>
                      </div>
                    )}
                    {b.payment_proof_url && (
                      <a href={b.payment_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                        <ExternalLink className="w-3 h-3" /> View Down Payment Proof
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(b.down_payment || 500)}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 1: Approve Booking */}
          {currentStep === 1 && (
            <>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-900/30">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Down payment approved successfully</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Booking Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-xs text-gray-500">Guest:</span><p className="font-medium text-gray-800 dark:text-gray-200">{guestName}</p></div>
                  <div><span className="text-xs text-gray-500">Haven:</span><p className="font-medium text-gray-800 dark:text-gray-200">{b.room_name}</p></div>
                  <div><span className="text-xs text-gray-500">Check-in:</span><p className="text-gray-800 dark:text-gray-200">{formatDate(b.check_in_date)}</p></div>
                  <div><span className="text-xs text-gray-500">Check-out:</span><p className="text-gray-800 dark:text-gray-200">{formatDate(b.check_out_date)}</p></div>
                  <div><span className="text-xs text-gray-500">Down Payment:</span><p className="font-bold text-green-600">{formatCurrency(b.down_payment || 500)}</p></div>
                  <div><span className="text-xs text-gray-500">Security Deposit:</span><p className="text-xs text-gray-500 italic">Collected on check-in day</p></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Click <span className="font-semibold text-green-600">Approve Booking</span> to confirm. Security deposit will be collected by the cleaner on check-in day.
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
            <button onClick={handleApproveDownPayment} disabled={stepLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
              {stepLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</> : <><CheckCircle className="w-4 h-4" /> Approve Down Payment</>}
            </button>
          )}
          {currentStep === 1 && (
            <button onClick={handleFinalApprove} disabled={isLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</> : <><CheckCircle className="w-4 h-4" /> Approve Booking</>}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
