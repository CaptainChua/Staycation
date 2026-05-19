"use client";

import { X, ChevronDown, Plus, Trash2, Settings2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CLEANING_HOURS = 2;

interface Haven {
  uuid_id: string;
  haven_name: string;
  tower: string;
  floor: string;
}

interface BookingType {
  id: string;
  name: string;
  duration: number;
  price: number;
  available_days: string[];
  first_check_in: string;
  last_check_in: string;
}

interface BookingModalSettingProps {
  isOpen: boolean;
  onClose: () => void;
  initialHavenId?: string;
}

const DEFAULT_TYPES: Omit<BookingType, "id">[] = [
  {
    name: "6-Hour Booking",
    duration: 6,
    price: 999,
    available_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
    first_check_in: "08:00",
    last_check_in: "19:00",
  },
  {
    name: "10-Hour Booking",
    duration: 10,
    price: 1599,
    available_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
    first_check_in: "08:00",
    last_check_in: "20:00",
  },
  {
    name: "21-Hour Booking",
    duration: 21,
    price: 1799,
    available_days: ["Sun", "Mon", "Tue", "Wed", "Thu"],
    first_check_in: "08:00",
    last_check_in: "08:00",
  },
  {
    name: "21-Hour (Fri & Sat)",
    duration: 21,
    price: 2099,
    available_days: ["Fri", "Sat"],
    first_check_in: "15:00",
    last_check_in: "15:00",
  },
  {
    name: "Overnight",
    duration: 24,
    price: 1699,
    available_days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    first_check_in: "14:00",
    last_check_in: "14:00",
  },
];

function to12Hour(time: string): string {
  if (!time) return "--:--";
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "--:--";
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${period}`;
}

function addHoursToTime(time: string, hours: number): { result: string; nextDay: boolean } {
  if (!time) return { result: "--:--", nextDay: false };
  const [h, m] = time.split(":").map(Number);
  const totalMins = h * 60 + m + hours * 60;
  const resultH = Math.floor(totalMins / 60) % 24;
  const resultM = totalMins % 60;
  return {
    result: `${String(resultH).padStart(2, "0")}:${String(resultM).padStart(2, "0")}`,
    nextDay: totalMins >= 24 * 60,
  };
}

const BookingModalSetting = ({ isOpen, onClose, initialHavenId }: BookingModalSettingProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [havens, setHavens] = useState<Haven[]>([]);
  const [selectedHavenId, setSelectedHavenId] = useState<string>(initialHavenId ?? "");

  const [types, setTypes] = useState<BookingType[]>(() =>
    DEFAULT_TYPES.map((t) => ({ ...t, id: uuidv4() }))
  );
  const [isLoadingHavens, setIsLoadingHavens] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    setIsLoadingHavens(true);
    fetch("/api/admin/haven")
      .then((r) => r.json())
      .then((res) => {
        let list: Haven[] = [];
        if (Array.isArray(res)) list = res;
        else if (Array.isArray(res?.data)) list = res.data;
        else if (Array.isArray(res?.havens)) list = res.havens;
        setHavens(list);
        if (!initialHavenId && list.length > 0) setSelectedHavenId(list[0].uuid_id);
      })
      .catch(() => toast.error("Failed to load havens"))
      .finally(() => setIsLoadingHavens(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedHavenId) return;
    setIsLoadingTimes(true);
    fetch(`/api/admin/haven/${selectedHavenId}/times`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          const bw = res.data.booking_windows ?? {};
          const saved: Omit<BookingType, "id">[] = bw.types ?? [];
          setTypes(
            (saved.length ? saved : DEFAULT_TYPES).map((t) => ({ ...t, id: uuidv4() }))
          );
        }
      })
      .catch(() => {
        setTypes(DEFAULT_TYPES.map((t) => ({ ...t, id: uuidv4() })));
      })
      .finally(() => setIsLoadingTimes(false));
  }, [selectedHavenId]);

  const updateType = useCallback(
    <K extends keyof BookingType>(id: string, field: K, value: BookingType[K]) =>
      setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))),
    []
  );

  const toggleDay = useCallback((id: string, day: string) => {
    setTypes((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const days = t.available_days.includes(day)
          ? t.available_days.filter((d) => d !== day)
          : [...t.available_days, day];
        return { ...t, available_days: days };
      })
    );
  }, []);

  const addType = () =>
    setTypes((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: "",
        duration: 6,
        price: 0,
        available_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        first_check_in: "08:00",
        last_check_in: "18:00",
      },
    ]);

  const removeType = (id: string) =>
    setTypes((prev) => prev.filter((t) => t.id !== id));

  const handleSave = async () => {
    if (!selectedHavenId) return;
    for (const t of types) {
      if (!t.name.trim()) {
        toast.error("Please fill in the name for all booking types");
        return;
      }
    }
    setIsSaving(true);
    try {
      const booking_windows = {
        types: types.map(({ id: _id, ...rest }) => rest),
      };
      const res = await fetch(`/api/admin/haven/${selectedHavenId}/times`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_windows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Booking times saved successfully");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Booking Settings</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configure booking types and time windows</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking settings"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

            {/* Haven selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Haven
              </label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  aria-label="Select haven"
                  value={selectedHavenId}
                  onChange={(e) => setSelectedHavenId(e.target.value)}
                  disabled={isLoadingHavens}
                  className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isLoadingHavens ? (
                    <option>Loading havens...</option>
                  ) : (
                    havens.map((h) => (
                      <option key={h.uuid_id} value={h.uuid_id}>
                        {h.haven_name} — Tower {h.tower}, Floor {h.floor}
                      </option>
                    ))
                  )}
                </select>
                {isLoadingHavens && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {isLoadingTimes ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {types.map((type) => {
                  const latestCheckout = addHoursToTime(
                    type.last_check_in,
                    type.duration + CLEANING_HOURS
                  );
                  const firstCheckout = addHoursToTime(type.first_check_in, type.duration);

                  return (
                    <div
                      key={type.id}
                      className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 space-y-3"
                    >
                      {/* Name + delete */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={type.name}
                          onChange={(e) => updateType(type.id, "name", e.target.value)}
                          placeholder="Booking type name…"
                          className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeType(type.id)}
                          disabled={types.length === 1}
                          title="Remove booking type"
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Duration + Price */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Duration:</span>
                          <input
                            type="number"
                            aria-label="Duration in hours"
                            min={1}
                            max={48}
                            value={type.duration}
                            onChange={(e) =>
                              updateType(type.id, "duration", Number(e.target.value))
                            }
                            className="w-10 bg-transparent text-gray-900 dark:text-gray-100 text-sm font-medium text-center focus:outline-none"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">hrs</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Price: ₱</span>
                          <input
                            type="number"
                            aria-label="Price in PHP"
                            min={0}
                            value={type.price}
                            onChange={(e) =>
                              updateType(type.id, "price", Number(e.target.value))
                            }
                            className="flex-1 min-w-0 bg-transparent text-gray-900 dark:text-gray-100 text-sm font-medium focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Available Days */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Available Days</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {DAYS.map((day) => {
                            const active = type.available_days.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(type.id, day)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                  active
                                    ? "bg-brand-primary text-white shadow-sm"
                                    : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-brand-primary/60 hover:text-brand-primary"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                            First Check-in Time{" "}
                            <span className="text-red-500">*</span>
                          </p>
                          <input
                            type="time"
                            aria-label="First check-in time"
                            value={type.first_check_in}
                            onChange={(e) =>
                              updateType(type.id, "first_check_in", e.target.value)
                            }
                            className="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base font-bold focus:outline-none"
                          />
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                            Last Check-in Time{" "}
                            <span className="text-red-500">*</span>
                          </p>
                          <input
                            type="time"
                            aria-label="Last check-in time"
                            value={type.last_check_in}
                            onChange={(e) =>
                              updateType(type.id, "last_check_in", e.target.value)
                            }
                            className="w-full bg-transparent text-gray-900 dark:text-gray-100 text-base font-bold focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Info box */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 space-y-0.5">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <span className="font-semibold">Operating Window:</span>{" "}
                          First check-in at {to12Hour(type.first_check_in)} &bull; Last check-in at{" "}
                          {to12Hour(type.last_check_in)}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          <span className="font-semibold">Latest checkout:</span>{" "}
                          {to12Hour(latestCheckout.result)}
                          {latestCheckout.nextDay ? " (next day)" : ""}{" "}
                          <span className="text-blue-400/70">
                            ({type.duration}hrs stay + {CLEANING_HOURS}hrs cleaning)
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Add booking type */}
                <button
                  type="button"
                  onClick={addType}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-brand-primary/50 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Booking Type
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoadingTimes || !selectedHavenId}
              className="flex-1 px-4 py-2.5 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSaving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default BookingModalSetting;
