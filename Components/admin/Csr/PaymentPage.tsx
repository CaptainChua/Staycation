"use client";

import {
  DollarSign,
  Search,
  Filter,
  Eye,
  Check,
  CheckCircle,
  X,
  XCircle,
  Clock,
  ArrowUpDown,
  Info,
  User,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Image as ImageIcon,
  CreditCard,
} from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { UpdateBookingPaymentPayload } from "@/types/bookingPayment";
import {
  useGetBookingPaymentsQuery,
  useUpdateBookingPaymentMutation,
} from "@/redux/api/bookingPaymentsApi";

type PaymentStatus = "Paid" | "Pending" | "Rejected";

interface PaymentRow {
  id?: string;
  booking_id: string;
  guest: string;

  // Formatted and numeric totals for display/sorting
  totalAmount: string;
  totalAmountValue?: number;

  // Original down payment submitted
  downPayment: string;
  downPaymentValue?: number;

  // Cumulative amount paid so far (amount_paid)
  amountPaid: string;
  amountPaidValue?: number;
  // Remaining balance (total - amount_paid), non-negative
  remaining: string;
  remainingValue?: number;

  payment_proof?: string | null;
  status: PaymentStatus;
  statusColor: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking?: any;
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  capitalize?: boolean;
}

function InfoField({ label, value, icon, capitalize }: InfoFieldProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-300">
            {icon}
          </div>
        )}
        <div
          className={`w-full rounded-2xl border border-gray-200 dark:border-gray-700 px-3 py-3 text-sm text-gray-800 dark:text-gray-100 dark:bg-gray-900 ${icon ? "pl-9" : "pl-3"} ${capitalize ? "capitalize" : ""}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const mapStatusToUI = (status?: string | null): PaymentStatus => {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "confirmed") return "Paid";
  if (s === "rejected" || s === "declined") return "Rejected";
  return "Pending";
};

const getStatusColorClass = (status?: string | null) => {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "confirmed")
    return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  if (s === "pending")
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
  if (s === "rejected" || s === "declined")
    return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
};

// Small table skeleton rows (used while bookings are loading)
const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
        <td className="py-4 px-4">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
        <td className="py-4 px-4">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
        <td className="py-4 px-4 text-right">
          <div className="h-4 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
        <td className="py-4 px-4 text-center">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
        </td>
        <td className="py-4 px-4 text-center">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
        </td>
        <td className="py-4 px-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto animate-pulse" />
        </td>
      </tr>
    ))}
  </tbody>
);

function RejectModal({
  isOpen,
  payment,
  onCancel,
  onConfirm,
  updatingPaymentId,
}: {
  isOpen: boolean;
  payment: PaymentRow | null;
  onCancel: () => void;
  onConfirm: (id: string, reason: string) => Promise<void>;
  updatingPaymentId: string | null;
}) {
  const [localReason, setLocalReason] = useState("");

  if (!isOpen || !payment) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="fixed z-[9991] w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-lg">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Reject Payment
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provide a reason for rejecting the payment (optional).
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Payment Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4" />
                Payment Information
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Payer:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {payment.guest}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Payment ID:
                  </span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {payment.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Amount:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {formatCurrency(Number(payment.booking?.down_payment ?? 0))}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rejection Reason (optional)
              </label>
              <textarea
                value={localReason}
                onChange={(e) => setLocalReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Rejection reason (optional)"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={onCancel}
              type="button"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(payment.id!, localReason)}
              type="button"
              disabled={updatingPaymentId === payment.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center"
            >
              {updatingPaymentId === payment.id ? (
                <svg
                  className="animate-spin inline-block align-middle h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span className="font-semibold ml-1">Reject</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({
  isOpen,
  payment,
  onCancel,
  onConfirm,
  updatingPaymentId,
}: {
  isOpen: boolean;
  payment: PaymentRow | null;
  onCancel: () => void;
  onConfirm: (payment: PaymentRow, amount: number) => Promise<void>;
  updatingPaymentId: string | null;
}) {
  const [localAmount, setLocalAmount] = useState<string>("");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (payment && isOpen) {
      // Default the input to the submitted payment amount (if present), otherwise
      // fallback to the remaining balance. This makes approving a submitted proof
      // fast (amount prefilled) while still being convenient for check-in
      // collections (remaining balance prefilled).
      timeoutId = setTimeout(() => {
        const submitted = Number(payment.booking?.down_payment ?? 0);
        const explicitRemaining = payment.booking?.remaining_balance;
        const remaining =
          typeof explicitRemaining !== "undefined" && explicitRemaining !== null
            ? Number(explicitRemaining)
            : !Number.isNaN(Number(payment.booking?.total_amount ?? NaN))
              ? Math.max(
                  0,
                  Number(payment.booking?.total_amount ?? 0) -
                    Number(
                      payment.booking?.amount_paid ??
                        payment.booking?.down_payment ??
                        0,
                    ),
                )
              : 0;
        const defaultAmt = submitted > 0 ? submitted : remaining;
        setLocalAmount(defaultAmt > 0 ? String(defaultAmt) : "");
      }, 0);
    }
    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [payment, isOpen]);

  if (!isOpen || !payment) return null;

  const amountNum = parseFloat(localAmount || "0");

  // Compute previous remaining (prefer server value, otherwise derive).
  // We require full settlement when this modal is being used to collect the
  // remaining balance (i.e. when there is no submitted down payment).
  const submitted = Number(payment.booking?.down_payment ?? 0);
  const explicitRemaining = payment.booking?.remaining_balance;
  const prevRemaining =
    typeof explicitRemaining !== "undefined" && explicitRemaining !== null
      ? Number(explicitRemaining)
      : !Number.isNaN(Number(payment.booking?.total_amount ?? NaN))
        ? Math.max(
            0,
            Number(payment.booking?.total_amount ?? 0) -
              Number(
                payment.booking?.amount_paid ??
                  payment.booking?.down_payment ??
                  0,
              ),
          )
        : 0;

  // Underpay = this is a direct collection (no submitted down payment) AND
  // the entered amount is less than the remaining balance.
  const isUnderpay = submitted <= 0 && amountNum < prevRemaining;

  const handleConfirm = () => {
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (isUnderpay) {
      toast.error(`Amount must be at least ${formatCurrency(prevRemaining)}`);
      return;
    }
    onConfirm(payment, amountNum);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="fixed z-[9991] w-full max-w-md max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Approve Payment
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the amount to be recorded and approve the payment.
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4" />
                Payment Summary
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {payment.totalAmount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Remaining Balance</div>
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {payment.remaining}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount to collect
              </label>
              <input
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                min="0"
                step="0.01"
                placeholder=""
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {isUnderpay && (
                <div className="text-sm text-red-600 mt-2">
                  Amount must be at least {formatCurrency(prevRemaining)}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                updatingPaymentId === payment.id ||
                isNaN(amountNum) ||
                amountNum < 0 ||
                isUnderpay
              }
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
            >
              {updatingPaymentId === payment.id ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Confirm Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeModal({
  isOpen,
  amount,
  onClose,
}: {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="fixed z-[9991] w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Change
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please return the following change to the guest
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500">Change Amount</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {formatCurrency(amount)}
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PaymentStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof PaymentRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Compute server-side filter status (map UI filter to DB values)
  const serverStatusParam =
    filterStatus === "all"
      ? undefined
      : filterStatus === "Paid"
        ? "approved"
        : filterStatus.toLowerCase();

  // Fetch payments from backend (use status query when a specific filter is selected)
  const {
    data: paymentsRaw = [],
    isLoading: isPaymentsLoading,
    isFetching: isPaymentsFetching,
    refetch,
  } = useGetBookingPaymentsQuery(
    serverStatusParam ? { status: serverStatusParam } : undefined,
  );

  // Fetch all payments for summary counts (unfiltered)
  const { data: paymentsAll } = useGetBookingPaymentsQuery();

  // Mutation for approve/reject
  const [updateBookingPayment] = useUpdateBookingPaymentMutation();

  // Local UI state for modals and actions (local types used; avoid global booking types for now)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(
    null,
  );
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const payments = useMemo<PaymentRow[]>(() => {
    return (paymentsRaw || []).map((p) => {
      const totalAmountValue = Number(p.total_amount ?? 0);
      const downPaymentValue = Number(p.down_payment ?? 0);
      // amount_paid may be null for older records — fall back to down_payment
      const amountPaidValue = Number(p.amount_paid ?? p.down_payment ?? 0);
      // Prefer an explicit stored remaining_balance if available; otherwise derive it from totals
      const remainingValue =
        typeof p.remaining_balance !== "undefined" &&
        p.remaining_balance !== null
          ? Math.max(0, Number(p.remaining_balance))
          : Math.max(0, totalAmountValue - amountPaidValue);

      const row: PaymentRow = {
        id: p.id,
        booking_id: p.booking_id ?? String(p.booking_fk ?? ""),
        guest: `${p.guest_first_name ?? ""} ${p.guest_last_name ?? ""}`.trim(),
        totalAmount: formatCurrency(totalAmountValue),
        totalAmountValue,
        downPayment: formatCurrency(downPaymentValue),
        downPaymentValue,
        amountPaid: formatCurrency(amountPaidValue),
        amountPaidValue,
        remaining: formatCurrency(remainingValue),
        remainingValue,
        payment_proof: p.payment_proof_url ?? undefined,
        status: mapStatusToUI(p.payment_status),
        statusColor: getStatusColorClass(p.payment_status),
        booking: {
          id: p.booking_fk,
          booking_id: p.booking_id,
          guest_first_name: p.guest_first_name ?? undefined,
          guest_last_name: p.guest_last_name ?? undefined,
          guest_email: p.guest_email ?? undefined,
          guest_phone: p.guest_phone ?? undefined,
          down_payment: p.down_payment,
          amount_paid: p.amount_paid,
          total_amount: p.total_amount,
          remaining_balance: p.remaining_balance,
          payment_proof_url: p.payment_proof_url,
          payment_method: p.payment_method,
          updated_at: p.reviewed_at ?? p.created_at,
          status: p.payment_status ?? undefined,
          rejection_reason: p.rejection_reason,
        },
      };
      return row;
    });
  }, [paymentsRaw]);

  // combined loading flag for UI skeletons
  const isLoadingTable = isPaymentsLoading || isPaymentsFetching;

  // Handlers
  const handleView = useCallback((row: PaymentRow) => {
    if (!row?.id) {
      toast.error("Payment ID not available");
      return;
    }
    setSelectedPayment(row);
    setIsViewModalOpen(true);
  }, []);

  const handleCloseView = useCallback(() => {
    setSelectedPayment(null);
    setIsViewModalOpen(false);
  }, []);

  const handleConfirmApprove = useCallback(
    async (payment: PaymentRow, amount: number) => {
      if (!payment?.id) {
        toast.error("Payment ID not available");
        return;
      }

      setUpdatingPaymentId(payment.id);
      const toastId = toast.loading("Approving payment...");
      try {
        // amount_paid is maintained server-side via collect_amount

        // No client-side aggregation — send the collect_amount to the server and
        // let it apply changes atomically (server will clamp and compute the
        // new down_payment / amount_paid / remaining_balance).

        const payload: Partial<UpdateBookingPaymentPayload> & {
          id: string;
          collect_amount?: number;
        } = {
          id: payment.id,
          payment_status: "approved",
          collect_amount: Number(amount),
        };

        await updateBookingPayment(payload).unwrap();
        toast.success("Payment approved", { id: toastId });

        // Refresh payments and update UI
        await refetch();

        // Close the approve modal (keeping the view open to show updated data)
        setIsApproveModalOpen(false);

        // compute and show change modal (leftover amount to return to guest)
        // determine how much of the entered amount is applied to the remaining balance
        const prevRemainingForChange = (() => {
          const explicit = payment.booking?.remaining_balance;
          if (typeof explicit !== "undefined" && explicit !== null)
            return Number(explicit);
          const totalAmt = Number(payment.booking?.total_amount ?? NaN);
          const paidAmt = Number(
            payment.booking?.amount_paid ?? payment.booking?.down_payment ?? 0,
          );
          return !Number.isNaN(totalAmt) ? Math.max(0, totalAmt - paidAmt) : 0;
        })();
        const appliedAmountForChange = Math.min(
          Math.max(Number(amount), 0),
          Math.max(prevRemainingForChange, 0),
        );
        const changeAmt = Math.max(0, Number(amount) - appliedAmountForChange);
        setChangeAmount(changeAmt);
        setIsChangeModalOpen(true);
      } catch (err) {
        console.error("Approve error:", err);
        let msg = "Failed to approve payment";
        // Prefer server-provided message when available and perform safe type checks.
        if (err && typeof err === "object") {
          const errObj = err as Record<string, unknown>;
          const data = errObj["data"];
          if (data && typeof data === "object") {
            const dataObj = data as Record<string, unknown>;
            if (typeof dataObj["error"] === "string") {
              msg = dataObj["error"] as string;
            } else if (typeof dataObj["message"] === "string") {
              msg = dataObj["message"] as string;
            }
          } else {
            if (typeof errObj["error"] === "string") {
              msg = errObj["error"] as string;
            } else if (typeof errObj["message"] === "string") {
              msg = errObj["message"] as string;
            }
          }
        } else if (typeof err === "string") {
          msg = err;
        }
        toast.error(msg, { id: toastId });
      } finally {
        setUpdatingPaymentId(null);
      }
    },
    [updateBookingPayment, refetch],
  );

  const onSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openRejectModal = useCallback((row: PaymentRow) => {
    if (!row?.id) {
      toast.error("Payment ID not available");
      return;
    }
    // Keep the selected payment set so the reject modal has context,
    // and close the view modal before opening the reject modal.
    setSelectedPayment(row);
    setIsViewModalOpen(false);
    setIsRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(
    async (id: string, reason: string) => {
      if (!id) {
        toast.error("Payment ID not available");
        return;
      }
      setUpdatingPaymentId(id);
      const toastId = toast.loading("Rejecting payment...");
      try {
        await updateBookingPayment({
          id,
          payment_status: "rejected",
          rejection_reason: reason || undefined,
        }).unwrap();
        toast.success("Payment rejected", { id: toastId });
        refetch();
        setIsRejectModalOpen(false);
        setSelectedPayment(null);
      } catch (err) {
        console.error("Reject error:", err);
        toast.error("Failed to reject payment", { id: toastId });
      } finally {
        setUpdatingPaymentId(null);
      }
    },
    [updateBookingPayment, refetch],
  );

  const handleCancelReject = useCallback(() => {
    setIsRejectModalOpen(false);
    setSelectedPayment(null);
  }, []);

  const filteredPayments = useMemo(() => {
    const q = (searchTerm || "").toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        payment.booking_id.toLowerCase().includes(q) ||
        payment.guest.toLowerCase().includes(q);

      const matchesFilter =
        filterStatus === "all" || payment.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, payments, searchTerm]);

  const sortedPayments = useMemo(() => {
    const copy = [...filteredPayments];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      // Numeric sorts for the new currency columns
      if (sortField === "totalAmount") {
        const aNum = a.totalAmountValue ?? 0;
        const bNum = b.totalAmountValue ?? 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }
      if (sortField === "downPayment") {
        const aNum = a.downPaymentValue ?? 0;
        const bNum = b.downPaymentValue ?? 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }
      if (sortField === "amountPaid") {
        const aNum = a.amountPaidValue ?? 0;
        const bNum = b.amountPaidValue ?? 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }
      if (sortField === "remaining") {
        const aNum = a.remainingValue ?? 0;
        const bNum = b.remainingValue ?? 0;
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }
      const key = String(sortField);
      const aVal = String(
        (a as unknown as Record<string, unknown>)[key] ?? "",
      ).toLowerCase();
      const bVal = String(
        (b as unknown as Record<string, unknown>)[key] ?? "",
      ).toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredPayments, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedPayments.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedPayments = sortedPayments.slice(startIndex, endIndex);

  const handleSort = (field: keyof PaymentRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Use unfiltered payments for summary counts so counts don't change with status filter
  const totalCount = (paymentsAll || []).length;
  const paidCount = (paymentsAll || []).filter(
    (p) => mapStatusToUI(p.payment_status) === "Paid",
  ).length;
  const pendingCount = (paymentsAll || []).filter(
    (p) => mapStatusToUI(p.payment_status) === "Pending",
  ).length;
  const rejectedCount = (paymentsAll || []).filter(
    (p) => mapStatusToUI(p.payment_status) === "Rejected",
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Payments Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage payment submissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Payments",
            value: String(totalCount),
            color: "bg-green-500",
            icon: DollarSign,
          },
          {
            label: "Paid",
            value: String(paidCount),
            color: "bg-emerald-500",
            icon: CheckCircle,
          },
          {
            label: "Pending",
            value: String(pendingCount),
            color: "bg-yellow-500",
            icon: Clock,
          },
          {
            label: "Rejected",
            value: String(rejectedCount),
            color: "bg-red-500",
            icon: XCircle,
          },
        ].map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-transform duration-200 transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                Show
              </label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                entries
              </label>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by booking ID or guest name..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  value === "all" ||
                  ["Paid", "Pending", "Rejected"].includes(value)
                ) {
                  setFilterStatus(value as "all" | PaymentStatus);
                }
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th
                  onClick={() => handleSort("booking_id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Booking ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("guest")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Guest
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("totalAmount")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Total Amount
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("downPayment")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Down Payment
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("amountPaid")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount Paid
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("remaining")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Remaining Balance
                    <span
                      title="Remaining Balance = Total Amount - Amount Paid"
                      className="ml-1 text-gray-400 flex items-center"
                    >
                      <Info className="w-4 h-4" />
                    </span>
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>

                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Payment Proof
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            {isLoadingTable ? (
              <TableSkeleton rows={entriesPerPage} />
            ) : (
              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr
                    key={payment.booking_id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                        {payment.booking_id}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {payment.guest}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">
                        {payment.totalAmount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">
                        {payment.downPayment}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">
                        {payment.amountPaid}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold text-sm whitespace-nowrap ${
                          (payment.remainingValue ?? 0) > 0
                            ? "text-orange-700 dark:text-orange-300"
                            : "text-green-700 dark:text-green-300"
                        }`}
                      >
                        {payment.remaining}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {payment.payment_proof ? (
                        <a
                          href={payment.payment_proof}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          No proof
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${payment.statusColor}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(payment)}
                          className="p-2 inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View"
                          type="button"
                          aria-label={`View ${payment.booking_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsApproveModalOpen(true);
                          }}
                          disabled={
                            !payment.id || updatingPaymentId === payment.id
                          }
                          className="p-2 inline-flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Approve"
                          type="button"
                          aria-label={`Approve booking ${payment.booking_id}`}
                        >
                          {updatingPaymentId === payment.id ? (
                            <svg
                              className="animate-spin inline-block align-middle h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => openRejectModal(payment)}
                          disabled={
                            !payment.id || updatingPaymentId === payment.id
                          }
                          className="p-2 inline-flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reject"
                          type="button"
                          aria-label={`Reject booking ${payment.booking_id}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden p-4">
        {isLoadingTable ? (
          <div className="space-y-4">
            {Array.from({ length: Math.min(entriesPerPage, 5) }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                  <div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>

                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                  <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 pb-3">
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedPayments.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No payments found
          </div>
        ) : (
          paginatedPayments.map((payment) => (
            <div
              key={payment.booking_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-transform duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Booking ID
                  </p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">
                    {payment.booking_id}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${payment.statusColor}`}
                >
                  {payment.status}
                </span>
              </div>

              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Guest
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                    {payment.guest}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 pb-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Total Amount
                  </p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">
                    {payment.totalAmount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Down Payment
                  </p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">
                    {payment.downPayment}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Amount Paid
                  </p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">
                    {payment.amountPaid}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                    Remaining Balance
                    <span
                      title="Remaining Balance = Total Amount - Amount Paid"
                      className="text-gray-400 flex items-center"
                    >
                      <Info className="w-3 h-3" />
                    </span>
                  </p>
                  <p
                    className={`font-bold ${
                      (payment.remainingValue ?? 0) > 0
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-green-700 dark:text-green-300"
                    }`}
                  >
                    {payment.remaining}
                  </p>
                </div>
              </div>

              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Payment Proof
                </p>
                {payment.payment_proof ? (
                  <a
                    href={payment.payment_proof}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                  >
                    <ImageIcon className="w-4 h-4" /> View
                  </a>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    No proof
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => handleView(payment)}
                  className="p-2 inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  title="View"
                  type="button"
                  aria-label={`View ${payment.booking_id}`}
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setSelectedPayment(payment);
                    setIsApproveModalOpen(true);
                  }}
                  disabled={!payment.id || updatingPaymentId === payment.id}
                  className="p-2 inline-flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Approve"
                  type="button"
                  aria-label={`Approve booking ${payment.booking_id}`}
                >
                  {updatingPaymentId === payment.id ? (
                    <svg
                      className="animate-spin inline-block align-middle h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => openRejectModal(payment)}
                  disabled={!payment.id || updatingPaymentId === payment.id}
                  className="p-2 inline-flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reject"
                  type="button"
                  aria-label={`Reject booking ${payment.booking_id}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {sortedPayments.length === 0 ? 0 : startIndex + 1} to{" "}
              {Math.min(endIndex, sortedPayments.length)} of{" "}
              {sortedPayments.length} entries
              {searchTerm || filterStatus !== "all"
                ? ` (filtered from ${payments.length} total entries)`
                : ""}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
                type="button"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      currentPage === pageNum
                        ? "bg-orange-500 text-white shadow-md"
                        : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                    disabled={totalPages === 0}
                    type="button"
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
                type="button"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal (Booking Details styling, local implementation) */}
      {isViewModalOpen && selectedPayment && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleCloseView}
          />
          <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999]">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[60vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700">
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
                      Booking: {selectedPayment.booking_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseView}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Guest & Payment Info (status badge moved to the right side of this card header) */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      Payment Information
                    </h3>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColorClass(
                        selectedPayment.booking?.status ??
                          selectedPayment.status,
                      )}`}
                    >
                      {(
                        selectedPayment.booking?.status ??
                        selectedPayment.status ??
                        "unknown"
                      )
                        .toUpperCase()
                        .replace("-", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField
                      label="Booking ID"
                      value={selectedPayment.booking_id}
                    />
                    <InfoField label="Guest" value={selectedPayment.guest} />
                    <InfoField
                      label="Amount"
                      value={
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(
                            Number(selectedPayment.booking?.down_payment ?? 0),
                          )}
                        </span>
                      }
                    />
                    <InfoField
                      label="Payment Proof"
                      value={
                        selectedPayment.payment_proof ? (
                          <a
                            href={selectedPayment.payment_proof}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <ImageIcon className="w-4 h-4" /> View Proof
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-400">
                            No proof
                          </span>
                        )
                      }
                    />
                    <InfoField
                      label="Contact"
                      value={
                        selectedPayment.booking?.guest_email ??
                        selectedPayment.guest
                      }
                    />
                    {selectedPayment.booking?.status === "rejected" &&
                      selectedPayment.booking?.rejection_reason && (
                        <InfoField
                          label="Rejection Reason"
                          value={selectedPayment.booking.rejection_reason}
                        />
                      )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                    Payment Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField
                      label="Total Amount"
                      value={
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {selectedPayment.totalAmount}
                        </span>
                      }
                    />
                    <InfoField
                      label="Down Payment"
                      value={
                        <span className="text-green-700 dark:text-green-300 font-semibold">
                          {formatCurrency(
                            Number(selectedPayment.booking?.down_payment ?? 0),
                          )}
                        </span>
                      }
                    />
                    <InfoField
                      label="Amount Paid"
                      value={
                        <span className="text-green-700 dark:text-green-300 font-semibold">
                          {selectedPayment.amountPaid}
                        </span>
                      }
                    />
                    <InfoField
                      label="Remaining Balance"
                      value={
                        <span
                          className={`font-semibold ${
                            Number(selectedPayment.remainingValue ?? 0) > 0
                              ? "text-orange-700 dark:text-orange-300"
                              : "text-green-700 dark:text-green-300"
                          }`}
                        >
                          {selectedPayment.remaining}
                        </span>
                      }
                    />
                    <InfoField
                      label="Payment Method"
                      value={selectedPayment.booking?.payment_method ?? "—"}
                      capitalize
                    />
                  </div>
                </div>
              </div>

              {/* Footer (actions) */}
              <div className="flex items-center justify-between gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated:{" "}
                  {selectedPayment.booking?.updated_at
                    ? formatDate(selectedPayment.booking?.updated_at)
                    : "N/A"}
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseView}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedPayment) return;
                      setIsApproveModalOpen(true);
                    }}
                    disabled={
                      mapStatusToUI(
                        selectedPayment.booking?.status ??
                          selectedPayment.status,
                      ) === "Paid" || updatingPaymentId === selectedPayment.id
                    }
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 dark:from-orange-600 dark:to-yellow-600 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-yellow-600 dark:hover:from-orange-700 dark:hover:to-yellow-700 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setIsRejectModalOpen(true);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition inline-flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <RejectModal
        key={`reject-${selectedPayment?.id}`}
        isOpen={isRejectModalOpen}
        payment={selectedPayment}
        onCancel={handleCancelReject}
        onConfirm={handleConfirmReject}
        updatingPaymentId={updatingPaymentId}
      />
      <ApproveModal
        key={`approve-${selectedPayment?.id}`}
        isOpen={isApproveModalOpen}
        payment={selectedPayment}
        onCancel={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        updatingPaymentId={updatingPaymentId}
      />
      <ChangeModal
        key={`change-${selectedPayment?.id}`}
        isOpen={isChangeModalOpen}
        amount={changeAmount}
        onClose={() => setIsChangeModalOpen(false)}
      />
    </div>
  );
}
