"use client";

import { Home, Shield, PlusCircle, CreditCard } from "lucide-react";

interface TotalBreakdownProps {
  roomRate: number;
  securityDeposit: number;
  depositStatus?: string;
  addOnsTotal: number;
  totalAmount: number;
  downPayment?: number;
  remainingBalance?: number;
  paymentStatus?: string;
  isCompact?: boolean;
}

// Default security deposit amount
const DEFAULT_SECURITY_DEPOSIT = 1000;

export default function TotalBreakdown({
  roomRate,
  securityDeposit,
  depositStatus,
  addOnsTotal,
  totalAmount,
  downPayment = 0,
  remainingBalance = 0,
  paymentStatus,
  isCompact = false
}: TotalBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Always use fixed rates as per user rule
  const FIXED_DEPOSIT = 1000;
  const FIXED_DOWN_PAYMENT = 500;

  const safeNumber = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  // Check if security deposit is paid (explicitly 'paid' or 'held')
  const isDepositPaid = depositStatus?.toLowerCase() === 'paid' || depositStatus?.toLowerCase() === 'held';

  // Calculate display total at the top
  // "display all total including room, deposit, add ons, and down payment"
  // We assume totalAmount (from DB) is Room + Addons. We add Deposit to get the base total.
  const displayTotal = safeNumber(roomRate) + safeNumber(addOnsTotal) + FIXED_DEPOSIT;

  // Calculate actual balance
  // "balance should be auto calculate if deposit is paid and down payment is always calculate minus -500"
  // Balance = (Room + Addons + Deposit) - DownPayment(500) - (Deposit if paid)
  const actualRemainingBalance = displayTotal - FIXED_DOWN_PAYMENT - (isDepositPaid ? FIXED_DEPOSIT : 0);

  const breakdownItems = [
    {
      icon: Home,
      label: "Room",
      amount: roomRate,
      color: "text-blue-600"
    },
    {
      icon: Shield,
      label: "Deposit",
      amount: FIXED_DEPOSIT,
      color: "text-green-600"
    },
    {
      icon: PlusCircle,
      label: "Add-ons",
      amount: addOnsTotal,
      color: "text-purple-600"
    }
  ];

  const hasRemainingBalance = actualRemainingBalance > 0;

  // Format payment status display
  const getStatusDisplay = () => {
    if (!paymentStatus) return '';
    if (paymentStatus.toLowerCase().includes('approved')) return 'Approved';
    if (paymentStatus.toLowerCase().includes('pending')) return 'Pending';
    return paymentStatus;
  };

  // Get status color
  const getStatusColor = () => {
    if (!paymentStatus) return 'text-gray-600';
    if (paymentStatus.toLowerCase().includes('approved')) return 'text-green-600';
    if (paymentStatus.toLowerCase().includes('pending')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (isCompact) {
    return (
      <div className="text-sm space-y-2">
        {/* Total row */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-700 dark:text-gray-300">Total</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">
              {formatCurrency(displayTotal)}
            </span>
          </div>
        </div>

        {/* Breakdown items */}
        <div className="space-y-1">
          {breakdownItems.map((item, index) => {
            const isDepositPaid = item.label === "Deposit" && (depositStatus?.toLowerCase() === 'paid' || depositStatus?.toLowerCase() === 'held');

            return (
              <div key={index} className="border-b border-gray-200 dark:border-gray-600 pb-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`${item.color} font-semibold`}>{item.label}</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                {item.label === "Deposit" && (
                  <div className="flex items-center justify-end mt-0.5 text-xs">
                    <span className={`${isDepositPaid ? 'text-green-600' : 'text-red-600'}`}>
                      ({isDepositPaid ? 'Paid' : 'Not Paid'})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Down Payment (Always 500) */}
        <div className="border-b border-gray-200 dark:border-gray-600 pb-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600 font-semibold">Down Payment</span>
            <span className="text-blue-600 font-medium">{formatCurrency(FIXED_DOWN_PAYMENT)}</span>
          </div>
          {paymentStatus && (
            <div className="flex items-center justify-end mt-0.5 text-xs">
              <span className={`font-semibold ${getStatusColor()}`}>
                ({getStatusDisplay()})
              </span>
            </div>
          )}
        </div>

        {/* Balance row */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded px-2 py-1 border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between">
            <span className="text-orange-700 dark:text-orange-400 font-semibold">Balance</span>
            <span className="text-orange-700 dark:text-orange-400 font-bold">
              {formatCurrency(actualRemainingBalance)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Item</span>
          <div className="flex items-center gap-8">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 text-right w-32">Amount</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 text-right w-24">Status</span>
          </div>
        </div>
      </div>

      {/* Breakdown items */}
      <div className="divide-y divide-gray-200 dark:divide-gray-600">
        {breakdownItems.map((item, index) => {
          const isDepositPaid = item.label === "Deposit" && (depositStatus?.toLowerCase() === 'paid' || depositStatus?.toLowerCase() === 'held');

          return (
            <div key={index} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 text-right w-32">
                    {formatCurrency(item.amount)}
                  </span>
                  {item.label === "Deposit" && (
                    <span className={`text-xs font-bold text-right w-24 ${isDepositPaid ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {isDepositPaid ? 'Paid' : 'Not Paid'}
                    </span>
                  )}
                  {item.label !== "Deposit" && (
                    <span className="text-sm text-gray-400 text-right w-24">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Amount */}
        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total Amount</span>
            <div className="flex items-center gap-8">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100 text-right w-32">
                {formatCurrency(displayTotal)}
              </span>
              <span className="text-sm text-gray-400 text-right w-24">—</span>
            </div>
          </div>
        </div>

        {/* Down Payment (Always 500) */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Down Payment</span>
            <div className="flex items-center gap-8">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 text-right w-32">
                {formatCurrency(FIXED_DOWN_PAYMENT)}
              </span>
              <span className={`text-xs font-bold text-right w-24 ${getStatusColor()}`}>
                {getStatusDisplay() || 'Locked'}
              </span>
            </div>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-orange-700 dark:text-orange-400">Balance</span>
            <div className="flex items-center gap-8">
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400 text-right w-32">
                {formatCurrency(actualRemainingBalance)}
              </span>
              <span className="text-sm text-gray-400 text-right w-24">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
