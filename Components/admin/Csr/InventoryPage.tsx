"use client";

import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  Activity,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  FileDown,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import AddItem from "./Modals/AddItem";
import EditItem, { EditInventoryItemInput } from "./Modals/EditItem";
import ViewItem, { ViewInventoryItem } from "./Modals/ViewItem";
import DeleteConfirmation from "./Modals/DeleteConfirmation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

const CATEGORY_FILTER_OPTIONS = [
  "Guest Amenities",
  "Bathroom Supplies",
  "Cleaning Supplies",
  "Linens & Bedding",
  "Kitchen Supplies",
  "Add ons",
] as const;

interface InventoryRow {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_type: string;
  price_per_unit: number;
  last_restocked: string | null;
  status: InventoryStatus;
  statusColor: string;
}

type InventoryApiRow = {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_type: string;
  price_per_unit: number;
  last_restocked: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

interface UsageRow {
  item_id: string;
  name: string;
  used_today: number;
  used_week: number;
  trend: "up" | "down";
}

const statusToColor = (status: InventoryStatus) => {
  if (status === "In Stock") return "bg-green-100 text-green-700";
  if (status === "Low Stock") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const getUiStatus = (currentStock: number): InventoryStatus => {
  if (!Number.isFinite(currentStock) || currentStock <= 0) return "Out of Stock";
  if (currentStock <= 10) return "Low Stock";
  return "In Stock";
};

const formatDateTime = (value: unknown) => {
  if (!value) return "-";

  const asDate = value instanceof Date ? value : null;
  const asString = typeof value === "string" ? value.trim() : "";
  const asNumber = typeof value === "number" ? value : NaN;

  const normalizedString = asString.includes("T")
    ? asString
    : asString.includes(" ")
      ? asString.replace(" ", "T")
      : asString;

  const d = asDate ?? (Number.isFinite(asNumber) ? new Date(asNumber) : new Date(normalizedString));
  if (!Number.isFinite(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

// Translation content for guides
const guideTranslations = {
  en: {
    statusGuide: {
      title: "Inventory Status Guide",
      statuses: [
        {
          name: "In Stock",
          description: "Items have sufficient quantity above minimum threshold"
        },
        {
          name: "Low Stock",
          description: "Items are running low (at or below threshold of 10 units)"
        },
        {
          name: "Out of Stock",
          description: "No items available or quantity is zero"
        }
      ]
    },
    usageGuide: {
      title: "How to Manage Inventory",
      steps: [
        {
          title: "Add New Items",
          description: "Click 'Add Item' to create new inventory items with category, stock level, and minimum threshold"
        },
        {
          title: "Monitor Stock Levels",
          description: "Review status indicators to track which items need restocking"
        },
        {
          title: "Edit Item Details",
          description: "Update item information including current stock, minimum stock, and unit type"
        },
        {
          title: "Track Usage",
          description: "Monitor usage patterns to optimize reorder quantities"
        }
      ],
      actionGuideTitle: "How to Use Actions:",
      actions: [
        {
          title: "View",
          description: "Click the eye icon to view full item details and history"
        },
        {
          title: "Edit",
          description: "Update item stock levels, thresholds, and other details"
        },
        {
          title: "Delete",
          description: "Remove items that are no longer needed"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Filter Items",
          description: "Use search, category, and status filters to find items you want to manage"
        },
        {
          title: "Export Data",
          description: "Download inventory data as CSV or PDF for reporting and analysis"
        },
        {
          title: "Review & Track",
          description: "Monitor stock levels and usage trends across all items"
        }
      ],
      whenToUseTitle: "When to Use Features:",
      useCases: [
        {
          title: "Use Filters",
          description: "When you need to focus on specific items by category or stock status"
        },
        {
          title: "Export Reports",
          description: "When you need to share inventory data with management or suppliers"
        },
        {
          title: "Monitor Usage",
          description: "When planning reorder schedules based on consumption patterns"
        }
      ]
    }
  },
  fil: {
    statusGuide: {
      title: "Inventory Status Guide",
      statuses: [
        {
          name: "In Stock",
          description: "May sapat na dami ng items sa minimum threshold"
        },
        {
          name: "Low Stock",
          description: "Kaunting items na lang (10 units o mas kaunti)"
        },
        {
          name: "Out of Stock",
          description: "Walang items o zero ang quantity"
        }
      ]
    },
    usageGuide: {
      title: "Paano mag-manage ng Inventory",
      steps: [
        {
          title: "Magdagdag ng Bagong Items",
          description: "I-click 'Add Item' para gumawa ng bagong inventory items with category, stock level, at minimum"
        },
        {
          title: "Bantayan ang Stock Levels",
          description: "Tingnan ang status para malaman kung aling items ang kailangan ng restock"
        },
        {
          title: "I-edit ang Item Details",
          description: "I-update ang item info kasama ang current stock, minimum stock, at unit type"
        },
        {
          title: "Bantayan ang Usage",
          description: "Subaybayan ang usage patterns para ma-optimize ang reorder quantities"
        }
      ],
      actionGuideTitle: "Paano gamitin ang Actions:",
      actions: [
        {
          title: "View",
          description: "I-click ang mata icon para makita ang full item details at history"
        },
        {
          title: "Edit",
          description: "I-update ang item stock levels, thresholds, at iba pang details"
        },
        {
          title: "Delete",
          description: "I-tanggal ang items na hindi na kailangan"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Mag-filter ng Items",
          description: "Gamitin ang search, category, at status filters para mahanap ang items"
        },
        {
          title: "I-export ang Data",
          description: "I-download ang inventory data as CSV o PDF para sa reports at analysis"
        },
        {
          title: "Subaybayan ang Stock",
          description: "Bantayan ang stock levels at usage trends sa lahat ng items"
        }
      ],
      whenToUseTitle: "Kailan gamitin ang Features:",
      useCases: [
        {
          title: "Gamitin ang Filters",
          description: "Pag kailangan mong mag-focus sa specific items by category o stock status"
        },
        {
          title: "I-export ang Reports",
          description: "Pag kailangan mong magbahagi ng inventory data sa management o suppliers"
        },
        {
          title: "Bantayan ang Usage",
          description: "Pag nagplaplano ng reorder schedules based sa consumption patterns"
        }
      ]
    }
  }
};

export default function InventoryPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ViewInventoryItem | null>(null);
  const [editItem, setEditItem] = useState<EditInventoryItemInput | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | InventoryStatus>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof InventoryRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<InventoryRow[]>([]);

  // Guide states
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showBulkGuide, setShowBulkGuide] = useState(false);
  const [guideLanguage, setGuideLanguage] = useState<"en" | "fil">("en");

  const loadInventory = async () => {
    const res = await fetch("/api/inventory", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed (${res.status})`);
    }

    const json: { success: boolean; data: InventoryApiRow[] } = await res.json();
    const apiRows = Array.isArray(json?.data) ? json.data : [];

    const mapped: InventoryRow[] = apiRows.map((r) => {
      const currentStock = Number(r.current_stock ?? 0);
      const status = getUiStatus(currentStock);
      const lastRestocked = r.last_restocked ?? r.created_at ?? null;
      return {
        item_id: r.item_id,
        item_name: r.item_name,
        category: r.category,
        current_stock: currentStock,
        minimum_stock: Number(r.minimum_stock ?? 0),
        unit_type: r.unit_type,
        price_per_unit: Number(r.price_per_unit ?? 0),
        last_restocked: lastRestocked,
        status,
        statusColor: statusToColor(status),
      };
    });

    setRows(mapped);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        await loadInventory();
      } catch (e: unknown) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load inventory");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute usage rows dynamically from inventory data
  const usageRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    // Only show items with low stock or out of stock as they indicate higher usage
    return rows
      .filter(row => row.status === "Low Stock" || row.status === "Out of Stock")
      .map(row => {
        // Calculate usage metrics based on stock levels
        const stockDeficiency = Math.max(0, row.minimum_stock - row.current_stock);
        const used_today = Math.ceil(stockDeficiency / 3); // Estimate daily usage
        const used_week = stockDeficiency * 2; // Estimate weekly usage

        // Determine trend based on current stock vs minimum threshold
        const trend: "up" | "down" = row.current_stock < (row.minimum_stock / 2) ? "up" : "down";

        return {
          item_id: row.item_id,
          name: row.item_name,
          used_today,
          used_week,
          trend
        };
      })
      .slice(0, 10); // Show top 10 most used items
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        row.item_id.toLowerCase().includes(term) ||
        row.item_name.toLowerCase().includes(term) ||
        row.category.toLowerCase().includes(term) ||
        row.unit_type.toLowerCase().includes(term);

      const matchesStatus = filterStatus === "all" || row.status === filterStatus;
      const matchesCategory = filterCategory === "all" || row.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [filterCategory, filterStatus, rows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      const aSortable = String(a[sortField] ?? "").toLowerCase();
      const bSortable = String(b[sortField] ?? "").toLowerCase();
      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof InventoryRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    setIsDeleting(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: deleteItem.item_id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || payload?.message || "Failed to delete item");
      }
      setDeleteSuccess("Item deleted successfully.");
      setRows([]);
      setLoading(true);
      await loadInventory();
      setLoading(false);
      window.setTimeout(() => {
        setDeleteItem(null);
        setDeleteSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalCount = rows.length;
  const inStockCount = rows.filter((r) => r.status === "In Stock").length;
  const lowStockCount = rows.filter((r) => r.status === "Low Stock").length;
  const outOfStockCount = rows.filter((r) => r.status === "Out of Stock").length;

  const categoryOptions = CATEGORY_FILTER_OPTIONS;

  const getExportRows = () => sortedRows;

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rowsToExport = getExportRows();
    const headers = ["Item ID", "Item Name", "Category", "Current Stock", "Minimum Stock", "Unit Type", "Price Per Unit", "Status", "Last Restocked"];
    const csvLines = [headers.join(",")];

    rowsToExport.forEach((row) => {
      const line = [
        row.item_id,
        row.item_name,
        row.category,
        row.current_stock,
        row.minimum_stock,
        row.unit_type,
        row.price_per_unit,
        row.status,
        row.last_restocked ? formatDateTime(row.last_restocked) : "-",
      ]
        .map((value) => {
          const safe = String(value ?? "").replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",");
      csvLines.push(line);
    });

    const timestamp = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(new Date())
      .replace(/[^\d]/g, "");

    downloadBlob(csvLines.join("\n"), `inventory_${timestamp}.csv`, "text/csv;charset=utf-8;");
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

 const handleExportPdf = () => {
   try {
     const rowsToExport = getExportRows();

     if (rowsToExport.length === 0) {
       alert("No data to export");
       return;
     }

     const doc = new jsPDF({
       orientation: "landscape",
       unit: "mm",
       format: "a4",
     });

     doc.setFontSize(18);
     doc.setFont("helvetica", "bold");
     doc.text("Inventory Report", doc.internal.pageSize.getWidth() / 2, 15, {
       align: "center",
     });

     doc.setFontSize(10);
     doc.setFont("helvetica", "normal");
     const generatedDate = new Date().toLocaleString("en-PH", {
       timeZone: "Asia/Manila",
     });
     doc.text(
       `Generated: ${generatedDate}`,
       doc.internal.pageSize.getWidth() / 2,
       22,
       { align: "center" },
     );

     const tableHeaders = [
       "Item ID",
       "Item Name",
       "Category",
       "Current Stock",
       "Minimum Stock",
       "Unit Type",
       "Price Per Unit",
       "Status",
       "Last Restocked",
     ];

     const tableData = rowsToExport.map((row) => [
       row.item_id,
       row.item_name,
       row.category,
       row.current_stock.toString(),
       row.minimum_stock.toString(),
       row.unit_type,
       `₱${row.price_per_unit.toFixed(2)}`,
       row.status,
       row.last_restocked ? formatDateTime(row.last_restocked) : "-",
     ]);

     autoTable(doc, {
       head: [tableHeaders],
       body: tableData,
       startY: 28,
       theme: "grid",
       styles: {
         fontSize: 9,
         cellPadding: 3,
       },
       headStyles: {
         fillColor: [243, 244, 246],
         textColor: [31, 41, 55],
         fontStyle: "bold",
       },
       columnStyles: {
         0: { cellWidth: 35 },
         1: { cellWidth: 45 },
         2: { cellWidth: 35 },
         3: { cellWidth: 25, halign: "center" },
         4: { cellWidth: 25, halign: "center" },
         5: { cellWidth: 25, halign: "center" },
         6: { cellWidth: 25, halign: "center" },
         7: { cellWidth: 45 },
       },
     });

     const timestamp = new Intl.DateTimeFormat("en-CA", {
       year: "numeric",
       month: "2-digit",
       day: "2-digit",
       hour: "2-digit",
       minute: "2-digit",
       second: "2-digit",
     })
       .format(new Date())
       .replace(/[^\d]/g, "");

     doc.save(`inventory_report_${timestamp}.pdf`);
   } catch (error) {
     console.error("Error exporting PDF:", error);
     alert("Failed to export PDF. Please check the console for errors.");
   }
 };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      <div className="w-full space-y-6 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Inventory Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage items, stock levels, and usage tracking
              </p>
            </div>
          </div>

          {isAddItemOpen && (
            <AddItem
              onClose={() => setIsAddItemOpen(false)}
              onAdd={async (item) => {
                setLoading(true);
                setError(null);
                try {
                  const derivedStatus: InventoryStatus =
                    !Number.isFinite(item.current_stock) ||
                    item.current_stock <= 0
                      ? "Out of Stock"
                      : item.current_stock <= 10
                        ? "Low Stock"
                        : "In Stock";

                  const res = await fetch("/api/inventory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      item_name: item.name,
                      category: item.category,
                      current_stock: item.current_stock,
                      minimum_stock: item.minimum_stock,
                      unit_type: item.unit_type,
                      price_per_unit: item.price_per_unit,
                      status: derivedStatus,
                    }),
                  });

                  const payload = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    throw new Error(
                      payload?.error ||
                        payload?.message ||
                        `Request failed (${res.status})`,
                    );
                  }

                  setRows([]);
                  setLoading(true);
                  await loadInventory();
                  setLoading(false);
                } catch (e: unknown) {
                  setLoading(false);
                  throw e;
                }
              }}
            />
          )}

          {viewItem && (
            <ViewItem item={viewItem} onClose={() => setViewItem(null)} />
          )}
          {editItem && (
            <EditItem
              item={editItem}
              onClose={() => setEditItem(null)}
              onSave={async (payload) => {
                const res = await fetch("/api/inventory", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(
                    json?.error || json?.message || "Failed to update item",
                  );
                }
                await loadInventory();
              }}
            />
          )}
          {deleteItem && (
            <DeleteConfirmation
              itemName={deleteItem.item_name}
              itemId={deleteItem.item_id}
              onConfirm={confirmDelete}
              onCancel={() => {
                setDeleteItem(null);
                setDeleteError(null);
                setDeleteSuccess(null);
              }}
              isDeleting={isDeleting}
              error={deleteError}
              success={deleteSuccess}
            />
          )}

          {/* Status Guide */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
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
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {guideTranslations[guideLanguage].statusGuide.statuses.map((status, idx) => {
                  const statusColors: Record<string, string> = {
                    "In Stock": "bg-green-500",
                    "Low Stock": "bg-yellow-500",
                    "Out of Stock": "bg-red-500"
                  };
                  const color = statusColors[status.name] || "bg-gray-500";

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

          {/* How to Use Inventory Guide */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
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
                        const iconMap: Record<string, typeof Eye> = {
                          View: Eye,
                          Edit: Edit,
                          Delete: Trash2
                        };
                        return iconMap[title] || Eye;
                      };

                      const getActionColor = (title: string) => {
                        const colorMap: Record<string, string> = {
                          View: 'text-blue-600 dark:text-blue-400',
                          Edit: 'text-indigo-600 dark:text-indigo-400',
                          Delete: 'text-red-600 dark:text-red-400'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
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
                        const iconMap: Record<string, typeof AlertCircle> = {
                          'Use Filters': Filter,
                          'Export Reports': FileDown,
                          'Monitor Usage': Activity
                        };
                        return iconMap[title] || AlertCircle;
                      };

                      const getUseCaseColor = (title: string) => {
                        const colorMap: Record<string, string> = {
                          'Use Filters': 'text-blue-600 dark:text-blue-400',
                          'Export Reports': 'text-green-600 dark:text-green-400',
                          'Monitor Usage': 'text-indigo-600 dark:text-indigo-400'
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Items",
                value: String(totalCount),
                color: "bg-pink-500",
                icon: Package,
              },
              {
                label: "In Stock",
                value: String(inStockCount),
                color: "bg-green-500",
                icon: TrendingUp,
              },
              {
                label: "Low Stock",
                value: String(lowStockCount),
                color: "bg-yellow-500",
                icon: Activity,
              },
              {
                label: "Out of Stock",
                value: String(outOfStockCount),
                color: "bg-red-500",
                icon: TrendingDown,
              },
            ].map((stat, i) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={i}
                  className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg hover:scale-[1.02] transition-all`}
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

          <div className="flex justify-start flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsAddItemOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    Show
                  </label>
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    entries
                  </label>
                </div>

                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by item ID, item name, category, or unit type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(
                        e.target.value as "all" | InventoryStatus,
                      );
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Category
                  </span>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="all">All Categories</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadInventory}
                    className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-red-500 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-green-500 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                  <tr>
                    <th
                      onClick={() => handleSort("item_id")}
                      className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        Item ID
                        <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("item_name")}
                      className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        Item Name
                        <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("category")}
                      className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Category
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("current_stock")}
                      className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Stock
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("unit_type")}
                      className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Unit
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("price_per_unit")}
                      className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Price
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("last_restocked")}
                      className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Last Restocked
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("status")}
                      className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Status
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 px-4 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        <div className="flex items-center justify-center gap-3">
                          <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                          Loading inventory...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 px-4 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.item_id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                            {row.item_id}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                            {row.item_name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {row.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {row.current_stock}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {row.unit_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {row.price_per_unit > 0
                              ? `₱${row.price_per_unit.toFixed(2)}`
                              : ""}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                            {formatDateTime(row.last_restocked)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${row.statusColor}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                              type="button"
                              onClick={async () => {
                                try {
                                  // Call API to log the view action
                                  await fetch(`/api/inventory?item_id=${row.item_id}`, {
                                    method: "GET",
                                    headers: { "Content-Type": "application/json" },
                                  });
                                } catch (err) {
                                  console.error("Failed to log view action:", err);
                                }
                                // Show the view modal
                                setViewItem({
                                  item_id: row.item_id,
                                  item_name: row.item_name,
                                  category: row.category,
                                  current_stock: row.current_stock,
                                  minimum_stock: row.minimum_stock,
                                  unit_type: row.unit_type,
                                  price_per_unit: row.price_per_unit,
                                  last_restocked: row.last_restocked,
                                  status: row.status,
                                });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors"
                              title="Edit"
                              type="button"
                              onClick={() =>
                                setEditItem({
                                  item_id: row.item_id,
                                  item_name: row.item_name,
                                  category: row.category,
                                  current_stock: row.current_stock,
                                  minimum_stock: row.minimum_stock,
                                  unit_type: row.unit_type,
                                  price_per_unit: row.price_per_unit,
                                  status: row.status,
                                })
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                              type="button"
                              onClick={() => setDeleteItem(row)}
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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(endIndex, sortedRows.length)} of {sortedRows.length}{" "}
                  entries
                  {searchTerm || filterStatus !== "all"
                    ? ` (filtered from ${rows.length} total entries)`
                    : ""}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || totalPages === 0}
                    className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="First Page"
                    type="button"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || totalPages === 0}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from(
                    { length: Math.min(5, totalPages || 1) },
                    (_, i) => {
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
                              ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md"
                              : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                          disabled={totalPages === 0}
                          type="button"
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Last Page"
                    type="button"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Usage Tracking
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monitor how frequently inventory items are used
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Item
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Used Today
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Used This Week
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.map((u) => (
                    <tr
                      key={u.item_id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {u.item_id}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {u.used_today}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {u.used_week}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.trend === "up" ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            Up
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                            <TrendingDown className="w-4 h-4" />
                            Down
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}