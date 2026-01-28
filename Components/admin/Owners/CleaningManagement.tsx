"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Home,
  CheckCircle,
  AlertCircle,
  Wrench,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";
import { useGetBookingsQuery, useUpdateCleaningStatusMutation } from "@/redux/api/bookingsApi";
import toast from "react-hot-toast";

type BookingStatus = "pending" | "approved" | "rejected" | "confirmed" | "checked-in" | "completed" | "cancelled";
type CleaningStatus = "pending" | "in-progress" | "cleaned" | "inspected";

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
  status: BookingStatus;
  cleaning_status: CleaningStatus;
  created_at: string;
  updated_at: string;
}

// Derive room status from booking status
const getRoomStatus = (booking: Booking): "occupied" | "available" | "checkout-pending" => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkIn = new Date(booking.check_in_date);
  checkIn.setHours(0, 0, 0, 0);

  const checkOut = new Date(booking.check_out_date);
  checkOut.setHours(0, 0, 0, 0);

  // Room is occupied if guest has checked in and hasn't completed stay
  if (booking.status === "checked-in") {
    // Check if today is checkout day
    if (today.getTime() === checkOut.getTime()) {
      return "checkout-pending";
    }
    return "occupied";
  }

  // Room is available after completion or if not yet checked in
  if (booking.status === "completed") {
    return "available";
  }

  // For approved/confirmed bookings, check dates
  if (booking.status === "approved" || booking.status === "confirmed") {
    if (today >= checkIn && today <= checkOut) {
      return "occupied";
    }
  }

  return "available";
};

const CleaningManagement = () => {
  // Fetch bookings data
  const { data: bookings = [], isLoading, refetch } = useGetBookingsQuery(
    {},
    {
      pollingInterval: 5000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );
  const [updateCleaningStatus] = useUpdateCleaningStatusMutation();

  // Filter states
  const [roomStatusFilter, setRoomStatusFilter] = useState<"all" | "occupied" | "available" | "checkout-pending">("all");
  const [cleaningStatusFilter, setCleaningStatusFilter] = useState<"all" | "pending" | "in-progress" | "cleaned" | "inspected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [cleanerName, setCleanerName] = useState("");
  const [selectedCleaningId, setSelectedCleaningId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // Process bookings to get room data with statuses
  const roomData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only include bookings with approved status and dates that are today or sooner
    const activeBookings = (bookings as Booking[]).filter(
      (b) => {
        const checkInDate = new Date(b.check_in_date);
        const checkOutDate = new Date(b.check_out_date);
        checkInDate.setHours(0, 0, 0, 0);
        checkOutDate.setHours(0, 0, 0, 0);
        
        const statusMatch = ["approved", "confirmed", "checked-in"].includes(b.status);
        const checkInMatch = checkInDate <= today;
        const checkOutMatch = checkOutDate <= today;
        
        // Debug logging for troubleshooting
        if (b.room_name?.includes("experiemnt") || b.booking_id === "BK1768356599516") {
          console.log("Debug booking:", {
            room_name: b.room_name,
            status: b.status,
            check_in_date: b.check_in_date,
            check_out_date: b.check_out_date,
            statusMatch,
            checkInMatch,
            checkOutMatch,
            today: today.toISOString().split('T')[0]
          });
        }
        
        return statusMatch && checkInMatch && checkOutMatch;
      }
    );

    // Group by room name and get most recent booking for each room
    const roomMap = new Map<string, Booking>();

    activeBookings.forEach((booking) => {
      const roomName = booking.room_name?.trim();
      if (!roomName) return;

      const existing = roomMap.get(roomName);
      if (!existing || new Date(booking.check_in_date) > new Date(existing.check_in_date)) {
        roomMap.set(roomName, booking);
      }
    });

    return Array.from(roomMap.values()).map((booking) => ({
      ...booking,
      roomStatus: getRoomStatus(booking),
      guestName: `${booking.guest_first_name} ${booking.guest_last_name}`,
    }));
  }, [bookings]);

  // Filter rooms based on status and search
  const filteredRooms = useMemo(() => {
    return roomData.filter((room) => {
      const matchesRoomStatus = roomStatusFilter === "all" || room.roomStatus === roomStatusFilter;
      const matchesCleaningStatus = cleaningStatusFilter === "all" || room.cleaning_status === cleaningStatusFilter;
      const matchesSearch =
        room.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.booking_id?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesRoomStatus && matchesCleaningStatus && matchesSearch;
    });
  }, [roomData, roomStatusFilter, cleaningStatusFilter, searchTerm]);

  // Handle cleaning status update
  const handleAssignCleaner = () => {
    // TODO: Implement assign cleaner logic
    console.log('Assign cleaner:', cleanerName, 'to room:', selectedCleaningId);
    setShowAssignModal(false);
    setCleanerName("");
    setSelectedCleaningId(null);
    setModalError(null);
  };

  const handleCleaningStatusUpdate = async (roomId: string, newStatus: string) => {
    try {
      await updateCleaningStatus({ id: roomId, cleaning_status: newStatus }).unwrap();
      toast.success(`Cleaning status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      console.error("Failed to update cleaning status:", error);
      toast.error("Failed to update cleaning status");
    }
  };

  const getRoomStatusColor = (status: "occupied" | "available" | "checkout-pending") => {
    switch (status) {
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "available":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "checkout-pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getCleaningStatusColor = (status: CleaningStatus) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "cleaned":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      case "inspected":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getRoomStatusIcon = (status: "occupied" | "available" | "checkout-pending") => {
    switch (status) {
      case "occupied":
        return <Users className="w-4 h-4" />;
      case "available":
        return <CheckCircle className="w-4 h-4" />;
      case "checkout-pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getCleaningStatusIcon = (status: CleaningStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <Wrench className="w-4 h-4" />;
      case "cleaned":
        return <Sparkles className="w-4 h-4" />;
      case "inspected":
        return <ClipboardCheck className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getRoomStatusText = (status: "occupied" | "available" | "checkout-pending") => {
    switch (status) {
      case "occupied":
        return "Occupied";
      case "available":
        return "Available";
      case "checkout-pending":
        return "Checkout Today";
      default:
        return "Unknown";
    }
  };

  const getCleaningStatusText = (status: CleaningStatus) => {
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

  // Stats calculations
  const totalRooms = filteredRooms.length;
  const availableCount = filteredRooms.filter((room) => room.roomStatus === "available").length;
  const occupiedCount = filteredRooms.filter((room) => room.roomStatus === "occupied").length;
  const checkoutPendingCount = filteredRooms.filter((room) => room.roomStatus === "checkout-pending").length;
  const cleaningPendingCount = filteredRooms.filter((room) => room.cleaning_status === "pending").length;
  const totalTasks = filteredRooms.length;
  const cleaningInProgressCount = filteredRooms.filter((room) => room.cleaning_status === "in-progress").length;

  const statCards = [
    {
      id: "total",
      label: "Total Rooms",
      value: totalTasks,
      color: "bg-blue-500",
      Icon: Home,
    },
    {
      id: "occupied",
      label: "Occupied",
      value: occupiedCount,
      color: "bg-red-500",
      Icon: Users,
    },
    {
      id: "checkout",
      label: "Checkout Today",
      value: checkoutPendingCount,
      color: "bg-amber-500",
      Icon: Clock,
    },
    {
      id: "available",
      label: "Available",
      value: availableCount,
      color: "bg-green-500",
      Icon: CheckCircle,
    },
    {
      id: "cleaning-pending",
      label: "Needs Cleaning",
      value: cleaningPendingCount,
      color: "bg-orange-500",
      Icon: Wrench,
    },
    {
      id: "cleaning-progress",
      label: "Being Cleaned",
      value: cleaningInProgressCount,
      color: "bg-indigo-500",
      Icon: Sparkles,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700 min-h-screen">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                placeholder="Search room, guest, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/80 transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Room:</span>
                <select
                  value={roomStatusFilter}
                  onChange={(e) => setRoomStatusFilter(e.target.value as typeof roomStatusFilter)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/80 transition"
                >
                  <option value="all">All</option>
                  <option value="occupied">Occupied</option>
                  <option value="available">Available</option>
                  <option value="checkout-pending">Checkout Today</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Cleaning:</span>
                <select
                  value={cleaningStatusFilter}
                  onChange={(e) => setCleaningStatusFilter(e.target.value as typeof cleaningStatusFilter)}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary/80 transition"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="cleaned">Cleaned</option>
                  <option value="inspected">Inspected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Room
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Room Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Cleaning Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Guest
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Check In
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Check Out
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Booking ID
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No rooms found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room, index) => (
                  <tr
                    key={room.id}
                    className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                          <Home className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {room.room_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getRoomStatusColor(room.roomStatus)}`}
                      >
                        {getRoomStatusIcon(room.roomStatus)}
                        <span>{getRoomStatusText(room.roomStatus)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getCleaningStatusColor(room.cleaning_status)}`}
                      >
                        {getCleaningStatusIcon(room.cleaning_status)}
                        <span>{getCleaningStatusText(room.cleaning_status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-100">
                      {room.guestName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {room.check_in_date
                        ? new Date(room.check_in_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {room.check_out_date
                        ? new Date(room.check_out_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">
                      {room.booking_id || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        {room.cleaning_status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleCleaningStatusUpdate(room.id, "in-progress")}
                            className="p-2 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/30 transition-colors"
                            title="Start Cleaning"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}
                        {room.cleaning_status === "in-progress" && (
                          <button
                            type="button"
                            onClick={() => handleCleaningStatusUpdate(room.id, "cleaned")}
                            className="p-2 rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/30 transition-colors"
                            title="Mark as Cleaned"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                        )}
                        {room.cleaning_status === "cleaned" && (
                          <button
                            type="button"
                            onClick={() => handleCleaningStatusUpdate(room.id, "inspected")}
                            className="p-2 rounded-md border border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/30 transition-colors"
                            title="Mark as Inspected"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                        {room.cleaning_status === "inspected" && (
                          <button
                            type="button"
                            onClick={() => handleCleaningStatusUpdate(room.id, "pending")}
                            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                            title="Reset to Pending"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
            {filteredRooms
              .filter((r) => r.cleaning_status === "pending")
              .slice(0, 5)
              .map((room) => (
                <div
                  key={room.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {room.room_name}
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
            {filteredRooms.filter((r) => r.cleaning_status === "pending").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No pending cleaning tasks
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Checkout Today - Needs Cleaning
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rooms checking out today that require cleaning
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
            {filteredRooms
              .filter((r) => r.roomStatus === "checkout-pending" && r.cleaning_status === "pending")
              .map((room) => (
                <div
                  key={room.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {room.room_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Guest: {room.guestName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCleaningStatusUpdate(room.id, "in-progress")}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                  >
                    Start Cleaning
                  </button>
                </div>
              ))}
            {filteredRooms.filter(
              (r) => r.roomStatus === "checkout-pending" && r.cleaning_status === "pending"
            ).length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No rooms checking out today need cleaning
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Currently Being Cleaned
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rooms with cleaning in progress
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
            {filteredRooms
              .filter((r) => r.cleaning_status === "in-progress")
              .map((room) => (
                <div
                  key={room.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {room.room_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Booking: {room.booking_id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCleaningStatusUpdate(room.id, "cleaned")}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                  >
                    Mark Cleaned
                  </button>
                </div>
              ))}
            {filteredRooms.filter((r) => r.cleaning_status === "in-progress").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No rooms currently being cleaned
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cleaned - Awaiting Inspection
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rooms that have been cleaned and need inspection
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
            {filteredRooms
              .filter((r) => r.cleaning_status === "cleaned")
              .map((room) => (
                <div
                  key={room.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {room.room_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Booking: {room.booking_id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCleaningStatusUpdate(room.id, "inspected")}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                  >
                    Approve Inspection
                  </button>
                </div>
              ))}
            {filteredRooms.filter((r) => r.cleaning_status === "cleaned").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No rooms awaiting inspection
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ready for Guests
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rooms that are inspected and ready
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
            {filteredRooms
              .filter((r) => r.cleaning_status === "inspected" && r.roomStatus === "available")
              .map((room) => (
                <div
                  key={room.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {room.room_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Booking: {room.booking_id}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                </div>
              ))}
            {filteredRooms.filter(
              (r) => r.cleaning_status === "inspected" && r.roomStatus === "available"
            ).length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No rooms currently ready for guests
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
