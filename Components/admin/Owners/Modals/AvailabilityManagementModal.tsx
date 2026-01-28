"use client";

import { useState, useEffect } from "react";
import { Calendar, Trash2 } from "lucide-react";
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
  onSave: (dates: BlockedDate[]) => void;
  initialData?: BlockedDateData[];
  isAddMode?: boolean;
}

const AvailabilityManagementModal = ({
  onSave,
  initialData,
  isAddMode = false,
}: AvailabilityManagementModalProps) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockDateForm, setBlockDateForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  useEffect(() => {
    if (initialData) {
      const mappedDates = initialData.map((date, index) => ({
        id: index, // Temporary ID, could be more robust
        fromDate: date.from_date,
        toDate: date.to_date,
        reason: date.reason || "",
      }));
      
      // Only update if the stringified content actually differs to avoid infinite loops
      // if the parent accidentally passes a new reference of the same data.
      if (JSON.stringify(mappedDates) !== JSON.stringify(blockedDates)) {
        setBlockedDates(mappedDates);
      }
    }
  }, [initialData, blockedDates]);

  const handleAddBlockedDate = () => {
    if (blockDateForm.fromDate && blockDateForm.toDate) {
      if (new Date(blockDateForm.fromDate) > new Date(blockDateForm.toDate)) {
        toast.error("From date must be before or equal to To date");
        return;
      }
      const newBlockedDates = [
        ...blockedDates,
        {
          id: Date.now(),
          ...blockDateForm,
        },
      ];
      setBlockedDates(newBlockedDates);
      setBlockDateForm({ fromDate: "", toDate: "", reason: "" });
      toast.success("Blocked date added");
      onSave(newBlockedDates); // Update parent state immediately
    } else {
      toast.error("Please select both from and to dates");
    }
  };

  const handleRemoveBlockedDate = (id: number) => {
    const newBlockedDates = blockedDates.filter((date) => date.id !== id);
    setBlockedDates(newBlockedDates);
    toast.success("Blocked date removed");
    onSave(newBlockedDates); // Update parent state immediately
  };

  const getInputClasses = (field: string) => {
    return {
      label: "text-sm font-medium text-gray-700 mb-2",
      inputWrapper: `bg-white border border-gray-300 hover:border-brand-primary/60 focus-within:!border-brand-primary focus-within:!ring-1 focus-within:!ring-brand-primary/20 shadow-sm transition-all duration-200 rounded-lg h-12 ${isAddMode ? 'hover:!bg-white data-[hover=true]:!bg-white' : ''}`,
      input: "text-gray-800 placeholder:text-gray-400"
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-primary" /> Blocked Dates
        </h3>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
          <p className="text-sm text-gray-500 mb-6 font-medium">Add dates when this haven is not available for booking.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Input
              type="date"
              label="From Date"
              labelPlacement="outside"
              value={blockDateForm.fromDate}
              onChange={(e) => setBlockDateForm({ ...blockDateForm, fromDate: e.target.value })}
              classNames={getInputClasses('fromDate')}
            />
            <Input
              type="date"
              label="To Date"
              labelPlacement="outside"
              value={blockDateForm.toDate}
              onChange={(e) => setBlockDateForm({ ...blockDateForm, toDate: e.target.value })}
              classNames={getInputClasses('toDate')}
            />
            <Input
              label="Reason"
              labelPlacement="outside"
              placeholder="e.g., Maintenance"
              value={blockDateForm.reason}
              onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
              classNames={getInputClasses('reason')}
            />
          </div>
          <button
            type="button"
            onClick={handleAddBlockedDate}
            className="w-full md:w-auto px-8 py-3 bg-brand-primary hover:bg-[#b57603] text-white rounded-lg font-bold transition-all shadow-md active:scale-95"
          >
            Add Blocked Date
          </button>
        </div>

        {blockedDates.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Currently Blocked ({blockedDates.length})</p>
            {blockedDates.map((date) => (
              <div key={date.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-brand-primary/30 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md group will-change-transform">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-primary/5 rounded-full text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{date.fromDate}</p>
                      <span className="text-gray-300">→</span>
                      <p className="text-sm font-bold text-gray-800">{date.toDate}</p>
                    </div>
                    {date.reason && <p className="text-xs text-gray-500 mt-1 font-medium">{date.reason}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBlockedDate(date.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 font-medium italic">No blocked dates scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManagementModal;