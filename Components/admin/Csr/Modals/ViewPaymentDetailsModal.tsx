"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CreditCard,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  MapPin,
  Calendar
} from "lucide-react";
import { DeliverableRecord } from "@/app/admin/csr/actions";

interface ViewPaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DeliverableRecord | null;
}

export default function ViewPaymentDetailsModal({
  isOpen,
  onClose,
  record
}: ViewPaymentDetailsModalProps) {
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
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
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

  if (!isOpen || !record) return null;

  // Get payment status color and icon
  const getPaymentStatusConfig = () => {
    switch (record.payment_status) {
      case "approved":
        return {
          color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
          icon: CheckCircle,
          label: "Approved"
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
          icon: Clock,
          label: "Pending"
        };
      case "rejected":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
          icon: XCircle,
          label: "Rejected"
        };
      case "refunded":
        return {
          color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
          icon: DollarSign,
          label: "Refunded"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
          icon: CreditCard,
          label: "Unknown"
        };
    }
  };

  const statusConfig = getPaymentStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Get payment type config
  const getPaymentTypeConfig = () => {
    switch (record.payment_type) {
      case "full":
        return {
          color: "bg-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          textColor: "text-green-700 dark:text-green-300",
          label: "Fully Paid"
        };
      case "down_payment":
        return {
          color: "bg-amber-500",
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-200 dark:border-amber-800",
          textColor: "text-amber-700 dark:text-amber-300",
          label: "Down Payment Only"
        };
      default:
        return {
          color: "bg-gray-500",
          bgColor: "bg-gray-50 dark:bg-gray-800",
          borderColor: "border-gray-200 dark:border-gray-700",
          textColor: "text-gray-700 dark:text-gray-300",
          label: "Unpaid"
        };
    }
  };

  const typeConfig = getPaymentTypeConfig();

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${typeConfig.color} rounded-lg`}>
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Payment Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Booking: {record.booking_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Guest Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <User className="w-4 h-4" />
              Guest Information
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {record.guest}
                </span>
              </div>
              {record.guest_email && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <a
                    href={`mailto:${record.guest_email}`}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {record.guest_email}
                  </a>
                </div>
              )}
              {record.guest_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                  <a
                    href={`tel:${record.guest_phone}`}
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    {record.guest_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location & Dates */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              Booking Details
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {record.haven}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tower:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {record.tower}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-in:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {record.checkin_date}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-red-500" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-out:</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {record.checkout_date}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className={`${typeConfig.bgColor} border ${typeConfig.borderColor} rounded-lg p-4`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${typeConfig.textColor} mb-3`}>
              <DollarSign className="w-4 h-4" />
              Payment Information
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Status:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${typeConfig.color === 'bg-green-500' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : typeConfig.color === 'bg-amber-500' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {typeConfig.label}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {record.formatted_total_amount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Down Payment:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {record.formatted_down_payment}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Remaining Balance:</span>
                  <span className={`text-lg font-bold ${record.remaining_balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {record.formatted_remaining_balance}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning for Down Payment */}
          {record.payment_type === "down_payment" && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Outstanding Balance Alert
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    This guest has an outstanding balance of{" "}
                    <strong>{record.formatted_remaining_balance}</strong>. Please collect the
                    remaining payment before or during check-out.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Security Deposit Information */}
          {record.security_deposit_id && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
                <DollarSign className="w-4 h-4" />
                Security Deposit
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deposit Status:</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                    record.security_deposit_status === 'Returned' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    record.security_deposit_status === 'Processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    record.security_deposit_status === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    record.security_deposit_status === 'Forfeited' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {record.security_deposit_status || 'Unknown'}
                  </span>
                </div>

                {/* Status Explanation */}
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2">
                  {record.security_deposit_status === 'Returned' && (
                    <div>
                      <span className="font-medium">Returned:</span> Full security deposit has been refunded to the guest.
                    </div>
                  )}
                  {record.security_deposit_status === 'Processing' && (
                    <div>
                      <span className="font-medium">Processing:</span> Security deposit is currently being held and processed.
                    </div>
                  )}
                  {record.security_deposit_status === 'Partial' && (
                    <div>
                      <span className="font-medium">Partial:</span> Security deposit has been partially refunded with some amount forfeited due to damages or violations.
                    </div>
                  )}
                  {record.security_deposit_status === 'Forfeited' && (
                    <div>
                      <span className="font-medium">Forfeited:</span> Full security deposit has been forfeited due to significant damages, violations, or other issues.
                    </div>
                  )}
                  {record.security_deposit_status === 'Pending' && (
                    <div>
                      <span className="font-medium">Pending:</span> Security deposit payment is pending or not yet processed.
                    </div>
                  )}
                </div>

                {/* Warning for Partial/Forfeited Status */}
                {(record.security_deposit_status === 'Partial' || record.security_deposit_status === 'Forfeited') && (
                  <div className={`${record.security_deposit_status === 'Forfeited' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'} border rounded-lg p-3`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 ${record.security_deposit_status === 'Forfeited' ? 'text-red-500' : 'text-amber-500'} flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className={`text-sm font-medium ${record.security_deposit_status === 'Forfeited' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                          {record.security_deposit_status === 'Forfeited' ? 'Security Deposit Forfeited' : 'Partial Security Deposit Refund'}
                        </p>
                        <p className={`text-xs ${record.security_deposit_status === 'Forfeited' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'} mt-1`}>
                          {record.security_deposit_status === 'Forfeited' 
                            ? `The full security deposit of ${record.formatted_security_deposit_amount} has been forfeited. Check the notes section for details.`
                            : `Only ${new Intl.NumberFormat('en-PH', {
                                style: 'currency',
                                currency: 'PHP',
                                minimumFractionDigits: 0
                              }).format(record.security_deposit_refunded_amount)} has been refunded out of ${record.formatted_security_deposit_amount}.`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deposit Amount:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {record.formatted_security_deposit_amount}
                  </span>
                </div>

                {(record.security_deposit_refunded_amount > 0 || record.security_deposit_forfeited_amount > 0) && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                    {record.security_deposit_refunded_amount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Refunded Amount:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 0
                          }).format(record.security_deposit_refunded_amount)}
                        </span>
                      </div>
                    )}
                    {record.security_deposit_forfeited_amount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Forfeited Amount:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {new Intl.NumberFormat('en-PH', {
                            style: 'currency',
                            currency: 'PHP',
                            minimumFractionDigits: 0
                          }).format(record.security_deposit_forfeited_amount)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {record.security_deposit_payment_method && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {record.security_deposit_payment_method}
                    </span>
                  </div>
                )}

                {record.security_deposit_held_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Held At:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(record.security_deposit_held_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {record.security_deposit_returned_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Returned At:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(record.security_deposit_returned_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {record.security_deposit_notes && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notes:</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100 italic">
                      {record.security_deposit_notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add-ons Summary */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 mb-3">
              <DollarSign className="w-4 h-4" />
              Add-ons Summary
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Add-ons ({(record.items || []).length} items):
              </span>
              <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {record.formatted_grand_total}
              </span>
            </div>
          </div>

          {/* Payment Proof Link */}
          {record.payment_proof_url && (
            <a
              href={record.payment_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium border border-blue-200 dark:border-blue-800"
            >
              <ExternalLink className="w-4 h-4" />
              View Payment Proof
            </a>
          )}

          {/* Security Deposit Proof Link */}
          {record.security_deposit_payment_proof_url && (
            <a
              href={record.security_deposit_payment_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors font-medium border border-cyan-200 dark:border-cyan-800"
            >
              <ExternalLink className="w-4 h-4" />
              View Security Deposit Proof
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
