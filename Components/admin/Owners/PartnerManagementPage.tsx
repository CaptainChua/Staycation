"use client";

import React, { useState, useMemo } from "react";
import {
  useGetPartnersQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  Partner,
  useUpdatePartnerStatusMutation,
} from "@/redux/api/partnersApi";
import {
  Handshake,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import toast from "react-hot-toast";
import AddPartnerModal from "./Modals/AddPartnerModal";

// Skeleton component for table rows
const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <tr key={index} className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 mx-auto"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </td>
      </tr>
    ))}
  </>
);

interface FormData {
  email: string;
  password: string;
  fullname: string;
  phone: string;
  address: string;
  type: string;
  commission_rate: number;
}

const PartnerManagementPage = () => {
  const { data: partnersData, isLoading } = useGetPartnersQuery();
  const [createPartner, { isLoading: isCreating }] = useCreatePartnerMutation();
  const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerMutation();
  const [deletePartner, { isLoading: isDeleting }] = useDeletePartnerMutation();
  const [updatePartnerStatus] = useUpdatePartnerStatusMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pending" | "suspended">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<"fullname" | "email" | "type" | "commission_rate" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const initialFormData: FormData = {
    email: "",
    password: "",
    fullname: "",
    phone: "",
    address: "",
    type: "hotel",
    commission_rate: 10.0,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const partners = partnersData?.data || [];

  // Calculate statistics
  const stats = useMemo(() => {
    const total = partners.length;
    const active = partners.filter((p) => p.status === "active").length;
    const pending = partners.filter((p) => p.status === "pending").length;
    const suspended = partners.filter((p) => p.status === "suspended").length;

    return [
      { label: "Total Partners", value: total, color: "bg-indigo-500", icon: Handshake },
      { label: "Active", value: active, color: "bg-green-500", icon: Eye },
      { label: "Pending", value: pending, color: "bg-yellow-500", icon: Clock },
      { label: "Suspended", value: suspended, color: "bg-red-500", icon: AlertTriangle },
    ];
  }, [partners]);

  // Filter and search
  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch =
        partner.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = filterStatus === "all" || partner.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [partners, searchTerm, filterStatus]);

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortField) return filteredPartners;

    return [...filteredPartners].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      const aSortable = (typeof aVal === 'string' ? aVal : String(aVal || '')).toLowerCase();
      const bSortable = (typeof bVal === 'string' ? bVal : String(bVal || '')).toLowerCase();

      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredPartners, sortField, sortDirection]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedPartners = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: "fullname" | "email" | "type" | "commission_rate") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleOpenModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        email: partner.email || "",
        password: "",
        fullname: partner.fullname || "",
        phone: partner.phone || "",
        address: partner.address || "",
        type: partner.type || "hotel",
        commission_rate: partner.commission_rate || 10.0,
      });
    } else {
      setEditingPartner(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "commission_rate" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.fullname) {
      toast.error("Email and fullname are required");
      return;
    }

    if (!editingPartner && !formData.password) {
      toast.error("Password is required for new partners");
      return;
    }

    try {
      if (editingPartner) {
        const updateData = {
          id: editingPartner.id,
          fullname: formData.fullname,
          phone: formData.phone,
          address: formData.address,
          type: formData.type,
          commission_rate: formData.commission_rate,
        };
        await updatePartner(updateData).unwrap();
        toast.success("Partner updated successfully");
      } else {
        await createPartner(formData).unwrap();
        toast.success("Partner created successfully");
      }
      handleCloseModal();
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to save partner");
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;

    try {
      await deletePartner(id).unwrap();
      toast.success("Partner deleted successfully");
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to delete partner");
    }
  };

  const handleStatusChange = async (partner: Partner, newStatus: string) => {
    try {
      await updatePartnerStatus({ id: partner.id, status: newStatus }).unwrap();
      toast.success("Partner status updated successfully");
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to update status");
    }
  };

  const handleRefresh = () => {
    // Refetch data by reloading the query
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Partner Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage partners and their services</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
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
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Partner Status Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Active</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Partner is verified and can offer services</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Pending</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Awaiting verification and approval</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Suspended</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Partner account is temporarily disabled</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-gray-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Inactive</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Partner account is no longer active</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Add Partners Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">How to Add Partners</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Click Add Partner</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Use the "Add Partner" button in the toolbar</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Fill Partner Details</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Enter email, password, name and other information</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Set Commission Rate</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Define commission percentage for services</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Save & Verify</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Click Save then approve partner status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary text-sm"
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Partner
            </button>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as "all" | "active" | "pending" | "suspended");
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort("fullname")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Partner Name
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("email")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Email
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Phone
                </th>
                <th
                  onClick={() => handleSort("type")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Type
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("commission_rate")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Commission
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Status
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <TableSkeleton />
              ) : paginatedPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Handshake className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No partners found</p>
                    <p className="text-sm mt-1">Add your first partner to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
                          <Handshake className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {partner.fullname}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {partner.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {partner.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {partner.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                      {partner.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {partner.commission_rate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <select
                        value={partner.status}
                        onChange={(e) => handleStatusChange(partner, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer focus:outline-none border-0 ${
                          partner.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : partner.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(partner)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePartner(partner.id)}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? "bg-brand-primary text-white"
                      : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      <AddPartnerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingPartner={editingPartner}
        formData={formData}
        onFormChange={handleInputChange}
        onSave={handleSavePartner}
        isCreating={isCreating}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default PartnerManagementPage;