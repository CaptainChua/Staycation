// ...existing code...
"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

interface Booking {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  cleaning_status: "pending" | "in-progress" | "cleaned" | "inspected";
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

const RoomManagement = () => {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in-progress" | "cleaned" | "inspected"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state for assigning cleaner
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cleanerName, setCleanerName] = useState("");

  // Load bookings from API
  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error(`Failed to fetch bookings: ${res.status}`);
      const data = await res.json();
      // Handle both array and object responses
      const bookingsArray = Array.isArray(data) ? data : (data.bookings || data.data || []);
      setBookings(bookingsArray);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Update cleaning status
  const updateCleaningStatus = async (
    bookingId: string,
    newStatus: "pending" | "in-progress" | "cleaned" | "inspected",
    assignedTo?: string | null
  ) => {
    // Optimistic update
    setBookings((prev) =>
      prev?.map((b) => {
        const updated: any = { ...b, cleaning_status: newStatus };
        if (assignedTo !== undefined) {
          updated.assigned_to = assignedTo;
        }
        return b.id === bookingId ? updated : b;
      }) ?? prev
    );

    try {
      const payload: any = { cleaning_status: newStatus };
      if (assignedTo !== undefined) {
        payload.assigned_to = assignedTo;
      }

      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Update failed: ${res.status}`);
      }
      const responseData = await res.json();
      // Handle both direct booking response or wrapped response
      const updated = responseData.id ? responseData : responseData.booking;
      
      if (updated && updated.id) {
        // Ensure assigned_to is properly set from our payload
        const finalUpdated = { ...updated };
        if (assignedTo !== undefined) {
          finalUpdated.assigned_to = assignedTo;
        }
        setBookings((prev) => prev?.map((b) => (b.id === bookingId ? finalUpdated : b)) ?? prev);
      } else {
        // If response doesn't contain updated booking, reload all
        await loadBookings();
      }
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message || "Update failed");
      // Reload to get fresh data from server
      await loadBookings();
    }
  };

  // Actions
  const markInProgress = async (bookingId: string) => {
    await updateCleaningStatus(bookingId, "in-progress");
  };

  const markCleaned = async (bookingId: string) => {
    await updateCleaningStatus(bookingId, "cleaned");
  };

  const markInspected = async (bookingId: string) => {
    await updateCleaningStatus(bookingId, "inspected");
  };

  const resetToPending = async (bookingId: string) => {
    await updateCleaningStatus(bookingId, "pending");
  };

  // Move to next status
  const moveToNextStatus = async (bookingId: string, currentStatus: string) => {
    // If pending, show modal to assign cleaner
    if (currentStatus === "pending") {
      setSelectedBookingId(bookingId);
      setShowAssignModal(true);
      return;
    }

    const statusSequence = ["pending", "in-progress", "cleaned", "inspected"];
    const currentIndex = statusSequence.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusSequence.length;
    const nextStatus = statusSequence[nextIndex] as "pending" | "in-progress" | "cleaned" | "inspected";
    
    // If moving from inspected to pending, clear the assigned cleaner
    if (currentStatus === "inspected") {
      await updateCleaningStatus(bookingId, nextStatus, null);
    } else {
      await updateCleaningStatus(bookingId, nextStatus);
    }
  };

  // Handle modal submit for assigning cleaner
  const handleAssignCleaner = async () => {
    if (!selectedBookingId || !cleanerName.trim()) {
      setError("Please enter a cleaner name");
      return;
    }

    setShowAssignModal(false);
    await updateCleaningStatus(selectedBookingId, "in-progress", cleanerName);
    setCleanerName("");
    setSelectedBookingId(null);
  };

  // Filter and search
  const currentBookings = Array.isArray(bookings) ? bookings : [];
  const filteredBookings = currentBookings.filter((booking) => {
    const matchesStatus = statusFilter === "all" || booking.cleaning_status === statusFilter;
    const term = searchTerm.trim().toLowerCase();
    const guestName = `${booking.guest_first_name} ${booking.guest_last_name}`.toLowerCase();
    const matchesSearch =
      term === "" ||
      booking.room_name.toLowerCase().includes(term) ||
      guestName.includes(term) ||
      booking.booking_id.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cleaned":
        return "bg-green-100 text-green-800 border-green-200";
      case "inspected":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const totalBookings = filteredBookings.length;
  const pendingCount = filteredBookings.filter((b) => b.cleaning_status === "pending").length;
  const inProgressCount = filteredBookings.filter((b) => b.cleaning_status === "in-progress").length;
  const cleanedCount = filteredBookings.filter((b) => b.cleaning_status === "cleaned").length;
  const inspectedCount = filteredBookings.filter((b) => b.cleaning_status === "inspected").length;

  const statCards = [
    { id: "total", label: "Total Rooms", value: totalBookings, color: "bg-blue-500", Icon: Home },
    { id: "pending", label: "Pending", value: pendingCount, color: "bg-slate-500", Icon: AlertCircle },
    { id: "in-progress", label: "In Progress", value: inProgressCount, color: "bg-amber-500", Icon: Wrench },
    { id: "cleaned", label: "Cleaned", value: cleanedCount, color: "bg-green-500", Icon: CheckCircle },
    { id: "inspected", label: "Inspected", value: inspectedCount, color: "bg-emerald-500", Icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 min-h-screen">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cleaning Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor room readiness, coordinate cleaners, and balance occupancy</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statCards.map(({ id, label, value, color, Icon }) => (
          <div
            key={id}
            className={`${color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{label}</p>
                <p className="text-3xl font-bold mt-2">{value}</p>
              </div>
              <Icon className="w-12 h-12 opacity-40" />
            </div>
          </div>
        ))}
      </div>

      {/* Room Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search room, guest, or booking..."
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
        
        <div className="relative max-h-[420px] overflow-y-auto overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Room</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Cleaning Status</th>                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Cleaner Name</th>                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Guest</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Check In</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Check Out</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Phone</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredBookings.map((booking, index) => (
                <tr
                  key={booking.id}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{booking.room_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">#{booking.booking_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(booking.cleaning_status)}`}>
                      {getStatusIcon(booking.cleaning_status)}
                      <span>{getStatusText(booking.cleaning_status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-100">
                    {booking.assigned_to || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-100">
                    {booking.guest_first_name} {booking.guest_last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {booking.check_in_date} <br /> <span className="text-xs">{booking.check_in_time}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {booking.check_out_date} <br /> <span className="text-xs">{booking.check_out_time}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <a href={`mailto:${booking.guest_email}`} className="hover:underline text-blue-600">
                      {booking.guest_email}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <a href={`tel:${booking.guest_phone}`} className="hover:underline text-blue-600">
                      {booking.guest_phone}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {booking.cleaning_status === "pending" && (
                        <button
                          type="button"
                          onClick={() => moveToNextStatus(booking.id, booking.cleaning_status)}
                          className="p-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/30 transition-colors"
                          aria-label="Start cleaning"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span className="sr-only">Start Cleaning</span>
                        </button>
                      )}
                      {booking.cleaning_status === "in-progress" && (
                        <button
                          type="button"
                          onClick={() => moveToNextStatus(booking.id, booking.cleaning_status)}
                          className="p-2 rounded-md border border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/50 dark:text-green-300 dark:hover:bg-green-900/30 transition-colors"
                          aria-label="Mark cleaned"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span className="sr-only">Mark Cleaned</span>
                        </button>
                      )}
                      {booking.cleaning_status === "cleaned" && (
                        <button
                          type="button"
                          onClick={() => moveToNextStatus(booking.id, booking.cleaning_status)}
                          className="p-2 rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition-colors"
                          aria-label="Mark inspected"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="sr-only">Mark Inspected</span>
                        </button>
                      )}
                      {booking.cleaning_status === "inspected" && (
                        <button
                          type="button"
                          onClick={() => moveToNextStatus(booking.id, booking.cleaning_status)}
                          className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Reset to pending"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="sr-only">Reset</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today&apos;s Cleaning Schedule</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bookings to monitor closely for the next shift</p>
          </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {filteredBookings
              .filter((b) => b.cleaning_status === "in-progress" || b.cleaning_status === "pending")
              .map((booking) => (
                <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{booking.room_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Guest: {booking.guest_first_name} {booking.guest_last_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {getStatusText(booking.cleaning_status)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Check-out: {booking.check_out_date}</p>
                  </div>
                </div>
              ))}
            {filteredBookings.filter((b) => b.cleaning_status === "in-progress" || b.cleaning_status === "pending").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Nothing scheduled for today. All cleanings complete!
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pending Assignments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Bookings waiting to start cleaning</p>
          </div>
          <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {filteredBookings
              .filter((b) => b.cleaning_status === "pending")
              .map((booking) => (
                <div key={booking.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{booking.room_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Check-out: {booking.check_out_date}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    Pending Start
                  </span>
                </div>
              ))}
            {filteredBookings.filter((b) => b.cleaning_status === "pending").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                All pending bookings have been assigned.
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
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                  {error}
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
                  setSelectedBookingId(null);
                  setError(null);
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
export default RoomManagement;
// ...existing code...