"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Package, 
  Calendar, 
  Users, 
  Home, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  List,
  Loader2
} from "lucide-react";

interface BulkSelectionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'preparing' | 'delivered' | 'cancelled' | 'refunded';
  selectedBookings: Array<{
    id: string;
    deliverable_id: string;
    guest: string;
    haven: string;
    checkin_date: string;
    checkout_date: string;
    overall_status: string;
    payment_status: string;
    grand_total: number;
    formatted_grand_total: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      formatted_price: string;
      total: number;
      formatted_total: string;
      status: string;
      notes?: string;
    }>;
  }>;
  isLoading?: boolean;
}

const actionConfig = {
  preparing: {
    title: 'Mark Selected Items as Preparing',
    description: 'All selected items will be marked as currently being prepared for delivery.',
    icon: Clock,
    color: 'indigo',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  },
  delivered: {
    title: 'Mark Selected Items as Delivered',
    description: 'All selected items will be marked as delivered and inventory stock will be updated.',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
    buttonColor: 'bg-green-600 hover:bg-green-700 text-white'
  },
  cancelled: {
    title: 'Cancel Selected Items',
    description: 'All selected items will be cancelled and will not be delivered.',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700 text-white'
  },
  refunded: {
    title: 'Refund Selected Items',
    description: 'All selected items will be marked as refunded.',
    icon: AlertCircle,
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-300',
    buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white'
  }
};

export default function BulkSelectionActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedBookings,
  isLoading = false
}: BulkSelectionActionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = actionConfig[action];
  if (!config) {
    console.error('Invalid action:', action, 'Available actions:', Object.keys(actionConfig));
    return null;
  }
  const Icon = config.icon;

  // Calculate affected items across all selected bookings
  const allAffectedItems = selectedBookings.flatMap(booking => 
    booking.items.filter(item => 
      action === 'delivered' ? item.status !== 'Delivered' && item.status !== 'Cancelled' && item.status !== 'Refunded' :
      action === 'cancelled' ? item.status !== 'Cancelled' && item.status !== 'Refunded' :
      action === 'refunded' ? item.status !== 'Refunded' :
      item.status !== 'Preparing' && item.status !== 'Delivered' && item.status !== 'Cancelled' && item.status !== 'Refunded'
    )
  );

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${config.color}-500 rounded-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {config.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Summary */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <List className="w-4 h-4" />
              Action Summary
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedBookings.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Selected Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{allAffectedItems.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Affected Items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {allAffectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Quantity</p>
              </div>
            </div>
          </div>

          {/* Selected Bookings */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Home className="w-4 h-4" />
              Selected Bookings ({selectedBookings.length})
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedBookings.map((booking) => (
                <div key={booking.id} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{booking.deliverable_id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{booking.guest} - {booking.haven}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.formatted_grand_total}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>📅 {booking.checkin_date}</span>
                    <span>📅 {booking.checkout_date}</span>
                    <span>📦 {booking.items.length} items</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Items Preview */}
          {allAffectedItems.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <Package className="w-4 h-4" />
                Affected Items Preview (showing first 10)
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allAffectedItems.slice(0, 10).map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between items-center bg-white dark:bg-gray-700 rounded p-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "Pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                        item.status === "Preparing" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" :
                        item.status === "Delivered" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                        item.status === "Cancelled" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                        item.status === "Refunded" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
                {allAffectedItems.length > 10 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    ... and {allAffectedItems.length - 10} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Warning for delivered action */}
          {action === 'delivered' && allAffectedItems.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Inventory Update
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    This action will automatically update inventory stock for all affected items across {selectedBookings.length} bookings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Warning */}
          {allAffectedItems.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Confirmation Required
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This action will update {allAffectedItems.length} item(s) across {selectedBookings.length} booking(s) and cannot be undone. Please confirm you want to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || allAffectedItems.length === 0}
            className={`px-4 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                {action === 'preparing' ? 'Mark All as Preparing' :
                 action === 'delivered' ? 'Mark All as Delivered' :
                 action === 'cancelled' ? 'Cancel All Items' :
                 'Refund All Items'}
                {allAffectedItems.length > 0 && ` (${allAffectedItems.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
