"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X, Package, Activity } from "lucide-react";

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface ViewInventoryItem {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_type: string;
  price_per_unit: number;
  last_restocked: string | null;
  status: InventoryStatus;
}

interface ViewItemProps {
  item: ViewInventoryItem;
  onClose: () => void;
}

const statusToColor = (status: InventoryStatus) => {
  if (status === "In Stock") return "bg-green-100 text-green-700";
  if (status === "Low Stock") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
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

const shortenId = (id: string): string => {
  if (id.length <= 12) return id;
  const first = id.slice(0, 8);
  const last = id.slice(-4);
  return `${first}...${last}`;
};

const maskId = (id: string): string => {
  // Show only first 4 chars and last 2 chars
  if (id.length <= 8) return id;
  const first = id.slice(0, 4);
  const last = id.slice(-2);
  return `${first}...${last}`;
};

export default function ViewItem({ item, onClose }: ViewItemProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts - use requestAnimationFrame to avoid cascading renders
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  const statusColor = useMemo(() => statusToColor(item.status), [item.status]);

  if (!isMounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999] pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary rounded-lg">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Inventory Item Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View complete item information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Package className="w-4 h-4" />
                Item Information
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID:</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {maskId(item.item_id)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.item_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Category:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Activity className="w-4 h-4" />
                Stock Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Current:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {item.current_stock}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Minimum:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {item.minimum_stock}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Unit:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.unit_type || "-"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Price Per Unit:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {new Intl.NumberFormat('en-PH', {
                      style: 'currency',
                      currency: 'PHP',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.price_per_unit)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Restocked:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(item.last_restocked)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}