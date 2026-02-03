"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Trash2, Info } from "lucide-react";
import { Input } from "@nextui-org/input";
import toast from 'react-hot-toast';
import AdminDateRangePicker from "./AdminDateRangePicker";

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
      label: "text-sm font-bold text-gray-700 mb-2 ml-1 uppercase tracking-wider",
      inputWrapper: [
        "bg-white",
        "border-2",
        "border-gray-200",
        "hover:border-brand-primary/40",
        "focus-within:!border-brand-primary",
        "focus-within:ring-4",
        "focus-within:ring-brand-primary/10",
        "shadow-sm",
        "transition-all",
        "duration-300",
        "rounded-2xl",
        "h-14",
        "px-4",
        isAddMode ? 'hover:!bg-white data-[hover=true]:!bg-white' : ''
      ].join(" "),
      input: "text-base font-semibold text-gray-900 placeholder:text-gray-400"
    };
  };

  // Memoize blocked dates for the picker to avoid unnecessary re-renders
  const existingBlockedDates = useMemo(() => 
    blockedDates.map(d => ({ fromDate: d.fromDate, toDate: d.toDate })),
  [blockedDates]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-primary" /> Availability Management
        </h3>
        
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-8 transition-all duration-300 hover:shadow-md">
          <div className="flex items-start gap-4 mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed font-medium">
              Select a date range and provide a reason to block this haven from being booked. 
              The calendar view will show existing blocked dates to help you avoid overlaps.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <AdminDateRangePicker 
                fromDate={blockDateForm.fromDate}
                toDate={blockDateForm.toDate}
                onFromDateChange={(date) => setBlockDateForm(prev => ({ ...prev, fromDate: date }))}
                onToDateChange={(date) => setBlockDateForm(prev => ({ ...prev, toDate: date }))}
                blockedDates={existingBlockedDates}
              />
            </div>
            <div className="space-y-2">
              <Input
                label="Reason for Blocking"
                labelPlacement="outside"
                placeholder="e.g., General Maintenance, Owner Stay"
                value={blockDateForm.reason}
                onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                classNames={getInputClasses('reason')}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBlockedDate}
            className={`
              w-full lg:w-auto px-10 py-3.5 bg-brand-primary hover:bg-[#b57603] text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2
              ${(!blockDateForm.fromDate || !blockDateForm.toDate) ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
            `}
            disabled={!blockDateForm.fromDate || !blockDateForm.toDate}
          >
            <Calendar className="w-5 h-5" />
            Add Blocked Range
          </button>
        </div>

        {blockedDates.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Currently Blocked ({blockedDates.length})
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {blockedDates.map((date) => (
                <div key={date.id} className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-brand-primary/30 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-brand-primary/5 rounded-2xl text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-gray-800">{new Date(date.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <span className="text-gray-300">→</span>
                        <p className="text-base font-bold text-gray-800">{new Date(date.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      {date.reason && <p className="text-sm text-gray-500 mt-1 font-medium">{date.reason}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedDate(date.id)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove blocked range"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/30">
            <div className="relative inline-block mb-4">
              <Calendar className="w-16 h-16 text-gray-200" />
              <Info className="w-6 h-6 text-brand-primary/40 absolute -bottom-1 -right-1" />
            </div>
            <p className="text-gray-400 font-bold text-lg">No blocked dates scheduled</p>
            <p className="text-gray-400 text-sm mt-1">This haven is currently available for all future dates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityManagementModal;