"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import TotalBreakdown from "../TotalBreakdown";

interface Booking {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  down_payment: number;
  remaining_balance: number;
  total_amount: number;
  add_ons_total: number;
  room_rate: number;
  security_deposit: number;
  deposit_status?: string;
  payment_status?: string;
  status: string;
}

interface PaymentCollectionModalProps {
  booking: Booking;
  onClose: () => void;
  isOpen: boolean;
  onConfirm?: (paymentData: {
    amountCollected: number;
    change: number;
    paymentMethod: string;
  }) => void;
}

export default function PaymentCollectionModal({
  booking,
  onClose,
  isOpen,
  onConfirm,
}: PaymentCollectionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [amountCollected, setAmountCollected] = useState<string>("");
  const [change, setChange] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose();
      }
    };

    if (isMounted && isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMounted, isOpen, onClose]);

  // Calculate true balance including unpaid deposit
  const isDepositPaid = booking.deposit_status?.toLowerCase() === 'paid' || booking.deposit_status?.toLowerCase() === 'held';
  const displaySecurityDeposit = 1000;

  // Total cost = Room + Add-ons + Deposit
  const baseTotalCost = (booking.total_amount || 0) + displaySecurityDeposit;

  // Amount already paid (the down payment recorded in DB)
  // We assume here that for "Payment Collection" (at check-in), the down payment is already "approved" in reality 
  // or we just subtract what's in booking.down_payment.
  const downPaymentPaid = booking.down_payment || 0;
  const depositAlreadyPaid = isDepositPaid ? displaySecurityDeposit : 0;

  const trueRemainingBalance = baseTotalCost - downPaymentPaid - depositAlreadyPaid;

  // Handle amount input and auto-calculate change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountCollected(value);

    // Calculate change based on true remaining balance
    if (value) {
      const amount = parseFloat(value);
      const changeAmount = amount - trueRemainingBalance;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      setChange(0);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`;

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9992] w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Payment Collection
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Booking #{booking.booking_id}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{guestName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Property:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{booking.room_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-in:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.check_in_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{booking.guest_phone}</span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <DollarSign className="w-4 h-4" />
              Payment Breakdown
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <TotalBreakdown
                roomRate={booking.room_rate}
                securityDeposit={booking.security_deposit}
                depositStatus={booking.deposit_status}
                addOnsTotal={booking.add_ons_total}
                totalAmount={booking.total_amount}
                downPayment={booking.down_payment}
                remainingBalance={booking.remaining_balance}
                paymentStatus={booking.payment_status}
                isCompact={true}
              />
            </div>
          </div>

          {/* Payment Collection Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Collect Payment
            </div>
            <div className="space-y-3">
              {/* Amount Due */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount Due</span>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(trueRemainingBalance)}
                    </span>
                    {!isDepositPaid && (
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tight -mt-1">Includes Security Deposit</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Collected Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Amount Collected
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={amountCollected}
                    onChange={handleAmountChange}
                    placeholder={trueRemainingBalance.toString()}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Change Display */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Change
                  </span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(change)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onConfirm) {
                onConfirm({
                  amountCollected: parseFloat(amountCollected),
                  change,
                  paymentMethod,
                });
              }
            }}
            disabled={!amountCollected || parseFloat(amountCollected) < trueRemainingBalance}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Payment
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
