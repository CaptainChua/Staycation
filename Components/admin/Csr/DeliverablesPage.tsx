"use client";

import {
  Package,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  User,
  Loader2,
  CheckCircle,
  Clock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  XCircle,
  RotateCcw,
  CheckSquare,
  Play,
  Truck,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  BadgeCheck,
  CircleDollarSign,
  ChevronDown
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { DeliverableRecord, DeliverableItem } from "@/app/admin/csr/actions";
import ViewPaymentDetailsModal from "./Modals/ViewPaymentDetailsModal";

// Highlight text function
const highlightText = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-medium">
        {part}
      </span>
    ) : (
      part
    )
  );
};

export default function DeliverablesPage() {
  const { data: session } = useSession();
  const employeeId = session?.user?.id;
  
  console.log('🔑 Session and EmployeeId:', { session, employeeId });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [filterDate, setFilterDate] = useState<"all" | "today_checkin" | "today_checkout" | "custom_range">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof DeliverableRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<DeliverableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selection state for bulk actions
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Payment details modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<DeliverableRecord | null>(null);

  // Toggle expanded items
  const toggleExpanded = (bookingId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Log employee activity
  const logEmployeeActivity = async (action: string, details: string, entityId?: string) => {
    console.log('🔍 logEmployeeActivity called:', { employeeId, action, details, entityId });
    
    if (!employeeId) {
      console.log('❌ No employeeId found, skipping logging');
      return;
    }
    
    try {
      console.log('📡 Sending request to /api/admin/employee-activity');
      const response = await fetch('/api/admin/employee-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          action,
          details,
          entityType: 'deliverable',
          entityId,
        }),
      });
      
      const result = await response.json();
      console.log('📡 Response from employee-activity API:', result);
      
      if (!response.ok) {
        console.error('❌ API Error:', result);
      }
    } catch (error) {
      console.error('❌ Failed to log employee activity:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching deliverables data...');
      const response = await fetch('/api/admin/deliverables');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch deliverables');
      }
      
      const result = await response.json();
      console.log('Received deliverables data:', result.data?.length || 0, 'records');
      
      if (result.data && result.data.length > 0) {
        console.log('Sample data:', result.data[0]);
      }
      
      setRows(result.data || []);
    } catch (error) {
      console.error("Failed to fetch deliverables:", error);
      toast.error("Failed to load deliverables: " + (error instanceof Error ? error.message : "Unknown error"));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return rows.filter((row) => {
      // Safety check for items array
      const items = row.items || [];

      // Check if search matches any item name
      const itemNamesMatch = items.some(item =>
        item.name?.toLowerCase().includes(term)
      );

      const matchesSearch =
        row.deliverable_id?.toLowerCase().includes(term) ||
        row.booking_id?.toLowerCase().includes(term) ||
        row.guest?.toLowerCase().includes(term) ||
        row.haven?.toLowerCase().includes(term) ||
        itemNamesMatch;

      // Check status - either overall status or any item status
      const matchesFilter = filterStatus === "all" ||
        row.overall_status === filterStatus ||
        items.some(item => item.status === filterStatus);

      let matchesDateFilter = true;
      if (filterDate === "today_checkin" && row.checkin_date_raw) {
        const checkinDate = new Date(row.checkin_date_raw);
        matchesDateFilter = checkinDate >= today && checkinDate < tomorrow;
      } else if (filterDate === "today_checkout" && row.checkout_date_raw) {
        const checkoutDate = new Date(row.checkout_date_raw);
        matchesDateFilter = checkoutDate >= today && checkoutDate < tomorrow;
      } else if (filterDate === "custom_range" && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        const checkinDate = row.checkin_date_raw ? new Date(row.checkin_date_raw) : null;
        const checkoutDate = row.checkout_date_raw ? new Date(row.checkout_date_raw) : null;
        matchesDateFilter = (checkinDate && checkinDate >= startDate && checkinDate <= endDate) ||
          (checkoutDate && checkoutDate >= startDate && checkoutDate <= endDate) || false;
      }

      return matchesSearch && matchesFilter && matchesDateFilter;
    });
  }, [filterStatus, filterDate, customStartDate, customEndDate, rows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      let aVal: string | number | Date = '';
      let bVal: string | number | Date = '';

      // Handle special fields for the grouped structure
      if (sortField === 'grand_total') {
        return sortDirection === "asc" ? a.grand_total - b.grand_total : b.grand_total - a.grand_total;
      }

      if (sortField === 'overall_status') {
        aVal = a.overall_status;
        bVal = b.overall_status;
      } else if (sortField in a) {
        aVal = (a as unknown as Record<string, unknown>)[sortField] as string | number | Date;
        bVal = (b as unknown as Record<string, unknown>)[sortField] as string | number | Date;
      }

      const aSortable = (typeof aVal === 'string' ? aVal : String(aVal)).toLowerCase();
      const bSortable = (typeof bVal === 'string' ? bVal : String(bVal)).toLowerCase();

      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof DeliverableRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Update status for an individual item within a booking
  const handleItemStatusUpdate = async (bookingId: string, itemId: string, newStatus: string) => {
    const oldRows = [...rows];
    setRows(prev => prev.map(r => {
      if (r.id === bookingId) {
        const updatedItems = (r.items || []).map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        );
        // Recalculate overall status
        const statuses = updatedItems.map(item => item.status);
        let overallStatus = 'Delivered';
        if (statuses.includes('Pending')) overallStatus = 'Pending';
        else if (statuses.includes('Preparing')) overallStatus = 'Preparing';
        else if (statuses.includes('Cancelled') && !statuses.every(s => s === 'Cancelled')) overallStatus = 'Partial';
        else if (statuses.every(s => s === 'Delivered')) overallStatus = 'Delivered';
        else if (statuses.every(s => s === 'Refunded')) overallStatus = 'Refunded';
        else if (statuses.every(s => s === 'Cancelled')) overallStatus = 'Cancelled';

        return { ...r, items: updatedItems, overall_status: overallStatus };
      }
      return r;
    }));

    try {
      const response = await fetch('/api/admin/deliverables', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliverableId: itemId,
          newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      toast.success(`Item marked as ${newStatus}`);
      
      // Log employee activity
      await logEmployeeActivity(
        `UPDATE_ITEM_STATUS`,
        `Updated item status to ${newStatus} in booking ${rows.find(r => r.id === bookingId)?.deliverable_id}`,
        bookingId
      );
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to update status: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Update all items in a booking to the same status
  const handleAllItemsStatusUpdate = async (bookingId: string, newStatus: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    const oldRows = [...rows];
    setRows(prev => prev.map(r => {
      if (r.id === bookingId) {
        const updatedItems = (r.items || []).map(item => ({ ...item, status: newStatus }));
        return { ...r, items: updatedItems, overall_status: newStatus };
      }
      return r;
    }));

    try {
      // Update all items in parallel
      const promises = (booking.items || []).map(item => 
        fetch('/api/admin/deliverables', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliverableId: item.id,
            newStatus
          })
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any failed
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} updates failed`);
      }
      
      toast.success(`All items marked as ${newStatus}`);
      
      // Log employee activity
      await logEmployeeActivity(
        `UPDATE_ALL_ITEMS_STATUS`,
        `Updated all items in booking ${booking.deliverable_id} to ${newStatus} status`,
        bookingId
      );
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to update status: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleMarkAllDelivered = async (bookingId: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    const oldRows = [...rows];
    setRows(prev => prev.map(r => {
      if (r.id === bookingId) {
        const updatedItems = (r.items || []).map(item => ({ ...item, status: "Delivered" }));
        return { ...r, items: updatedItems, overall_status: "Delivered" };
      }
      return r;
    }));

    try {
      const promises = (booking.items || []).map(item => 
        fetch('/api/admin/deliverables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliverableId: item.id,
            action: 'delivered'
          })
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any failed
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} updates failed`);
      }
      
      toast.success("All items marked as delivered");
      
      // Log employee activity
      await logEmployeeActivity(
        `MARK_ALL_DELIVERED`,
        `Marked all items in booking ${booking.deliverable_id} as delivered`,
        bookingId
      );
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to mark as delivered: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleCancelAll = async (bookingId: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    const oldRows = [...rows];
    setRows(prev => prev.map(r => {
      if (r.id === bookingId) {
        const updatedItems = (r.items || []).map(item => ({ ...item, status: "Cancelled" }));
        return { ...r, items: updatedItems, overall_status: "Cancelled" };
      }
      return r;
    }));

    try {
      const promises = (booking.items || []).map(item => 
        fetch('/api/admin/deliverables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliverableId: item.id,
            action: 'cancelled'
          })
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any failed
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} updates failed`);
      }
      
      toast.success("All items cancelled");
      
      // Log employee activity
      await logEmployeeActivity(
        `CANCEL_ALL_ITEMS`,
        `Cancelled all items in booking ${booking.deliverable_id}`,
        bookingId
      );
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to cancel items: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleRefundAll = async (bookingId: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    const oldRows = [...rows];
    setRows(prev => prev.map(r => {
      if (r.id === bookingId) {
        const updatedItems = (r.items || []).map(item => ({ ...item, status: "Refunded" }));
        return { ...r, items: updatedItems, overall_status: "Refunded" };
      }
      return r;
    }));

    try {
      const promises = (booking.items || []).map(item => 
        fetch('/api/admin/deliverables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliverableId: item.id,
            action: 'refunded'
          })
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any failed
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} updates failed`);
      }
      
      toast.success("All items refunded");
      
      // Log employee activity
      await logEmployeeActivity(
        `REFUND_ALL_ITEMS`,
        `Refunded all items in booking ${booking.deliverable_id}`,
        bookingId
      );
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to refund items: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeliverables(paginatedRows.map(row => row.id));
    } else {
      setSelectedDeliverables([]);
    }
  };

  const handleSelectDeliverable = (deliverableId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeliverables(prev => [...prev, deliverableId]);
    } else {
      setSelectedDeliverables(prev => prev.filter(id => id !== deliverableId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedDeliverables.length === 0) {
      toast.error("Please select at least one booking");
      return;
    }

    setBulkActionLoading(true);
    const oldRows = [...rows];

    try {
      // Update all items in selected bookings
      setRows(prev => prev.map(r => {
        if (selectedDeliverables.includes(r.id)) {
          const updatedItems = (r.items || []).map(item => ({ ...item, status: action }));
          return { ...r, items: updatedItems, overall_status: action };
        }
        return r;
      }));

      // Get all item IDs from selected bookings and update them
      const selectedRows = rows.filter(r => selectedDeliverables.includes(r.id));
      const allItemIds = selectedRows.flatMap(r => (r.items || []).map(item => item.id));
      
      const promises = allItemIds.map(id => 
        fetch('/api/admin/deliverables', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliverableId: id,
            newStatus: action
          })
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any failed
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} updates failed`);
      }

      toast.success(`Successfully marked ${selectedDeliverables.length} bookings as ${action}`);
      
      // Log employee activity
      await logEmployeeActivity(
        `BULK_UPDATE_STATUS`,
        `Bulk updated ${selectedDeliverables.length} bookings to ${action} status`,
        selectedDeliverables.join(',') // Pass multiple IDs as comma-separated
      );
      setSelectedDeliverables([]);
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to process some deliverables: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Summary counts - count individual items across all bookings
  const allItems = rows.flatMap(r => r.items || []);
  const totalCount = allItems.length;
  const pendingCount = allItems.filter((item) => item?.status === "Pending").length;
  const preparingCount = allItems.filter((item) => item?.status === "Preparing").length;
  const deliveredCount = allItems.filter((item) => item?.status === "Delivered").length;
  const cancelledCount = allItems.filter((item) => item?.status === "Cancelled").length;
  const refundedCount = allItems.filter((item) => item?.status === "Refunded").length;
  const bookingCount = rows.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Deliverables Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage add-ons and deliverables for bookings</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Total Deliverables", value: String(bookingCount), color: "bg-indigo-500", icon: Package },
          { label: "Pending", value: String(pendingCount), color: "bg-yellow-500", icon: Clock },
          { label: "Preparing", value: String(preparingCount), color: "bg-indigo-500", icon: Loader2 },
          { label: "Delivered", value: String(deliveredCount), color: "bg-green-500", icon: CheckCircle },
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
        <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Deliverable Status Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Pending</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Items waiting to be prepared</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Preparing</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Items currently being prepared</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Delivered</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Successfully delivered to guest</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Cancelled</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Order was cancelled</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full mt-1 flex-shrink-0"></div>
            <div>
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Refunded</h5>
              <p className="text-xs text-gray-600 dark:text-gray-300">Payment has been refunded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedDeliverables.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-primary" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {selectedDeliverables.length} deliverable{selectedDeliverables.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("Preparing")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Mark Preparing
              </button>
              <button
                onClick={() => handleBulkAction("Delivered")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Mark Delivered
              </button>
              <button
                onClick={() => handleBulkAction("Cancelled")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Cancel
              </button>
              <button
                onClick={() => setSelectedDeliverables([])}
                disabled={bulkActionLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Search by ID, booking, guest, haven, or item name..."
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
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>
            <select
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value as typeof filterDate);
                if (e.target.value !== "custom_range") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              <option value="all">All Dates</option>
              <option value="today_checkin">Today&apos;s Check-ins</option>
              <option value="today_checkout">Today&apos;s Check-outs</option>
              <option value="custom_range">Custom Range</option>
            </select>
            {filterDate === "custom_range" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section - Fixed height and scrollable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDeliverables.length === paginatedRows.length && paginatedRows.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span>Select</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort("deliverable_id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Deliverable ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("haven")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Haven & Booking
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
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Item Details
                  </div>
                </th>
                <th
                  onClick={() => handleSort("grand_total")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Total
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("overall_status")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("checkin_date")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Check-in / Check-out Dates
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                    <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading deliverables...</p>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No deliverables found</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedDeliverables.includes(row.id)}
                        onChange={(e) => handleSelectDeliverable(row.id, e.target.checked)}
                        className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                      />
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{highlightText(row.deliverable_id, searchTerm)}</span>
                        {/* Payment Status Badge */}
                        <div className="mt-2">
                          {row.payment_type === 'full' && row.payment_status === 'approved' ? (
                            <div className="flex items-center gap-1">
                              <BadgeCheck className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700 dark:text-green-400">Fully Paid</span>
                            </div>
                          ) : row.payment_type === 'down_payment' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Down Payment Only</span>
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
                                <div>Paid: <span className="font-medium text-green-600">{row.formatted_down_payment}</span></div>
                                <div>Balance: <span className="font-medium text-red-600">{row.formatted_remaining_balance}</span></div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedPaymentRecord(row);
                                  setPaymentModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline mt-1 font-medium"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Payment Details
                              </button>
                            </div>
                          ) : row.payment_status === 'pending' ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Payment Pending</span>
                            </div>
                          ) : row.payment_status === 'rejected' ? (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-medium text-red-600 dark:text-red-400">Payment Rejected</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <CircleDollarSign className="w-4 h-4 text-gray-400" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">No Payment Info</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{highlightText(row.haven, searchTerm)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tower:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{row.tower}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Booking ID:</span>
                          <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{highlightText(row.booking_id, searchTerm)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{highlightText(row.guest, searchTerm)}</span>
                        </div>
                        {row.guest_email && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Email:</span>
                            <a href={`mailto:${row.guest_email}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                              {row.guest_email}
                            </a>
                          </div>
                        )}
                        {row.guest_phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Phone:</span>
                            <a href={`tel:${row.guest_phone}`} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline">
                              {row.guest_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="min-w-[380px]">
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                          <div className="col-span-4">Item</div>
                          <div className="col-span-1 text-center">Qty</div>
                          <div className="col-span-2 text-right">Price</div>
                          <div className="col-span-2 text-right">Total</div>
                          <div className="col-span-3 text-center">Status</div>
                        </div>
                        {/* Item Rows */}
                        <div className="space-y-2">
                          {(row.items || []).length === 0 ? (
                            <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
                              No items found
                            </div>
                          ) : (
                            <>
                              {(row.items || []).slice(0, expandedItems[row.id] ? undefined : 2).map((item, idx) => (
                                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center ${idx > 0 ? 'pt-2 border-t border-gray-100 dark:border-gray-700' : ''}`}>
                                  <div className="col-span-4 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{highlightText(item.name, searchTerm)}</span>
                                  </div>
                                  <div className="col-span-1 text-center">
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-medium text-gray-800 dark:text-gray-100">
                                      {item.quantity}
                                    </span>
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{item.formatted_price}</span>
                                  </div>
                                  <div className="col-span-2 text-right">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap">{item.formatted_total}</span>
                                  </div>
                                  <div className="col-span-3 text-center">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                      item.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                                      item.status === "Preparing" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" :
                                      item.status === "Delivered" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                                      item.status === "Cancelled" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                                      item.status === "Refunded" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" :
                                      "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    }`}>
                                      {item.status}
                                    </span>
                                  </div>
                                  {/* Item Notes */}
                                  {item.notes && (
                                    <div className="col-span-12 mt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400 italic">Note: {item.notes}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {/* Show More/Less Button */}
                              {(row.items || []).length > 2 && (
                                <button
                                  onClick={() => toggleExpanded(row.id)}
                                  className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                  {expandedItems[row.id] ? (
                                    <>
                                      <ChevronDown className="w-3 h-3 rotate-180" />
                                      Show less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3" />
                                      Show {((row.items || []).length - 2)} more
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right border border-gray-200 dark:border-gray-700">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                          {highlightText(row.formatted_grand_total, searchTerm)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          row.overall_status === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : row.overall_status === "Preparing"
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            : row.overall_status === "Delivered"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : row.overall_status === "Cancelled"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : row.overall_status === "Refunded"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {highlightText(row.overall_status, searchTerm)}
                      </span>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Check-in:</span>
                          <span className="text-xs font-semibold text-green-700 dark:text-green-300">{highlightText(row.checkin_date, searchTerm)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Check-out:</span>
                          <span className="text-xs font-semibold text-red-700 dark:text-red-300">{highlightText(row.checkout_date, searchTerm)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Mark All Preparing"
                          type="button"
                          onClick={() => handleAllItemsStatusUpdate(row.id, "Preparing")}
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="Mark All Delivered"
                          type="button"
                          onClick={() => handleMarkAllDelivered(row.id)}
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Cancel All"
                          type="button"
                          onClick={() => handleCancelAll(row.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                          title="Refund All"
                          type="button"
                          onClick={() => handleRefundAll(row.id)}
                        >
                          <RotateCcw className="w-4 h-4" />
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
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

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Pending</span>
              <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Preparing</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{preparingCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Delivered</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">{deliveredCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Cancelled</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">{cancelledCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Refunded</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">{refundedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      <ViewPaymentDetailsModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPaymentRecord(null);
        }}
        record={selectedPaymentRecord}
      />
    </div>
  );
}
