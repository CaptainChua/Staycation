"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Handshake, X } from "lucide-react";

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

  // ✅ FIXED TYPE (important)
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

  // ✅ FIXED FORM HANDLER
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return;

    await onSave(e);
  };

  return createPortal(
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] px-4">
        <div
          className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2">
              <Handshake />
              <h2 className="font-bold">
                {editingPartner ? "Edit Partner" : "Add Partner"}
              </h2>
            </div>

            <button onClick={onClose}>
              <X />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* EMAIL */}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onFormChange}
              placeholder="Email"
              className="w-full border p-2 rounded"
              required
              disabled={!!editingPartner}
            />

            {/* PASSWORD */}
            {!editingPartner && (
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={onFormChange}
                placeholder="Password"
                className="w-full border p-2 rounded"
                required
              />
            )}

            {/* FULLNAME */}
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={onFormChange}
              placeholder="Full Name"
              className="w-full border p-2 rounded"
              required
            />

            {/* PHONE */}
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={onFormChange}
              placeholder="Phone"
              className="w-full border p-2 rounded"
            />

            {/* ADDRESS */}
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={onFormChange}
              placeholder="Address"
              className="w-full border p-2 rounded"
            />

            {/* TYPE */}
            <select
              name="type"
              value={formData.type}
              onChange={onFormChange}
              className="w-full border p-2 rounded"
            >
              <option value="hotel">Hotel</option>
            </select>

            {/* COMMISSION */}
            <input
              type="number"
              name="commission_rate"
              value={formData.commission_rate}
              onChange={onFormChange}
              className="w-full border p-2 rounded"
              placeholder="Commission %"
              min={0}
              max={100}
            />

            {/* BUTTONS */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded"
              >
                {isLoading
                  ? "Saving..."
                  : editingPartner
                  ? "Update"
                  : "Create"}
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