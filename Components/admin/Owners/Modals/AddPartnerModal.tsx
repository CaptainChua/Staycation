"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Handshake, X, Mail, Lock, User, MapPin, Building2, Percent } from "lucide-react";

interface FormData {
  email: string;
  password: string;
  fullname: string;
  phone: string;
  address: string;
  type: string;
  commission_rate: number;
}

interface Partner {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  type: string;
  commission_rate: number;
  status: "active" | "pending" | "suspended" | "inactive";
}

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPartner: Partner | null;
  formData: FormData;

  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;

  onSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;

  isCreating?: boolean;
  isUpdating?: boolean;
}

const AddPartnerModal = ({
  isOpen,
  onClose,
  editingPartner,
  formData,
  onFormChange,
  onSave,
  isCreating,
  isUpdating,
}: AddPartnerModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen) return null;

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    await onSave(e);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, "");
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: "phone", value: numericOnly },
    } as React.ChangeEvent<HTMLInputElement>;
    onFormChange(syntheticEvent);
  };

  const inputBase =
    "w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400 dark:placeholder:text-gray-500";

  const labelBase =
    "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  return createPortal(
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4 py-6 overflow-y-auto">
        <div
          className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-primary/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/15 rounded-xl">
                <Handshake className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPartner ? "Edit Partner" : "Add Partner"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingPartner
                    ? "Update partner details and commission"
                    : "Create a new partner account"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* GUIDE BOX */}
          <div className="px-6 pt-5">
            <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
              <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">
                ?
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">
                  What is a Partner?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Partners are hotels or properties that list with us. Set their
                  commission rate and login details so they can manage their
                  listings.
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* EMAIL */}
            <div>
              <label className={labelBase}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onFormChange}
                  placeholder="partner@email.com"
                  className={inputBase}
                  required
                  disabled={!!editingPartner || isLoading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            {!editingPartner && (
              <div>
                <label className={labelBase}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={onFormChange}
                    placeholder="Set a secure password"
                    className={inputBase}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* FULLNAME */}
            <div>
              <label className={labelBase}>Full Name / Business Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={onFormChange}
                  placeholder="e.g. Sunset Hotel Tagaytay"
                  className={inputBase}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className={labelBase}>Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  📞
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  disabled={isLoading}
                  placeholder="+63 912 345 6789"
                  className={inputBase}
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div>
              <label className={labelBase}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={onFormChange}
                  placeholder="Complete address"
                  className={inputBase}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* TYPE + COMMISSION (grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>Partner Type</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    name="type"
                    value={formData.type}
                    onChange={onFormChange}
                    aria-label="Partner type"
                    title="Partner type"
                    disabled={isLoading}
                    className={`${inputBase} appearance-none cursor-pointer`}
                  >
                    <option value="hotel">Hotel</option>
                    <option value="resort">Resort</option>
                    <option value="villa">Villa</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelBase}>Commission %</label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="commission_rate"
                    value={formData.commission_rate}
                    onChange={onFormChange}
                    className={inputBase}
                    placeholder="10"
                    min={0}
                    max={100}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-[#b57603] text-white font-semibold shadow-md transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Saving..."
                  : editingPartner
                  ? "Update Partner"
                  : "Create Partner"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
};

export default AddPartnerModal;
