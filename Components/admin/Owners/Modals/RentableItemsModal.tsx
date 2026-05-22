"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Pencil, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface RentableItem {
  id: number;
  haven_id: string;
  name: string;
  icon: string;
  price_per_night: number;
  is_active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  havenId: string;
  havenName: string;
}

const emptyForm = { name: "", icon: "🛎️", price_per_night: "" };

export default function RentableItemsModal({ isOpen, onClose, havenId, havenName }: Props) {
  const [items, setItems] = useState<RentableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    if (isOpen && havenId) fetchItems();
  }, [isOpen, havenId]);

  async function fetchItems() {
    if (!havenId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/haven/${havenId}/rentable-items`);
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load rentable items");
    } catch (err) {
      console.error("[RentableItemsModal] fetchItems error:", err);
      toast.error("Failed to load rentable items");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!havenId) return toast.error("Haven ID is missing — please close and reopen the modal.");
    if (!form.name.trim()) return toast.error("Name is required");
    const price = parseFloat(form.price_per_night);
    if (isNaN(price) || price < 0) return toast.error("Enter a valid price");

    setSaving(true);
    try {
      const res = await fetch(`/api/haven/${havenId}/rentable-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), icon: form.icon || "🛎️", price_per_night: price }),
      });
      const text = await res.text();
      let json: { success: boolean; data?: RentableItem; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        console.error("[RentableItemsModal] Non-JSON response:", text.slice(0, 300));
        toast.error("Server error — check that the haven_rentable_items table exists in the database.");
        return;
      }
      if (json.success && json.data) {
        setItems((prev) => [...prev, json.data as RentableItem]);
        setForm(emptyForm);
        toast.success("Item added");
      } else {
        toast.error(json.error || "Failed to add item");
      }
    } catch (err) {
      console.error("[RentableItemsModal] handleAdd error:", err);
      toast.error("Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: number) {
    if (!editForm.name.trim()) return toast.error("Name is required");
    const price = parseFloat(editForm.price_per_night);
    if (isNaN(price) || price < 0) return toast.error("Enter a valid price");

    setSaving(true);
    try {
      const res = await fetch(`/api/haven/rentable-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name.trim(), icon: editForm.icon || "🛎️", price_per_night: price }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.map((it) => (it.id === id ? json.data : it)));
        setEditingId(null);
        toast.success("Item updated");
      } else {
        toast.error(json.error || "Failed to update item");
      }
    } catch {
      toast.error("Failed to update item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/haven/rentable-items/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((it) => it.id !== id));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  }

  function startEdit(item: RentableItem) {
    setEditingId(item.id);
    setEditForm({ name: item.name, icon: item.icon, price_per_night: String(item.price_per_night) });
  }

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Rentable Items</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{havenName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            These optional add-ons appear in the guest pamphlet sent with every booking confirmation.
          </p>

          {/* Add form */}
          <form onSubmit={handleAdd} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Add New Item</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Icon (emoji)"
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                className="w-16 px-2 py-1.5 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                maxLength={4}
              />
              <input
                type="text"
                placeholder="Item name (e.g. Mini Fridge)"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                required
              />
              <input
                type="number"
                placeholder="₱/night"
                value={form.price_per_night}
                onChange={(e) => setForm((p) => ({ ...p, price_per_night: e.target.value }))}
                className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                min="0"
                step="0.01"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Item
            </button>
          </form>

          {/* Items list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">No rentable items yet. Add one above.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) =>
                editingId === item.id ? (
                  <li key={item.id} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <input
                      type="text"
                      value={editForm.icon}
                      onChange={(e) => setEditForm((p) => ({ ...p, icon: e.target.value }))}
                      placeholder="🛎️"
                      aria-label="Icon emoji"
                      title="Icon emoji"
                      className="w-12 px-1.5 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
                      maxLength={4}
                    />
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Item name"
                      aria-label="Item name"
                      title="Item name"
                      className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      value={editForm.price_per_night}
                      onChange={(e) => setEditForm((p) => ({ ...p, price_per_night: e.target.value }))}
                      placeholder="₱/night"
                      aria-label="Price per night"
                      title="Price per night"
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate(item.id)}
                      disabled={saving}
                      aria-label="Save changes"
                      title="Save changes"
                      className="p-1.5 text-green-600 hover:text-green-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel editing"
                      title="Cancel editing"
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ) : (
                  <li key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                    <span className="text-xl leading-none">{item.icon}</span>
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      ₱{Number(item.price_per_night).toLocaleString("en-PH", { minimumFractionDigits: 2 })}/night
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      aria-label={`Edit ${item.name}`}
                      title="Edit"
                      className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Delete ${item.name}`}
                      title="Delete"
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                )
              )}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
