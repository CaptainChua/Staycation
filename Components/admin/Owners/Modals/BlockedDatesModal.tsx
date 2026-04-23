"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Edit, X, Loader2 } from "lucide-react";
import DateRangePicker from "@/Components/HeroSection/DateRangePicker";

interface BlockedDate {
  id?: string;
  haven_id: string;
  from_date: string;
  to_date: string;
  reason?: string;
  status?: string;
}

interface Haven {
  uuid_id: string;
  haven_name: string;
  tower?: string;
  floor?: string;
}

interface BlockedDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BlockedDate) => Promise<void>;
  editingDate?: BlockedDate | null;
  havens: Haven[];
  isLoading?: boolean;
}

export default function BlockedDatesModal({
  isOpen,
  onClose,
  onSubmit,
  editingDate,
  havens,
  isLoading = false,
}: BlockedDatesModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [havenlId, setHavenId] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (editingDate) {
      setHavenId(editingDate.haven_id);
      setFromDate(editingDate.from_date?.split("T")[0] || "");
      setToDate(editingDate.to_date?.split("T")[0] || "");
      setReason(editingDate.reason || "");
      setStatus(editingDate.status || "active");
    } else {
      setHavenId("");
      setFromDate("");
      setToDate("");
      setReason("");
      setStatus("active");
    }
    setError(null);
  }, [editingDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!havenlId || !fromDate || !toDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError("From date must be before To date");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...(editingDate?.id && { id: editingDate.id }),
        haven_id: havenlId,
        from_date: fromDate,
        to_date: toDate,
        reason: reason || undefined,
        status,
      };
      console.log("🔵 [BlockedDatesModal] Submitting data:", submitData);
      await onSubmit(submitData);
      handleClose();
    } catch (err) {
      console.error("❌ [BlockedDatesModal] Error during submit:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFromDate("");
    setToDate("");
    setHavenId("");
    setReason("");
    setStatus("active");
    setError(null);
    onClose();
  };

  if (!isMounted) return null;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal - Responsive Container */}
      <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4" onClick={handleClose}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 flex-shrink-0 ${
                  editingDate
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : "bg-brand-primary"
                } rounded-lg flex items-center justify-center`}
              >
                {editingDate ? (
                  <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {editingDate ? "Edit Blocked Date" : "Add Blocked Date"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                  {editingDate
                    ? "Update the blocked date details"
                    : "Create a new blocked date for your haven"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Form - Scrollable Content and Buttons */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            {/* Form Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Haven Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Haven <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <select
                  value={havenlId}
                  onChange={(e) => setHavenId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">{isLoading ? "Loading havens..." : "Select a haven"}</option>
                  {havens.map((haven: Haven) => (
                    <option key={haven.uuid_id} value={haven.uuid_id}>
                      {haven.haven_name} {haven.tower && `- ${haven.tower}`}{" "}
                      {haven.floor && `Floor ${haven.floor}`}
                    </option>
                  ))}
                </select>
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range - Using DateRangePicker */}
            <div className="overflow-visible">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Date Range <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="overflow-visible z-20">
                <DateRangePicker
                  checkInDate={fromDate}
                  checkOutDate={toDate}
                  onCheckInChange={setFromDate}
                  onCheckOutChange={setToDate}
                  havenId={havenlId}
                  expanded={true}
                />
              </div>

              {/* Selected Date Range Display */}
              {(fromDate || toDate) && (
                <div className="mt-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">Selected Period:</p>
                  <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                    {fromDate && toDate
                      ? `${new Date(fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${new Date(toDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : fromDate
                      ? `From ${new Date(fromDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : `Until ${new Date(toDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Reason <span className="text-xs text-gray-500 font-normal ml-1">(Optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Maintenance, Private event, Renovation..."
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none transition-all"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Provide a reason to help your team understand why these dates are blocked
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose whether this blocked period is active or inactive
              </p>
            </div>
            </div>

          {/* Action Buttons - Sticky Footer */}
          <div className="flex-shrink-0 flex gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
            >
              {(isSubmitting || isLoading) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {editingDate ? "Update" : "Create"}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
