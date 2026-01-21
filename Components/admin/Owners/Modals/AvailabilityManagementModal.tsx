"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Trash2 } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(blockedDates);
    toast.success("Availability management updated successfully!");
    onClose();
  };

  const handleClose = () => {
    setBlockDateForm({ fromDate: "", toDate: "", reason: "" });
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Availability Management</h2>
              <p className="text-sm text-gray-600 mt-1">Manage blocked dates and availability</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
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
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="date"
                    label="To Date"
                    labelPlacement="outside"
                    value={blockDateForm.toDate}
                    onChange={(e) => setBlockDateForm({ ...blockDateForm, toDate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    label="Reason"
                    labelPlacement="outside"
                    placeholder="e.g., Maintenance"
                    value={blockDateForm.reason}
                    onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBlockedDate}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg mb-4"
                >
                  Add Blocked Date
                </button>
                {blockedDates.length > 0 && (
                  <div className="space-y-2">
                    {blockedDates.map((date) => (
                      <div key={date.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {date.fromDate} to {date.toDate}
                            </p>
                            {date.reason && <p className="text-xs text-gray-500">{date.reason}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(date.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default AvailabilityManagementModal;
