"use client";

import { useState, useEffect } from "react";
import AdminTimePicker from "./AdminTimePicker";

interface CheckInTimeData {
  six_hour_check_in?: string;
  six_hour_check_out?: string;
  ten_hour_check_in?: string;
  ten_hour_check_out?: string;
  twenty_one_hour_check_in?: string;
  twenty_one_hour_check_out?: string;
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
    six_hour_check_out: "15:00",
    ten_hour_check_in: "09:00",
    ten_hour_check_out: "19:00",
    twenty_one_hour_check_in: "14:00",
    twenty_one_hour_check_out: "11:00",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        six_hour_check_in: initialData.six_hour_check_in || "09:00",
        six_hour_check_out: initialData.six_hour_check_out || "15:00",
        ten_hour_check_in: initialData.ten_hour_check_in || "09:00",
        ten_hour_check_out: initialData.ten_hour_check_out || "19:00",
        twenty_one_hour_check_in: initialData.twenty_one_hour_check_in || "14:00",
        twenty_one_hour_check_out: initialData.twenty_one_hour_check_out || "11:00",
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof CheckInTimeData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onSave(newData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-12">
        {/* 6-Hour Stay */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-primary/20 pb-2">6-Hour Stay Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminTimePicker
              label="Check-in Time"
              value={formData.six_hour_check_in || "09:00"}
              onChange={(val) => handleChange('six_hour_check_in', val)}
              helperText="Standard check-in time for 6-hour stays."
            />
            <AdminTimePicker
              label="Check-out Time"
              value={formData.six_hour_check_out || "15:00"}
              onChange={(val) => handleChange('six_hour_check_out', val)}
              helperText="Standard check-out time for 6-hour stays."
            />
          </div>
        </div>

        {/* 10-Hour Stay */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-primary/20 pb-2">10-Hour Stay Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminTimePicker
              label="Check-in Time"
              value={formData.ten_hour_check_in || "09:00"}
              onChange={(val) => handleChange('ten_hour_check_in', val)}
              helperText="Standard check-in time for 10-hour stays."
            />
            <AdminTimePicker
              label="Check-out Time"
              value={formData.ten_hour_check_out || "19:00"}
              onChange={(val) => handleChange('ten_hour_check_out', val)}
              helperText="Standard check-out time for 10-hour stays."
            />
          </div>
        </div>

        {/* 21-Hour Stay */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-brand-primary border-b border-brand-primary/20 pb-2">21-Hour Stay Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminTimePicker
              label="Check-in Time"
              value={formData.twenty_one_hour_check_in || "14:00"}
              onChange={(val) => handleChange('twenty_one_hour_check_in', val)}
              helperText="Standard check-in time for 21-hour (overnight) stays."
            />
            <AdminTimePicker
              label="Check-out Time"
              value={formData.twenty_one_hour_check_out || "11:00"}
              onChange={(val) => handleChange('twenty_one_hour_check_out', val)}
              helperText="Standard check-out time for 21-hour stays (usually next day)."
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export default CheckInTimeSettingsModal;
