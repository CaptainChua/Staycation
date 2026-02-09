"use client";

import {
  Plus,
  Trash2,
  Calendar,
  Search,
  Loader2,
  Edit,
  X,
  CalendarOff,
  Building2,
  Filter,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  useGetBlockedDatesQuery,
  useCreateBlockedDateMutation,
  useUpdateBlockedDateMutation,
  useDeleteBlockedDateMutation,
} from "@/redux/api/blockedDatesApi";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import toast from "react-hot-toast";
import BlockedDatesModal from "./Modals/BlockedDatesModal";

interface BlockedDate {
  id: string;
  haven_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
  status?: string;
  created_at: string;
  haven_name?: string;
  tower?: string;
  floor?: string;
}

interface Haven {
  uuid_id: string;
  haven_name: string;
  tower?: string;
  floor?: string;
}

interface BlockedDateFormData {
  haven_id: string;
  from_date: string;
  to_date: string;
  reason: string;
}


const BlockedDatesManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHaven, setFilterHaven] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Fetch blocked dates - initially fetch all, then filter by haven if selected
  const { data: blockedDatesData, isLoading: isLoadingBlockedDates, error: blockedDatesError, refetch: refetchBlockedDates } =
    useGetBlockedDatesQuery({});

  // Fetch havens for dropdown
  const { data: havensData } = useGetHavensQuery({});

  // Manual refresh function like InventoryPage
  const handleManualRefresh = async () => {
    setRefreshLoading(true);
    try {
      // Refetch the blocked dates data using RTK Query's refetch function
      await refetchBlockedDates();
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshLoading(false);
    }
  };

  // Mutations
  const [createBlockedDate, { isLoading: isCreating }] =
    useCreateBlockedDateMutation();
  const [updateBlockedDate, { isLoading: isUpdating }] =
    useUpdateBlockedDateMutation();
  const [deleteBlockedDate, { isLoading: isDeleting }] =
    useDeleteBlockedDateMutation();

  const blockedDates = blockedDatesData?.data || [];
  const havens: Haven[] = (havensData as Haven[]) || [];

  // Debug logging
  console.log('BlockedDates Debug:', {
    isLoadingBlockedDates,
    blockedDatesError,
    blockedDatesData,
    blockedDates,
    havens
  });

  // Get unique havens for filter dropdown
  const uniqueHavens = Array.from(
    new Map(havens.map((h: Haven) => [h.uuid_id, h])).values()
  );

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    const totalBlockedDates = blockedDates.length;
    const activeBlocks = blockedDates.filter((date: BlockedDate) => {
      const toDate = new Date(date.to_date);
      return toDate >= today;
    }).length;
    const expiredBlocks = totalBlockedDates - activeBlocks;
    const affectedHavens = new Set(blockedDates.map((d: BlockedDate) => d.haven_id)).size;

    return [
      { label: "Total Blocked", value: totalBlockedDates, color: "bg-blue-500", icon: CalendarOff },
      { label: "Active", value: activeBlocks, color: "bg-orange-500", icon: Clock },
      { label: "Expired", value: expiredBlocks, color: "bg-green-500", icon: CheckCircle },
      { label: "Havens Affected", value: affectedHavens, color: "bg-purple-500", icon: Building2 },
    ];
  }, [blockedDates]);

  const filteredBlockedDates = useMemo(() => {
    const today = new Date();
    return blockedDates.filter((date: BlockedDate) => {
      const matchesSearch =
        date.haven_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        date.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        date.tower?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        date.floor?.toLowerCase().includes(searchQuery.toLowerCase());

      const toDate = new Date(date.to_date);
      const isActive = toDate >= today;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && isActive) ||
        (filterStatus === "expired" && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [blockedDates, searchQuery, filterStatus]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBlockedDates.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedBlockedDates = filteredBlockedDates.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleOpenModal = (blockedDate?: BlockedDate) => {
    if (blockedDate) {
      setEditingDate(blockedDate);
    } else {
      setEditingDate(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDate(null);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterHaven, filterStatus]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blocked date?")) {
      try {
        await deleteBlockedDate(id).unwrap();
        toast.success("Blocked date deleted successfully");
      } catch (error: unknown) {
        const errorMessage =
          error &&
          typeof error === "object" &&
          "data" in error &&
          error.data &&
          typeof error.data === "object" &&
          "error" in error.data &&
          typeof error.data.error === "string"
            ? error.data.error
            : "Failed to delete blocked date";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header - matching CSR design exactly */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Blocked Dates Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage blocked dates for your havens to prevent bookings on specific dates</p>
        </div>
      </div>

      {/* Error State */}
      {blockedDatesError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Data</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load blocked dates. Please try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      )}

      {!blockedDatesError && (
        <>
          {/* Stats Cards - matching CSR design exactly */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
            {stats.map((stat, i) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={i}
                  className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">{stat.label}</p>
                      <div className="text-3xl font-bold mt-2">
                        {isLoadingBlockedDates ? (
                          <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                        ) : (
                          stat.value
                        )}
                      </div>
                    </div>
                    <IconComponent className="w-12 h-12 opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-start flex-shrink-0 gap-2">

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Blocked Date
            </button>            
          </div>

          {/* Filters - matching CSR design exactly */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by haven name, reason, tower, or floor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <select
                  value={filterHaven}
                  onChange={(e) => setFilterHaven(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
                >
                  <option value="all">All Havens</option>
                  {uniqueHavens.map((haven: Haven) => (
                    <option key={haven.uuid_id} value={haven.uuid_id}>
                      {haven.haven_name} {haven.tower && `- ${haven.tower}`}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${refreshLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Table - matching CSR design exactly */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700 flex-1 flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Haven
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      From Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      To Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Reason
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Block Status
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Period
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlockedDates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <CalendarOff className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No blocked dates found</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {searchQuery || filterHaven !== "all" || filterStatus !== "all"
                                ? "Try adjusting your search or filters"
                                : "Click \"Add Blocked Date\" to create a new one"}
                            </p>
                          </div>
                          {(searchQuery || filterHaven !== "all" || filterStatus !== "all") && (
                            <button
                              onClick={() => {
                                setSearchQuery("");
                                setFilterHaven("all");
                                setFilterStatus("all");
                              }}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBlockedDates.map((blockedDate: BlockedDate, index: number) => {
                      const today = new Date();
                      const toDate = new Date(blockedDate.to_date);
                      const isActive = toDate >= today;

                      return (
                        <tr
                          key={blockedDate.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold">
                                {blockedDate.haven_name?.charAt(0) || "H"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                  {blockedDate.haven_name || "Unknown Haven"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {blockedDate.tower && `${blockedDate.tower}`}
                                  {blockedDate.floor && ` • Floor ${blockedDate.floor}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {formatDate(blockedDate.from_date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {formatDate(blockedDate.to_date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {blockedDate.reason || "-"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                blockedDate.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                              }`}
                            >
                              {blockedDate.status === "active" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                isActive
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                              }`}
                            >
                              {isActive ? "Active" : "Expired"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenModal(blockedDate)}
                                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(blockedDate.id)}
                                disabled={isDeleting}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {filteredBlockedDates.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredBlockedDates.length)} of {filteredBlockedDates.length} entries
                  {searchQuery || filterHaven !== "all" || filterStatus !== "all" ? ` (filtered from ${blockedDates.length} total entries)` : ""}
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
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md border-brand-primary"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
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
        </>
      )}

      {/* Blocked Dates Modal */}
      <BlockedDatesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={async (data) => {
          try {
            console.log("🟢 [BlockedDatesManagementPage] Received data in onSubmit:", data);
            if (editingDate) {
              console.log("📝 [BlockedDatesManagementPage] Updating blocked date...");
              await updateBlockedDate({
                id: editingDate.id,
                ...data,
              }).unwrap();
              toast.success("Blocked date updated successfully");
            } else {
              console.log("✨ [BlockedDatesManagementPage] Creating new blocked date...");
              await createBlockedDate(data).unwrap();
              console.log("✅ [BlockedDatesManagementPage] Blocked date created successfully!");
              toast.success("Blocked date created successfully");
            }
            handleCloseModal();
          } catch (error: unknown) {
            console.error("❌ [BlockedDatesManagementPage] Error:", error);
            const errorMessage =
              error &&
              typeof error === "object" &&
              "data" in error &&
              error.data &&
              typeof error.data === "object" &&
              "error" in error.data &&
              typeof error.data.error === "string"
                ? error.data.error
                : "Failed to save blocked date";
            console.error("❌ Full error object:", error);
            console.error("❌ Error message to display:", errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        }}
        editingDate={editingDate}
        havens={uniqueHavens}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
};

export default BlockedDatesManagementPage;
