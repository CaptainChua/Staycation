"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, User, Mail, Phone, MapPin, Calendar, Users as UsersIcon, DollarSign, CreditCard, Facebook, IdCard, Image as ImageIcon } from "lucide-react";

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

interface ViewBookingsProps {
  booking: Booking;
  onClose: () => void;
}

export default function ViewBookings({ booking, onClose }: ViewBookingsProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts - use requestAnimationFrame to avoid cascading renders
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  if (!isMounted) return null;

  const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`;
  const totalGuests = booking.adults + booking.children + booking.infants;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const parseAdditionalGuests = () => {
    try {
      if (typeof booking.additional_guests === 'string') {
        return JSON.parse(booking.additional_guests);
      }
      return Array.isArray(booking.additional_guests) ? booking.additional_guests : [];
    } catch {
      return [];
    }
  };

  const additionalGuests = parseAdditionalGuests();

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
            <div>
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-[0.2em]">
                Booking Details
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {booking.booking_id}
              </h2>
              <div className="mt-2">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/70 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            {/* Guest Information */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Guest Information
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Primary Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Full Name" icon={<User className="w-4 h-4" />} value={guestName} />
                {booking.guest_gender && (
                  <InfoField label="Gender" value={booking.guest_gender} capitalize />
                )}
                <InfoField label="Email Address" icon={<Mail className="w-4 h-4" />} value={booking.guest_email} />
                <InfoField label="Phone Number" icon={<Phone className="w-4 h-4" />} value={booking.guest_phone} />
                {booking.facebook_link && (
                  <div className="md:col-span-2">
                    <InfoField
                      label="Facebook Profile"
                      icon={<Facebook className="w-4 h-4" />}
                      value={
                        <a href={booking.facebook_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {booking.facebook_link}
                        </a>
                      }
                    />
                  </div>
                )}
                {booking.valid_id_url && (
                  <div className="md:col-span-2">
                    <InfoField
                      label="Valid ID"
                      icon={<IdCard className="w-4 h-4" />}
                      value={
                        <a href={booking.valid_id_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          View Valid ID
                        </a>
                      }
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Additional Guests */}
            {additionalGuests.length > 0 && (
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                    Additional Guests
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {additionalGuests.length} {additionalGuests.length === 1 ? 'Guest' : 'Guests'}
                  </h3>
                </div>
                <div className="space-y-3">
                  {additionalGuests.map((guest: { firstName?: string; lastName?: string; age?: string; gender?: string; validIdUrl?: string }, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-2xl p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Name</p>
                          <p className="font-semibold text-gray-800">{guest.firstName} {guest.lastName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Age</p>
                          <p className="font-semibold text-gray-800">{guest.age || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Gender</p>
                          <p className="font-semibold text-gray-800 capitalize">{guest.gender || 'N/A'}</p>
                        </div>
                        {guest.validIdUrl && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Valid ID</p>
                            <a href={guest.validIdUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                              View ID
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Booking Details */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Reservation Details
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Stay Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Haven" icon={<MapPin className="w-4 h-4" />} value={booking.room_name} />
                <InfoField
                  label="Total Guests"
                  icon={<UsersIcon className="w-4 h-4" />}
                  value={`${totalGuests} (Adults: ${booking.adults}, Children: ${booking.children}, Infants: ${booking.infants})`}
                />
                <InfoField
                  label="Check-In"
                  icon={<Calendar className="w-4 h-4" />}
                  value={
                    <div>
                      <p className="font-semibold">{formatDate(booking.check_in_date)}</p>
                      <p className="text-xs text-gray-500">{booking.check_in_time}</p>
                    </div>
                  }
                />
                <InfoField
                  label="Check-Out"
                  icon={<Calendar className="w-4 h-4" />}
                  value={
                    <div>
                      <p className="font-semibold">{formatDate(booking.check_out_date)}</p>
                      <p className="text-xs text-gray-500">{booking.check_out_time}</p>
                    </div>
                  }
                />
                {booking.created_at && (
                  <div className="md:col-span-2">
                    <InfoField label="Booked On" value={formatDate(booking.created_at)} />
                  </div>
                )}
              </div>
            </section>

            {/* Payment Information */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Payment Details
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Billing Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Haven Rate" icon={<DollarSign className="w-4 h-4" />} value={formatCurrency(booking.room_rate)} />
                <InfoField label="Security Deposit" icon={<DollarSign className="w-4 h-4" />} value={formatCurrency(booking.security_deposit)} />
                <InfoField label="Add-ons Total" icon={<DollarSign className="w-4 h-4" />} value={formatCurrency(booking.add_ons_total)} />
                <InfoField
                  label="Total Amount"
                  icon={<DollarSign className="w-4 h-4" />}
                  value={<span className="text-lg font-bold text-gray-900">{formatCurrency(booking.total_amount)}</span>}
                />
                <InfoField
                  label="Down Payment"
                  value={<span className="text-green-700 font-semibold">{formatCurrency(booking.down_payment)}</span>}
                />
                <InfoField
                  label="Remaining Balance"
                  value={<span className="text-orange-700 font-semibold">{formatCurrency(booking.remaining_balance)}</span>}
                />
                <InfoField label="Payment Method" icon={<CreditCard className="w-4 h-4" />} value={booking.payment_method} capitalize />
                {booking.payment_proof_url && (
                  <InfoField
                    label="Payment Proof"
                    icon={<ImageIcon className="w-4 h-4" />}
                    value={
                      <a href={booking.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        View Payment Proof
                      </a>
                    }
                  />
                )}
              </div>
            </section>
          </div>

          {/* Footer actions */}
          <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-3 bg-white">
            <p className="text-xs text-gray-500">
              Last updated: {booking.updated_at ? formatDate(booking.updated_at) : 'N/A'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-yellow-600 transition"
              >
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  capitalize?: boolean;
}

const InfoField = ({ label, value, icon, capitalize }: InfoFieldProps) => (
  <div className="space-y-2">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <div
        className={`w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-800 ${icon ? "pl-9" : "pl-3"} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </div>
    </div>
  </div>
);