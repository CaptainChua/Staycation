"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Tag, X } from "lucide-react";
import { updateDiscount, DiscountRecord, getDiscounts, getDiscountProperties } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

interface EditDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: DiscountRecord | null;
  onSuccess: () => void;
}

export default function EditDiscountModal({
  isOpen,
  onClose,
  discount,
  onSuccess,
}: EditDiscountModalProps) {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [havens, setHavens] = useState<any[]>([]);
  const [loadingHavens, setLoadingHavens] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 0,
    min_booking_amount: 0,
    start_date: "",
    end_date: "",
    max_uses: 0,
    active: false,
    haven_ids: [] as string[],
  });

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHavens();
    }
  }, [isOpen]);

  const loadHavens = async () => {
    try {
      setLoadingHavens(true);
      const response = await fetch("/api/haven");
      const data = await response.json();
      if (data.success) {
        setHavens(data.data || []);
      } else {
        throw new Error(data.error || "Failed to load properties");
      }
    } catch (error) {
      console.error("Failed to load properties:", error);
      toast.error("Failed to load properties");
      setHavens([]);
    } finally {
      setLoadingHavens(false);
    }
  };

  useEffect(() => {
    if (discount && isOpen) {
      // Load the selected properties for this discount
      const loadDiscountProperties = async () => {
        try {
          const selectedProperties = await getDiscountProperties(discount.id);
          
          // Format dates for HTML date inputs (YYYY-MM-DD format)
          const formatDateForInput = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };
          
          setForm({
            name: discount.name,
            description: discount.description || "",
            discount_type: discount.discount_type as "percentage" | "fixed",
            discount_value: discount.discount_value,
            min_booking_amount: discount.min_booking_amount || 0,
            start_date: formatDateForInput(discount.start_date),
            end_date: formatDateForInput(discount.end_date),
            max_uses: discount.max_uses || 0,
            active: discount.active,
            haven_ids: selectedProperties,
          });
        } catch (error) {
          console.error("Failed to load discount properties:", error);
          
          // Format dates for HTML date inputs (YYYY-MM-DD format)
          const formatDateForInput = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
          };
          
          // Fallback to empty array if loading fails
          setForm({
            name: discount.name,
            description: discount.description || "",
            discount_type: discount.discount_type as "percentage" | "fixed",
            discount_value: discount.discount_value,
            min_booking_amount: discount.min_booking_amount || 0,
            start_date: formatDateForInput(discount.start_date),
            end_date: formatDateForInput(discount.end_date),
            max_uses: discount.max_uses || 0,
            active: discount.active,
            haven_ids: [],
          });
        }
      };

      loadDiscountProperties();
      setError(null);
      setSuccess(null);
    }
  }, [discount, isOpen]);

  const isValid = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.discount_type &&
      form.discount_value > 0 &&
      form.start_date.length > 0 &&
      form.end_date.length > 0 &&
      new Date(form.start_date) < new Date(form.end_date)
    );
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving || !discount) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      await updateDiscount(discount.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_booking_amount: form.min_booking_amount > 0 ? form.min_booking_amount : undefined,
        start_date: form.start_date,
        end_date: form.end_date,
        max_uses: form.max_uses > 0 ? form.max_uses : undefined,
        active: form.active,
        haven_ids: form.haven_ids,
      }, session?.user?.id);

      toast.success("Discount updated successfully.");
      window.setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update discount";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || !isOpen || !discount) return null;

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
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Edit Discount
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update discount details and conditions
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
            id="edit-discount-form"
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
                  Discount Code (Read-only)
                </label>
                <input
                  type="text"
                  value={discount.discount_code}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-mono cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Properties (Optional)
                </label>
                {loadingHavens ? (
                  <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                    <span className="text-sm">Loading properties...</span>
                  </div>
                ) : havens.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
                    {havens.map((haven) => (
                      <label
                        key={haven.uuid_id}
                        className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={form.haven_ids.includes(haven.uuid_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((p) => ({
                                ...p,
                                haven_ids: [...p.haven_ids, haven.uuid_id],
                              }));
                            } else {
                              setForm((p) => ({
                                ...p,
                                haven_ids: p.haven_ids.filter((id) => id !== haven.uuid_id),
                              }));
                            }
                          }}
                          disabled={isSaving}
                          className="w-4 h-4 text-brand-primary rounded focus:ring-2 focus:ring-brand-primary cursor-pointer"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                          {haven.haven_name || "Unnamed Property"}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No properties available</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Select properties to apply this discount to specific rooms. Leave empty to apply to all properties.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Discount Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="e.g., Summer Sale"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  disabled={isSaving}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="Optional explanation of the discount"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Discount Type *
                </label>
                <select
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      discount_type: e.target.value as "percentage" | "fixed",
                    }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₱)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Discount Value *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount_value}
                  onChange={(e) => setForm((p) => ({ ...p, discount_value: Number(e.target.value) }))}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Min. Booking Amount (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_booking_amount}
                  onChange={(e) => setForm((p) => ({ ...p, min_booking_amount: Number(e.target.value) }))}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Max Uses (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.max_uses}
                  onChange={(e) => setForm((p) => ({ ...p, max_uses: Number(e.target.value) }))}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  disabled={isSaving}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                    disabled={isSaving}
                    className="w-5 h-5 text-brand-primary rounded focus:ring-2 focus:ring-brand-primary cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Active - Discount is available for guests to use
                  </span>
                </label>
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
              form="edit-discount-form"
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
    document.body
  );
}
