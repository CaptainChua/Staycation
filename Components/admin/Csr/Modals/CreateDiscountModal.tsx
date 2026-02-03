"use client";

import { X, Loader2, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { createDiscount } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";

interface CreateDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateDiscountModal = ({ isOpen, onClose, onSuccess }: CreateDiscountModalProps) => {
  const [loading, setLoading] = useState(false);
  const [havens, setHavens] = useState<any[]>([]);
  const [loadingHavens, setLoadingHavens] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    haven_id: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_booking_amount: "",
    start_date: "",
    end_date: "",
    max_uses: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadHavens();
    }
  }, [isOpen]);

  const loadHavens = async () => {
    try {
      setLoadingHavens(true);
      const response = await fetch("/api/havens");
      const data = await response.json();
      if (data.success) {
        setHavens(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load properties:", error);
      toast.error("Failed to load properties");
    } finally {
      setLoadingHavens(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.haven_id || !formData.name || !formData.discount_type || !formData.discount_value || !formData.start_date || !formData.end_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await createDiscount({
        code: formData.code,
        haven_id: formData.haven_id,
        name: formData.name,
        description: formData.description || undefined,
        discount_type: formData.discount_type as 'percentage' | 'fixed',
        discount_value: parseFloat(formData.discount_value),
        min_booking_amount: formData.min_booking_amount ? parseFloat(formData.min_booking_amount) : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
      });

      toast.success("Discount created successfully");
      onSuccess();
      setFormData({
        code: "",
        haven_id: "",
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_booking_amount: "",
        start_date: "",
        end_date: "",
        max_uses: "",
      });
    } catch (error) {
      toast.error("Failed to create discount");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plus className="w-6 h-6 text-brand-primary" />
            Create New Discount
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER20"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Property *
              </label>
              <select
                value={formData.haven_id}
                onChange={(e) => setFormData({ ...formData, haven_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading || loadingHavens}
              >
                <option value="">Select a property</option>
                {havens.map((haven) => (
                  <option key={haven.uuid_id} value={haven.uuid_id}>
                    {haven.haven_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Summer Sale"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this discount"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₱)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                  disabled={loading}
                />
                <span className="absolute right-3 top-2.5 text-gray-500">
                  {formData.discount_type === 'percentage' ? '%' : '₱'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Min. Booking Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_booking_amount}
                onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Max Uses
              </label>
              <input
                type="number"
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Discount
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateDiscountModal;
