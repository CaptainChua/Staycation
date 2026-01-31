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
  Loader2
} from "lucide-react";

interface DeliverableActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'preparing' | 'delivered' | 'cancelled' | 'refunded';
  booking: {
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
  };
  item: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    formatted_price: string;
    total: number;
    formatted_total: string;
    status: string;
    notes?: string;
  };
  isLoading?: boolean;
}

const actionConfig = {
  preparing: {
    title: 'Mark Item as Preparing',
    description: 'This item will be marked as currently being prepared for delivery.',
    icon: Clock,
    color: 'indigo',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  },
  delivered: {
    title: 'Mark Item as Delivered',
    description: 'This item will be marked as delivered and inventory stock will be updated.',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-700 dark:text-green-300',
    buttonColor: 'bg-green-600 hover:bg-green-700 text-white'
  },
  cancelled: {
    title: 'Cancel Item',
    description: 'This item will be cancelled and will not be delivered.',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    textColor: 'text-red-700 dark:text-red-300',
    buttonColor: 'bg-red-600 hover:bg-red-700 text-white'
  },
  refunded: {
    title: 'Refund Item',
    description: 'This item will be marked as refunded.',
    icon: AlertCircle,
    color: 'orange',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-700 dark:text-orange-300',
    buttonColor: 'bg-orange-600 hover:bg-orange-700 text-white'
  }
};

export default function DeliverableActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  booking,
  item,
  isLoading = false
}: DeliverableActionModalProps) {
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
  const Icon = config.icon;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
          {/* Item Details */}
          <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Package className="w-4 h-4" />
              Item Details
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                  {item.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Note: {item.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.formatted_price}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.formatted_total}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
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
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Home className="w-4 h-4" />
              Booking Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Booking ID</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.deliverable_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guest</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.guest}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Haven</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.haven}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Check-in</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.checkin_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Check-out</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.checkout_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{booking.formatted_grand_total}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for delivered action */}
          {action === 'delivered' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Inventory Update
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    This action will automatically subtract {item.quantity} unit(s) from the inventory stock for "{item.name}".
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
            disabled={isLoading}
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
                {action === 'preparing' ? 'Mark as Preparing' :
                 action === 'delivered' ? 'Mark as Delivered' :
                 action === 'cancelled' ? 'Cancel Item' :
                 'Refund Item'}
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
