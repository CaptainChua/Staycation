"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

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

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      toast.success("Basic information saved successfully!");
      // Don't close here if parent handles it? The existing code called onClose()
      // But usually parent closes. I'll call onClose() to match existing behavior.
      // Actually, wrapper handles onClose logic usually? 
      // Existing code: toast -> onClose.
      // SubModalWrapper calls onSave. It does NOT automatically close.
      // So I should keep logic here. However, `onClose` prop passed to wrapper closes modal.
      // I need to ensure state reset happens.
      // I'll call reset logic then onClose passed from parent.
      setFormData({
        haven_name: "",
        tower: "",
        floor: "",
        view_type: "",
      });
      setErrors({});
      onClose(); // This will close the modal via parent state
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

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Basic Information"
      subtitle="Update haven basic details"
      onSave={handleSave}
    >
      <div className="space-y-4">
        <Input
          label="Haven Name"
          labelPlacement="outside"
          placeholder="e.g., Haven 1"
          value={formData.haven_name}
          onChange={(e) => setFormData({ ...formData, haven_name: e.target.value })}
          classNames={{ 
            label: "text-sm font-medium text-gray-700",
            inputWrapper: "border-gray-300 focus-within:!border-brand-primary focus-within:!ring-brand-primary/20 hover:border-brand-primary/50 transition-colors"
          }}
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
          classNames={{ 
            label: "text-sm font-medium text-gray-700",
            trigger: "border-gray-300 focus-within:!border-brand-primary focus-within:!ring-brand-primary/20 hover:border-brand-primary/50 transition-colors"
          }}
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
          classNames={{ 
            label: "text-sm font-medium text-gray-700",
            inputWrapper: "border-gray-300 focus-within:!border-brand-primary focus-within:!ring-brand-primary/20 hover:border-brand-primary/50 transition-colors"
          }}
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
          classNames={{ 
            label: "text-sm font-medium text-gray-700",
            trigger: "border-gray-300 focus-within:!border-brand-primary focus-within:!ring-brand-primary/20 hover:border-brand-primary/50 transition-colors"
          }}
          isInvalid={!!errors.view_type}
          errorMessage={errors.view_type}
          isRequired
        >
          {views.map((view) => (
            <SelectItem key={view.value}>{view.label}</SelectItem>
          ))}
        </Select>
      </div>
    </SubModalWrapper>
  );
};

export default BasicInformationModal;