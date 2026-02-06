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
  Users as UsersIcon
} from "lucide-react";

interface Booking {
  id?: string;
  cleaning_id?: string;
  booking_id: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  haven?: string;
  room_name?: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  cleaning_status?: string;
  cleaner_first_name?: string;
  cleaner_last_name?: string;
  cleaner_employment_id?: string;
  cleaning_time_in?: string;
  cleaning_time_out?: string;
  cleaned_at?: string;
  inspected_at?: string;
  assigned_cleaner_id?: string;
}

interface ViewBookingsProps {
  booking: Booking;
  onClose: () => void;
}

export default function ViewBookings({ booking, onClose }: ViewBookingsProps) {
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

  const guestName = `${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || 'N/A';
  const cleanerName = booking.cleaner_first_name && booking.cleaner_last_name
    ? `${booking.cleaner_first_name} ${booking.cleaner_last_name}`
    : 'Unassigned';
  const havenName = booking.haven || booking.room_name || 'N/A';

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

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
      case "in-progress":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "cleaned":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "inspected":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Unknown';
    if (status === 'pending' && !booking.assigned_cleaner_id) return 'Unassigned';
    if (status === 'pending' && booking.assigned_cleaner_id) return 'Assigned';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
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
            <div className="p-2 bg-blue-500 rounded-lg">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Cleaning Task Details
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View complete task information
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
          {/* Task Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              Task Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Booking ID:</span>
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {booking.booking_id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.cleaning_status)}`}>
                  {getStatusLabel(booking.cleaning_status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Assigned Cleaner:</span>
                <span className={`text-sm font-medium ${cleanerName === 'Unassigned' ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-gray-100'}`}>
                  {cleanerName}
                </span>
              </div>
              {booking.cleaner_employment_id && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Employee ID:</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {booking.cleaner_employment_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4" />
              Booking Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {havenName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-in:</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {formatDate(booking.check_in_date)} {formatTime(booking.check_in_time)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-out:</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {formatDate(booking.check_out_date)} {formatTime(booking.check_out_time)}
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
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {guestName}
                </span>
              </div>
              {booking.guest_email && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Email:</span>
                  <a href={`mailto:${booking.guest_email}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                    {booking.guest_email}
                  </a>
                </div>
              )}
              {booking.guest_phone && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone:</span>
                  <a href={`tel:${booking.guest_phone}`} className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline">
                    {booking.guest_phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Cleaning Timeline */}
          {(booking.cleaning_time_in || booking.cleaning_time_out || booking.cleaned_at || booking.inspected_at) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">
                <Calendar className="w-4 h-4" />
                Cleaning Timeline
              </div>
              <div className="space-y-2">
                {booking.cleaning_time_in && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Started:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(booking.cleaning_time_in).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {booking.cleaning_time_out && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Finished:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(booking.cleaning_time_out).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {booking.cleaned_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cleaned At:</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {new Date(booking.cleaned_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
                {booking.inspected_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Inspected At:</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {new Date(booking.inspected_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
