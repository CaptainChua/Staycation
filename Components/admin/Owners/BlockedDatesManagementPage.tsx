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
} from "lucide-react";
import { useState, useMemo } from "react";
import {
  useGetBlockedDatesQuery,
  useCreateBlockedDateMutation,
  useUpdateBlockedDateMutation,
  useDeleteBlockedDateMutation,
} from "@/redux/api/blockedDatesApi";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import toast from "react-hot-toast";

interface BlockedDate {
  id: string;
  haven_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
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
  const [formData, setFormData] = useState<BlockedDateFormData>({
    haven_id: "",
    from_date: "",
    to_date: "",
    reason: "",
  });

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
      setFormData({
        haven_id: blockedDate.haven_id,
        from_date: formatDateForInput(blockedDate.from_date),
        to_date: formatDateForInput(blockedDate.to_date),
        reason: blockedDate.reason || "",
      });
    } else {
      setEditingDate(null);
      setFormData({
        haven_id: "",
        from_date: "",
        to_date: "",
        reason: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDate(null);
    setFormData({
      haven_id: "",
      from_date: "",
      to_date: "",
      reason: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.haven_id || !formData.from_date || !formData.to_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingDate) {
        await updateBlockedDate({
          id: editingDate.id,
          ...formData,
        }).unwrap();
        toast.success("Blocked date updated successfully");
      } else {
        await createBlockedDate(formData).unwrap();
        toast.success("Blocked date created successfully");
      }
      handleCloseModal();
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
          : "Failed to save blocked date";
      toast.error(errorMessage);
    }
  };

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
                      Status
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlockedDates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-500 dark:text-gray-400">
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
                    filteredBlockedDates.map((blockedDate: BlockedDate, index: number) => {
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

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing <span className="font-semibold">{filteredBlockedDates.length}</span> of{" "}
                <span className="font-semibold">{blockedDates.length}</span> blocked dates
              </p>
            </div>
          </div>
        </>
      )}

      {/* Enhanced Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300 border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${editingDate ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-brand-primary'} rounded-lg flex items-center justify-center`}>
                    {editingDate ? (
                      <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {editingDate ? "Edit Blocked Date" : "Add Blocked Date"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {editingDate ? "Update the blocked date details" : "Create a new blocked date for your haven"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Haven Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Haven <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.haven_id}
                    onChange={(e) =>
                      setFormData({ ...formData, haven_id: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                    required
                  >
                    <option value="">Select a haven</option>
                    {uniqueHavens.map((haven: Haven) => (
                      <option key={haven.uuid_id} value={haven.uuid_id}>
                        {haven.haven_name} {haven.tower && `- ${haven.tower}`}{" "}
                        {haven.floor && `Floor ${haven.floor}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      From Date <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={formData.from_date}
                        onChange={(e) =>
                          setFormData({ ...formData, from_date: e.target.value })
                        }
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      To Date <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Calendar className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={formData.to_date}
                        onChange={(e) =>
                          setFormData({ ...formData, to_date: e.target.value })
                        }
                        min={formData.from_date}
                        className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Reason <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="e.g., Maintenance, Private event, Renovation..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Provide a reason to help your team understand why these dates are blocked
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="flex-1 px-4 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {(isCreating || isUpdating) && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {editingDate ? "Update Blocked Date" : "Create Blocked Date"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedDatesManagementPage;
