"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

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

  const handleSave = () => {
    if (validateForm()) {
      onSave({
        capacity: parseInt((formData.capacity ?? "").toString()),
        room_size: parseFloat((formData.room_size ?? "").toString()),
        beds: formData.beds,
        description: formData.description,
      });
      toast.success("Haven details saved successfully!");
      handleClose();
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

  const inputClassNames = {
    label: "text-sm font-medium text-gray-700",
    inputWrapper: "border-gray-300 focus-within:!border-brand-primary focus-within:!ring-brand-primary/20 hover:border-brand-primary/50 transition-colors"
  };

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Haven Details"
      subtitle="Update haven specifications and description"
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Maximum Guests"
            labelPlacement="outside"
            value={formData.capacity?.toString()}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            classNames={inputClassNames}
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
            classNames={inputClassNames}
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
          classNames={inputClassNames}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all text-sm"
            placeholder="Enter haven description..."
          />
        </div>
      </div>
    </SubModalWrapper>
  );
};

export default HavenDetailsModal;