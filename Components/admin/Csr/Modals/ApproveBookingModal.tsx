"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  User,
  MapPin,
  Calendar,
  Eye,
  ExternalLink,
  Clock,
  Users as UsersIcon,
  CreditCard,
  Banknote,
  Phone,
  Mail,
  Shield,
  PlusCircle,
  Home,
  CheckCircle
} from "lucide-react";
import TotalBreakdown from "../TotalBreakdown";

interface Booking {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  guest_gender?: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  facebook_link?: string;
  payment_method: string;
  payment_proof_url?: string;
  valid_id_url?: string;
  room_rate: number;
  security_deposit: number;
  deposit_status?: string;
  security_deposit_payment_method?: string;
  security_deposit_payment_proof_url?: string;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  status: string;
  add_ons?: unknown;
  additional_guests?: unknown;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ApproveBookingModalProps {
  booking?: Booking;
  bookings?: Booking[];
  onClose: () => void;
  onApprove: (bookingId: string) => void;
  onBulkApprove?: (bookingIds: string[]) => void;
  isLoading?: boolean;
  isBulk?: boolean;
}

export default function ApproveBookingModal({ booking, bookings, onClose, onApprove, onBulkApprove, isLoading = false, isBulk = false }: ApproveBookingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isMounted) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMounted, onClose]);

  if (!isMounted) return null;

  const selectedBookings = bookings || (booking ? [booking] : []);
  const guestName = isBulk ? "Multiple Bookings" : (booking ? `${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || 'N/A' : 'N/A');
  const totalGuests = booking ? booking.adults + booking.children + booking.infants : 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
        return "bg-red-100 text-red-700";
      case "checked-in":
        return "bg-blue-100 text-blue-700";
      case "checked-out":
        return "bg-indigo-100 text-indigo-700";
      case "cancelled":
        return "bg-orange-100 text-orange-700";
      case "completed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleApprove = () => {
    if (isBulk && onBulkApprove) {
      const bookingIds = selectedBookings.map(b => b.id);
      onBulkApprove(bookingIds);
    } else if (booking) {
      onApprove(booking.id);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" />
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isBulk ? `Approve ${selectedBookings.length} Bookings` : 'Approve Booking'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isBulk ? `Review and approve ${selectedBookings.length} selected bookings` : 'Review booking details and approve'}
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
          {isBulk ? (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Selected Bookings Summary
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You have selected <span className="font-semibold">{selectedBookings.length}</span> bookings to approve.
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedBookings.map((b) => (
                    <div key={b.id} className="text-xs bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                      <span className="font-mono">{b.booking_id}</span> - {b.room_name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Booking Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  Booking Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Booking ID:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">{booking.booking_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-in:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.check_in_date)} {formatTime(booking.check_in_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-out:</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.check_out_date)} {formatTime(booking.check_out_time)}</span>
                  </div>
                </div>
              </div>

              {/* Haven Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Home className="w-4 h-4" />
                  Haven Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{booking.room_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {booking.adults} Adults, {booking.children} Children, {booking.infants} Infants
                    </span>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  Guest Information
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{guestName}</span>
                  </div>
                  {booking.guest_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${booking.guest_email}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                        {booking.guest_email}
                      </a>
                    </div>
                  )}
                  {booking.guest_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${booking.guest_phone}`} className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        {booking.guest_phone}
                      </a>
                    </div>
                  )}
                  {booking.facebook_link && (
                    <div className="flex items-center gap-2">
                      <a
                        href={booking.facebook_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Facebook Profile
                      </a>
                    </div>
                  )}
                  {booking.valid_id_url && (
                    <div className="flex items-center gap-2">
                      <a
                        href={booking.valid_id_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Valid ID
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <CreditCard className="w-4 h-4" />
                  Payment Information
                </div>
                <div className="space-y-3">
                  {booking.payment_method && (
                    <div className="flex items-center gap-2">
                      {booking.payment_method.toLowerCase() === 'cash' && <Banknote className="w-4 h-4 text-green-600" />}
                      {booking.payment_method.toLowerCase() === 'gcash' && <CreditCard className="w-4 h-4 text-blue-600" />}
                      {booking.payment_method.toLowerCase() === 'bank transfer' && <CreditCard className="w-4 h-4 text-purple-600" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{booking.payment_method}</span>
                    </div>
                  )}
                  {booking.payment_proof_url && (
                    <div className="flex items-center gap-2">
                      <a
                        href={booking.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Payment Proof
                      </a>
                    </div>
                  )}
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <TotalBreakdown
                      roomRate={booking.room_rate}
                      securityDeposit={booking.security_deposit}
                      depositStatus={booking.deposit_status}
                      addOnsTotal={booking.add_ons_total}
                      totalAmount={booking.total_amount}
                      downPayment={booking.down_payment}
                      remainingBalance={booking.remaining_balance}
                      isCompact={false}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {isBulk ? 'Approving...' : 'Approving...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isBulk ? `Approve ${selectedBookings.length} Bookings` : 'Approve Booking'}
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
