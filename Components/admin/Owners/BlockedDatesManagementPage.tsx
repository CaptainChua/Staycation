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

// Skeleton Components
const StatsCardSkeleton = () => (
  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
      </div>
      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-2">
    <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
      ))}
    </div>
    {[...Array(5)].map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-6 gap-4 p-4 bg-white dark:bg-gray-800 rounded">
        {[...Array(6)].map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    ))}
  </div>
);

const BlockedDatesManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterHaven, setFilterHaven] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<BlockedDate | null>(null);
  const [formData, setFormData] = useState<BlockedDateFormData>({
    haven_id: "",
    from_date: "",
    to_date: "",
    reason: "",
  });

  // Fetch blocked dates
  const { data: blockedDatesData, isLoading: isLoadingBlockedDates } =
    useGetBlockedDatesQuery({
      haven_id: filterHaven !== "all" ? filterHaven : undefined,
    });

  // Fetch havens for dropdown
  const { data: havensData } = useGetHavensQuery({});

  // Mutations
  const [createBlockedDate, { isLoading: isCreating }] =
    useCreateBlockedDateMutation();
  const [updateBlockedDate, { isLoading: isUpdating }] =
    useUpdateBlockedDateMutation();
  const [deleteBlockedDate, { isLoading: isDeleting }] =
    useDeleteBlockedDateMutation();

  const blockedDates = blockedDatesData?.data || [];
  const havens: Haven[] = (havensData as Haven[]) || [];

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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Blocked Dates Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage blocked dates for your havens to prevent bookings on specific dates
        </p>
      </div>

      {/* Loading State */}
      {isLoadingBlockedDates && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <TableSkeleton />
          </div>
        </>
      )}

      {!isLoadingBlockedDates && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
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

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1 relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by haven name, reason, tower, or floor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <select
                  value={filterHaven}
                  onChange={(e) => setFilterHaven(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
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
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Blocked Date
                </button>
              </div>
            </div>
          </div>

          {/* Blocked Dates Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
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
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                          <CalendarOff className="w-12 h-12 text-gray-400" />
                          <p className="font-medium">No blocked dates found</p>
                          <p className="text-sm">
                            Click &quot;Add Blocked Date&quot; to create a new one
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredBlockedDates.map((blockedDate: BlockedDate) => {
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
                                  {blockedDate.floor && ` - Floor ${blockedDate.floor}`}
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
                Showing {filteredBlockedDates.length} of {blockedDates.length} blocked dates
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {editingDate ? "Edit Blocked Date" : "Add Blocked Date"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Haven <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.haven_id}
                  onChange={(e) =>
                    setFormData({ ...formData, haven_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.from_date}
                    onChange={(e) =>
                      setFormData({ ...formData, from_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    To Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.to_date}
                    onChange={(e) =>
                      setFormData({ ...formData, to_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Maintenance, Private event, Renovation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(isCreating || isUpdating) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {editingDate ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedDatesManagementPage;
