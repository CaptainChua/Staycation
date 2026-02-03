"use client";

import { X, Calendar, DollarSign, Tag } from "lucide-react";
import { createPortal } from "react-dom";
import { DiscountRecord } from "@/app/admin/csr/actions";

interface ViewDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: DiscountRecord;
}

const ViewDiscountModal = ({ isOpen, onClose, discount }: ViewDiscountModalProps) => {
  if (!isOpen) return null;

  const startDate = new Date(discount.start_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const endDate = new Date(discount.end_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const isExpired = new Date(discount.end_date) < new Date();

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-primary" />
            Discount Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {isExpired && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                This discount has expired
              </p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Code
              </label>
              <div className="text-lg font-mono text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 p-3 rounded-lg">
                {discount.discount_code}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Name
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {discount.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Property
              </label>
              <p className="text-gray-900 dark:text-white">
                {discount.haven_name || "All Properties"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Discount Amount
              </label>
              <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                {discount.formatted_value}
              </p>
            </div>
          </div>

          {/* Description */}
          {discount.description && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <p className="text-gray-600 dark:text-gray-400">
                {discount.description}
              </p>
            </div>
          )}

          {/* Discount Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <p className="text-gray-900 dark:text-white capitalize">
                {discount.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Minimum Booking Amount
              </label>
              <p className="text-gray-900 dark:text-white">
                {discount.formatted_min}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </label>
              <p className="text-gray-900 dark:text-white">{startDate}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </label>
              <p className="text-gray-900 dark:text-white">{endDate}</p>
            </div>
          </div>

          {/* Usage Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Usage Limit
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {discount.max_uses ? `${discount.max_uses} times` : "Unlimited"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Times Used
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {discount.used_count} {discount.max_uses && `of ${discount.max_uses}`}
                </p>
              </div>
            </div>

            {discount.max_uses && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Usage Percentage
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${discount.usage_percentage}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {discount.usage_percentage}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${discount.active ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-gray-900 dark:text-white">
                {discount.active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ViewDiscountModal;
