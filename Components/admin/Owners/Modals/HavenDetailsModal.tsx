"use client";

import { useState, useEffect } from "react";
import { Input, Textarea } from "@nextui-org/input";
import { z } from "zod";

const detailsSchema = z.object({
  capacity: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, "Capacity must be a positive number"),
  room_size: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Room size must be a positive number"),
  beds: z.string().min(1, "Number of beds is required"),
  description: z.string().min(1, "Description is required"),
});

interface HavenDetailsData {
  capacity?: number | string;
  room_size?: number | string;
  beds?: string;
  description?: string;
}

interface HavenDetailsModalProps {
  onSave: (data: HavenDetailsData) => void;
  initialData?: HavenDetailsData;
  isAddMode?: boolean;
}

const HavenDetailsModal = ({ 
  onSave, 
  initialData, 
  isAddMode = false,
}: HavenDetailsModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    capacity: "",
    room_size: "",
    beds: "",
    description: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        capacity: initialData.capacity?.toString() || "",
        room_size: initialData.room_size?.toString() || "",
        beds: initialData.beds || "",
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const validation = detailsSchema.safeParse(formData);
  const errors = !validation.success ? validation.error.format() : null;

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    onSave(newData);
  };

  const getInputClasses = (field: string) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field as keyof typeof errors];
    const isFieldValid = isFieldTouched && !errors?.[field as keyof typeof errors];

    let borderClass = "border-gray-300";
    if (isFieldInvalid) borderClass = "border-red-500 bg-red-50/10";
    if (isFieldValid) borderClass = "border-green-500 bg-green-50/10";

    return {
      label: "text-sm font-medium text-gray-700 mb-2",
      inputWrapper: `bg-white border ${borderClass} hover:border-brand-primary/60 focus-within:!border-brand-primary focus-within:!ring-1 focus-within:!ring-brand-primary/20 shadow-sm transition-all duration-200 rounded-lg h-12`,
      input: "text-gray-800 placeholder:text-gray-400"
    };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Capacity"
            labelPlacement="outside"
            placeholder="e.g., 4"
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            classNames={getInputClasses('capacity')}
            isInvalid={touched.capacity && !!errors?.capacity}
            errorMessage={touched.capacity && (errors?.capacity as any)?._errors[0]}
            isRequired
          />
          <Input
            type="number"
            label="Room Size (sqm)"
            labelPlacement="outside"
            placeholder="e.g., 35"
            value={formData.room_size}
            onChange={(e) => handleChange('room_size', e.target.value)}
            classNames={getInputClasses('room_size')}
            isInvalid={touched.room_size && !!errors?.room_size}
            errorMessage={touched.room_size && (errors?.room_size as any)?._errors[0]}
            isRequired
          />
        </div>
        <Input
          label="Beds"
          labelPlacement="outside"
          placeholder="e.g., 2 Queen Beds"
          value={formData.beds}
          onChange={(e) => handleChange('beds', e.target.value)}
          classNames={getInputClasses('beds')}
          isInvalid={touched.beds && !!errors?.beds}
          errorMessage={touched.beds && (errors?.beds as any)?._errors[0]}
          isRequired
        />
        <Textarea
          label="Description"
          labelPlacement="outside"
          placeholder="Describe the haven..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          classNames={{
            ...getInputClasses('description'),
            inputWrapper: `${getInputClasses('description').inputWrapper} h-auto min-h-[120px] py-2`
          }}
          isInvalid={touched.description && !!errors?.description}
          errorMessage={touched.description && (errors?.description as any)?._errors[0]}
          isRequired
        />
      </div>
    </div>
  );
};

export default HavenDetailsModal;
