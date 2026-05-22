"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Loader2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

// Add-ons (formerly "Rentables") — two-step structure:
//   Add Category → Add Items inside that category.
// Items still live in haven_rentable_items (legacy table name); each item
// carries a category_id linking to haven_addon_categories.

interface AddOnItem {
  id: number;
  name: string;
  icon: string;
  price_per_night: number;
  is_active: boolean;
  category_id: string | null;
}

interface AddOnCategory {
  id: string;
  haven_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
  items: AddOnItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  havenId: string;
  havenName: string;
}

const emptyCatForm = { name: "", icon: "📦" };
const emptyItemForm = { name: "", icon: "🛎️", price_per_night: "" };

export default function AddOnsModal({ isOpen, onClose, havenId, havenName }: Props) {
  const [categories, setCategories] = useState<AddOnCategory[]>([]);
  const [uncategorized, setUncategorized] = useState<AddOnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCat, setSavingCat] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<number | null>(null);

  const [catForm, setCatForm] = useState(emptyCatForm);
  // Per-category in-flight item form state.
  const [itemForms, setItemForms] = useState<Record<string, typeof emptyItemForm>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && havenId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, havenId]);

  async function loadAll() {
    if (!havenId) return;
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch(`/api/haven/${havenId}/addon-categories`),
        fetch(`/api/haven/${havenId}/rentable-items`),
      ]);
      const catJson = await catRes.json();
      const itemJson = await itemRes.json();

      const cats: AddOnCategory[] = catJson?.success ? catJson.data : [];
      const allItems: AddOnItem[] = itemJson?.success ? itemJson.data : [];
      const uncat = allItems.filter((i) => !i.category_id);

      setCategories(cats);
      setUncategorized(uncat);
      // Expand the first category by default.
      if (cats.length > 0) setExpanded({ [cats[0].id]: true });
    } catch (err) {
      console.error("[AddOnsModal] load error:", err);
      toast.error("Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catForm.name.trim()) return toast.error("Category name is required");
    setSavingCat(true);
    try {
      const res = await fetch(`/api/haven/${havenId}/addon-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catForm.name.trim(), icon: catForm.icon || "📦" }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      setCategories((prev) => [...prev, json.data]);
      setExpanded((prev) => ({ ...prev, [json.data.id]: true }));
      setCatForm(emptyCatForm);
      toast.success(`Category "${json.data.name}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setSavingCat(false);
    }
  }

  async function handleDeleteCategory(c: AddOnCategory) {
    if (c.items.length > 0) {
      if (!confirm(
        `"${c.name}" has ${c.items.length} item(s). Deleting the category will leave those items uncategorized. Continue?`,
      )) return;
    } else if (!confirm(`Delete category "${c.name}"?`)) return;

    setDeletingCat(c.id);
    try {
      const res = await fetch(`/api/haven/addon-categories/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
      // Move its items into the uncategorized bucket so the owner sees them.
      setUncategorized((prev) => [
        ...prev,
        ...c.items.map((i) => ({ ...i, category_id: null })),
      ]);
      toast.success(`Category "${c.name}" deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeletingCat(null);
    }
  }

  async function handleAddItem(categoryId: string | null) {
    const key = categoryId || "__uncat__";
    const form = itemForms[key] || emptyItemForm;
    if (!form.name.trim()) return toast.error("Item name is required");
    const price = parseFloat(form.price_per_night);
    if (isNaN(price) || price < 0) return toast.error("Enter a valid price");

    setSavingItem(key);
    try {
      const res = await fetch(`/api/haven/${havenId}/rentable-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon || "🛎️",
          price_per_night: price,
          category_id: categoryId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || `HTTP ${res.status}`);
      if (categoryId) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId ? { ...c, items: [...c.items, json.data as AddOnItem] } : c,
          ),
        );
      } else {
        setUncategorized((prev) => [...prev, json.data as AddOnItem]);
      }
      setItemForms((prev) => ({ ...prev, [key]: emptyItemForm }));
      toast.success(`Item "${json.data.name}" added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSavingItem(null);
    }
  }

  async function handleDeleteItem(itemId: number, categoryId: string | null) {
    if (!confirm("Delete this item?")) return;
    setDeletingItem(itemId);
    try {
      const res = await fetch(`/api/haven/rentable-items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      if (categoryId) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c,
          ),
        );
      } else {
        setUncategorized((prev) => prev.filter((i) => i.id !== itemId));
      }
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setDeletingItem(null);
    }
  }

  const updateItemForm = (key: string, patch: Partial<typeof emptyItemForm>) =>
    setItemForms((prev) => ({ ...prev, [key]: { ...(prev[key] || emptyItemForm), ...patch } }));

  if (!isOpen) return null;

  // NOTE: we DON'T define ItemForm as a child component here. Defining a
  // component inside the parent's render makes React see a new component
  // identity on every keystroke → unmounts the old <input> and remounts a
  // new one → focus is lost after the first character. Inline the JSX
  // directly instead.
  const renderItemForm = (categoryId: string | null) => {
    const key = categoryId || "__uncat__";
    const form = itemForms[key] || emptyItemForm;
    return (
      <div className="flex flex-col sm:flex-row gap-2 mt-2 items-stretch">
        <input
          type="text"
          value={form.icon}
          onChange={(e) => updateItemForm(key, { icon: e.target.value })}
          placeholder="🛎️"
          aria-label="Item icon"
          className="w-14 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-center text-sm"
        />
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateItemForm(key, { name: e.target.value })}
          placeholder="Item name (e.g. Extra towel)"
          aria-label="Item name"
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
        />
        <input
          type="number"
          value={form.price_per_night}
          onChange={(e) => updateItemForm(key, { price_per_night: e.target.value })}
          placeholder="₱ / night"
          min="0"
          step="0.01"
          aria-label="Price per night"
          className="w-[120px] px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={() => handleAddItem(categoryId)}
          disabled={savingItem === key || !form.name.trim() || !form.price_per_night}
          className="px-3 rounded-lg bg-brand-primary text-white hover:bg-brand-primaryDark font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          {savingItem === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add item
        </button>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add-ons</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {havenName} — categories of optional extras shown on the guest pamphlet
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: Add Category */}
          <form
            onSubmit={handleAddCategory}
            className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4"
          >
            <div className="text-[11.5px] font-semibold text-brand-primary uppercase tracking-wide mb-2">
              Step 1 · Add category
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
              <input
                type="text"
                value={catForm.icon}
                onChange={(e) => setCatForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="📦"
                aria-label="Category icon"
                className="w-14 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg text-center text-sm"
              />
              <input
                type="text"
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name (e.g. Food & Drinks, Toiletries, Equipment)"
                aria-label="Category name"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-brand-primary text-sm placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={savingCat || !catForm.name.trim()}
                className="px-4 rounded-lg bg-brand-primary text-white hover:bg-brand-primaryDark font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {savingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add category
              </button>
            </div>
          </form>

          {/* STEP 2: Categories list with their items */}
          <div className="text-[11.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Step 2 · Add items inside each category
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading add-ons…
            </div>
          ) : categories.length === 0 && uncategorized.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              No categories yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900/40"
                >
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                      }
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${
                          expanded[c.id] ? "rotate-180" : ""
                        }`}
                      />
                      <span className="text-xl">{c.icon}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {c.name}
                      </span>
                      <span className="text-[11px] text-gray-500 ml-1">
                        ({c.items.length} item{c.items.length === 1 ? "" : "s"})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c)}
                      disabled={deletingCat === c.id}
                      title="Delete category"
                      className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                    >
                      {deletingCat === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {expanded[c.id] && (
                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/40 dark:bg-white/5">
                      <ul className="divide-y divide-gray-100 dark:divide-white/5 mt-2">
                        {c.items.length === 0 ? (
                          <li className="text-xs text-gray-400 italic py-3 text-center">
                            No items yet — add one below.
                          </li>
                        ) : (
                          c.items.map((i) => (
                            <li key={i.id} className="flex items-center gap-3 py-2">
                              <span className="text-lg">{i.icon}</span>
                              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                                {i.name}
                              </span>
                              <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                ₱{Number(i.price_per_night).toLocaleString("en-PH")} / night
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(i.id, c.id)}
                                disabled={deletingItem === i.id}
                                title="Delete item"
                                className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                              >
                                {deletingItem === i.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                      {renderItemForm(c.id)}
                    </div>
                  )}
                </div>
              ))}

              {uncategorized.length > 0 && (
                <div className="border border-dashed border-amber-300 dark:border-amber-700 rounded-xl overflow-hidden bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="px-4 py-3 flex items-center gap-2">
                    <span className="text-xl">❓</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">
                      Uncategorized
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-300 ml-1">
                      ({uncategorized.length} item{uncategorized.length === 1 ? "" : "s"})
                    </span>
                  </div>
                  <div className="px-4 pb-4 border-t border-amber-200 dark:border-amber-800">
                    <ul className="divide-y divide-amber-200 dark:divide-amber-800 mt-2">
                      {uncategorized.map((i) => (
                        <li key={i.id} className="flex items-center gap-3 py-2">
                          <span className="text-lg">{i.icon}</span>
                          <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                            {i.name}
                          </span>
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                            ₱{Number(i.price_per_night).toLocaleString("en-PH")} / night
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(i.id, null)}
                            disabled={deletingItem === i.id}
                            title="Delete item"
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                          >
                            {deletingItem === i.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
