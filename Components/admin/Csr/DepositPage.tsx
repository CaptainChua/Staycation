"use client";

import {
  Wallet,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  User,
  Eye,
  RotateCcw,
  Loader2,
  Trash2,
  CheckCircle,
  Clock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { getDeposits, DepositRecord, updateDepositStatus } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";

type DepositStatus = "Pending" | "Processing" | "Returned" | "Forfeited";

export default function DepositPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof DepositRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<DepositRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<DepositRecord | null>(null);
  const [modalType, setModalType] = useState<'view' | 'refund' | 'delete'>('view');

  const openModal = (booking: DepositRecord, type: 'view' | 'refund' | 'delete') => {
    setSelectedBooking(booking);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const confirmAction = async () => {
    if (!selectedBooking) return;

    if (modalType === 'refund') {
        await handleStatusUpdate(selectedBooking.deposit_id, "Returned");
    } else if (modalType === 'delete') {
         setRows((prev) => prev.filter((row) => row.deposit_id !== selectedBooking.deposit_id));
         toast.success("Record deleted");
    }
    closeModal();
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Client-side pagination: Fetch ALL data once
      const data = await getDeposits();
      
      // CRITICAL: Overwrite state completely. Do NOT append.
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
      toast.error("Failed to load deposits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        row.deposit_id.toLowerCase().includes(term) ||
        row.booking_id.toLowerCase().includes(term) ||
        row.guest.toLowerCase().includes(term) ||
        row.haven.toLowerCase().includes(term);

      const matchesFilter = filterStatus === "all" || row.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, rows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      const aSortable = (typeof aVal === 'string' ? aVal : String(aVal)).toLowerCase();
      const bSortable = (typeof bVal === 'string' ? bVal : String(bVal)).toLowerCase();
      
      if (sortField === 'deposit_amount') {
          return sortDirection === "asc" ? (a.deposit_amount - b.deposit_amount) : (b.deposit_amount - a.deposit_amount);
      }

      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortDirection, sortField]);

  // Strict Slicing Logic
  // Ensure we rely on the numeric state of entriesPerPage (default 10)
  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  
  // This MUST be a new array slice every render
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof DepositRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleStatusUpdate = async (deposit_id: string, newStatus: string) => {
      const oldRows = [...rows];
      setRows(prev => prev.map(r => r.deposit_id === deposit_id ? { ...r, status: newStatus } : r));
      
      try {
          await updateDepositStatus(deposit_id, newStatus);
          toast.success(`Haven deposit marked as ${newStatus}`);
      } catch (error) {
          setRows(oldRows);
          toast.error("Failed to update status");
      }
  };



  const totalCount = rows.length;
  const pendingCount = rows.filter((r) => r.status === "Pending").length;
  const processingCount = rows.filter((r) => r.status === "Processing").length;
  const returnedCount = rows.filter((r) => r.status === "Returned").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Deposits Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track deposits and manage refunds after checkout</p>
        </div>
        <button 
            onClick={fetchData}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Refresh Data"
        >
            <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Total Deposits", value: String(totalCount), color: "bg-indigo-500", icon: Wallet },
          { label: "Pending", value: String(pendingCount), color: "bg-yellow-500", icon: Clock },
          { label: "Processing", value: String(processingCount), color: "bg-purple-500", icon: Loader2 },
          { label: "Returned", value: String(returnedCount), color: "bg-green-500", icon: CheckCircle },
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</label>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by deposit ID, booking ID, guest, or haven..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => {
                const value = e.target.value;
                setFilterStatus(value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Returned">Returned</option>
              <option value="Forfeited">Forfeited</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section - Fixed height and scrollable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort("deposit_id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Deposit ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
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
                  onClick={() => handleSort("haven")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Haven
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("tower")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Tower
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("deposit_amount")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
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
                <th
                  onClick={() => handleSort("checkout_date")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Checkout Date
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                  <tr>
                      <td colSpan={9} className="py-20 text-center">
                          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading deposit records...</p>
                      </td>
                  </tr>
              ) : paginatedRows.length === 0 ? (
                  <tr>
                      <td colSpan={9} className="py-20 text-center">
                          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No deposits found</p>
                      </td>
                  </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.booking_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.deposit_id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.booking_id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.guest}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{row.haven}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.tower}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{row.formatted_amount}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        row.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                        row.status === "Processing" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" :
                        row.status === "Returned" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                        row.status === "Forfeited" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.checkout_date}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View Details"
                          type="button"
                          onClick={() => openModal(row, 'view')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Mark Returned"
                          type="button"
                          onClick={() => openModal(row, 'refund')}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Process"
                          type="button"
                          onClick={() => handleStatusUpdate(row.deposit_id, "Processing")}
                        >
                          <Loader2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Record"
                          type="button"
                          onClick={() => openModal(row, 'delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} entries
              {searchTerm || filterStatus !== "all" ? ` (filtered from ${rows.length} total entries)` : ""}
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
                        ? "bg-amber-600 text-white shadow-md"
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Pending</span>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Processing</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{processingCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Returned</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{returnedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
                 {modalType === 'view' && (
                    <>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Deposit Details</h3>
                         <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Haven Name</span>
                                <p className="text-gray-800 dark:text-gray-200">{selectedBooking.haven}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tower</span>
                                <p className="text-gray-800 dark:text-gray-200">{selectedBooking.tower}</p>
                            </div>
                             <div>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-out Date</span>
                                <p className="text-gray-800 dark:text-gray-200">{selectedBooking.checkout_date}</p>
                            </div>
                         </div>
                         <div className="mt-6 flex justify-end">
                             <button onClick={closeModal} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors">Close</button>
                         </div>
                    </>
                 )}

                 {modalType === 'refund' && (
                     <>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Confirm Refund</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to return the deposit for <span className="font-semibold">{selectedBooking.guest}</span>?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                            <button onClick={confirmAction} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">Confirm Refund</button>
                        </div>
                     </>
                 )}

                 {modalType === 'delete' && (
                     <>
                        <h3 className="text-lg font-bold mb-4 text-red-600 dark:text-red-400">Delete Record</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
                         <div className="flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
                            <button onClick={confirmAction} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Delete</button>
                        </div>
                     </>
                 )}
            </div>
        </div>
      )}
    </div>
  );
}