"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, UserPlus, CheckCircle, MapPin, Calendar, User, Users, Loader2, ChevronDown } from "lucide-react";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import { useGetBookingsQuery, useUpdateBookingStatusMutation } from "@/redux/api/bookingsApi";
import toast from 'react-hot-toast';
import Image from "next/image";

interface Cleaner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  employment_id: string;
  role: string;
  department?: string;
  profile_image_url?: string;
  phone?: string;
}

interface BookingRow {
  id: string;
  booking_id: string;
  room_name?: string;
  guest_first_name?: string;
  guest_last_name?: string;
  check_out_date?: string;
  check_out_time?: string;
  status?: "pending" | "approved" | "rejected" | "confirmed" | "checked-in" | "completed" | "cancelled";
  cleaning_status?: "pending" | "in-progress" | "cleaned" | "inspected";
  assigned_cleaner_id?: string | null;
  cleaning_time_in?: string | null;
  cleaning_time_out?: string | null;
}

interface AssignCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess?: () => void;
}

const skeletonPulse = "animate-pulse bg-gray-100 dark:bg-gray-700/60";

export default function AssignCleanerModal({ isOpen, onClose, bookingId, onSuccess }: AssignCleanerModalProps) {
  const [showCleanerDropdown, setShowCleanerDropdown] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [cleanerSearchTerm, setCleanerSearchTerm] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const cleanerDropdownRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());
  
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({ role: "Cleaner" });
  const { data: bookings = [] } = useGetBookingsQuery(
    {},
    {
      pollingInterval: 5000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  ) as { data: BookingRow[] };
  const [updateBookingStatus, { isLoading: isUpdating }] = useUpdateBookingStatusMutation();

  const cleaners = useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.filter((emp: Cleaner) => emp.role === "Cleaner" || emp.role === "cleaner");
  }, [employeesData]);

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.booking_id === bookingId || b.id === bookingId);
  }, [bookings, bookingId]);

  const cleanerAvailability = useMemo(() => {
    const map: Record<string, { status: "Available" | "Cleaning"; room?: string; timeIn?: string | null }> = {};
    for (const cleaner of cleaners) {
      map[cleaner.id] = { status: "Available" };
    }
    for (const b of bookings) {
      const cleanerId = b.assigned_cleaner_id || undefined;
      if (!cleanerId) continue;
      if (b.cleaning_status !== "in-progress") continue;
      if (b.cleaning_time_out) continue;
      map[cleanerId] = {
        status: "Cleaning",
        room: b.room_name || "Not specified",
        timeIn: b.cleaning_time_in || null,
      };
    }
    return map;
  }, [bookings, cleaners]);

  const pendingCleaningTasks = useMemo(() => {
    const copy = (Array.isArray(bookings) ? bookings : []).filter((b) => {
      return (b.cleaning_status === "pending" || !b.cleaning_status) && !b.assigned_cleaner_id;
    });
    copy.sort((a, b) => {
      const aKey = `${a.check_out_date ?? ""} ${a.check_out_time ?? ""}`.trim();
      const bKey = `${b.check_out_date ?? ""} ${b.check_out_time ?? ""}`.trim();
      return aKey.localeCompare(bKey);
    });
    return copy;
  }, [bookings]);

  const nextQueuedTask = useMemo(() => {
    return pendingCleaningTasks[0] || null;
  }, [pendingCleaningTasks]);

  const handleCleanerSelect = (cleaner: Cleaner) => {
    setSelectedCleaner(cleaner);
    setShowCleanerDropdown(false);
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;
  };

  useEffect(() => {
    if (!showCleanerDropdown) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [showCleanerDropdown]);

  const filteredCleaners = useMemo(() => {
    const term = cleanerSearchTerm.trim().toLowerCase();
    return cleaners.filter((cleaner: Cleaner) => {
      const a = cleanerAvailability[cleaner.id];
      if (availableOnly && a?.status !== "Available") return false;
      if (!term) return true;
      const fullName = `${cleaner.first_name} ${cleaner.last_name}`.toLowerCase();
      return (
        fullName.includes(term) ||
        cleaner.email.toLowerCase().includes(term) ||
        cleaner.employment_id.toLowerCase().includes(term)
      );
    });
  }, [availableOnly, cleanerAvailability, cleanerSearchTerm, cleaners]);

  const handleAssign = async () => {
    if (!selectedCleaner || !selectedBooking) {
      toast.error("Please select a cleaner");
      return;
    }

    try {
      await updateBookingStatus({
        id: selectedBooking.id,
        cleaning_status: "in-progress",
        assigned_cleaner_id: selectedCleaner.id,
        cleaning_time_in: new Date().toISOString(),
        cleaning_time_out: null
      }).unwrap();
      
      toast.success(`Cleaning task assigned to ${selectedCleaner.first_name} ${selectedCleaner.last_name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to assign cleaner");
      console.error(error);
    }
  };

  const handleAssignNextFromQueue = async () => {
    if (!selectedCleaner) {
      toast.error("Please select a cleaner");
      return;
    }
    if (!nextQueuedTask) {
      toast.error("No rooms in the queue");
      return;
    }

    const status = cleanerAvailability[selectedCleaner.id]?.status;
    if (status === "Cleaning") {
      toast.error("Cleaner is currently busy");
      return;
    }

    try {
      await updateBookingStatus({
        id: nextQueuedTask.id,
        cleaning_status: "in-progress",
        assigned_cleaner_id: selectedCleaner.id,
        cleaning_time_in: new Date().toISOString(),
        cleaning_time_out: null,
      }).unwrap();

      toast.success(`Next room assigned to ${selectedCleaner.first_name} ${selectedCleaner.last_name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to assign next room");
      console.error(error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

  const handleDropdownClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (cleanerDropdownRef.current && !cleanerDropdownRef.current.contains(target)) {
      setShowCleanerDropdown(false);
    }
  };

  useEffect(() => {
    if (!showCleanerDropdown) return;
    document.addEventListener("mousedown", handleDropdownClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleDropdownClickOutside);
    };
  }, [showCleanerDropdown]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const guestName = selectedBooking 
    ? `${selectedBooking.guest_first_name || ""} ${selectedBooking.guest_last_name || ""}`.trim() || "Guest"
    : "Unknown Guest";

  return (
    <>
      {createPortal(
        <>
          <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
          <div
            ref={modalRef}
            className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Assign Cleaner
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Assign a cleaner to this cleaning task
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Booking Information */}
              {selectedBooking && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    Cleaning Task Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Booking ID:</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                          {selectedBooking.booking_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Guest:</span>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{guestName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Haven:</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedBooking.room_name || "Not specified"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Check-Out:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString() : "N/A"} {selectedBooking.check_out_time || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Cleaner Preview */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Cleaner
                  </label>
                  <div ref={cleanerDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCleanerDropdown((v) => !v)}
                      className={`w-full px-4 py-3 rounded-lg transition-all text-left border ${
                        selectedCleaner
                          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                          : "border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-primary hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {selectedCleaner ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                            {selectedCleaner.profile_image_url ? (
                              <Image
                                src={selectedCleaner.profile_image_url}
                                alt={`${selectedCleaner.first_name} ${selectedCleaner.last_name}`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-brand-primary flex items-center justify-center">
                                <span className="text-white font-semibold">
                                  {selectedCleaner.first_name?.[0]}{selectedCleaner.last_name?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {selectedCleaner ? (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {selectedCleaner.first_name} {selectedCleaner.last_name}
                                </p>
                                {(() => {
                                  const a = cleanerAvailability[selectedCleaner.id] || { status: "Available" as const };
                                  const isCleaning = a.status === "Cleaning";
                                  return (
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                        isCleaning ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                                      }`}
                                    >
                                      {a.status}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {selectedCleaner.email} • {selectedCleaner.employment_id}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900 dark:text-gray-100">Select a cleaner</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Click to choose from available cleaners</p>
                            </>
                          )}
                        </div>

                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </button>

                    {showCleanerDropdown && (
                      <div className="absolute z-[9992] mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                              type="text"
                              placeholder="Search by name, email, or employment ID..."
                              value={cleanerSearchTerm}
                              onChange={(e) => setCleanerSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <input
                              id="available-only-inline"
                              type="checkbox"
                              checked={availableOnly}
                              onChange={(e) => setAvailableOnly(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                            />
                            <label htmlFor="available-only-inline" className="text-sm text-gray-700 dark:text-gray-300">
                              Show available only
                            </label>
                          </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto p-2">
                          {employeesLoading ? (
                            <div className="p-3 text-sm text-gray-600 dark:text-gray-300">Loading cleaners...</div>
                          ) : filteredCleaners.length === 0 ? (
                            <div className="p-3 text-sm text-gray-600 dark:text-gray-300">No cleaners found</div>
                          ) : (
                            filteredCleaners.map((cleaner: Cleaner) => {
                              const fullName = `${cleaner.first_name} ${cleaner.last_name}`;
                              const isSelected = selectedCleaner?.id === cleaner.id;
                              const a = cleanerAvailability[cleaner.id] || { status: "Available" as const };
                              const isCleaning = a.status === "Cleaning";
                              const timeMs = a.timeIn ? now - new Date(a.timeIn).getTime() : 0;

                              return (
                                <button
                                  type="button"
                                  key={cleaner.id}
                                  onClick={() => handleCleanerSelect(cleaner)}
                                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                                    isSelected
                                      ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                                      : "border-transparent hover:border-brand-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                      {cleaner.profile_image_url ? (
                                        <Image
                                          src={cleaner.profile_image_url}
                                          alt={fullName}
                                          width={40}
                                          height={40}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-brand-primary flex items-center justify-center">
                                          <span className="text-white font-semibold">
                                            {cleaner.first_name?.[0]}{cleaner.last_name?.[0]}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{fullName}</p>
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                            isCleaning ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                                          }`}
                                        >
                                          {a.status}
                                        </span>
                                        {isSelected && <CheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />}
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{cleaner.email}</p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-500">ID: {cleaner.employment_id}</span>
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                                          {isCleaning && a.timeIn ? formatDuration(timeMs) : "-"}
                                        </span>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                                        {isCleaning ? `Room: ${a.room || "N/A"}` : "Room: -"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Queue</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Next room</span>
                  </div>

                  {nextQueuedTask ? (
                    <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{nextQueuedTask.room_name || "Not specified"}</span>
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{nextQueuedTask.booking_id}</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {`${nextQueuedTask.check_out_date ?? ""} ${nextQueuedTask.check_out_time ?? ""}`.trim() || "Not specified"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-300">No rooms in the queue.</div>
                  )}

                  <button
                    onClick={handleAssignNextFromQueue}
                    disabled={!selectedCleaner || !nextQueuedTask || employeesLoading || isUpdating}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    Assign Next Room
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedCleaner || employeesLoading || isUpdating}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
              >
                {employeesLoading || isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Assign Cleaner
                  </>
                )}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
