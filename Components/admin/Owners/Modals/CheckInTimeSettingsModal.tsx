"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';

interface CheckInTimeData {
  six_hour_check_in?: string;
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
}

interface CheckInTimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CheckInTimeData) => void;
  initialData?: CheckInTimeData;
}

const CheckInTimeSettingsModal = ({ isOpen, onClose, onSave, initialData }: CheckInTimeSettingsModalProps) => {
  const [formData, setFormData] = useState<CheckInTimeData>({
    six_hour_check_in: "09:00",
    ten_hour_check_in: "09:00",
    twenty_one_hour_check_in: "14:00",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        six_hour_check_in: initialData.six_hour_check_in || "09:00",
        ten_hour_check_in: initialData.ten_hour_check_in || "09:00",
        twenty_one_hour_check_in: initialData.twenty_one_hour_check_in || "14:00",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast.success("Check-in time settings saved successfully!");
    onClose();
  };

  const handleClose = () => {
    setFormData({
      six_hour_check_in: "09:00",
      ten_hour_check_in: "09:00",
      twenty_one_hour_check_in: "14:00",
    });
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Check-in Time Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Set default check-in times for each booking duration</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <Input
                type="time"
                label="6-Hour Check-in Time"
                labelPlacement="outside"
                value={formData.six_hour_check_in}
                onChange={(e) => setFormData({ ...formData, six_hour_check_in: e.target.value })}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
              />
              <Input
                type="time"
                label="10-Hour Check-in Time"
                labelPlacement="outside"
                value={formData.ten_hour_check_in}
                onChange={(e) => setFormData({ ...formData, ten_hour_check_in: e.target.value })}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
              />
              <Input
                type="time"
                label="21-Hour Check-in Time"
                labelPlacement="outside"
                value={formData.twenty_one_hour_check_in}
                onChange={(e) => setFormData({ ...formData, twenty_one_hour_check_in: e.target.value })}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default CheckInTimeSettingsModal;
