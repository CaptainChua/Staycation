"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Tag, X, Calendar, DollarSign } from "lucide-react";
import { DiscountRecord } from "@/app/admin/csr/actions";

interface ViewDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount: DiscountRecord | null;
}

export default function ViewDiscountModal({ isOpen, onClose, discount }: ViewDiscountModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted || !isOpen || !discount) return null;

  const startDate = new Date(discount.start_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const endDate = new Date(discount.end_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isExpired = new Date(discount.end_date) < new Date();

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
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary rounded-lg">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Discount Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View complete discount information and usage statistics
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* Status Alert */}
            {isExpired && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg px-4 py-3 text-sm">
                This discount has expired
              </div>
            )}

            {!discount.active && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 rounded-lg px-4 py-3 text-sm">
                This discount is currently inactive
              </div>
            )}

            {/* Basic Information Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Discount Code
                  </p>
                  <p className="text-lg font-mono font-bold text-brand-primary">
                    {discount.discount_code}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Discount Name
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {discount.name}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Property
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">
                    {discount.haven_name || "All Properties"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Discount Amount
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                    {discount.formatted_value}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {discount.description && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                  Description
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {discount.description}
                </p>
              </div>
            )}

            {/* Discount Details Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                Discount Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Type
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {discount.discount_type === "percentage" ? "Percentage (%)" : "Fixed Amount (₱)"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">
                    Min. Booking Amount
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {discount.formatted_min || "None"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Start Date
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{startDate}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> End Date
                  </p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{endDate}</p>
                </div>
              </div>
            </div>

            {/* Usage Statistics Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                Usage Statistics
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Usage Limit
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {discount.max_uses ? `${discount.max_uses}` : "Unlimited"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
                      Times Used
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {discount.used_count}
                      {discount.max_uses && (
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                          of {discount.max_uses}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {discount.max_uses && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Usage Percentage
                      </p>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {discount.usage_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                        style={{ width: `${discount.usage_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full ${
                    discount.active ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                    Status
                  </p>
                  <p className={`text-sm font-medium ${
                    discount.active
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {discount.active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition-all font-medium text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
