"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { z } from "zod";

const basicInfoSchema = z.object({
  haven_name: z.string().min(1, "Haven Name is required"),
  tower: z.string().min(1, "Tower is required"),
  floor: z.string().min(1, "Floor is required"),
  view_type: z.string().min(1, "View Type is required"),
});

interface BasicInformationData {
  haven_name?: string;
  tower?: string;
  floor?: string;
  view_type?: string;
}

interface BasicInformationModalProps {
  onSave: (data: BasicInformationData) => void;
  initialData?: BasicInformationData;
  isAddMode?: boolean;
}

const BasicInformationModal = ({ 
  onSave, 
  initialData, 
  isAddMode = false,
}: BasicInformationModalProps) => {
  const [formData, setFormData] = useState<BasicInformationData>({
    haven_name: "",
    tower: "",
    floor: "",
    view_type: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
  }, [initialData]);

  const validation = basicInfoSchema.safeParse(formData);
  const errors = !validation.success 
    ? validation.error.format() 
    : null;

  const handleChange = (field: keyof BasicInformationData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    onSave(newData);
  };

  const getInputClasses = (field: keyof BasicInformationData) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field];
    const isFieldValid = isFieldTouched && !errors?.[field];

    let borderClass = "border-gray-300";
    if (isFieldInvalid) borderClass = "border-red-500 bg-red-50/10";
    if (isFieldValid) borderClass = "border-green-500 bg-green-50/10";

    return {
      label: "text-sm font-medium text-gray-700 mb-2",
      inputWrapper: `bg-white border ${borderClass} hover:border-brand-primary/60 focus-within:!border-brand-primary focus-within:!ring-1 focus-within:!ring-brand-primary/20 shadow-sm transition-all duration-200 rounded-lg h-12`,
      input: "text-gray-800 placeholder:text-gray-400"
    };
  };

  const getSelectClasses = (field: keyof BasicInformationData) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field];
    const isFieldValid = isFieldTouched && !errors?.[field];

    let borderClass = "border-gray-300";
    if (isFieldInvalid) borderClass = "border-red-500 bg-red-50/10";
    if (isFieldValid) borderClass = "border-green-500 bg-green-50/10";

    return {
      label: "text-sm font-medium text-gray-700 mb-2",
      trigger: `bg-white border ${borderClass} hover:border-brand-primary/60 focus-within:!border-brand-primary focus-within:!ring-1 focus-within:!ring-brand-primary/20 shadow-sm transition-all duration-200 rounded-lg h-12`,
      value: "text-gray-800"
    };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-6">
        <Input
          label="Haven Name"
          labelPlacement="outside"
          placeholder="e.g., Haven 1"
          value={formData.haven_name}
          onChange={(e) => handleChange('haven_name', e.target.value)}
          classNames={getInputClasses('haven_name')}
          isInvalid={touched.haven_name && !!errors?.haven_name}
          errorMessage={touched.haven_name && errors?.haven_name?._errors[0]}
          isRequired
        />
        <Select
          label="Tower"
          labelPlacement="outside"
          placeholder="Select Tower"
          selectedKeys={formData.tower ? [formData.tower] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleChange('tower', value);
          }}
          classNames={getSelectClasses('tower')}
          isInvalid={touched.tower && !!errors?.tower}
          errorMessage={touched.tower && errors?.tower?._errors[0]}
          isRequired
        >
          {towers.map((tower) => (
            <SelectItem key={tower.value} textValue={tower.label}>{tower.label}</SelectItem>
          ))}
        </Select>
        <Input
          label="Floor"
          labelPlacement="outside"
          placeholder="e.g., 1"
          value={formData.floor}
          onChange={(e) => handleChange('floor', e.target.value)}
          classNames={getInputClasses('floor')}
          isInvalid={touched.floor && !!errors?.floor}
          errorMessage={touched.floor && errors?.floor?._errors[0]}
          isRequired
        />
        <Select
          label="View Type"
          labelPlacement="outside"
          placeholder="Select View"
          selectedKeys={formData.view_type ? [formData.view_type] : []}
          onSelectionChange={(keys) => {
            const value = Array.from(keys)[0] as string;
            handleChange('view_type', value);
          }}
          classNames={getSelectClasses('view_type')}
          isInvalid={touched.view_type && !!errors?.view_type}
          errorMessage={touched.view_type && errors?.view_type?._errors[0]}
          isRequired
        >
          {views.map((view) => (
            <SelectItem key={view.value} textValue={view.label}>{view.label}</SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default BasicInformationModal;
