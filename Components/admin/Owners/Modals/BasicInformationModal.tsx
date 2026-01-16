"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import toast from 'react-hot-toast';

interface BasicInformationData {
  haven_name?: string;
  tower?: string;
  floor?: string;
  view_type?: string;
}

interface BasicInformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BasicInformationData) => void;
  initialData?: BasicInformationData;
}

const BasicInformationModal = ({ isOpen, onClose, onSave, initialData }: BasicInformationModalProps) => {
  const [formData, setFormData] = useState<BasicInformationData>({
    haven_name: "",
    tower: "",
    floor: "",
    view_type: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const towers = [
    { value: "tower-a", label: "Tower A" },
    { value: "tower-b", label: "Tower B" },
    { value: "tower-c", label: "Tower C" },
    { value: "tower-d", label: "Tower D" },
  ];

  const views = [
    { value: "city", label: "City View" },
    { value: "pool", label: "Pool View" },
    { value: "ocean", label: "Ocean View" },
    { value: "garden", label: "Garden View" },
    { value: "mountain", label: "Mountain View" },
  ];

  useEffect(() => {
    if (initialData) {
      setFormData({
        haven_name: initialData.haven_name || "",
        tower: initialData.tower || "",
        floor: initialData.floor || "",
        view_type: initialData.view_type || "",
      });
    }
  }, [initialData, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.haven_name?.trim()) {
      newErrors.haven_name = "Haven name is required";
    }
    if (!formData.tower) {
      newErrors.tower = "Tower is required";
    }
    if (!formData.floor?.trim()) {
      newErrors.floor = "Floor is required";
    }
    if (!formData.view_type) {
      newErrors.view_type = "View type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      toast.success("Basic information saved successfully!");
      onClose();
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  const handleClose = () => {
    setFormData({
      haven_name: "",
      tower: "",
      floor: "",
      view_type: "",
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
              <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
              <p className="text-sm text-gray-600 mt-1">Update haven basic details</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <Input
                label="Haven Name"
                labelPlacement="outside"
                placeholder="e.g., Haven 1"
                value={formData.haven_name}
                onChange={(e) => setFormData({ ...formData, haven_name: e.target.value })}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
                isInvalid={!!errors.haven_name}
                errorMessage={errors.haven_name}
                isRequired
              />
              <Select
                label="Tower"
                labelPlacement="outside"
                placeholder="Select Tower"
                selectedKeys={formData.tower ? [formData.tower] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, tower: value });
                }}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
                isInvalid={!!errors.tower}
                errorMessage={errors.tower}
                isRequired
              >
                {towers.map((tower) => (
                  <SelectItem key={tower.value}>{tower.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="Floor"
                labelPlacement="outside"
                placeholder="e.g., 1"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
                isInvalid={!!errors.floor}
                errorMessage={errors.floor}
                isRequired
              />
              <Select
                label="View Type"
                labelPlacement="outside"
                placeholder="Select View"
                selectedKeys={formData.view_type ? [formData.view_type] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, view_type: value });
                }}
                classNames={{ label: "text-sm font-medium text-gray-700" }}
                isInvalid={!!errors.view_type}
                errorMessage={errors.view_type}
                isRequired
              >
                {views.map((view) => (
                  <SelectItem key={view.value}>{view.label}</SelectItem>
                ))}
              </Select>
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

export default BasicInformationModal;
