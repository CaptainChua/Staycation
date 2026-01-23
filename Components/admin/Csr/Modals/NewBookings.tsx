"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, Mail, Phone, User, X, Users, Clock } from "lucide-react";
import { useCreateBookingMutation } from "@/redux/api/bookingsApi";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import toast from "react-hot-toast";

interface NewBookingModalProps {
  onClose: () => void;
}

interface Haven {
  uuid_id: string;
  haven_name: string;
  tower: string;
  floor: string;
  view_type: string;
  capacity: number;
  room_size: string;
  beds: string;
  description: string;
  youtube_url?: string;
  six_hour_rate: number;
  ten_hour_rate: number;
  weekday_rate: number;
  weekend_rate: number;
}

const statusOptions = ["pending", "approved", "declined", "checked-in", "checked-out", "cancelled", "completed"];
const paymentMethods = ["cash", "gcash", "bank-transfer", "credit-card"];

export default function NewBookingModal({ onClose }: NewBookingModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [createBooking, { isLoading }] = useCreateBookingMutation();
  const { data: havensData, isLoading: isLoadingHavens } = useGetHavensQuery({}) as { data: Haven[]; isLoading: boolean };

  const [form, setForm] = useState({
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    guestGender: "",
    roomName: "",
    checkInDate: "",
    checkOutDate: "",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    adults: "1",
    children: "0",
    infants: "0",
    facebookLink: "",
    paymentMethod: "cash",
    paymentType: "down-payment", // "down-payment" or "full-payment"
    roomRate: "",
    securityDeposit: "0",
    addOnsTotal: "0",
    downPaymentAmount: "",
    status: "pending",
    notes: "",
  });

  // Set mounted state after component mounts - use requestAnimationFrame to avoid cascading renders
  useEffect(() => {
    // Schedule the state update for the next animation frame
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  // Parse havens data
  const havens: Haven[] = Array.isArray(havensData) ? havensData : [];

  if (!isMounted) return null;

  const calculateHavenRate = (selectedHaven?: Haven, checkInDate?: string, checkOutDate?: string) => {
    if (!selectedHaven) return "";
    if (!checkInDate || !checkOutDate) {
      return selectedHaven.ten_hour_rate?.toString() ?? "";
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate <= startDate) {
      return selectedHaven.ten_hour_rate?.toString() ?? "";
    }

    const weekdayRate = selectedHaven.weekday_rate ?? selectedHaven.ten_hour_rate;
    const weekendRate = selectedHaven.weekend_rate ?? weekdayRate;

    let total = 0;
    const cursor = new Date(startDate);

    while (cursor < endDate) {
      const day = cursor.getDay();
      const isWeekend = day === 5 || day === 6; // Friday & Saturday treated as weekend
      total += isWeekend ? weekendRate : weekdayRate;
      cursor.setDate(cursor.getDate() + 1);
    }

    return total.toString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updatedForm = { ...prev, [name]: value };

      if (["roomName", "checkInDate", "checkOutDate"].includes(name)) {
        const selectedHaven = havens.find((h) => h.haven_name === updatedForm.roomName);
        const calculatedRate = calculateHavenRate(selectedHaven, updatedForm.checkInDate, updatedForm.checkOutDate);
        updatedForm.roomRate = calculatedRate;
      }

      return updatedForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const roomRate = parseFloat(form.roomRate) || 0;
    const securityDeposit = parseFloat(form.securityDeposit) || 0;
    const addOnsTotal = parseFloat(form.addOnsTotal) || 0;
    const totalAmount = roomRate + securityDeposit + addOnsTotal;

    // Calculate down payment and remaining balance based on payment type
    let downPayment = 0;
    let remainingBalance = 0;

    if (form.paymentType === "full-payment") {
      downPayment = totalAmount;
      remainingBalance = 0;
    } else {
      // Down payment
      downPayment = parseFloat(form.downPaymentAmount) || 0;
      remainingBalance = totalAmount - downPayment;
    }

    const bookingData = {
      guest_first_name: form.guestFirstName,
      guest_last_name: form.guestLastName,
      guest_email: form.guestEmail,
      guest_phone: form.guestPhone,
      guest_gender: form.guestGender || undefined,
      room_name: form.roomName,
      check_in_date: form.checkInDate,
      check_out_date: form.checkOutDate,
      check_in_time: form.checkInTime,
      check_out_time: form.checkOutTime,
      adults: parseInt(form.adults),
      children: parseInt(form.children),
      infants: parseInt(form.infants),
      facebook_link: form.facebookLink || undefined,
      payment_method: form.paymentMethod,
      room_rate: roomRate,
      security_deposit: securityDeposit,
      add_ons_total: addOnsTotal,
      total_amount: totalAmount,
      down_payment: downPayment,
      remaining_balance: remainingBalance,
      status: form.status,
    };

    try {
      await createBooking(bookingData).unwrap();
      toast.success("Booking created successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to create booking");
      console.error(error);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-8 z-[9999]">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-yellow-50">
            <div>
              <p className="text-sm font-semibold text-orange-500 uppercase tracking-[0.2em]">
                Booking manager
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mt-1">Create New Booking</h2>
              <p className="text-sm text-gray-500 mt-1">
                Capture guest details and reservation preferences.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/70 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
            {/* Guest Details */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Guest details
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Primary contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LabeledInput
                  label="First Name"
                  name="guestFirstName"
                  value={form.guestFirstName}
                  onChange={handleChange}
                  placeholder="Juan"
                  icon={<User className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Last Name"
                  name="guestLastName"
                  value={form.guestLastName}
                  onChange={handleChange}
                  placeholder="Dela Cruz"
                  icon={<User className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Email Address"
                  name="guestEmail"
                  type="email"
                  value={form.guestEmail}
                  onChange={handleChange}
                  placeholder="juan@email.com"
                  icon={<Mail className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Phone Number"
                  name="guestPhone"
                  value={form.guestPhone}
                  onChange={handleChange}
                  placeholder="+63 912 345 6789"
                  icon={<Phone className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledSelect
                  label="Gender"
                  name="guestGender"
                  value={form.guestGender}
                  onChange={handleChange}
                  options={["male", "female", "other"]}
                />
                <LabeledInput
                  label="Facebook Profile (Optional)"
                  name="facebookLink"
                  value={form.facebookLink}
                  onChange={handleChange}
                  placeholder="https://facebook.com/username"
                />
              </div>
            </section>

            {/* Booking Details */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Reservation details
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Stay information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-600">Select Haven</span>
                  <select
                    name="roomName"
                    value={form.roomName}
                    onChange={handleChange}
                    required
                    disabled={isLoadingHavens}
                    className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {isLoadingHavens ? "Loading havens..." : "Select a haven/room"}
                    </option>
                    {havens.map((haven) => (
                      <option key={haven.uuid_id} value={haven.haven_name}>
                        {haven.haven_name} - {haven.tower} (Weekday ₱{haven.weekday_rate.toLocaleString()} / Weekend ₱{haven.weekend_rate.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <LabeledSelect
                  label="Booking Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={statusOptions}
                  required
                />
                <LabeledInput
                  label="Check-in Date"
                  name="checkInDate"
                  type="date"
                  value={form.checkInDate}
                  onChange={handleChange}
                  icon={<Calendar className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Check-in Time"
                  name="checkInTime"
                  type="time"
                  value={form.checkInTime}
                  onChange={handleChange}
                  icon={<Clock className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Check-out Date"
                  name="checkOutDate"
                  type="date"
                  value={form.checkOutDate}
                  onChange={handleChange}
                  icon={<Calendar className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Check-out Time"
                  name="checkOutTime"
                  type="time"
                  value={form.checkOutTime}
                  onChange={handleChange}
                  icon={<Clock className="w-4 h-4 text-gray-400" />}
                  required
                />
              </div>
            </section>

            {/* Guest Count */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Guest count
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Number of guests</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LabeledInput
                  label="Adults"
                  name="adults"
                  type="number"
                  min={1}
                  value={form.adults}
                  onChange={handleChange}
                  icon={<Users className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Children"
                  name="children"
                  type="number"
                  min={0}
                  value={form.children}
                  onChange={handleChange}
                  icon={<Users className="w-4 h-4 text-gray-400" />}
                  required
                />
                <LabeledInput
                  label="Infants"
                  name="infants"
                  type="number"
                  min={0}
                  value={form.infants}
                  onChange={handleChange}
                  icon={<Users className="w-4 h-4 text-gray-400" />}
                  required
                />
              </div>
            </section>

            {/* Payment Information */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Payment details
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Billing information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LabeledInput
                  label="Haven Rate (₱)"
                  name="roomRate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.roomRate}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
                <LabeledInput
                  label="Security Deposit (₱)"
                  name="securityDeposit"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.securityDeposit}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <LabeledInput
                  label="Add-ons Total (₱)"
                  name="addOnsTotal"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.addOnsTotal}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <LabeledSelect
                  label="Payment Method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  options={paymentMethods}
                  required
                />
              </div>

              {/* Payment Type Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LabeledSelect
                    label="Payment Type"
                    name="paymentType"
                    value={form.paymentType}
                    onChange={handleChange}
                    options={["down-payment", "full-payment"]}
                    required
                  />

                  {form.paymentType === "down-payment" && (
                    <LabeledInput
                      label="Down Payment Amount (₱)"
                      name="downPaymentAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.downPaymentAmount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  )}

                  {form.paymentType === "full-payment" && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-600">Total Amount (₱)</span>
                      <div className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-800 bg-gray-50">
                        {(() => {
                          const total = (parseFloat(form.roomRate) || 0) +
                                       (parseFloat(form.securityDeposit) || 0) +
                                       (parseFloat(form.addOnsTotal) || 0);
                          return `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em]">
                  Special requests
                </p>
                <h3 className="text-lg font-semibold text-gray-900">Add internal notes</h3>
              </div>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add any guest preferences, arrival notes, or CSR reminders..."
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </section>
          </form>

          {/* Footer actions */}
          <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-3 bg-white">
            <p className="text-xs text-gray-500">
              Total Amount will be automatically calculated based on room rate, deposit, and add-ons.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const LabeledInput = ({ label, icon, ...props }: LabeledInputProps) => (
  <label className="space-y-2">
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">{icon}</div>}
      <input
        {...props}
        className={`w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${icon ? "pl-9" : "pl-3"
          }`}
      />
    </div>
  </label>
);

interface LabeledSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

const LabeledSelect = ({ label, options, ...props }: LabeledSelectProps) => {
  const formatOptionText = (option: string) => {
    // Format option text for display
    return option
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <select
        {...props}
        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOptionText(option)}
          </option>
        ))}
      </select>
    </label>
  );
};