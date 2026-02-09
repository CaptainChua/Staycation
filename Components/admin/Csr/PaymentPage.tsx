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
  CheckSquare,
  Loader2,
} from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { UpdateBookingPaymentPayload } from "@/types/bookingPayment";
import {
  useGetBookingPaymentsQuery,
  useUpdateBookingPaymentMutation,
} from "@/redux/api/bookingPaymentsApi";
import type { PaymentStatus, PaymentRow } from "./types";
import { formatCurrency } from "./utils";
import ApproveModal from "./Modals/ApproveModal";
import RejectModal from "./Modals/RejectModal";
import ChangeModal from "./Modals/ChangeModal";
import ViewPaymentModal from "./Modals/ViewPaymentModal";

// Payment types are imported from ./types

/* InfoField removed — unused in this file */

// Currency and date formatting helpers moved to ./utils

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

/* Small table skeleton rows (used while bookings are loading) */
const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <tbody>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
        {/* Select */}
        <td className="py-4 px-4">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Booking ID */}
        <td className="py-4 px-4">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Guest */}
        <td className="py-4 px-4">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Total Amount */}
        <td className="py-4 px-4 text-right">
          <div className="h-4 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Down Payment */}
        <td className="py-4 px-4 text-right">
          <div className="h-4 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Amount Paid */}
        <td className="py-4 px-4 text-right">
          <div className="h-4 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Remaining Balance */}
        <td className="py-4 px-4 text-right">
          <div className="h-4 w-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Payment Proof */}
        <td className="py-4 px-4 text-center">
          <div className="h-4 w-20 mx-auto bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>

        {/* Status */}
        <td className="py-4 px-4 text-center">
          <div className="h-6 w-20 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </td>

        {/* Actions */}
        <td className="py-4 px-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

// RejectModal component moved to ./Modals/RejectModal

// ApproveModal component moved to ./Modals/ApproveModal

// ChangeModal component moved to ./Modals/ChangeModal

export default function PaymentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PaymentStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
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
            action_type: activityType,
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
  // Tracks which action is currently being performed for the payment id above.
  // This allows us to show the spinner on the correct action icon (approve vs reject).
  const [updatingAction, setUpdatingAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Bulk selection state
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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
      setUpdatingAction("approve");

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
        setUpdatingAction(null);
      }
    },
    [updateBookingPayment, refetch, logEmployeeActivity, session],
  );

  const onSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleConfirmReject = useCallback(
    async (id: string, reason: string) => {
      if (!id) {
        toast.error("Payment ID not available");
        return;
      }
      // Keep the selected payment so we can restore it if the mutation fails
      const originalSelected = selectedPayment;

      setUpdatingPaymentId(id);
      setUpdatingAction("reject");

      // Optimistically close modal and clear selection so the UI responds
      setIsRejectModalOpen(false);
      setSelectedPayment(null);

      // Show an immediate success toast; we'll update it if the
      // server rejects the mutation.
      const toastId = toast.success("Payment rejected");

      // Log client-side attempt to reject
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
        // optimistic update — no success toast (UI already reflects change)
        refetch();
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
        setUpdatingAction(null);
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

  // Visible IDs on the current page (filter out undefined ids for type-safety)
  const visiblePaymentIds = paginatedPayments
    .map((p) => p.id)
    .filter((id): id is string => typeof id === "string");

  // Bulk selection helpers & processing
  const handleSelectPayment = (id: string, checked: boolean) => {
    setSelectedPayments((prev) =>
      checked ? [...prev, id] : prev.filter((p) => p !== id),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Use only visible, defined ids for selection (avoids `undefined` values)
      setSelectedPayments(visiblePaymentIds);
    } else {
      setSelectedPayments([]);
    }
  };

  const processBulkApprove = async () => {
    if (selectedPayments.length === 0) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedPayments.map((id) => {
          // Find the corresponding payment row to determine the appropriate
          // collect_amount (prefer submitted down_payment, otherwise use remaining)
          const payment = payments.find((p) => p.id === id);
          const submittedDown =
            typeof payment?.booking?.down_payment === "number"
              ? Number(payment!.booking!.down_payment)
              : undefined;
          const fallbackRemaining = Number(payment?.remainingValue ?? 0);
          const collect_amount =
            typeof submittedDown !== "undefined" && submittedDown > 0
              ? submittedDown
              : Math.max(0, fallbackRemaining);

          const payload: Partial<UpdateBookingPaymentPayload> & {
            id: string;
            collect_amount?: number;
            reviewed_by?: string | null;
          } = {
            id,
            payment_status: "approved",
            reviewed_by: session?.user?.id ?? undefined,
          };

          if (collect_amount > 0) {
            payload.collect_amount = collect_amount;
          }

          return updateBookingPayment(payload).unwrap();
        }),
      );
      toast.success(`${selectedPayments.length} payment(s) approved`);
      logEmployeeActivity?.(
        "BULK_APPROVE_PAYMENTS",
        `Approved ${selectedPayments.length} payments`,
        "payment",
        null,
      );
      setSelectedPayments([]);
      await refetch();
    } catch (err) {
      console.error("Bulk approve failed:", err);
      toast.error("Failed to approve selected payments");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const processBulkReject = async (reason?: string) => {
    if (selectedPayments.length === 0) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedPayments.map((id) =>
          updateBookingPayment({
            id,
            payment_status: "rejected",
            rejection_reason: reason || undefined,
            reviewed_by: session?.user?.id ?? undefined,
          }).unwrap(),
        ),
      );
      toast.success(`${selectedPayments.length} payment(s) rejected`);
      logEmployeeActivity?.(
        "BULK_REJECT_PAYMENTS",
        `Rejected ${selectedPayments.length} payments`,
        "payment",
        null,
      );
      setSelectedPayments([]);
      await refetch();
    } catch (err) {
      console.error("Bulk reject failed:", err);
      toast.error("Failed to reject selected payments");
    } finally {
      setBulkActionLoading(false);
    }
  };

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

      {/* Bulk Actions Bar */}
      {selectedPayments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {selectedPayments.length} payment
                {selectedPayments.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => processBulkApprove()}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
                type="button"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Approve
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const reason = window.prompt("Rejection reason (optional):");
                  if (reason === null) return;
                  processBulkReject(reason);
                }}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
                type="button"
              >
                {bulkActionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" /> Reject
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedPayments([])}
                disabled={bulkActionLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
                type="button"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

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
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        visiblePaymentIds.length > 0 &&
                        selectedPayments.length === visiblePaymentIds.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span>Select</span>
                  </div>
                </th>
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
                    key={payment.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={
                          payment.id
                            ? selectedPayments.includes(payment.id)
                            : false
                        }
                        onChange={(e) =>
                          payment.id &&
                          handleSelectPayment(payment.id, e.target.checked)
                        }
                        className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                      />
                    </td>
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
                          {updatingPaymentId === payment.id &&
                          updatingAction === "approve" ? (
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
                          {updatingPaymentId === payment.id &&
                          updatingAction === "reject" ? (
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
                            <X className="w-4 h-4" />
                          )}
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
              key={payment.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-transform duration-200 transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      payment.id ? selectedPayments.includes(payment.id) : false
                    }
                    onChange={(e) =>
                      payment.id &&
                      handleSelectPayment(payment.id, e.target.checked)
                    }
                    className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                  />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Booking ID
                    </p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">
                      {payment.booking_id}
                    </p>
                  </div>
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
                    onClick={() =>
                      logEmployeeActivity?.(
                        "VIEW_PAYMENT_PROOF",
                        `Viewed payment proof for booking ${payment.booking_id}`,
                        "payment",
                        payment.id,
                      )
                    }
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
                    logEmployeeActivity?.(
                      "OPEN_APPROVE_MODAL",
                      `Opened approve modal for booking ${payment.booking_id}`,
                      "payment",
                      payment.id,
                    );
                  }}
                  disabled={!payment.id || updatingPaymentId === payment.id}
                  className="p-2 inline-flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Approve"
                  type="button"
                  aria-label={`Approve booking ${payment.booking_id}`}
                >
                  {updatingPaymentId === payment.id &&
                  updatingAction === "approve" ? (
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
                  {updatingPaymentId === payment.id &&
                  updatingAction === "reject" ? (
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
                    <X className="w-4 h-4" />
                  )}
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
      <ViewPaymentModal
        isOpen={isViewModalOpen}
        payment={selectedPayment}
        onClose={handleCloseView}
      />

      <RejectModal
        key={`reject-${selectedPayment?.id}`}
        isOpen={isRejectModalOpen}
        payment={selectedPayment}
        onCancelAction={handleCancelReject}
        onConfirmAction={handleConfirmReject}
        updatingPaymentId={updatingPaymentId}
        updatingAction={updatingAction}
      />
      <ApproveModal
        key={`approve-${selectedPayment?.id}`}
        isOpen={isApproveModalOpen}
        payment={selectedPayment}
        onCancelAction={() => setIsApproveModalOpen(false)}
        onConfirmAction={handleConfirmApprove}
        updatingPaymentId={updatingPaymentId}
        updatingAction={updatingAction}
      />
      <ChangeModal
        key={`change-${selectedPayment?.id}`}
        isOpen={isChangeModalOpen}
        amount={changeAmount}
        onCloseAction={() => setIsChangeModalOpen(false)}
      />
    </div>
  );
}
