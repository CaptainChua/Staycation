"use client";

import { useState, useEffect } from "react";
import AdminTimePicker from "./AdminTimePicker";

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
    onSave(newData);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-8">
        <AdminTimePicker
          label="6-Hour Check-in Time"
          value={formData.six_hour_check_in || "09:00"}
          onChange={(val) => handleChange('six_hour_check_in', val)}
          helperText="Standard check-in time for 6-hour stays."
        />
        <AdminTimePicker
          label="10-Hour Check-in Time"
          value={formData.ten_hour_check_in || "09:00"}
          onChange={(val) => handleChange('ten_hour_check_in', val)}
          helperText="Standard check-in time for 10-hour stays."
        />
        <AdminTimePicker
          label="21-Hour Check-in Time"
          value={formData.twenty_one_hour_check_in || "14:00"}
          onChange={(val) => handleChange('twenty_one_hour_check_in', val)}
          helperText="Standard check-in time for 21-hour (overnight) stays."
        />
      </div>
    </div>
  );
};


export default CheckInTimeSettingsModal;
