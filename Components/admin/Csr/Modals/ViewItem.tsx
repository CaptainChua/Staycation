"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X } from "lucide-react";

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface ViewInventoryItem {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_type: string;
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
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-[0.2em]">
                  Inventory
                </p>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  View Item
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Item details (read-only)
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

          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Item ID
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.item_id}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Status
                </p>
                <span
                  className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusColor}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Item Name
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.item_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Category
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.category}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Unit Type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.unit_type || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Current Stock
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.current_stock}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Minimum Stock
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {item.minimum_stock}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Last Restocked
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {formatDateTime(item.last_restocked)}
                </p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-8 py-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold"
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