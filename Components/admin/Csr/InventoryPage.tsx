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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddItem from "./Modals/AddItem";

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface InventoryRow {
  inventory_id: string;
  item_name: string;
  stock: number;
  price: number;
  status: InventoryStatus;
  statusColor: string;
}

type InventoryApiRow = {
  inventory_id: string;
  item_name: string;
  stock_quantity: number;
  price: string | number | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const statusToColor = (status: InventoryStatus) => {
  if (status === "In Stock") return "bg-green-100 text-green-700";
  if (status === "Low Stock") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const getUiStatus = (apiStatus: string, stockQty: number): InventoryStatus => {
  if (apiStatus === "Out of Stock") return "Out of Stock";
  return stockQty > 0 && stockQty <= 10 ? "Low Stock" : "In Stock";
};

interface UsageRow {
  item_id: string;
  name: string;
  used_today: number;
  used_week: number;
  trend: "up" | "down";
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
};

export default function InventoryPage() {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | InventoryStatus>("all");
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
      const priceNum = r.price === null ? 0 : Number(r.price);
      const stockQty = Number(r.stock_quantity ?? 0);
      const status = getUiStatus(r.status, stockQty);
      return {
        inventory_id: r.inventory_id,
        item_name: r.item_name,
        stock: stockQty,
        price: Number.isFinite(priceNum) ? priceNum : 0,
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
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load inventory");
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
        row.inventory_id.toLowerCase().includes(term) ||
        row.item_name.toLowerCase().includes(term);

      const matchesFilter = filterStatus === "all" || row.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, rows, searchTerm]);

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

  const deleteRow = (item_id: string) => {
    setRows((prev) => prev.filter((r) => r.inventory_id !== item_id));
  };

  const totalCount = rows.length;
  const inStockCount = rows.filter((r) => r.status === "In Stock").length;
  const lowStockCount = rows.filter((r) => r.status === "Low Stock").length;
  const outOfStockCount = rows.filter((r) => r.status === "Out of Stock").length;

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
              const apiStatus: InventoryStatus =
                item.stock === 0
                  ? "Out of Stock"
                  : item.stock <= 10
                    ? "Low Stock"
                    : "In Stock";

              const res = await fetch("/api/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  item_name: item.name,
                  stock_quantity: item.stock,
                  price: item.price,
                  status: apiStatus,
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
                placeholder="Search by item ID or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
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
                  onClick={() => handleSort("inventory_id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Inventory ID
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
                  onClick={() => handleSort("stock")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Stock
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("price")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Price
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
                  <td colSpan={6} className="py-10 px-4 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-3">
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-sm text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.inventory_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 text-sm">{row.inventory_id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 text-sm">{row.item_name}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm font-semibold text-gray-700">{row.stock}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{formatCurrency(row.price)}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View" type="button">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors" title="Edit" type="button">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                          type="button"
                          onClick={() => deleteRow(row.inventory_id)}
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