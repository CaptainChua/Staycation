"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, CreditCard, Smartphone, Wallet, Building, Search, Filter, ArrowUpDown, RefreshCw, Download, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import toast from "react-hot-toast";
import PaymentMethodModal from "./Modals/PaymentMethod";

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
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
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

interface PaymentMethod {
  id: string;
  payment_name: string;
  payment_method: string;
  provider: string;
  account_details: string;
  payment_qr_link?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
}

const PaymentMethodsManagementPage = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [showAccountDetails, setShowAccountDetails] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof PaymentMethod | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch payment methods
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.data || []);
      } else {
        toast.error("Failed to fetch payment methods");
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast.error("Error fetching payment methods");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    
    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Payment method deleted successfully");
        fetchPaymentMethods();
      } else {
        toast.error("Failed to delete payment method");
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast.error("Error deleting payment method");
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/payment-methods/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`Payment method ${!currentStatus ? "activated" : "deactivated"} successfully`);
        fetchPaymentMethods();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    }
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsModalOpen(true);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="w-5 h-5" />;
      case "mobile_wallet":
        return (
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
        );
      case "bank_transfer":
        return (
          <div className="w-5 h-5 bg-gray-700 rounded flex items-center justify-center">
            <Building className="w-3 h-3 text-white" />
          </div>
        );
      case "cash":
        return (
          <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">₱</span>
          </div>
        );
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const toggleAccountDetailsVisibility = (id: string) => {
    setShowAccountDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter and sort logic
  const filteredRows = paymentMethods.filter((row) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      row.payment_name.toLowerCase().includes(term) ||
      row.provider.toLowerCase().includes(term) ||
      row.payment_method.toLowerCase().includes(term);

    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "active" && row.is_active) ||
      (filterStatus === "inactive" && !row.is_active);

    return matchesSearch && matchesFilter;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    const aSortable = (typeof aVal === 'string' ? aVal : String(aVal)).toLowerCase();
    const bSortable = (typeof bVal === 'string' ? bVal : String(bVal)).toLowerCase();
    
    if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
    if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof PaymentMethod) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Calculate summary counts
  const totalCount = paymentMethods.length;
  const activeCount = paymentMethods.filter(row => row.is_active).length;
  const inactiveCount = paymentMethods.filter(row => !row.is_active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payment Methods Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage payment methods and processing options</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
        {[
          { label: "Total Methods", value: String(totalCount), color: "bg-indigo-500", icon: Wallet },
          { label: "Active", value: String(activeCount), color: "bg-green-500", icon: CreditCard },
          { label: "Inactive", value: String(inactiveCount), color: "bg-red-500", icon: EyeOff },
        ].map((stat, i) => {
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

      {/* Status Explanation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Payment Method Status Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Active</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Payment method is currently available for guests to use during checkout</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Inactive</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Payment method is temporarily disabled and not visible to guests</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Add Payment Methods Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">How to Add Payment Methods</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Click Add Payment Method</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Use the "Add Payment Method" button in the header to open the form</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Fill Required Fields</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Enter payment name, select method type, provider, and account details</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Add Description (Optional)</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Provide additional details about the payment method for clarity</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Set Status & Save</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Toggle active status and click "Add Payment Method" to save</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-2">Payment Method Types:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-primary" />
              <span><strong>Credit Card:</strong> For Visa, Mastercard, etc.</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-primary" />
              <span><strong>Mobile Wallet:</strong> For GCash, PayMaya, etc.</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-primary" />
              <span><strong>Bank Transfer:</strong> For BDO, BPI, etc.</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-brand-primary" />
              <span><strong>Cash:</strong> For on-site cash payments</span>
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
                placeholder="Search by payment name, provider, or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPaymentMethods}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setEditingMethod(null);
                setIsModalOpen(true);
              }}
              className="bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as "all" | "active" | "inactive");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort("payment_name")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Payment Method
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("provider")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    Provider
                    <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Account Details
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  QR Code
                </th>
                <th
                  onClick={() => handleSort("is_active")}
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <TableSkeleton />
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No payment methods found</p>
                    <p className="text-sm mt-1">Add your first payment method to get started</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((method) => (
                  <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="text-brand-primary">
                          {getPaymentIcon(method.payment_method)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {method.payment_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {method.payment_method.replace("_", " ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {method.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                          {showAccountDetails[method.id] 
                            ? method.account_details 
                            : "••••••••••••"
                          }
                        </span>
                        <button
                          onClick={() => toggleAccountDetailsVisibility(method.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showAccountDetails[method.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {method.payment_qr_link ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={method.payment_qr_link}
                            alt="QR Code"
                            className="w-12 h-12 object-cover rounded border border-gray-300 dark:border-gray-600"
                          />
                          <a
                            href={method.payment_qr_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                          >
                            View
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">No QR code</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          method.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {method.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleActiveStatus(method.id, method.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            method.is_active
                              ? "text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                              : "text-green-600 hover:text-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          }`}
                          title={method.is_active ? "Deactivate" : "Activate"}
                        >
                          {method.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(method)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingMethod(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50 md:hidden"
        title="Add Payment Method"
      >
        <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMethod(null);
        }}
        editingMethod={editingMethod}
        onSaved={() => fetchPaymentMethods()} // Only refresh when data is actually saved
      />
    </div>
  );
};

export default PaymentMethodsManagementPage;
