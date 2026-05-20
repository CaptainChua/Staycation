"use client";

import { useEffect, useRef, useState } from "react";
import AdminTimePicker from "./AdminTimePicker";
import { Info } from "lucide-react";
import type { RateEntry } from "./PricingManagementModal";

// Add N hours to a "HH:MM" string, wrapping past midnight
const addHoursToTime = (timeStr: string, hours: number): string => {
  const [h, m] = timeStr.split(":").map(Number);
  const totalMinutes = (h * 60 + m + Math.round(hours * 60)) % (24 * 60);
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
};

// Sensible defaults derived from the rate's hours.
// Short daytime stays start at 09:00; longer/overnight stays start at 14:00.
// Check-out is always exactly check_in + hours (wraps past midnight).
const defaultsForHours = (hours: number): { check_in: string; check_out: string } => {
  const safeHours = Math.max(1, Math.min(24, Number(hours) || 1));
  const check_in = safeHours > 12 ? "14:00" : "09:00";
  return { check_in, check_out: addHoursToTime(check_in, safeHours) };
};

interface CheckInTimeSettingsModalProps {
  onSave: (data: { rates: RateEntry[] }) => void;
  initialData?: { rates?: RateEntry[] };
  isAddMode?: boolean;
}

const CheckInTimeSettingsModal = ({ onSave, initialData }: CheckInTimeSettingsModalProps) => {
  const [rates, setRates] = useState<RateEntry[]>([]);

  // Load once on mount; subsequent prop changes from parent are ignored to avoid loops.
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    const incoming = Array.isArray(initialData?.rates) ? (initialData!.rates as RateEntry[]) : [];
    const withDefaults = incoming.map((r) => {
      const d = defaultsForHours(Number(r.hours) || 0);
      return {
        ...r,
        check_in: r.check_in || d.check_in,
        check_out: r.check_out || d.check_out,
      };
    });
    setRates(withDefaults);
    didInitRef.current = true;
    // Push back so the parent state matches (in case defaults were applied)
    if (withDefaults.length > 0) onSave({ rates: withDefaults });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Keep local rates in sync with parent when the partner adds/removes rates in the Pricing step.
  // We compare label+hours sets to detect a structural change (not just a reference change).
  useEffect(() => {
    if (!didInitRef.current) return;
    const incoming = Array.isArray(initialData?.rates) ? (initialData!.rates as RateEntry[]) : [];
    const sig = (arr: RateEntry[]) =>
      arr.map((r) => `${r.label}__${r.hours}__${r.price}`).join("||");
    if (sig(incoming) === sig(rates)) return;
    // Merge: keep existing check_in/check_out where label+hours match; defaults for new ones
    const merged = incoming.map((r) => {
      const existing = rates.find((x) => x.label === r.label && x.hours === r.hours);
      if (existing) {
        return { ...r, check_in: existing.check_in, check_out: existing.check_out };
      }
      const d = defaultsForHours(Number(r.hours) || 0);
      return { ...r, check_in: r.check_in || d.check_in, check_out: r.check_out || d.check_out };
    });
    setRates(merged);
    onSave({ rates: merged });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.rates]);

  const updateRateTime = (idx: number, field: "check_in" | "check_out", value: string) => {
    const next = rates.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    setRates(next);
    onSave({ rates: next });
  };

  if (rates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
        <div className="flex items-start gap-3 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Add a rate first
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Go back to the <strong>Pricing</strong> step and add at least one rate. Each rate
              you add will appear here so you can set its check-in and check-out times.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
      <div className="space-y-10">
        {rates.map((rate, idx) => (
          <div key={`${rate.label}-${rate.hours}-${idx}`} className="space-y-4">
            <div className="border-b border-brand-primary/20 pb-3">
              <h3 className="text-lg font-bold text-brand-primary">
                {rate.label} — Check-in Configuration
              </h3>
              <div className="mt-2 flex items-start gap-2">
                <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex-shrink-0">
                  ?
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Set the check-in and check-out times for the{" "}
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    {rate.label}
                  </span>{" "}
                  rate ({rate.hours}h stay).{" "}
                  {rate.hours >= 20
                    ? "The check-out time falls on the next day for overnight stays."
                    : "Both times happen on the same day for daytime stays."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AdminTimePicker
                label="Check-in Time"
                value={rate.check_in || defaultsForHours(rate.hours).check_in}
                onChange={(val) => updateRateTime(idx, "check_in", val)}
                helperText={`The earliest time a guest can enter the haven for the ${rate.label} stay.`}
              />
              <AdminTimePicker
                label="Check-out Time"
                value={rate.check_out || defaultsForHours(rate.hours).check_out}
                onChange={(val) => updateRateTime(idx, "check_out", val)}
                helperText={
                  rate.hours >= 20
                    ? `The time guests must leave the next morning after their ${rate.label} stay.`
                    : `The time the guest must leave after their ${rate.label} stay.`
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckInTimeSettingsModal;
