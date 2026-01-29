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
import { useSession } from "next-auth/react";
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
  created_at?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking?: any;
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  capitalize?: boolean;
}

const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  icon,
  capitalize = false,
}) => (
  <div className="flex items-start space-x-2">
    {icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-medium ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  </div>
);

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <tbody>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={8} className="py-4 px-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `₱${Number(amount || 0).toFixed(2)}`;
  }
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};

const mapStatusToUI = (status?: string | null): PaymentStatus => {
  const s = (status ?? "").toLowerCase();
  if (s === "approved" || s === "paid") return "Paid";
  if (s === "rejected") return "Rejected";
  return "Pending";
};

const getStatusColorClass = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (s === "approved" || s === "paid") return "bg-green-100 text-green-800";
  if (s === "rejected") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
};

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
        setLocalAmount(remaining > 0 ? String(remaining) : "");
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof PaymentRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { data: session } = useSession();

  const logEmployeeActivity = useCallback(
    async (
      activityType: string,
      description: string,
      entityType?: string | null,
      entityId?: string | null,
    ) => {
      const employeeId = session?.user?.id;
      if (!employeeId) return;
      try {
        await fetch("/api/admin/activity-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: employeeId,
            activity_type: activityType,
            description,
            entity_type: entityType ?? null,
            entity_id: entityId ?? null,
          }),
        });
      } catch (err) {
        console.error("Failed to create employee activity log:", err);
      }
    },
    [session?.user?.id],
  );

  // Compute server-side filter status (map UI filter to DB values)
  const serverStatusParam =
    statusFilter === "all"
      ? undefined
      : statusFilter === "Paid"
        ? "approved"
        : statusFilter.toLowerCase();

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
  const handleView = useCallback(
    (row: PaymentRow) => {
      if (!row?.id) {
        toast.error("Payment ID not available");
        return;
      }
      // Log view action (fire-and-forget)
      logEmployeeActivity?.(
        "VIEW_PAYMENT",
        `Viewed payment ${row.booking_id}`,
        "payment",
        row.id,
      );
      setSelectedPayment(row);
      setIsViewModalOpen(true);
    },
    [logEmployeeActivity],
  );

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

      // Compute the change amount upfront and show the change modal immediately
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

      // Optimistically close the approve modal and show the change modal so the
      // user sees immediate feedback while the server processes the request.
      setIsApproveModalOpen(false);
      setChangeAmount(changeAmt);
      setIsChangeModalOpen(true);
      // Log change modal display
      logEmployeeActivity?.(
        "SHOW_CHANGE_MODAL",
        `Displayed change modal for booking ${payment.booking_id} with change amount ${changeAmt}`,
        "payment",
        payment.id,
      );

      // Show an immediate success toast; we'll update it to an
      // error message if the server rejects the mutation.
      const toastId = toast.success("Payment approved");

      // Log client-side attempt to approve
      logEmployeeActivity?.(
        "ATTEMPT_APPROVE_PAYMENT",
        `Attempted to approve payment ${payment.booking_id} with amount ${amount}`,
        "payment",
        payment.id,
      );

      try {
        // amount_paid is maintained server-side via collect_amount.
        const payload: Partial<UpdateBookingPaymentPayload> & {
          id: string;
          collect_amount?: number;
          reviewed_by?: string | null;
        } = {
          id: payment.id,
          payment_status: "approved",
          collect_amount: Number(amount),
          reviewed_by: session?.user?.id ?? undefined,
        };

        await updateBookingPayment(payload).unwrap();
        // optimistic update — no success toast (UI already reflects change)

        // Refresh payments and update UI (server authoritative)
        await refetch();
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
        toast.error(
          `Failed to approve payment: ${msg}. Reverting optimistic changes and restoring UI.`,
          { id: toastId },
        );

        // Roll back UI changes if the mutation failed
        setIsChangeModalOpen(false);
        setChangeAmount(0);
        setIsApproveModalOpen(true);
      } finally {
        setUpdatingPaymentId(null);
      }
    },
    [updateBookingPayment, refetch, logEmployeeActivity, session],
  );

  const handleConfirmReject = useCallback(
    async (id: string, reason: string) => {
      if (!id) {
        toast.error("Payment ID not available");
        return;
      }

      const originalSelected = selectedPayment;
      setUpdatingPaymentId(id);

      // Optimistically close modal and clear selection so the UI responds
      setIsRejectModalOpen(false);
      setSelectedPayment(null);

      const toastId = toast.success("Payment rejected");

      logEmployeeActivity?.(
        "ATTEMPT_REJECT_PAYMENT",
        `Attempted to reject payment ${id} with reason: ${reason || "N/A"}`,
        "payment",
        id,
      );

      try {
        await updateBookingPayment({
          id,
          payment_status: "rejected",
          rejection_reason: reason || undefined,
          reviewed_by: session?.user?.id ?? undefined,
        }).unwrap();
        await refetch();
      } catch (err) {
        console.error("Reject error:", err);
        let msg = "Failed to reject payment";
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
        toast.error(
          `Failed to reject payment: ${msg}. Reverting optimistic changes and restoring UI.`,
          { id: toastId },
        );

        // Restore selection and reopen the reject modal so the user can retry
        setSelectedPayment(originalSelected);
        setIsRejectModalOpen(true);
      } finally {
        setUpdatingPaymentId(null);
      }
    },
    [
      updateBookingPayment,
      refetch,
      selectedPayment,
      logEmployeeActivity,
      session,
    ],
  );

  const openRejectModal = useCallback(
    (row: PaymentRow) => {
      if (!row?.id) {
        toast.error("Payment ID not available");
        return;
      }
      // Log modal open
      logEmployeeActivity?.(
        "OPEN_REJECT_MODAL",
        `Opened reject modal for booking ${row.booking_id}`,
        "payment",
        row.id,
      );
      // Keep the selected payment set so the reject modal has context,
      // and close the view modal before opening the reject modal.
      setSelectedPayment(row);
      setIsViewModalOpen(false);
      setIsRejectModalOpen(true);
    },
    [logEmployeeActivity],
  );

  const handleCancelReject = useCallback(() => {
    logEmployeeActivity?.(
      "CANCEL_REJECT_MODAL",
      `Cancelled reject for payment ${selectedPayment?.booking_id ?? "N/A"}`,
      "payment",
      selectedPayment?.id ?? null,
    );
    setIsRejectModalOpen(false);
    setSelectedPayment(null);
  }, [logEmployeeActivity, selectedPayment]);

  const filteredPayments = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        q === "" ||
        payment.booking_id.toLowerCase().includes(q) ||
        payment.guest.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const sortedPayments = useMemo(() => {
    const copy = [...filteredPayments];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      // Numeric sorts for the currency columns
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

  // Pagination (apply on sorted results)
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedPayments.length);
  const paginatedPayments = useMemo(() => {
    return sortedPayments.slice(startIndex, endIndex);
  }, [sortedPayments, startIndex, endIndex]);

  const handleSort = (field: keyof PaymentRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const colors = {
      Paid: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
      >
        {status}
      </span>
    );
  };

  if (isLoadingTable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Management
        </h1>
        <p className="text-gray-600">Manage and review booking payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  filteredPayments.reduce(
                    (sum, p) => sum + (p.totalAmountValue ?? 0),
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredPayments.filter((p) => p.status === "Paid").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredPayments.filter((p) => p.status === "Pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredPayments.filter((p) => p.status === "Rejected").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by booking ID or guest name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("booking_id")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Booking ID</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            {isLoadingTable ? (
              <TableSkeleton rows={itemsPerPage} />
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
                          onClick={() =>
                            logEmployeeActivity?.(
                              "VIEW_PAYMENT_PROOF",
                              `Viewed payment proof for booking ${payment.booking_id}`,
                              "payment",
                              payment.id,
                            )
                          }
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
                            logEmployeeActivity?.(
                              "OPEN_APPROVE_MODAL",
                              `Opened approve modal for booking ${payment.booking_id}`,
                              "payment",
                              payment.id,
                            );
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing {sortedPayments.length === 0 ? 0 : startIndex + 1} to{" "}
                {endIndex} of {sortedPayments.length} entries
                {searchTerm || statusFilter !== "all"
                  ? ` (filtered from ${payments.length} total entries)`
                  : ""}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {sortedPayments.length === 0 ? 0 : startIndex + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * itemsPerPage,
                        sortedPayments.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{sortedPayments.length}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronsLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronsRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Modal */}
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
                              Number(
                                selectedPayment.booking?.down_payment ?? 0,
                              ),
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
                              Number(
                                selectedPayment.booking?.down_payment ?? 0,
                              ),
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
    </div>
  );
}
