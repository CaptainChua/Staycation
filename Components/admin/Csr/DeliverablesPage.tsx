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
  Calendar,
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
import DeliverableActionModal from "./Modals/DeliverableActionModal";
import BulkDeliverableActionModal from "./Modals/BulkDeliverableActionModal";
import BulkSelectionActionModal from "./Modals/BulkSelectionActionModal";
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

// Translation content for guides
const guideTranslations = {
  en: {
    statusGuide: {
      title: "Deliverable Status Guide",
      statuses: [
        {
          name: "Pending",
          description: "Items waiting to be prepared"
        },
        {
          name: "Preparing",
          description: "Items currently being prepared"
        },
        {
          name: "Delivered",
          description: "Successfully delivered to guest"
        },
        {
          name: "Cancelled",
          description: "Order was cancelled"
        },
        {
          name: "Refunded",
          description: "Payment has been refunded"
        }
      ]
    },
    usageGuide: {
      title: "How to Manage Deliverables",
      steps: [
        {
          title: "Select Items to Process",
          description: "Use the checkboxes to select deliverables you want to update, or use \"Select All\" in the table header"
        },
        {
          title: "Update Item Status",
          description: "Click on the status buttons (Preparing/Delivered/Cancelled) to update individual items or all items in a booking"
        },
        {
          title: "Track Payment Status",
          description: "Check payment indicators to see if full payment, down payment, or pending payment status for each deliverable"
        },
        {
          title: "Process Bulk Actions",
          description: "Use the bulk actions bar that appears when items are selected to update multiple deliverables at once"
        }
      ],
      actionGuideTitle: "How to Use Actions:",
      actions: [
        {
          title: "Preparing",
          description: "Use when you start preparing the items for delivery. Cannot be used if items are already marked as preparing."
        },
        {
          title: "Delivered",
          description: "Use when items have been successfully delivered to the guest. Automatically updates inventory stock."
        },
        {
          title: "Cancelled",
          description: "Use when items are no longer needed or the order is cancelled."
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Select Items",
          description: "Check the checkboxes next to deliverables you want to update, or use \"Select All\" in the table header"
        },
        {
          title: "Choose Action",
          description: "A bulk actions bar will appear at the top showing your selection with action buttons (Preparing/Delivered/Cancelled)"
        },
        {
          title: "Apply to All",
          description: "The action will be applied to all items in the selected deliverables at once"
        }
      ],
      whenToUseTitle: "When to Use Bulk Operations:",
      useCases: [
        {
          title: "Mark as Preparing",
          description: "When multiple bookings have items that need to be prepared at the same time. Cannot be used if items are already preparing."
        },
        {
          title: "Mark as Delivered",
          description: "When multiple items have been delivered and need status update in bulk. Automatically updates inventory stock for all affected items."
        },
        {
          title: "Mark as Cancelled",
          description: "When multiple orders need to be cancelled at once."
        }
      ]
    }
  },
  fil: {
    statusGuide: {
      title: "Deliverable Status Guide",
      statuses: [
        {
          name: "Pending",
          description: "Naghihintay na i-prepare"
        },
        {
          name: "Preparing",
          description: "Kasalukuyang ini-prepare"
        },
        {
          name: "Delivered",
          description: "Na-deliver na sa guest"
        },
        {
          name: "Cancelled",
          description: "Kinansela na ang order"
        },
        {
          name: "Refunded",
          description: "Na-refund na ang payment"
        }
      ]
    },
    usageGuide: {
      title: "Paano mag-manage ng Deliverables",
      steps: [
        {
          title: "Pumili ng Items na I-process",
          description: "I-check ang checkbox para sa deliverables na gusto mong i-update, o gamitin \"Select All\" sa table header"
        },
        {
          title: "I-update ang Item Status",
          description: "I-click ang status buttons (Preparing/Delivered/Cancelled) para mag-update ng individual items o lahat ng items sa booking"
        },
        {
          title: "Bantayan ang Payment Status",
          description: "Tingnan ang payment indicators para makita kung full payment, down payment, o pending payment ang status"
        },
        {
          title: "I-process ang Bulk Actions",
          description: "Gamitin ang bulk actions bar na lalabas pag may selected items para mag-update ng multiple deliverables nang sabay-sabay"
        }
      ],
      actionGuideTitle: "Paano gamitin ang Actions:",
      actions: [
        {
          title: "Preparing",
          description: "Gamitin pag nagsimula na kang mag-prepare ng items para sa delivery"
        },
        {
          title: "Delivered",
          description: "Gamitin pag na-deliver na ang items sa guest"
        },
        {
          title: "Cancelled",
          description: "Gamitin pag hindi na kailangan ang items o kinansela ang order"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Pumili ng Items",
          description: "I-check ang checkbox para sa deliverables na gusto mong i-update, o gamitin \"Select All\" sa table header"
        },
        {
          title: "Pumili ng Action",
          description: "Magpapakita ng bulk actions bar sa taas with action buttons (Preparing/Delivered/Cancelled)"
        },
        {
          title: "I-apply sa Lahat",
          description: "Ang action ay ia-apply sa lahat ng items sa selected deliverables nang sabay-sabay"
        }
      ],
      whenToUseTitle: "Kailan gamitin ang Bulk Operations:",
      useCases: [
        {
          title: "Mark as Preparing",
          description: "Pag maraming bookings na may items na kailangan i-prepare nang sabay-sabay"
        },
        {
          title: "Mark as Delivered",
          description: "Pag maraming items na na-deliver na at kailangan i-update ang status nang bulk"
        },
        {
          title: "Mark as Cancelled",
          description: "Pag maraming orders na kailangan i-cancel nang sabay-sabay"
        }
      ]
    }
  }
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

  // Guide states
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showBulkGuide, setShowBulkGuide] = useState(false);
  const [guideLanguage, setGuideLanguage] = useState<"en" | "fil">("en");

  // Modal states
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [bulkSelectionModalOpen, setBulkSelectionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'preparing' | 'delivered' | 'cancelled' | 'refunded'>('delivered');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

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
    const booking = rows.find(r => r.id === bookingId);
    const item = booking?.items?.find(i => i.id === itemId);
    
    if (!booking || !item) return;

    // Check if item already has the target status
    if (item.status === newStatus) {
      toast.error(`Item is already marked as ${newStatus}`);
      return;
    }

    // Set modal data and open
    setSelectedBooking(booking);
    setSelectedItem(item);
    setSelectedAction(newStatus as 'preparing' | 'delivered' | 'cancelled' | 'refunded');
    setActionModalOpen(true);
  };

  // Execute the item status update after modal confirmation
  const executeItemStatusUpdate = async () => {
    if (!selectedBooking || !selectedItem) return;

    const oldRows = [...rows];
    setIsActionLoading(true);
    
    setRows(prev => prev.map(r => {
      if (r.id === selectedBooking.id) {
        const updatedItems = (r.items || []).map(item =>
          item.id === selectedItem.id ? { ...item, status: selectedAction } : item
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
          deliverableId: selectedItem.id,
          newStatus: selectedAction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // If marked as delivered, update inventory stock
      if (selectedAction === 'delivered' && selectedItem) {
        try {
          await updateInventoryStock(selectedItem.name, selectedItem.quantity);
        } catch (inventoryError) {
          console.error('Failed to update inventory stock:', inventoryError);
          toast.error('Status updated but inventory stock update failed');
        }
      }

      toast.success(`Item marked as ${selectedAction}`);
      
      // Log employee activity
      await logEmployeeActivity(
        `UPDATE_ITEM_STATUS`,
        `Updated item status to ${selectedAction} in booking ${selectedBooking.deliverable_id}`,
        selectedBooking.id
      );

      // Refresh data to ensure UI is in sync with database
      await fetchData();
      
      // Close modal
      setActionModalOpen(false);
      setSelectedBooking(null);
      setSelectedItem(null);
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to update status: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Update inventory stock when item is delivered
  const updateInventoryStock = async (itemName: string, quantity: number) => {
    try {
      console.log('🔄 Updating inventory stock:', { itemName, quantity });
      
      const response = await fetch('/api/admin/inventory/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemName: itemName.trim(),
          quantity: quantity,
          operation: 'subtract' // Subtract from current stock
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Inventory update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update inventory stock');
      }

      const result = await response.json();
      console.log('✅ Inventory stock updated successfully:', result);
    } catch (error) {
      console.error('❌ Error updating inventory stock:', error);
      throw error;
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

    // Set modal data and open
    setSelectedBooking(booking);
    setSelectedAction('delivered');
    setBulkActionModalOpen(true);
  };

  const handleCancelAll = async (bookingId: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    // Set modal data and open
    setSelectedBooking(booking);
    setSelectedAction('cancelled');
    setBulkActionModalOpen(true);
  };

  const handleRefundAll = async (bookingId: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    // Set modal data and open
    setSelectedBooking(booking);
    setSelectedAction('refunded');
    setBulkActionModalOpen(true);
  };

  const handleMarkAllPreparing = async (bookingId: string) => {
    const booking = rows.find(r => r.id === bookingId);
    if (!booking) return;

    // Set modal data and open
    setSelectedBooking(booking);
    setSelectedAction('preparing');
    setBulkActionModalOpen(true);
  };

// Execute bulk action after modal confirmation
  const executeBulkAction = async () => {
    if (!selectedBooking) return;

    const oldRows = [...rows];
    setIsActionLoading(true);
    
    setRows(prev => prev.map(r => {
      if (r.id === selectedBooking.id) {
        const updatedItems = (r.items || []).map(item => ({ ...item, status: selectedAction === 'delivered' ? 'Delivered' : selectedAction === 'cancelled' ? 'Cancelled' : selectedAction === 'refunded' ? 'Refunded' : 'Preparing' }));
        return { ...r, items: updatedItems, overall_status: selectedAction === 'delivered' ? 'Delivered' : selectedAction === 'cancelled' ? 'Cancelled' : selectedAction === 'refunded' ? 'Refunded' : 'Preparing' };
      }
      return r;
    }));

    try {
      const results = await Promise.allSettled(
        (selectedBooking.items || []).map((item: DeliverableItem) =>
          fetch('/api/admin/deliverables', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deliverableId: item.id,
              newStatus: selectedAction === 'delivered' ? 'Delivered' : selectedAction === 'cancelled' ? 'Cancelled' : selectedAction === 'refunded' ? 'Refunded' : 'Preparing'
            })
          })
        )
      );

      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        console.error('Some updates failed:', failed);
        throw new Error(`${failed.length} updates failed`);
      }

      // Update inventory stock for all delivered items
      if (selectedAction === 'delivered') {
        const inventoryUpdateResults = await Promise.allSettled(
          (selectedBooking.items || []).map((item: DeliverableItem) =>
            updateInventoryStock(item.name, item.quantity)
          )
        );

        const inventoryFailed = inventoryUpdateResults.filter(result => result.status === 'rejected');
        if (inventoryFailed.length > 0) {
          console.error('Some inventory updates failed:', inventoryFailed);
          toast.error("All items marked as delivered but some inventory updates failed");
        } else {
          toast.success("All items marked as delivered and inventory updated");
        }
      } else {
        toast.success(`All items marked as ${selectedAction}`);
      }
      
      // Log employee activity
      await logEmployeeActivity(
        `MARK_ALL_${selectedAction.toUpperCase()}`,
        `Marked all items in booking ${selectedBooking.deliverable_id} as ${selectedAction}`,
        selectedBooking.id
      );

      // Refresh data to ensure UI is in sync with database
      await fetchData();
      
      // Close modal
      setBulkActionModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to mark as " + selectedAction + ": " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsActionLoading(false);
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

    // Check if any items already have the target status
    const selectedRows = rows.filter(r => selectedDeliverables.includes(r.id));
    const allItems = selectedRows.flatMap(r => r.items || []);
    
    if (action === 'Preparing') {
      const alreadyPreparing = allItems.filter(item => item.status === 'Preparing');
      if (alreadyPreparing.length > 0) {
        toast.error(`${alreadyPreparing.length} item(s) are already marked as preparing`);
        return;
      }
    }

    // Convert to lowercase to match actionConfig keys
    const normalizedAction = action.toLowerCase() as 'preparing' | 'delivered' | 'cancelled' | 'refunded';
    
    // Set modal data and open
    setSelectedAction(normalizedAction);
    setBulkSelectionModalOpen(true);
  };

  // Execute bulk selection action after modal confirmation
  const executeBulkSelectionAction = async () => {
    if (selectedDeliverables.length === 0) return;

    setBulkActionLoading(true);
    const oldRows = [...rows];

    try {
      // Get selected booking data
      const selectedRows = rows.filter(r => selectedDeliverables.includes(r.id));
      
      // Update all items in selected bookings
      setRows(prev => prev.map(r => {
        if (selectedDeliverables.includes(r.id)) {
          const updatedItems = (r.items || []).map(item => ({ 
            ...item, 
            status: selectedAction === 'delivered' ? 'Delivered' : 
                   selectedAction === 'cancelled' ? 'Cancelled' : 
                   selectedAction === 'refunded' ? 'Refunded' : 'Preparing'
          }));
          return { 
            ...r, 
            items: updatedItems, 
            overall_status: selectedAction === 'delivered' ? 'Delivered' : 
                           selectedAction === 'cancelled' ? 'Cancelled' : 
                           selectedAction === 'refunded' ? 'Refunded' : 'Preparing'
          };
        }
        return r;
      }));

      // Get all item IDs from selected bookings and update them
      const allItemIds = selectedRows.flatMap(r => (r.items || []).map(item => item.id));
      
      const promises = allItemIds.map(id => 
        fetch('/api/admin/deliverables', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliverableId: id,
            newStatus: selectedAction === 'delivered' ? 'Delivered' : 
                       selectedAction === 'cancelled' ? 'Cancelled' : 
                       selectedAction === 'refunded' ? 'Refunded' : 'Preparing'
          })
        })
      );
      
      const results = await Promise.all(promises);
      
      // Check if any failed
      const failed = results.filter(res => !res.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} updates failed`);
      }

      // Update inventory stock for all delivered items
      if (selectedAction === 'delivered') {
        const allItems = selectedRows.flatMap(r => r.items || []);
        const inventoryUpdateResults = await Promise.allSettled(
          allItems.map(item =>
            updateInventoryStock(item.name, item.quantity)
          )
        );

        const inventoryFailed = inventoryUpdateResults.filter(result => result.status === 'rejected');
        if (inventoryFailed.length > 0) {
          console.error('Some inventory updates failed:', inventoryFailed);
          toast.error("All items marked as delivered but some inventory updates failed");
        } else {
          toast.success(`Successfully marked ${selectedDeliverables.length} bookings as delivered and inventory updated`);
        }
      } else {
        toast.success(`Successfully marked ${selectedDeliverables.length} bookings as ${selectedAction}`);
      }
      
      // Log employee activity
      await logEmployeeActivity(
        `BULK_UPDATE_STATUS`,
        `Bulk updated ${selectedDeliverables.length} bookings to ${selectedAction} status`,
        selectedDeliverables.join(',') // Pass multiple IDs as comma-separated
      );
      
      setSelectedDeliverables([]);
      
      // Refresh data to ensure UI is in sync with database
      await fetchData();
      
      // Close modal
      setBulkSelectionModalOpen(false);
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to process some deliverables: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Summary counts - count deliverable records (1 per booking), not individual items
  const totalCount = paginatedRows.length;
  const pendingCount = paginatedRows.filter((row) => row.overall_status === "Pending").length;
  const preparingCount = paginatedRows.filter((row) => row.overall_status === "Preparing").length;
  const deliveredCount = paginatedRows.filter((row) => row.overall_status === "Delivered").length;
  const cancelledCount = paginatedRows.filter((row) => row.overall_status === "Cancelled").length;
  const refundedCount = paginatedRows.filter((row) => row.overall_status === "Refunded").length;
  const bookingCount = paginatedRows.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Deliverables Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage add-ons and deliverables for bookings</p>
        </div>
      </div>

      {/* Status Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowStatusGuide(!showStatusGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].statusGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showStatusGuide ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex gap-1 ml-2">
            {(['en', 'fil'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setGuideLanguage(lang)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  guideLanguage === lang
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'en' ? 'EN' : 'FIL'}
              </button>
            ))}
          </div>
        </div>

        {showStatusGuide && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {guideTranslations[guideLanguage].statusGuide.statuses.map((status, idx) => {
              const statusColors: Record<string, string> = {
                Pending: 'bg-yellow-500',
                Preparing: 'bg-indigo-500',
                Delivered: 'bg-green-500',
                Cancelled: 'bg-red-500',
                Refunded: 'bg-orange-500'
              };
              const color = statusColors[status.name] || 'bg-gray-500';

              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-3 h-3 ${color} rounded-full mt-1 flex-shrink-0`}></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{status.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{status.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to Use Deliverables Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowUsageGuide(!showUsageGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].usageGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showUsageGuide ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex gap-1 ml-2">
            {(['en', 'fil'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setGuideLanguage(lang)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  guideLanguage === lang
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'en' ? 'EN' : 'FIL'}
              </button>
            ))}
          </div>
        </div>

        {showUsageGuide && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guideTranslations[guideLanguage].usageGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{idx + 1}</div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">{guideTranslations[guideLanguage].usageGuide.actionGuideTitle}</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-300">
                {guideTranslations[guideLanguage].usageGuide.actions.map((action, idx) => {
                  const getActionIcon = (title: string) => {
                    const iconMap: Record<string, typeof Play> = {
                      Preparing: Play,
                      Delivered: Truck,
                      Cancelled: XCircle
                    };
                    return iconMap[title] || Play;
                  };

                  const getActionColor = (title: string) => {
                    const colorMap: Record<string, string> = {
                      Preparing: 'text-indigo-600 dark:text-indigo-400',
                      Delivered: 'text-green-600 dark:text-green-400',
                      Cancelled: 'text-red-600 dark:text-red-400'
                    };
                    return colorMap[title] || 'text-gray-600 dark:text-gray-400';
                  };

                  const IconComponent = getActionIcon(action.title);
                  const iconColor = getActionColor(action.title);

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <span><strong>{action.title}:</strong> {action.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Operations Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowBulkGuide(!showBulkGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].bulkGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showBulkGuide ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex gap-1 ml-2">
            {(['en', 'fil'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setGuideLanguage(lang)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  guideLanguage === lang
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'en' ? 'EN' : 'FIL'}
              </button>
            ))}
          </div>
        </div>

        {showBulkGuide && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guideTranslations[guideLanguage].bulkGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{idx + 1}</div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">{guideTranslations[guideLanguage].bulkGuide.whenToUseTitle}</h5>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                {guideTranslations[guideLanguage].bulkGuide.useCases.map((useCase, idx) => {
                  const getUseCaseIcon = (title: string) => {
                    const iconMap: Record<string, typeof Play> = {
                      'Mark as Preparing': Play,
                      'Mark as Delivered': Truck,
                      'Mark as Cancelled': XCircle
                    };
                    return iconMap[title] || Play;
                  };

                  const getUseCaseColor = (title: string) => {
                    const colorMap: Record<string, string> = {
                      'Mark as Preparing': 'text-indigo-600 dark:text-indigo-400',
                      'Mark as Delivered': 'text-green-600 dark:text-green-400',
                      'Mark as Cancelled': 'text-red-600 dark:text-red-400'
                    };
                    return colorMap[title] || 'text-gray-600 dark:text-gray-400';
                  };

                  const IconComponent = getUseCaseIcon(useCase.title);
                  const iconColor = getUseCaseColor(useCase.title);

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <span><strong>{useCase.title}:</strong> {useCase.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Total Deliverables", value: String(totalCount), color: "bg-indigo-500", icon: Package },
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
                  <div className="text-3xl font-bold mt-2">
                    {isLoading ? (
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
            <button
              onClick={fetchData}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Section - Fixed height and scrollable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="lg:hidden space-y-4 bg-white dark:bg-gray-800 overflow-hidden p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: Math.min(entriesPerPage, 5) }).map((_, i) => (
                <div
                  key={`deliverables-mobile-skeleton-${i}`}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-44" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-36" />
                    </div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="mt-3 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="py-20 text-center border border-gray-200 dark:border-gray-700 rounded-lg">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No deliverables found</p>
            </div>
          ) : (
            paginatedRows.map((row) => (
              <div key={`${row.id}-mobile`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                      {highlightText(row.deliverable_id, searchTerm)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {highlightText(row.haven, searchTerm)}
                      {row.tower ? ` • ${highlightText(row.tower, searchTerm)}` : ""}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Booking: {highlightText(row.booking_id, searchTerm)}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedDeliverables.includes(row.id)}
                    onChange={(e) => handleSelectDeliverable(row.id, e.target.checked)}
                    className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary flex-shrink-0 mt-1"
                  />
                </div>

                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                  Guest: {highlightText(row.guest, searchTerm)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                    <div className="font-bold text-gray-800 dark:text-gray-100">
                      {highlightText(row.formatted_grand_total, searchTerm)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
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
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                  Check-in: {highlightText(row.checkin_date, searchTerm)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Check-out: {highlightText(row.checkout_date, searchTerm)}
                </div>

                <div className="mt-3 flex items-center justify-end gap-1">
                  <button
                    className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                    title="Mark All Preparing"
                    type="button"
                    onClick={() => handleMarkAllPreparing(row.id)}
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
              </div>
            ))
          )}
        </div>

        <div className="hidden lg:block overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
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
                // Skeleton loading rows
                Array.from({ length: entriesPerPage }).map((_, idx) => (
                  <tr
                    key={`skeleton-${idx}`}
                    className="border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    {/* Select Checkbox */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </td>
                    {/* Deliverable ID */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </td>
                    {/* Haven & Booking */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </td>
                    {/* Guest */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                      </div>
                    </td>
                    {/* Item Details */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </td>
                    {/* Total */}
                    <td className="py-4 px-4 text-right border border-gray-200 dark:border-gray-700">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                    </td>
                    {/* Status */}
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
                    </td>
                    {/* Check-in / Check-out */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    </td>
                  </tr>
                ))
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
                          <Calendar className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Check-in:</span>
                          <span className="text-xs font-semibold text-green-700 dark:text-green-300">{highlightText(row.checkin_date, searchTerm)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-red-500" />
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
                          onClick={() => handleMarkAllPreparing(row.id)}
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

      {/* Individual Item Action Modal */}
      <DeliverableActionModal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedBooking(null);
          setSelectedItem(null);
        }}
        onConfirm={executeItemStatusUpdate}
        action={selectedAction}
        booking={selectedBooking}
        item={selectedItem}
        isLoading={isActionLoading}
      />

      {/* Bulk Action Modal */}
      <BulkDeliverableActionModal
        isOpen={bulkActionModalOpen}
        onClose={() => {
          setBulkActionModalOpen(false);
          setSelectedBooking(null);
        }}
        onConfirm={executeBulkAction}
        action={selectedAction}
        booking={selectedBooking}
        items={selectedBooking?.items || []}
        isLoading={isActionLoading}
      />

      {/* Bulk Selection Action Modal */}
      <BulkSelectionActionModal
        isOpen={bulkSelectionModalOpen}
        onClose={() => {
          setBulkSelectionModalOpen(false);
        }}
        onConfirm={executeBulkSelectionAction}
        action={selectedAction}
        selectedBookings={rows.filter(r => selectedDeliverables.includes(r.id)).map(r => ({
          id: r.id,
          deliverable_id: r.deliverable_id,
          guest: r.guest,
          haven: r.haven,
          checkin_date: r.checkin_date,
          checkout_date: r.checkout_date,
          overall_status: r.overall_status,
          payment_status: r.payment_status || 'pending',
          grand_total: r.grand_total,
          formatted_grand_total: r.formatted_grand_total,
          items: r.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            formatted_price: item.formatted_price,
            total: item.total_price,
            formatted_total: item.formatted_total,
            status: item.status,
            notes: item.notes ?? undefined
          }))
        }))}
        isLoading={bulkActionLoading}
      />
    </div>
  );
}
