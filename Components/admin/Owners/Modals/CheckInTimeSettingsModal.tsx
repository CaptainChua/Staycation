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
        <div className="space-y-4">
          <div className="border-b border-brand-primary/20 pb-3">
            <h3 className="text-lg font-bold text-brand-primary">6-Hour Stay Configuration</h3>
            <div className="mt-2 flex items-start gap-2">
              <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex-shrink-0">?</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-600 dark:text-gray-300">What is this?</span> A short daytime visit — guests arrive in the morning and leave before afternoon. Great for a quick rest, a swim, or a brief getaway without staying the night. Set what time guests can start arriving and what time they must leave.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminTimePicker
              label="Check-in Time"
              value={formData.six_hour_check_in || "09:00"}
              onChange={(val) => handleChange('six_hour_check_in', val)}
              helperText="The earliest time a guest can enter the haven for a 6-hour stay."
            />
            <AdminTimePicker
              label="Check-out Time"
              value={formData.six_hour_check_out || "15:00"}
              onChange={(val) => handleChange('six_hour_check_out', val)}
              helperText="The time by which the guest must leave after their 6-hour stay."
            />
          </div>
        </div>

        {/* 10-Hour Stay */}
        <div className="space-y-4">
          <div className="border-b border-brand-primary/20 pb-3">
            <h3 className="text-lg font-bold text-brand-primary">10-Hour Stay Configuration</h3>
            <div className="mt-2 flex items-start gap-2">
              <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex-shrink-0">?</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-600 dark:text-gray-300">What is this?</span> A half-day experience — guests have most of the day to enjoy the haven, from morning all the way to early evening. Perfect for families or groups who want more time to relax, swim, and settle in without rushing.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminTimePicker
              label="Check-in Time"
              value={formData.ten_hour_check_in || "09:00"}
              onChange={(val) => handleChange('ten_hour_check_in', val)}
              helperText="The earliest time a guest can enter the haven for a 10-hour stay."
            />
            <AdminTimePicker
              label="Check-out Time"
              value={formData.ten_hour_check_out || "19:00"}
              onChange={(val) => handleChange('ten_hour_check_out', val)}
              helperText="The time by which the guest must leave after their 10-hour stay."
            />
          </div>
        </div>

        {/* 21-Hour Stay */}
        <div className="space-y-4">
          <div className="border-b border-brand-primary/20 pb-3">
            <h3 className="text-lg font-bold text-brand-primary">21-Hour Stay Configuration</h3>
            <div className="mt-2 flex items-start gap-2">
              <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex-shrink-0">?</span>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-600 dark:text-gray-300">What is this?</span> An overnight stay — guests check in during the afternoon, spend the night, and check out the next morning. This is the closest to a full overnight experience. The check-out time is the following day, so make sure to set times accordingly.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AdminTimePicker
              label="Check-in Time"
              value={formData.twenty_one_hour_check_in || "14:00"}
              onChange={(val) => handleChange('twenty_one_hour_check_in', val)}
              helperText="The earliest time a guest can enter the haven for an overnight stay."
            />
            <AdminTimePicker
              label="Check-out Time"
              value={formData.twenty_one_hour_check_out || "11:00"}
              onChange={(val) => handleChange('twenty_one_hour_check_out', val)}
              helperText="The time guests must leave the next morning after their overnight stay."
            />
          </div>
        </div>
      </div>
    </div>
  );
};


export default CheckInTimeSettingsModal;
