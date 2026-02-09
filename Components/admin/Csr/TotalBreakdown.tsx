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
  isCompact = false
}: TotalBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Always use default security deposit amount (₱1,000)
  const displaySecurityDeposit = DEFAULT_SECURITY_DEPOSIT;

  // Check if security deposit is paid (not 'pending')
  const isDepositPaid = depositStatus?.toLowerCase() !== 'pending';

  // Calculate display total (totalAmount from DB + security deposit)
  // The database total_amount does NOT include security deposit, so we add it for display
  const displayTotal = totalAmount + displaySecurityDeposit;

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
      amount: displaySecurityDeposit,
      color: "text-green-600"
    },
    {
      icon: PlusCircle,
      label: "Add-ons",
      amount: addOnsTotal,
      color: "text-purple-600"
    }
  ];

  const hasValidDownPayment = downPayment > 0;
  // Calculate actual remaining balance
  // If deposit is paid, exclude it from balance. If not paid, include it.
  const actualRemainingBalance = isDepositPaid
    ? (totalAmount - downPayment)  // Deposit paid: exclude from balance
    : (displayTotal - downPayment); // Deposit not paid: include in balance
  const hasRemainingBalance = actualRemainingBalance > 0;

  if (isCompact) {
    return (
      <div className="text-sm text-right space-y-1">
        {/* Total */}
        <div className="font-bold text-gray-800 dark:text-gray-100">
          {formatCurrency(displayTotal)}
        </div>
        
        {/* Breakdown items */}
        <div className="space-y-1">
          {breakdownItems.map((item, index) => {
            // For security deposit, check if deposit_status is not 'Pending'
            const isDepositPaid = item.label === "Deposit" && depositStatus?.toLowerCase() !== 'pending';
            
            return (
              <div key={index} className="flex items-center justify-end gap-1 text-xs">
                <span className={`${item.color} font-medium`}>{item.label}:</span>
                <span className="text-gray-600 dark:text-gray-300">
                  {formatCurrency(item.amount)} 
                  {item.label === "Deposit" && (
                    <span className={`ml-1 ${isDepositPaid ? 'text-green-600' : 'text-red-600'}`}>
                      ({isDepositPaid ? 'Paid' : 'Not Paid'})
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Payment status */}
        {hasValidDownPayment && (
          <div className="flex items-center justify-end gap-1 text-xs">
            <CreditCard className="w-3 h-3 text-blue-500" />
            <span className="text-blue-600 font-medium">Paid:</span>
            <span className="text-blue-600">{formatCurrency(downPayment)}</span>
          </div>
        )}

        {/* Always show balance */}
        <div className="flex items-center justify-end gap-1 text-xs">
          <span className="text-orange-600 font-medium">Balance:</span>
          <span className="text-orange-600">{formatCurrency(actualRemainingBalance)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
        {breakdownItems.map((item, index) => {
          // For security deposit, check if deposit_status is not 'Pending'
          const isDepositPaid = item.label === "Deposit" && depositStatus?.toLowerCase() !== 'pending';
          
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
              </div>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatCurrency(item.amount)}
                {item.label === "Deposit" && (
                  <span className={`ml-1 ${isDepositPaid ? 'text-green-600' : 'text-red-600'}`}>
                    ({isDepositPaid ? 'Paid' : 'Not Paid'})
                  </span>
                )}
              </span>
            </div>
          );
        })}
        
        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-gray-700 dark:text-gray-300">Total Amount</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(displayTotal)}</span>
          </div>
          
          {hasValidDownPayment && (
            <div className="flex items-center justify-between text-sm mt-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Down Payment</span>
              </div>
              <span className="font-medium text-blue-600">{formatCurrency(downPayment)}</span>
            </div>
          )}

          {/* Always show remaining balance */}
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">Remaining Balance</span>
            <span className="font-medium text-orange-600">{formatCurrency(actualRemainingBalance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
