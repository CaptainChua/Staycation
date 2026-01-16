"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';

interface HavenDetailsData {
  capacity?: number | string;
  room_size?: number | string;
  beds?: string;
  description?: string;
}

interface HavenDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HavenDetailsData) => void;
  initialData?: HavenDetailsData;
}

const HavenDetailsModal = ({ isOpen, onClose, onSave, initialData }: HavenDetailsModalProps) => {
  const [formData, setFormData] = useState<HavenDetailsData>({
    capacity: "",
    room_size: "",
    beds: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        capacity: initialData.capacity?.toString() || "",
        room_size: initialData.room_size?.toString() || "",
        beds: initialData.beds || "",
        description: initialData.description || "",
      });
    }
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.capacity || formData.capacity === "") {
      newErrors.capacity = "Maximum guests is required";
    } else if (isNaN(parseInt(formData.capacity.toString()))) {
      newErrors.capacity = "Maximum guests must be a number";
    }

    if (!formData.room_size || formData.room_size === "") {
      newErrors.room_size = "Room size is required";
    } else if (isNaN(parseFloat(formData.room_size.toString()))) {
      newErrors.room_size = "Room size must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        capacity: parseInt(formData.capacity.toString()),
        room_size: parseFloat(formData.room_size.toString()),
        beds: formData.beds,
        description: formData.description,
      });
      toast.success("Haven details saved successfully!");
      onClose();
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleClose = () => {
    setFormData({
      capacity: "",
      room_size: "",
      beds: "",
      description: "",
    });
    setErrors({});
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
              <h2 className="text-2xl font-bold text-gray-800">Haven Details</h2>
              <p className="text-sm text-gray-600 mt-1">Update haven specifications and description</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Maximum Guests"
                  labelPlacement="outside"
                  value={formData.capacity?.toString()}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  classNames={{ label: "text-sm font-medium text-gray-700" }}
                  isInvalid={!!errors.capacity}
                  errorMessage={errors.capacity}
                  isRequired
                />
                <Input
                  type="number"
                  label="Room Size (sq.m)"
                  labelPlacement="outside"
                  value={formData.room_size?.toString()}
                  onChange={(e) => setFormData({ ...formData, room_size: e.target.value })}
                  classNames={{ label: "text-sm font-medium text-gray-700" }}
                  isInvalid={!!errors.room_size}
                  errorMessage={errors.room_size}
                  isRequired
                />
              </div>
              <Input
                label="Beds Configuration"
                labelPlacement="outside"
                placeholder="e.g., 1 King + 1 Queen Bed"
                value={formData.beds}
                onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Enter haven description..."
                />
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

export default HavenDetailsModal;
