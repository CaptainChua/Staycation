"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  Shield,
  Banknote,
} from "lucide-react";
import { useGetBookingPaymentsQuery } from "@/redux/api/bookingPaymentsApi";
import { getDeposits, DepositRecord } from "@/app/admin/csr/actions";
import PaymentPage from "./PaymentPage.tsx";
import DepositPage from "./DepositPage";

type PaymentCategory = "downpayment" | "deposit";

/**
 * PaymentsHub
 * Single "Payments" tab that combines the Guest Down Payment and Guest
 * Security Deposit views. Shows ONE complete row of 7 KPI cards (drawn from
 * both data sources) at the top, then category buttons that switch only the
 * table below. Each underlying page keeps its own data, IDs, modals and bulk
 * actions intact — nothing is merged. The pages' own KPI rows are hidden
 * (hideSummary) so they don't duplicate the combined row.
 */
export default function PaymentsHub() {
  const [category, setCategory] = useState<PaymentCategory>("downpayment");

  // --- Down payment data (same hook the Payment page uses, unfiltered) ---
  const { data: paymentsAll = [] } = useGetBookingPaymentsQuery();

  // --- Security deposit data (same server action the Deposit page uses) ---
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  useEffect(() => {
    let active = true;
    getDeposits()
      .then((data) => {
        if (active) setDeposits(data);
      })
      .catch((err) => console.error("Failed to load deposits for KPIs:", err));
    return () => {
      active = false;
    };
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);

  // --- Combined KPI calculations (counts/sums only — no ID merging) ---
  const { downPaymentKpis, depositKpis } = useMemo(() => {
    const all = paymentsAll || [];
    const totalPayments = all.length;
    const dpApproved = all.filter(
      (p) => p.payment_status === "approved_down_payment",
    ).length;
    const dpPending = all.filter(
      (p) => p.payment_status === "pending_down_payment",
    ).length;
    const rejected = all.filter(
      (p) => p.payment_status === "rejected",
    ).length;

    const pendingDeposits = deposits.filter((d) => d.status === "Pending").length;
    const paidDeposits = deposits.filter(
      (d) => d.status === "Paid" || d.status === "Held",
    );
    const totalHeld = paidDeposits.reduce(
      (sum, d) => sum + (d.deposit_amount || 0),
      0,
    );

    return {
      downPaymentKpis: [
        { label: "Total Payments", value: String(totalPayments), color: "bg-green-500", icon: DollarSign },
        { label: "Down payment approved", value: String(dpApproved), color: "bg-emerald-500", icon: CheckCircle },
        { label: "Down payment pending", value: String(dpPending), color: "bg-yellow-500", icon: Clock },
        { label: "Rejected", value: String(rejected), color: "bg-red-500", icon: XCircle },
      ],
      depositKpis: [
        { label: "Pending Deposits", value: String(pendingDeposits), color: "bg-amber-500", icon: Wallet },
        { label: "Paid (Holding)", value: String(paidDeposits.length), color: "bg-indigo-500", icon: Shield },
        { label: "Total Held Amount", value: formatCurrency(totalHeld), color: "bg-teal-500", icon: Banknote },
      ],
    };
  }, [paymentsAll, deposits]);

  const renderKpiCard = (
    stat: { label: string; value: string; color: string; icon: typeof DollarSign },
    i: number,
  ) => {
    const IconComponent = stat.icon;
    return (
      <div
        key={i}
        className={`${stat.color} text-white rounded-lg p-5 shadow dark:shadow-gray-900 hover:shadow-lg transition-transform duration-200 transform hover:-translate-y-1`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm opacity-90 leading-snug">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
          <IconComponent className="w-10 h-10 opacity-50 flex-shrink-0" />
        </div>
      </div>
    );
  };

  const buttons: { id: PaymentCategory; label: string; icon: typeof DollarSign }[] = [
    { id: "downpayment", label: "Down Payment", icon: DollarSign },
    { id: "deposit", label: "Security Deposit", icon: Wallet },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Payments
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage guest down payments and security deposits
        </p>
      </div>

      {/* Combined KPI cards — grouped by category so full titles fit */}
      <div className="space-y-4">
        {/* Down Payment KPIs */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Down Payment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {downPaymentKpis.map(renderKpiCard)}
          </div>
        </div>

        {/* Security Deposit KPIs */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
            Security Deposit
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {depositKpis.map(renderKpiCard)}
          </div>
        </div>
      </div>

      {/* Category Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          const active = category === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setCategory(btn.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Active Category Table (each page's own KPI row hidden via hideSummary) */}
      <div>
        {category === "downpayment" ? (
          <PaymentPage hideSummary />
        ) : (
          <DepositPage hideSummary />
        )}
      </div>
    </div>
  );
}
