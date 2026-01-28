"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";

interface CheckInTimeData {
  six_hour_check_in?: string;
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
}

interface CheckInTimeSettingsModalProps {
  onSave: (data: CheckInTimeData) => void;
  initialData?: CheckInTimeData;
  isAddMode?: boolean;
}

const CheckInTimeSettingsModal = ({ 
  onSave, 
  initialData, 
  isAddMode = false,
}: CheckInTimeSettingsModalProps) => {
  const [formData, setFormData] = useState<CheckInTimeData>({
    six_hour_check_in: "09:00",
    ten_hour_check_in: "09:00",
    twenty_one_hour_check_in: "14:00",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        six_hour_check_in: initialData.six_hour_check_in || "09:00",
        ten_hour_check_in: initialData.ten_hour_check_in || "09:00",
        twenty_one_hour_check_in: initialData.twenty_one_hour_check_in || "14:00",
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof CheckInTimeData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    onSave(newData);
  };

  const getInputClasses = (field: keyof CheckInTimeData) => {
    const isFieldTouched = touched[field];
    // For time inputs, we assume they are valid if set
    const isFieldValid = isFieldTouched && formData[field];

    let borderClass = "border-gray-300";
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
        <Input
          type="time"
          label="6-Hour Check-in Time"
          labelPlacement="outside"
          value={formData.six_hour_check_in}
          onChange={(e) => handleChange('six_hour_check_in', e.target.value)}
          classNames={getInputClasses('six_hour_check_in')}
        />
        <Input
          type="time"
          label="10-Hour Check-in Time"
          labelPlacement="outside"
          value={formData.ten_hour_check_in}
          onChange={(e) => handleChange('ten_hour_check_in', e.target.value)}
          classNames={getInputClasses('ten_hour_check_in')}
        />
        <Input
          type="time"
          label="21-Hour Check-in Time"
          labelPlacement="outside"
          value={formData.twenty_one_hour_check_in}
          onChange={(e) => handleChange('twenty_one_hour_check_in', e.target.value)}
          classNames={getInputClasses('twenty_one_hour_check_in')}
        />
      </div>
    </div>
  );
};

export default CheckInTimeSettingsModal;
