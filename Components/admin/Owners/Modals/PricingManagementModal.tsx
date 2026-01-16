"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';

interface PricingData {
  six_hour_rate?: number | string;
  ten_hour_rate?: number | string;
  weekday_rate?: number | string;
  weekend_rate?: number | string;
}

interface PricingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PricingData) => void;
  initialData?: PricingData;
}

const PricingManagementModal = ({ isOpen, onClose, onSave, initialData }: PricingManagementModalProps) => {
  const [formData, setFormData] = useState<PricingData>({
    six_hour_rate: "",
    ten_hour_rate: "",
    weekday_rate: "",
    weekend_rate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        six_hour_rate: initialData.six_hour_rate?.toString() || "",
        ten_hour_rate: initialData.ten_hour_rate?.toString() || "",
        weekday_rate: initialData.weekday_rate?.toString() || "",
        weekend_rate: initialData.weekend_rate?.toString() || "",
      });
    }
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.six_hour_rate || formData.six_hour_rate === "") {
      newErrors.six_hour_rate = "6-hour rate is required";
    } else if (isNaN(parseFloat(formData.six_hour_rate.toString()))) {
      newErrors.six_hour_rate = "6-hour rate must be a number";
    }

    if (!formData.ten_hour_rate || formData.ten_hour_rate === "") {
      newErrors.ten_hour_rate = "10-hour rate is required";
    } else if (isNaN(parseFloat(formData.ten_hour_rate.toString()))) {
      newErrors.ten_hour_rate = "10-hour rate must be a number";
    }

    if (!formData.weekday_rate || formData.weekday_rate === "") {
      newErrors.weekday_rate = "Weekday rate is required";
    } else if (isNaN(parseFloat(formData.weekday_rate.toString()))) {
      newErrors.weekday_rate = "Weekday rate must be a number";
    }

    if (!formData.weekend_rate || formData.weekend_rate === "") {
      newErrors.weekend_rate = "Weekend rate is required";
    } else if (isNaN(parseFloat(formData.weekend_rate.toString()))) {
      newErrors.weekend_rate = "Weekend rate must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        six_hour_rate: parseFloat(formData.six_hour_rate.toString()),
        ten_hour_rate: parseFloat(formData.ten_hour_rate.toString()),
        weekday_rate: parseFloat(formData.weekday_rate.toString()),
        weekend_rate: parseFloat(formData.weekend_rate.toString()),
      });
      toast.success("Pricing updated successfully!");
      onClose();
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleClose = () => {
    setFormData({
      six_hour_rate: "",
      ten_hour_rate: "",
      weekday_rate: "",
      weekend_rate: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Pricing Management</h2>
              <p className="text-sm text-gray-600 mt-1">Update haven pricing rates</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Weekday Rates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Weekday Rates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    label="6-Hour Rate"
                    labelPlacement="outside"
                    placeholder="₱ 0.00"
                    value={formData.six_hour_rate?.toString()}
                    onChange={(e) => setFormData({ ...formData, six_hour_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                    isInvalid={!!errors.six_hour_rate}
                    errorMessage={errors.six_hour_rate}
                    startContent={<span className="text-gray-500">₱</span>}
                    isRequired
                  />
                  <Input
                    type="number"
                    label="10-Hour Rate"
                    labelPlacement="outside"
                    placeholder="₱ 0.00"
                    value={formData.ten_hour_rate?.toString()}
                    onChange={(e) => setFormData({ ...formData, ten_hour_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                    isInvalid={!!errors.ten_hour_rate}
                    errorMessage={errors.ten_hour_rate}
                    startContent={<span className="text-gray-500">₱</span>}
                    isRequired
                  />
                  <Input
                    type="number"
                    label="21-Hour Rate"
                    labelPlacement="outside"
                    placeholder="₱ 0.00"
                    value={formData.weekday_rate?.toString()}
                    onChange={(e) => setFormData({ ...formData, weekday_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                    isInvalid={!!errors.weekday_rate}
                    errorMessage={errors.weekday_rate}
                    startContent={<span className="text-gray-500">₱</span>}
                    isRequired
                  />
                </div>
              </div>

              {/* Weekend Rates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Weekend Rates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="number"
                    label="6-Hour Rate"
                    labelPlacement="outside"
                    placeholder="₱ 0.00"
                    value={formData.six_hour_rate?.toString()}
                    onChange={(e) => setFormData({ ...formData, six_hour_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                    startContent={<span className="text-gray-500">₱</span>}
                  />
                  <Input
                    type="number"
                    label="10-Hour Rate"
                    labelPlacement="outside"
                    placeholder="₱ 0.00"
                    value={formData.ten_hour_rate?.toString()}
                    onChange={(e) => setFormData({ ...formData, ten_hour_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                    startContent={<span className="text-gray-500">₱</span>}
                  />
                  <Input
                    type="number"
                    label="21-Hour Rate"
                    labelPlacement="outside"
                    placeholder="₱ 0.00"
                    value={formData.weekend_rate?.toString()}
                    onChange={(e) => setFormData({ ...formData, weekend_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                    isInvalid={!!errors.weekend_rate}
                    errorMessage={errors.weekend_rate}
                    startContent={<span className="text-gray-500">₱</span>}
                    isRequired
                  />
                </div>
              </div>
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

export default PricingManagementModal;
