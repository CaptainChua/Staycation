"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Edit, X } from "lucide-react";

type InventoryCategory =
  | "Guest Amenities"
  | "Bathroom Supplies"
  | "Cleaning Supplies"
  | "Linens & Bedding"
  | "Kitchen Supplies"
  | "Add ons";

type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface EditInventoryItemInput {
  item_id: string;
  item_name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit_type: string;
  price_per_unit: number;
  status: InventoryStatus;
}

interface EditItemProps {
  item: EditInventoryItemInput;
  onClose: () => void;
  onSave?: (payload: {
    item_id: string;
    item_name: string;
    category: string;
    current_stock: number;
    minimum_stock: number;
    unit_type: string;
    price_per_unit: number;
    status: InventoryStatus;
  }) => Promise<void>;
}

export default function EditItem({ item, onClose, onSave }: EditItemProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    item_name: item.item_name,
    category: item.category as InventoryCategory,
    current_stock: item.current_stock,
    minimum_stock: item.minimum_stock,
    unit_type: item.unit_type,
    price_per_unit: item.price_per_unit,
  });

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const isValid = useMemo(() => {
    return (
      form.item_name.trim().length > 0 &&
      form.unit_type.trim().length > 0 &&
      Number.isFinite(form.current_stock) &&
      form.current_stock >= 0 &&
      Number.isFinite(form.minimum_stock) &&
      form.minimum_stock >= 0 &&
      Number.isFinite(form.price_per_unit) &&
      form.price_per_unit >= 0
    );
  }, [form.current_stock, form.minimum_stock, form.item_name, form.unit_type, form.price_per_unit]);

  const derivedStatus = useMemo<InventoryStatus>(() => {
    const current = Number(form.current_stock ?? 0);
    if (!Number.isFinite(current) || current <= 0) return "Out of Stock";
    if (current <= 10) return "Low Stock";
    return "In Stock";
  }, [form.current_stock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) {
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await onSave?.({
        item_id: item.item_id,
        item_name: form.item_name.trim(),
        category: form.category,
        current_stock: Math.max(0, Math.floor(form.current_stock)),
        minimum_stock: Math.max(0, Math.floor(form.minimum_stock)),
        unit_type: form.unit_type.trim(),
        price_per_unit: Math.max(0, parseFloat(form.price_per_unit.toFixed(2))),
        status: derivedStatus,
      });
      setSuccess("Item updated successfully.");
      window.setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={() => {
          if (isSaving) return;
          onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close modal"
      />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999] pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary rounded-lg">
                <Edit className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Edit Inventory Item
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update item details and stock levels
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <form
            id="edit-item-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
          >
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Item ID
                </label>
                <input
                  value={item.item_id}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed rounded-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Item Name
                </label>
                <input
                  value={form.item_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, item_name: e.target.value }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. Bath Towel"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      category: e.target.value as InventoryCategory,
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Guest Amenities">Guest Amenities</option>
                  <option value="Bathroom Supplies">Bathroom Supplies</option>
                  <option value="Cleaning Supplies">Cleaning Supplies</option>
                  <option value="Linens & Bedding">Linens &amp; Bedding</option>
                  <option value="Kitchen Supplies">Kitchen Supplies</option>
                  <option value="Add ons">Add ons</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Current Stock
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.current_stock}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      current_stock: Number(e.target.value),
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.minimum_stock}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      minimum_stock: Number(e.target.value),
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Unit Type
                </label>
                <input
                  value={form.unit_type}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unit_type: e.target.value }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g. pcs, bottles, sets"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Price Per Unit
                </label>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={form.price_per_unit}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      price_per_unit: Number(e.target.value),
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={derivedStatus}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed rounded-xl"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </form>

          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-item-form"
              disabled={!isValid || isSaving}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isSaving && (
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}