"use client";

import { useState, useEffect } from "react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

interface CheckInTimeData {
  six_hour_check_in?: string;
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
}

interface CheckInTimeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CheckInTimeData) => void;
  initialData?: CheckInTimeData;
}

const CheckInTimeSettingsModal = ({ isOpen, onClose, onSave, initialData }: CheckInTimeSettingsModalProps) => {
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
  }, [initialData, isOpen]);

  const handleSave = () => {
    onSave(formData);
    toast.success("Check-in time settings saved successfully!");
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      six_hour_check_in: "09:00",
      ten_hour_check_in: "09:00",
      twenty_one_hour_check_in: "14:00",
    });
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
      title="Check-in Time Settings"
      subtitle="Set default check-in times for each booking duration"
      onSave={handleSave}
    >
      <div className="space-y-4">
        <Input
          type="time"
          label="6-Hour Check-in Time"
          labelPlacement="outside"
          value={formData.six_hour_check_in}
          onChange={(e) => setFormData({ ...formData, six_hour_check_in: e.target.value })}
          classNames={inputClassNames}
        />
        <Input
          type="time"
          label="10-Hour Check-in Time"
          labelPlacement="outside"
          value={formData.ten_hour_check_in}
          onChange={(e) => setFormData({ ...formData, ten_hour_check_in: e.target.value })}
          classNames={inputClassNames}
        />
        <Input
          type="time"
          label="21-Hour Check-in Time"
          labelPlacement="outside"
          value={formData.twenty_one_hour_check_in}
          onChange={(e) => setFormData({ ...formData, twenty_one_hour_check_in: e.target.value })}
          classNames={inputClassNames}
        />
      </div>
    </SubModalWrapper>
  );
};

export default CheckInTimeSettingsModal;