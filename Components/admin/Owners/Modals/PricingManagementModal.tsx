"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { z } from "zod";

const pricingSchema = z.object({
  six_hour_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "6-hour rate must be a positive number"),
  ten_hour_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "10-hour rate must be a positive number"),
  weekday_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weekday rate must be a positive number"),
  weekend_rate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weekend rate must be a positive number"),
});

interface PricingData {
  six_hour_rate?: number | string;
  ten_hour_rate?: number | string;
  weekday_rate?: number | string;
  weekend_rate?: number | string;
}

interface PricingManagementModalProps {
  onSave: (data: PricingData) => void;
  initialData?: PricingData;
  isAddMode?: boolean;
}

const PricingManagementModal = ({ 
  onSave, 
  initialData, 
  isAddMode = false,
}: PricingManagementModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    six_hour_rate: "",
    ten_hour_rate: "",
    weekday_rate: "",
    weekend_rate: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        six_hour_rate: initialData.six_hour_rate?.toString() || "",
        ten_hour_rate: initialData.ten_hour_rate?.toString() || "",
        weekday_rate: initialData.weekday_rate?.toString() || "",
        weekend_rate: initialData.weekend_rate?.toString() || "",
      });
    }
  }, [initialData]);

  const validation = pricingSchema.safeParse(formData);
  const errors = !validation.success ? validation.error.format() : null;

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Pass back to parent for its validation
    onSave({
      six_hour_rate: newData.six_hour_rate,
      ten_hour_rate: newData.ten_hour_rate,
      weekday_rate: newData.weekday_rate,
      weekend_rate: newData.weekend_rate,
    });
  };

  const getInputClasses = (field: string) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field as keyof typeof errors];
    const isFieldValid = isFieldTouched && !errors?.[field as keyof typeof errors];

    let borderClass = "border-gray-200 dark:border-gray-700";
    if (isFieldInvalid) borderClass = "border-red-500 bg-red-50/10 dark:bg-red-900/10";
    if (isFieldValid) borderClass = "border-green-500 bg-green-50/10 dark:bg-green-900/10";

    return {
      label: "text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-wider",
      inputWrapper: [
        "bg-white dark:bg-gray-700",
        `border-2 ${borderClass}`,
        "hover:border-brand-primary/40",
        "focus-within:!border-brand-primary",
        "focus-within:ring-4",
        "focus-within:ring-brand-primary/10",
        "shadow-sm",
        "transition-all",
        "duration-300",
        "rounded-2xl",
        "h-14",
        "px-4"
      ].join(" "),
      input: "text-base font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
      errorMessage: "text-xs font-bold text-red-500 dark:text-red-400 mt-1.5 ml-1 animate-in slide-in-from-top-1"
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-8">
        {/* Weekday Rates */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
            Rates Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              type="number"
              label="6-Hour Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.six_hour_rate}
              onChange={(e) => handleChange('six_hour_rate', e.target.value)}
              classNames={getInputClasses('six_hour_rate')}
              isInvalid={touched.six_hour_rate && !!errors?.six_hour_rate}
              errorMessage={touched.six_hour_rate && (errors as any)?.six_hour_rate?._errors[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
            <Input
              type="number"
              label="10-Hour Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.ten_hour_rate}
              onChange={(e) => handleChange('ten_hour_rate', e.target.value)}
              classNames={getInputClasses('ten_hour_rate')}
              isInvalid={touched.ten_hour_rate && !!errors?.ten_hour_rate}
              errorMessage={touched.ten_hour_rate && (errors as any)?.ten_hour_rate?._errors[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
            <Input
              type="number"
              label="Weekday (21-Hour) Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.weekday_rate}
              onChange={(e) => handleChange('weekday_rate', e.target.value)}
              classNames={getInputClasses('weekday_rate')}
              isInvalid={touched.weekday_rate && !!errors?.weekday_rate}
              errorMessage={touched.weekday_rate && (errors as any)?.weekday_rate?._errors[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
            <Input
              type="number"
              label="Weekend (21-Hour) Rate"
              labelPlacement="outside"
              placeholder="0.00"
              value={formData.weekend_rate}
              onChange={(e) => handleChange('weekend_rate', e.target.value)}
              classNames={getInputClasses('weekend_rate')}
              isInvalid={touched.weekend_rate && !!errors?.weekend_rate}
              errorMessage={touched.weekend_rate && (errors as any)?.weekend_rate?._errors[0]}
              startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
              isRequired
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingManagementModal;
