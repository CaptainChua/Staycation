"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Home,
  CheckCircle,
  AlertCircle,
  Wrench,
  Filter,
  Search,
  UserPlus,
  CalendarClock,
  CheckCircle2,
  Loader,
} from "lucide-react";

interface CleaningRecord {
  id: string;
  bookingId: string;
  roomNumber: string;
  roomName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  cleaningStatus: "pending" | "in-progress" | "cleaned" | "inspected";
  assignedCleaner: string;
  cleanerContact: string;
  cleaningTimeIn?: string;
  cleaningTimeOut?: string;
  cleanedAt?: string;
  inspectedAt?: string;
  bookingStatus: string;
}

const CleaningManagement = () => {
  const [cleaningData, setCleaningData] = useState<CleaningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in-progress" | "cleaned" | "inspected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [cleanerName, setCleanerName] = useState("");
  const [selectedCleaningId, setSelectedCleaningId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch cleaning data on mount
  useEffect(() => {
    fetchCleaningData();
  }, []);

  const fetchCleaningData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bookings");
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const jsonData = await response.json();
      
      // Transform booking data to cleaning records
      const bookings = jsonData.data || jsonData.bookings || [];
      
      const cleaningRecords = bookings.map((booking: any) => {
        const firstName = booking.guest_first_name || "";
        const lastName = booking.guest_last_name || "";
        const fullName = `${firstName} ${lastName}`.trim();
        
        return {
          id: booking.id,
          bookingId: booking.booking_id,
          roomNumber: booking.room_name ? booking.room_name.split(" ")[booking.room_name.split(" ").length - 1] : "Unknown",
          roomName: booking.room_name || "Unknown",
          guestName: fullName || "Unknown Guest",
          checkIn: booking.check_in_date,
          checkOut: booking.check_out_date,
          cleaningStatus: booking.cleaning_status || "pending",
          assignedCleaner: booking.assigned_to || "Unassigned",
          cleanerContact: booking.assigned_to_contact || "-",
          roomStatus: getBookingStatusToRoom(booking.status),
          cleaning_status: booking.cleaning_status || "pending",
          room_name: booking.room_name || "Unknown",
          bookingStatus: booking.status,
        };
      });
      
      setCleaningData(cleaningRecords);
      setDataError(null);
    } catch (err) {
      console.error("Error fetching cleaning data:", err);
      setDataError(`Failed to load cleaning data: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const getBookingStatusToRoom = (status: string) => {
    if (!status) return "available";
    if (["approved", "confirmed", "checked-in"].includes(status)) return "occupied";
    return "available";
  };

  // Filter records based on status and search
  const filteredRecords = useMemo(() => {
    return cleaningData.filter((record: CleaningRecord) => {
      const matchesStatus = statusFilter === "all" || record.cleaningStatus === statusFilter;
      const matchesSearch =
        record.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.assignedCleaner?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [cleaningData, statusFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cleaned":
        return "bg-green-100 text-green-800 border-green-200";
      case "inspected":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "in-progress":
        return <Wrench className="w-4 h-4" />;
      case "cleaned":
        return <CheckCircle className="w-4 h-4" />;
      case "inspected":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-progress":
        return "In Progress";
      case "cleaned":
        return "Cleaned";
      case "inspected":
        return "Inspected";
      default:
        return "Unknown";
    }
  };

  const totalTasks = filteredRecords.length;
  const pendingCount = filteredRecords.filter((r: CleaningRecord) => r.cleaningStatus === "pending").length;
  const inProgressCount = filteredRecords.filter((r: CleaningRecord) => r.cleaningStatus === "in-progress").length;
  const cleanedCount = filteredRecords.filter((r: CleaningRecord) => r.cleaningStatus === "cleaned").length;

  const statCards = [
    {
      id: "total",
      label: "Total Rooms",
      value: totalTasks,
      color: "bg-blue-500",
      Icon: Home,
    },
    {
      id: "pending",
      label: "Pending",
      value: pendingCount,
      color: "bg-yellow-500",
      Icon: AlertCircle,
    },
    {
      id: "in-progress",
      label: "In Progress",
      value: inProgressCount,
      color: "bg-cyan-500",
      Icon: Wrench,
    },
    {
      id: "cleaned",
      label: "Cleaned",
      value: cleanedCount,
      color: "bg-green-500",
      Icon: CheckCircle,
    },
  ];

  const handleCleaningStatusUpdate = async (recordId: string, newStatus: string) => {
    // Optimistically update local state
    const originalData = cleaningData.map(r => ({ ...r }));
    const updatedData = cleaningData.map((record) =>
      record.id === recordId
        ? { ...record, cleaningStatus: newStatus as CleaningRecord["cleaningStatus"] }
        : record
    );
    setCleaningData(updatedData);

    try {
      const response = await fetch(`/api/bookings/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cleaning_status: newStatus,
          ...(newStatus === "in-progress" && { cleaning_time_in: new Date().toISOString() }),
          ...(newStatus === "cleaned" && { cleaned_at: new Date().toISOString() }),
          ...(newStatus === "inspected" && { inspected_at: new Date().toISOString() }),
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error("Error updating cleaning status:", err);
      setCleaningData(originalData);
      alert("Failed to update cleaning status");
    }
  };

  const handleAssignCleaner = async () => {
    if (!cleanerName.trim()) {
      setModalError("Please enter a cleaner name");
      return;
    }
    if (!selectedCleaningId) {
      setModalError("No cleaning task selected");
      return;
    }
    try {
      const cleaningRecord = cleaningData.find(r => r.id === selectedCleaningId);
      if (!cleaningRecord) {
        throw new Error("Cleaning record not found");
      }

      console.log("Assigning cleaner:", { 
        bookingId: cleaningRecord.bookingId, 
        cleanerName,
        recordId: selectedCleaningId 
      });

      // Optimistically update local state
      const updatedData = cleaningData.map((record) =>
        record.id === selectedCleaningId
          ? { ...record, assignedCleaner: cleanerName, cleaningStatus: "in-progress" as const }
          : record
      );
      setCleaningData(updatedData);
      setShowAssignModal(false);
      setCleanerName("");
      setSelectedCleaningId(null);
      setModalError(null);

      // Then make the API call
      const response = await fetch(`/api/bookings/${cleaningRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_to: cleanerName,
          cleaning_status: "in-progress",
          cleaning_time_in: new Date().toISOString(),
        }),
      });

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to assign cleaner");
      }
    } catch (err) {
      console.error("Error assigning cleaner:", err);
      setModalError(err instanceof Error ? err.message : "Failed to assign cleaner");
      setShowAssignModal(true);
      await fetchCleaningData();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400">Loading cleaning data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Cleaning Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor room readiness, track cleaning status, and manage housekeeping tasks
            </p>
          </div>
        </div>
      </div>

      {dataError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-300">
          {dataError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map(({ id, label, value, color, Icon }) => (
          <div
            key={id}
            className={`${color} text-white rounded-lg p-4 shadow dark:shadow-gray-900 hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <Icon className="w-8 h-8 opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Cleaning Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search room, guest, or cleaner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/80 transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/80 transition"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="cleaned">Cleaned</option>
                <option value="inspected">Inspected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Room</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Guest</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Check In</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Check Out</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Cleaner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Contact</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    No cleaning records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record: CleaningRecord, index: number) => (
                  <tr
                    key={record.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Room {record.roomNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">#{record.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(record.cleaningStatus)}`}>
                        {getStatusIcon(record.cleaningStatus)}
                        <span>{getStatusText(record.cleaningStatus)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-100">
                      {record.guestName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(record.checkIn)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(record.checkOut)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-100">
                      {record.assignedCleaner || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {record.cleanerContact || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {record.cleaningStatus === "pending" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCleaningId(record.id);
                              setShowAssignModal(true);
                            }}
                            className="p-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/30 transition-colors"
                            aria-label="Assign cleaner"
                            title="Assign Cleaner - Required before starting"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span className="sr-only">Assign Cleaner</span>
                          </button>
                        )}
                        {record.cleaningStatus === "in-progress" && (
                          <button
                            type="button"
                            onClick={() => handleCleaningStatusUpdate(record.id, "cleaned")}
                            className="p-2 rounded-md border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:text-green-300 dark:hover:bg-green-900/30 transition-colors"
                            aria-label="Mark cleaned"
                            title="Mark Cleaned"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="sr-only">Mark Cleaned</span>
                          </button>
                        )}
                        {record.cleaningStatus === "cleaned" && (
                          <button
                            type="button"
                            onClick={() => handleCleaningStatusUpdate(record.id, "inspected")}
                            className="p-2 rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition-colors"
                            aria-label="Inspect"
                            title="Inspect"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="sr-only">Inspect</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 pb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Checkout Today - Needs Cleaning
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rooms checking out today that require cleaning
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRecords
              .filter((r: CleaningRecord) => r.cleaningStatus === "pending")
              .slice(0, 5)
              .map((room: CleaningRecord) => (
                <div
                  key={room.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {room.roomName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Guest: {room.guestName}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCleaningId(room.id);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                  >
                    Assign Cleaner
                  </button>
                </div>
              ))}
            {filteredRecords.filter((r: CleaningRecord) => r.cleaningStatus === "pending").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No pending cleaning tasks
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today&apos;s Cleaning Schedule</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Rooms to monitor closely for the next shift</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRecords
              .filter((r: CleaningRecord) => r.cleaningStatus === "in-progress")
              .slice(0, 5)
              .map((room: CleaningRecord) => (
                <div key={room.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">Room {room.roomNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Guest: {room.guestName || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {room.assignedCleaner || "Unassigned"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Currently cleaning</p>
                  </div>
                  <button
                    onClick={() => handleCleaningStatusUpdate(room.id, "cleaned")}
                    className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                  >
                    Mark Cleaned
                  </button>
                </div>
              ))}
            {filteredRecords.filter((r: CleaningRecord) => r.cleaningStatus === "in-progress").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No rooms currently being cleaned
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Assignments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Rooms waiting for cleaner allocation</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRecords
              .filter((r: CleaningRecord) => r.assignedCleaner === "Unassigned" || r.assignedCleaner === "-")
              .slice(0, 5)
              .map((room: CleaningRecord) => (
                <div key={room.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">Room {room.roomNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status: {getStatusText(room.cleaningStatus)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCleaningId(room.id);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              ))}
            {filteredRecords.filter((r: CleaningRecord) => r.assignedCleaner === "Unassigned" || r.assignedCleaner === "-").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                All rooms have assigned cleaners
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Cleaner Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assign Cleaner</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cleaner Name
                </label>
                <input
                  type="text"
                  value={cleanerName}
                  onChange={(e) => setCleanerName(e.target.value)}
                  placeholder="Enter cleaner name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAssignCleaner();
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setCleanerName("");
                  setSelectedCleaningId(null);
                  setModalError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignCleaner}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningManagement;
