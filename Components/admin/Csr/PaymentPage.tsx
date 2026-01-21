"use client";

import {
  DollarSign,
  Search,
  Filter,
  Eye,
  CheckCircle,
  X,
  XCircle,
  Clock,
  ArrowUpDown,
  User,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Image as ImageIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  useGetBookingsQuery,
  useUpdateBookingStatusMutation,
} from "@/redux/api/bookingsApi";
type PaymentStatus = "Paid" | "Pending" | "Rejected";

interface PaymentRow {
  id?: string;
  booking_id: string;
  guest: string;
  amount: string;
  // numeric amount to allow numeric sorting
  amountValue?: number;
  payment_proof?: string | null;
  status: PaymentStatus;
  statusColor: string;
  // original booking payload for actions/modal view (local minimal type to avoid global refactor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking?: any;
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

  // Fetch bookings from backend (use status query when a specific filter is selected)
  const {
    data: bookingsRaw = [],
    isLoading: isBookingsLoading,
    isFetching: isBookingsFetching,
    refetch,
  } = useGetBookingsQuery(
    serverStatusParam ? { status: serverStatusParam } : undefined,
  );

  // Fetch all bookings for summary counts (unfiltered)
  const { data: bookingsAll } = useGetBookingsQuery();

  // bookings memo removed: mapping now uses bookingsRaw directly

  // Mutation for approve/reject
  const [updateBookingStatus] = useUpdateBookingStatusMutation();

  // Local UI state for modals and actions (local types used; avoid global booking types for now)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(
    null,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null,
  );

  // No detail fetch required for the lightweight payment view; we use the row data

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

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

  // Local InfoField component mirroring the Booking Details dialog style
  interface InfoFieldProps {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    capitalize?: boolean;
  }

  const InfoField = ({ label, value, icon, capitalize }: InfoFieldProps) => (
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

  const payments = useMemo<PaymentRow[]>(() => {
    return (bookingsRaw || []).map((b) => {
      const amountValue = Number(b.down_payment ?? b.total_amount ?? 0);
      const row: PaymentRow = {
        id: b.id,
        booking_id: b.booking_id!,
        guest: `${b.guest_first_name ?? ""} ${b.guest_last_name ?? ""}`.trim(),
        amount: formatCurrency(amountValue),
        amountValue,
        payment_proof: b.payment_proof_url ?? undefined,
        status: mapStatusToUI(b.status),
        statusColor: getStatusColorClass(b.status),
        booking: {
          id: b.id,
          booking_id: b.booking_id,
          guest_first_name: b.guest_first_name!,
          guest_last_name: b.guest_last_name!,
          guest_email: b.guest_email!,
          guest_phone: b.guest_phone!,
          down_payment: b.down_payment,
          total_amount: b.total_amount,
          remaining_balance: b.remaining_balance,
          payment_proof_url: b.payment_proof_url,
          status: b.status,
        },
      };
      return row;
    });
  }, [bookingsRaw]);

  // combined loading flag for UI skeletons
  const isLoadingTable = isBookingsLoading || isBookingsFetching;

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

  // Handlers
  const handleView = useCallback((row: PaymentRow) => {
    if (!row?.id) {
      toast.error("Booking ID not available");
      return;
    }
    setSelectedPayment(row);
    setIsViewModalOpen(true);
  }, []);

  const handleCloseView = useCallback(() => {
    setSelectedPayment(null);
    setIsViewModalOpen(false);
  }, []);

  const handleApprove = useCallback(
    async (row: PaymentRow) => {
      if (!row?.id) {
        toast.error("Booking ID not available");
        return;
      }
      setUpdatingBookingId(row.id);
      const toastId = toast.loading("Approving payment...");
      try {
        await updateBookingStatus({ id: row.id, status: "approved" }).unwrap();
        toast.success("Payment approved", { id: toastId });
        refetch();
      } catch (err) {
        console.error("Approve error:", err);
        toast.error("Failed to approve payment", { id: toastId });
      } finally {
        setUpdatingBookingId(null);
      }
    },
    [updateBookingStatus, refetch],
  );

  const openRejectModal = useCallback((row: PaymentRow) => {
    if (!row?.id) {
      toast.error("Booking ID not available");
      return;
    }
    // Keep the selected payment set so the reject modal has context,
    // and close the view modal before opening the reject modal.
    setSelectedPayment(row);
    setRejectReason("");
    setIsViewModalOpen(false);
    setIsRejectModalOpen(true);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!selectedPayment?.id) {
      toast.error("Booking ID not available");
      return;
    }
    setUpdatingBookingId(selectedPayment.id);
    const toastId = toast.loading("Rejecting payment...");
    try {
      await updateBookingStatus({
        id: selectedPayment.id,
        status: "rejected",
        rejection_reason: rejectReason || undefined,
      }).unwrap();
      toast.success("Payment rejected", { id: toastId });
      refetch();
      setIsRejectModalOpen(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to reject payment", { id: toastId });
    } finally {
      setUpdatingBookingId(null);
    }
  }, [selectedPayment, rejectReason, updateBookingStatus, refetch]);

  const handleCancelReject = useCallback(() => {
    setRejectReason("");
    setIsRejectModalOpen(false);
    setSelectedPayment(null);
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.guest.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "all" || payment.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, payments, searchTerm]);

  const sortedPayments = useMemo(() => {
    const copy = [...filteredPayments];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      // Numeric sort for amount (use amountValue)
      if (sortField === "amount") {
        const aNum = a.amountValue ?? 0;
        const bNum = b.amountValue ?? 0;
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

  // Use unfiltered bookings for summary counts so counts don't change with status filter
  const totalCount = (bookingsAll || []).length;
  const paidCount = (bookingsAll || []).filter(
    (b) => mapStatusToUI(b.status) === "Paid",
  ).length;
  const pendingCount = (bookingsAll || []).filter(
    (b) => mapStatusToUI(b.status) === "Pending",
  ).length;
  const rejectedCount = (bookingsAll || []).filter(
    (b) => mapStatusToUI(b.status) === "Rejected",
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
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  onClick={() => handleSort("amount")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
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
                        {payment.amount}
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
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View"
                          type="button"
                          aria-label={`View ${payment.booking_id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleApprove(payment)}
                          disabled={
                            !payment.id || updatingBookingId === payment.id
                          }
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Approve"
                          type="button"
                          aria-label={`Approve booking ${payment.booking_id}`}
                        >
                          {updatingBookingId === payment.id ? (
                            <svg
                              className="animate-spin h-4 w-4"
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
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => openRejectModal(payment)}
                          disabled={
                            !payment.id || updatingBookingId === payment.id
                          }
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reject"
                          type="button"
                          aria-label={`Reject booking ${payment.booking_id}`}
                        >
                          <XCircle className="w-4 h-4" />
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

      <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        {paginatedPayments.map((payment) => (
          <div
            key={payment.booking_id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
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

            <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Amount
                </p>
                <p className="font-bold text-gray-800 dark:text-gray-100">
                  {payment.amount}
                </p>
              </div>
              <div>
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
                    <ImageIcon className="w-4 h-4" />
                    View
                  </a>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    No proof
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => handleView(payment)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="View"
                type="button"
                aria-label={`View ${payment.booking_id}`}
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleApprove(payment)}
                disabled={!payment.id || updatingBookingId === payment.id}
                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Approve"
                type="button"
                aria-label={`Approve booking ${payment.booking_id}`}
              >
                {updatingBookingId === payment.id ? (
                  <svg
                    className="animate-spin h-5 w-5"
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
                disabled={!payment.id || updatingBookingId === payment.id}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reject"
                type="button"
                aria-label={`Reject booking ${payment.booking_id}`}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
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
              {/* Header (sticky, gradient) */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-yellow-500 dark:from-orange-600 dark:to-yellow-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-90">
                    Payment Details
                  </p>
                  <h2 className="text-3xl font-bold mt-1">
                    {selectedPayment.booking_id}
                  </h2>
                </div>
                <button
                  onClick={handleCloseView}
                  className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
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
                    <InfoField label="Amount" value={selectedPayment.amount} />
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
                          {formatCurrency(
                            Number(selectedPayment.booking?.total_amount ?? 0),
                          )}
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
                      label="Remaining Balance"
                      value={
                        <span className="text-orange-700 dark:text-orange-300 font-semibold">
                          {formatCurrency(
                            Number(
                              selectedPayment.booking?.remaining_balance ?? 0,
                            ),
                          )}
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
              <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-3 bg-white dark:bg-gray-900">
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
                    onClick={async () => {
                      await handleApprove(selectedPayment);
                      handleCloseView();
                    }}
                    disabled={
                      mapStatusToUI(
                        selectedPayment.booking?.status ??
                          selectedPayment.status,
                      ) === "Paid" || updatingBookingId === selectedPayment.id
                    }
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 dark:from-orange-600 dark:to-yellow-600 text-white font-semibold shadow-lg hover:from-orange-600 hover:to-yellow-600 dark:hover:from-orange-700 dark:hover:to-yellow-700 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Close the view modal and open the reject modal without
                      // clearing `selectedPayment` so the reject modal has its context.
                      setRejectReason("");
                      setIsViewModalOpen(false);
                      setIsRejectModalOpen(true);
                    }}
                    disabled={
                      mapStatusToUI(
                        selectedPayment.booking?.status ??
                          selectedPayment.status,
                      ) === "Rejected" ||
                      updatingBookingId === selectedPayment.id
                    }
                    className="px-6 py-2.5 rounded-xl bg-red-600 dark:bg-red-600 text-white font-semibold hover:bg-red-700 dark:hover:bg-red-700 transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reject Booking Modal (uses selectedPayment) */}
      {isRejectModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-[9999]">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancelReject}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
                Reject Payment
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Provide a reason for rejecting the payment (optional).
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 mb-4"
                rows={4}
                placeholder="Rejection reason (optional)"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelReject}
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  type="button"
                  disabled={updatingBookingId === selectedPayment.id}
                  className="px-4 py-2 rounded-lg bg-red-600 dark:bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {updatingBookingId === selectedPayment.id ? (
                    <svg
                      className="animate-spin h-4 w-4 inline-block"
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
                    "Reject Payment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
