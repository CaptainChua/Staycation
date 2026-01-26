"use client";

import { useState, useEffect } from "react";
import { Calendar, Trash2 } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

interface BlockedDate {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
}

interface BlockedDateData {
  from_date: string;
  to_date: string;
  reason?: string;
}

interface AvailabilityManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dates: BlockedDate[]) => void;
  initialData?: BlockedDateData[];
}

const AvailabilityManagementModal = ({ isOpen, onClose, onSave, initialData }: AvailabilityManagementModalProps) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockDateForm, setBlockDateForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  useEffect(() => {
    if (initialData) {
      setBlockedDates(
        initialData.map((date, index) => ({
          id: index,
          fromDate: date.from_date,
          toDate: date.to_date,
          reason: date.reason || "",
        }))
      );
    }
  }, [initialData, isOpen]);

  const handleAddBlockedDate = () => {
    if (blockDateForm.fromDate && blockDateForm.toDate) {
      if (new Date(blockDateForm.fromDate) > new Date(blockDateForm.toDate)) {
        toast.error("From date must be before or equal to To date");
        return;
      }
      setBlockedDates([
        ...blockedDates,
        {
          id: Date.now(),
          ...blockDateForm,
        },
      ]);
      setBlockDateForm({ fromDate: "", toDate: "", reason: "" });
      toast.success("Blocked date added");
    } else {
      toast.error("Please select both from and to dates");
    }
  };

  const handleRemoveBlockedDate = (id: number) => {
    setBlockedDates(blockedDates.filter((date) => date.id !== id));
    toast.success("Blocked date removed");
  };

  const handleSave = () => {
    onSave(blockedDates);
    toast.success("Availability management updated successfully!");
    handleClose();
  };

  const handleClose = () => {
    setBlockDateForm({ fromDate: "", toDate: "", reason: "" });
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
      title="Availability Management"
      subtitle="Manage blocked dates and availability"
      onSave={handleSave}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
            Blocked Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              type="date"
              label="From Date"
              labelPlacement="outside"
              value={blockDateForm.fromDate}
              onChange={(e) => setBlockDateForm({ ...blockDateForm, fromDate: e.target.value })}
              classNames={inputClassNames}
            />
            <Input
              type="date"
              label="To Date"
              labelPlacement="outside"
              value={blockDateForm.toDate}
              onChange={(e) => setBlockDateForm({ ...blockDateForm, toDate: e.target.value })}
              classNames={inputClassNames}
            />
            <Input
              label="Reason"
              labelPlacement="outside"
              placeholder="e.g., Maintenance"
              value={blockDateForm.reason}
              onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
              classNames={inputClassNames}
            />
          </div>
          <button
            type="button"
            onClick={handleAddBlockedDate}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg mb-4 font-medium transition-colors shadow-sm"
          >
            Add Blocked Date
          </button>
          {blockedDates.length > 0 && (
            <div className="space-y-2">
              {blockedDates.map((date) => (
                <div key={date.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg hover:border-brand-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full border border-gray-200">
                      <Calendar className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {date.fromDate} to {date.toDate}
                      </p>
                      {date.reason && <p className="text-xs text-gray-500">{date.reason}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedDate(date.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SubModalWrapper>
  );
};

export default AvailabilityManagementModal;