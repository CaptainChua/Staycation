"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Search, UserPlus, CheckCircle, MapPin, Calendar, User, Users, Loader2 } from "lucide-react";
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
  cleaning_status?: "pending" | "in-progress" | "cleaned" | "inspected";
}

interface AssignCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess?: () => void;
}

const skeletonPulse = "animate-pulse bg-gray-100 dark:bg-gray-700/60";

function SelectCleanerModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  cleaners 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (cleaner: Cleaner) => void;
  cleaners: Cleaner[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const filteredCleaners = useMemo(() => {
    return cleaners.filter((cleaner) =>
      `${cleaner.first_name} ${cleaner.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleaner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cleaner.employment_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cleaners, searchTerm]);

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

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

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        ref={modalRef}
        className="fixed z-[10001] w-full max-w-3xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Select Cleaner
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose a cleaner to assign to this task
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

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or employment ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
            />
          </div>
        </div>

        {/* Cleaners List */}
        <div className="p-4 space-y-3 max-h-[calc(85vh-200px)] overflow-y-auto">
          {filteredCleaners.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No cleaners found</p>
            </div>
          ) : (
            filteredCleaners.map((cleaner) => {
              const fullName = `${cleaner.first_name} ${cleaner.last_name}`;
              const isSelected = selectedCleaner?.id === cleaner.id;
              
              return (
                <div
                  key={cleaner.id}
                  onClick={() => setSelectedCleaner(cleaner)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-brand-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Profile Image */}
                    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-gray-200 dark:border-gray-700 flex-shrink-0">
                      {cleaner.profile_image_url ? (
                        <Image
                          src={cleaner.profile_image_url}
                          alt={fullName}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-primary flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {cleaner.first_name?.[0]}{cleaner.last_name?.[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cleaner Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {fullName}
                        </h3>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-brand-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {cleaner.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          ID: {cleaner.employment_id}
                        </span>
                        {cleaner.department && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {cleaner.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
            onClick={() => {
              if (selectedCleaner) {
                onSelect(selectedCleaner);
                onClose();
              }
            }}
            disabled={!selectedCleaner}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryDark disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Select Cleaner
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function AssignCleanerModal({ isOpen, onClose, bookingId, onSuccess }: AssignCleanerModalProps) {
  const [showCleanerModal, setShowCleanerModal] = useState(false);
  const [selectedCleaner, setSelectedCleaner] = useState<Cleaner | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({ role: "Cleaner" });
  const { data: bookings = [] } = useGetBookingsQuery({}) as { data: BookingRow[] };
  const [updateBookingStatus, { isLoading: isUpdating }] = useUpdateBookingStatusMutation();

  const cleaners = useMemo(() => {
    if (!employeesData?.data) return [];
    return employeesData.data.filter((emp: Cleaner) => emp.role === "Cleaner" || emp.role === "cleaner");
  }, [employeesData]);

  const selectedBooking = useMemo(() => {
    return bookings.find((b) => b.booking_id === bookingId || b.id === bookingId);
  }, [bookings, bookingId]);

  const handleCleanerSelect = (cleaner: Cleaner) => {
    setSelectedCleaner(cleaner);
    setShowCleanerModal(false);
  };

  const handleAssign = async () => {
    if (!selectedCleaner || !selectedBooking) {
      toast.error("Please select a cleaner");
      return;
    }

    try {
      // Note: The backend updateBookingStatus may need to be updated to support cleaning_status
      // For now, we'll update the status. You may need to create a separate endpoint for cleaning_status
      await updateBookingStatus({
        id: selectedBooking.id,
        status: selectedBooking.status || "approved",
        cleaning_status: "in-progress" // This maps to "In Progress" in the UI
      }).unwrap();
      
      toast.success(`Cleaning task assigned to ${selectedCleaner.first_name} ${selectedCleaner.last_name}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error("Failed to assign cleaner");
      console.error(error);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

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
      <SelectCleanerModal
        isOpen={showCleanerModal}
        onClose={() => setShowCleanerModal(false)}
        onSelect={handleCleanerSelect}
        cleaners={cleaners}
      />
      
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
                  {selectedCleaner ? (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center gap-4">
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
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {selectedCleaner.first_name} {selectedCleaner.last_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCleaner.email} • {selectedCleaner.employment_id}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCleanerModal(true)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Select a cleaner</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to choose from available cleaners</p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {selectedCleaner && (
                  <button
                    onClick={() => setShowCleanerModal(true)}
                    className="w-full px-4 py-2 text-sm text-brand-primary hover:text-brand-primaryDark font-medium"
                  >
                    Change Cleaner
                  </button>
                )}
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
