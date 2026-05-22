"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Check, Loader2, X, Info, Package, Search, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { ICON_OPTIONS, ICON_BY_KEY, pickIconForLabel, fileToResizedDataUrl } from "./AmenitiesModal";

interface RentableItem {
  id: number;
  haven_id: string;
  name: string;
  icon: string;
  // Uploaded image as a data URL. When present, wins over `icon` for rendering.
  icon_url?: string | null;
  price_per_night: number;
  is_active: boolean;
}

interface AddOnsManagementModalProps {
  // Wizard-step props (the only mode we render here — kept compatible with
  // other step components in HavenFormModal even though we only support 'step').
  mode?: "modal" | "step";
  isAddMode?: boolean;
  initialData?: { uuid_id?: string } | null;
  // The rest are provided by the parent wizard but unused by this step —
  // accepted to keep the prop contract uniform with other step components.
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  onSave?: (data: unknown) => void;
  onChange?: (data: unknown) => void;
  isLastStep?: boolean;
}

// New items store an iconKey (e.g. "playstation") in `icon` and optionally
// a data URL in `icon_url` from an uploaded image. Legacy items may still
// hold a raw emoji in `icon` — renderIcon handles all three shapes.
const emptyForm: { name: string; icon: string; icon_url: string | null; price_per_night: string } = {
  name: "",
  icon: "default",
  icon_url: null,
  price_per_night: "",
};

const renderIcon = (
  icon: string | undefined,
  iconUrl: string | null | undefined,
  className = "w-5 h-5",
  imgClass = "w-6 h-6 rounded",
) => {
  // Uploaded image wins over any built-in choice.
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt="" className={`${imgClass} object-cover`} />;
  }
  if (!icon) return <Package className={className} />;
  const Comp = ICON_BY_KEY[icon];
  if (Comp) return <Comp className={className} />;
  // Backward-compat: legacy items had emoji icons stored as-is.
  return <span className="text-xl leading-none" aria-hidden="true">{icon}</span>;
};

interface IconPickerProps {
  value: string;
  iconUrl: string | null;
  onChange: (key: string) => void;
  onIconUrlChange: (url: string | null) => void;
  label: string;
  // Name/price/action inputs the parent wants laid out next to the preview button.
  children: React.ReactNode;
}

const IconPicker = ({ value, iconUrl, onChange, onIconUrlChange, label, children }: IconPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  // Track whether the user explicitly picked an icon — once they do, stop
  // auto-suggesting as they keep typing the name. An uploaded image OR any
  // non-default starting value also counts as manual.
  const [userPickedManually, setUserPickedManually] = useState(
    !!iconUrl || (value !== "" && value !== "default"),
  );

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 96);
      onIconUrlChange(dataUrl);
      setUserPickedManually(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setUploading(false);
    }
  }

  // Auto-pick icon from the name when the user hasn't manually chosen one yet.
  useEffect(() => {
    if (userPickedManually) return;
    if (!label.trim()) return;
    const { iconKey } = pickIconForLabel(label);
    if (iconKey !== value) onChange(iconKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  const filteredOptions = useMemo(() => {
    if (!iconSearch.trim()) return ICON_OPTIONS;
    const q = iconSearch.toLowerCase();
    return ICON_OPTIONS.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.group.toLowerCase().includes(q) ||
        o.key.toLowerCase().includes(q),
    );
  }, [iconSearch]);

  return (
    <div className="space-y-2">
      {/* Preview-button + parent-provided form fields row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="w-12 h-12 rounded-lg bg-brand-primary/10 text-brand-primary grid place-items-center flex-shrink-0 border-2 border-transparent hover:border-brand-primary/40 hover:bg-brand-primary/20 transition overflow-hidden"
          title="Choose icon"
          aria-label="Choose icon"
          aria-expanded={showPicker}
        >
          {renderIcon(value, iconUrl, "w-6 h-6", "w-full h-full")}
        </button>
        {children}
      </div>

      {/* Help text + secondary toggle */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          An icon is auto-picked from the name. Tap the icon on the left to choose a different one.
        </p>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="text-[11px] font-semibold text-brand-primary hover:underline whitespace-nowrap"
        >
          {showPicker ? "Hide icons" : "Choose icon"}
        </button>
      </div>

      {showPicker && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 max-h-[340px] overflow-y-auto">
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-brand-primary/5 dark:bg-brand-primary/10 border border-dashed border-brand-primary/40">
            <label className={`flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 h-9 rounded-md bg-white dark:bg-gray-800 border border-brand-primary/50 text-brand-primary hover:bg-brand-primary hover:text-white font-semibold text-xs transition ${uploading ? "opacity-60 cursor-wait" : ""}`}>
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  {iconUrl ? "Replace uploaded icon" : "Upload your own icon"}
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {iconUrl && (
              <button
                type="button"
                onClick={() => onIconUrlChange(null)}
                className="px-2 h-9 rounded-md border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold"
                title="Remove uploaded icon"
                aria-label="Remove uploaded icon"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={iconSearch}
              onChange={(e) => setIconSearch(e.target.value)}
              placeholder="Or search built-in icons (gaming, pool, light, smart…)"
              className="w-full pl-9 pr-3 py-2 h-9 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-brand-primary placeholder:text-gray-400"
              aria-label="Search icons"
            />
          </div>

          {filteredOptions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-6">
              No icons match &ldquo;{iconSearch}&rdquo;
            </p>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {filteredOptions.map((opt) => {
                const OptIcon = opt.icon;
                const isPicked = value === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      onChange(opt.key);
                      onIconUrlChange(null); // built-in pick overrides any previous upload
                      setUserPickedManually(true);
                      setShowPicker(false);
                    }}
                    title={`${opt.label} · ${opt.group}`}
                    aria-label={opt.label}
                    aria-pressed={isPicked}
                    className={
                      isPicked
                        ? "aspect-square rounded-lg grid place-items-center transition border-2 border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "aspect-square rounded-lg grid place-items-center transition border-2 border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-brand-primary/30 hover:text-brand-primary"
                    }
                  >
                    <OptIcon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AddOnsManagementModal({
  isAddMode,
  initialData,
}: AddOnsManagementModalProps) {
  const havenId = initialData?.uuid_id;

  const [items, setItems] = useState<RentableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    if (!havenId || isAddMode) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/haven/${havenId}/rentable-items`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json?.success) setItems(json.data || []);
        else toast.error(json?.error || "Failed to load add-ons");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[AddOnsStep] fetch error:", err);
        toast.error("Failed to load add-ons");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [havenId, isAddMode]);

  async function handleAdd() {
    if (!havenId) return;
    if (!form.name.trim()) return toast.error("Name is required");
    const price = parseFloat(form.price_per_night);
    if (isNaN(price) || price < 0) return toast.error("Enter a valid price");

    setSaving(true);
    try {
      const res = await fetch(`/api/haven/${havenId}/rentable-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon.trim() || "default",
          icon_url: form.icon_url,
          price_per_night: price,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to add");
      setItems((prev) => [...prev, json.data]);
      setForm(emptyForm);
      toast.success("Add-on added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
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
        body: JSON.stringify({
          name: editForm.name.trim(),
          icon: editForm.icon.trim() || "default",
          icon_url: editForm.icon_url,
          price_per_night: price,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update");
      setItems((prev) => prev.map((i) => (i.id === id ? json.data : i)));
      setEditingId(null);
      toast.success("Add-on updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Remove this add-on?")) return;
    try {
      const res = await fetch(`/api/haven/rentable-items/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete");
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Add-on removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 dark:text-gray-200">
          <p className="font-semibold mb-0.5">Rentable add-ons (optional)</p>
          <p className="text-gray-600 dark:text-gray-300">
            Paid extras guests can buy at checkout — e.g. Pool Pass, Late Checkout, Extra Towels. You set the name, icon, and price.
          </p>
        </div>
      </div>

      {isAddMode || !havenId ? (
        <div className="p-10 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
          <Package className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">Save the haven first</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Add-ons can be managed once this haven is created. Click <strong>Next</strong> to continue — you can come back to this step from <em>Edit Haven</em> later.
          </p>
        </div>
      ) : (
        <>
          {/* NOTE: rendered as a <div>, not a <form>, because this component is itself
              nested inside HavenFormModal's outer <form> and nested forms are invalid HTML. */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <IconPicker
              value={form.icon}
              iconUrl={form.icon_url}
              onChange={(next) => setForm({ ...form, icon: next })}
              onIconUrlChange={(url) => setForm({ ...form, icon_url: url })}
              label={form.name}
            >
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="e.g. Pool Pass, Late Checkout"
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
                aria-label="Item name"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_night}
                onChange={(e) => setForm({ ...form, price_per_night: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="Price (₱)"
                className="w-32 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
                aria-label="Price"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-semibold text-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </IconPicker>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">No add-ons yet — add your first one above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                  {editingId === item.id ? (
                    <IconPicker
                      value={editForm.icon}
                      iconUrl={editForm.icon_url}
                      onChange={(next) => setEditForm({ ...editForm, icon: next })}
                      onIconUrlChange={(url) => setEditForm({ ...editForm, icon_url: url })}
                      label={editForm.name}
                    >
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
                        aria-label="Name"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.price_per_night}
                        onChange={(e) => setEditForm({ ...editForm, price_per_night: e.target.value })}
                        className="w-32 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
                        aria-label="Price"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdate(item.id)}
                        disabled={saving}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm inline-flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </IconPicker>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary grid place-items-center flex-shrink-0 overflow-hidden">
                        {renderIcon(item.icon, item.icon_url, "w-5 h-5", "w-full h-full")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ₱{Number(item.price_per_night).toLocaleString("en-PH")} each
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditForm({
                            name: item.name,
                            icon: item.icon,
                            icon_url: item.icon_url || null,
                            price_per_night: String(item.price_per_night),
                          });
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        aria-label={`Edit ${item.name}`}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        aria-label={`Delete ${item.name}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
