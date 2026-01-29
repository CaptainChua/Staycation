"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ChevronUp, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminTimePickerProps {
  label: string;
  value: string; // HH:mm format
  onChange: (time: string) => void;
  helperText?: string;
}

const AdminTimePicker = ({
  label,
  value,
  onChange,
  helperText
}: AdminTimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parse initial value
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const displayHour = h % 12 || 12;
      setHour(displayHour);
      setMinute(m);
      setIsPM(h >= 12);
    }
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const formatDisplayTime = () => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
  };

  const handleTimeChange = (newHour: number, newMinute: number, newIsPM: boolean) => {
    setHour(newHour);
    setMinute(newMinute);
    setIsPM(newIsPM);
    
    // Convert to 24h for the parent
    let h24 = newHour % 12;
    if (newIsPM) h24 += 12;
    const timeStr = `${String(h24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    onChange(timeStr);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute intervals

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-gray-700 ml-1 uppercase tracking-wider">
          {label}
        </label>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full h-14 flex items-center gap-3 px-4 bg-white border-2 rounded-2xl transition-all duration-300 text-left
            ${isOpen 
              ? "border-brand-primary ring-4 ring-brand-primary/10" 
              : "border-gray-200 hover:border-brand-primary/40 shadow-sm"}
          `}
        >
          <Clock className={`w-5 h-5 ${isOpen ? "text-brand-primary" : "text-gray-400"}`} />
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900">
              {formatDisplayTime()}
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        
        {helperText && (
          <p className="text-[10px] text-gray-400 ml-1 font-medium italic">
            {helperText}
          </p>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 p-4 w-64 origin-top"
          >
            <div className="flex flex-col gap-4">
              {/* Selection Area */}
              <div className="flex justify-between gap-2">
                {/* Hours */}
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Hour</p>
                  <div className="h-40 overflow-y-auto scrollbar-hide flex flex-col gap-1 pr-1">
                    {hours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleTimeChange(h, minute, isPM)}
                        className={`
                          py-2 rounded-lg text-sm font-bold transition-all
                          ${hour === h 
                            ? 'bg-brand-primary text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-50'}
                        `}
                      >
                        {String(h).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes */}
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">Min</p>
                  <div className="h-40 overflow-y-auto scrollbar-hide flex flex-col gap-1 pr-1">
                    {minutes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleTimeChange(hour, m, isPM)}
                        className={`
                          py-2 rounded-lg text-sm font-bold transition-all
                          ${minute === m 
                            ? 'bg-brand-primary text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-50'}
                        `}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AM/PM */}
                <div className="flex flex-col gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => handleTimeChange(hour, minute, false)}
                    className={`
                      px-3 py-3 rounded-xl text-xs font-black transition-all
                      ${!isPM 
                        ? 'bg-orange-500 text-white shadow-lg scale-105' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                    `}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeChange(hour, minute, true)}
                    className={`
                      px-3 py-3 rounded-xl text-xs font-black transition-all
                      ${isPM 
                        ? 'bg-orange-600 text-white shadow-lg scale-105' 
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                    `}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default AdminTimePicker;
