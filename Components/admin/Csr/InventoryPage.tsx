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
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import AddItem from "./Modals/AddItem";
import EditItem, { EditInventoryItemInput } from "./Modals/EditItem";
import ViewItem, { ViewInventoryItem } from "./Modals/ViewItem";

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

const CATEGORY_FILTER_OPTIONS = [
  "Guest Amenities",
  "Bathroom Supplies",
  "Cleaning Supplies",
  "Linens & Bedding",
  "Kitchen Supplies",
] as const;

interface InventoryRow {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_type: string;
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

export default function InventoryPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [viewItem, setViewItem] = useState<ViewInventoryItem | null>(null);
  const [editItem, setEditItem] = useState<EditInventoryItemInput | null>(null);

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

  const usageRows: UsageRow[] = [
    { item_id: "IT-001", name: "Bath Towel", used_today: 12, used_week: 78, trend: "up" },
    { item_id: "IT-002", name: "Guest Kit", used_today: 5, used_week: 34, trend: "up" },
    { item_id: "IT-004", name: "Extra Slippers", used_today: 3, used_week: 19, trend: "down" },
    { item_id: "IT-005", name: "Extra Comforter", used_today: 2, used_week: 9, trend: "up" },
  ];

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

  const deleteRow = async (row: InventoryRow) => {
    const confirmed = window.confirm(`Delete ${row.item_name}?`);
    if (!confirmed) return;
    try {
      const res = await fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: row.item_id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || payload?.message || "Failed to delete item");
      }
      await loadInventory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
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
    const headers = ["Item ID", "Item Name", "Category", "Current Stock", "Minimum Stock", "Unit Type", "Status", "Last Restocked"];
    const csvLines = [headers.join(",")];

    rowsToExport.forEach((row) => {
      const line = [
        row.item_id,
        row.item_name,
        row.category,
        row.current_stock,
        row.minimum_stock,
        row.unit_type,
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
    const rowsToExport = getExportRows();
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    const tableRows = rowsToExport
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.item_id)}</td>
            <td>${escapeHtml(row.item_name)}</td>
            <td>${escapeHtml(row.category)}</td>
            <td>${row.current_stock}</td>
            <td>${row.minimum_stock}</td>
            <td>${escapeHtml(row.unit_type)}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${escapeHtml(row.last_restocked ? formatDateTime(row.last_restocked) : "-")}</td>
          </tr>
        `,
      )
      .join("");

    const doc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { text-align: center; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Inventory Report</h1>
          <p>Generated: ${escapeHtml(new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }))}</p>
          <table>
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Minimum Stock</th>
                <th>Unit Type</th>
                <th>Status</th>
                <th>Last Restocked</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || "<tr><td colspan='8'>No data to display</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(doc);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage items, stock levels, and usage tracking</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddItemOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {isAddItemOpen && (
        <AddItem
          onClose={() => setIsAddItemOpen(false)}
          onAdd={async (item) => {
            setLoading(true);
            setError(null);
            try {
              const derivedStatus: InventoryStatus =
                !Number.isFinite(item.current_stock) || item.current_stock <= 0
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
                  status: derivedStatus,
                }),
              });

              const payload = await res.json().catch(() => ({}));
              if (!res.ok) {
                throw new Error(payload?.error || payload?.message || `Request failed (${res.status})`);
              }

              await loadInventory();
            } finally {
              setLoading(false);
            }
          }}
        />
      )}

      {viewItem && <ViewItem item={viewItem} onClose={() => setViewItem(null)} />}
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
              throw new Error(json?.error || json?.message || "Failed to update item");
            }
            await loadInventory();
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: String(totalCount), color: "bg-pink-500", icon: Package },
          { label: "In Stock", value: String(inStockCount), color: "bg-green-500", icon: TrendingUp },
          { label: "Low Stock", value: String(lowStockCount), color: "bg-yellow-500", icon: Activity },
          { label: "Out of Stock", value: String(outOfStockCount), color: "bg-red-500", icon: TrendingDown },
        ].map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
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

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 whitespace-nowrap">entries</label>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by item ID, item name, category, or unit type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as "all" | InventoryStatus);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Category</span>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort("item_id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Item ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("item_name")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Item Name
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("category")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Category
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("current_stock")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Stock
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("unit_type")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Unit
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("last_restocked")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Last Restocked
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-sm text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.item_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 text-sm">{row.item_id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 text-sm">{row.item_name}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-700">{row.category}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {row.current_stock}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-700">{row.unit_type}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {formatDateTime(row.last_restocked)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                          type="button"
                          onClick={() => {
                            setViewItem({
                              item_id: row.item_id,
                              item_name: row.item_name,
                              category: row.category,
                              current_stock: row.current_stock,
                              minimum_stock: row.minimum_stock,
                              unit_type: row.unit_type,
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
                          onClick={() => deleteRow(row)}
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

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} entries
              {searchTerm || filterStatus !== "all" ? ` (filtered from ${rows.length} total entries)` : ""}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
                type="button"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                        : "border border-gray-300 hover:bg-white"
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
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
                type="button"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Usage Tracking</h3>
            <p className="text-sm text-gray-500">Monitor how frequently inventory items are used</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">Item</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">Used Today</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">Used This Week</th>
                <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 whitespace-nowrap">Trend</th>
              </tr>
            </thead>
            <tbody>
              {usageRows.map((u) => (
                <tr key={u.item_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.item_id}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-semibold text-gray-700">{u.used_today}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-sm font-semibold text-gray-700">{u.used_week}</span>
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
  );
}