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
import {
  useGetBookingsQuery,
  useUpdateCleaningStatusMutation,
} from "@/redux/api/bookingsApi";
import toast from "react-hot-toast";

type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "confirmed"
  | "checked-in"
  | "completed"
  | "cancelled";

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

export default function CleaningManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>("all");
  const [cleaningStatusFilter, setCleaningStatusFilter] = useState<string>("all");
  const [selectedCleaningId, setSelectedCleaningId] = useState<string | null>(null);
  const [cleanerName, setCleanerName] = useState("");

  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
  } = useGetBookingsQuery({});

  const [updateCleaningStatus] = useUpdateCleaningStatusMutation();

  // Filter states
  const filteredRooms = useMemo(() => {
    return bookings.filter((booking: any) => {
      const matchesSearch = 
        booking.room_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guest_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_id?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRoomStatus = 
        roomStatusFilter === "all" || 
        (roomStatusFilter === "available" && booking.status === "completed") ||
        (roomStatusFilter === "occupied" && ["checked-in", "confirmed"].includes(String(booking.status ?? ""))) ||
        (roomStatusFilter === "checkout-pending" && booking.status === "checked-in");

      const matchesCleaningStatus = 
        cleaningStatusFilter === "all" || 
        booking.cleaning_status === cleaningStatusFilter;

      return matchesSearch && matchesRoomStatus && matchesCleaningStatus;
    });
  }, [bookings, searchTerm, roomStatusFilter, cleaningStatusFilter]);

  // Handle cleaning status update
  const handleCleaningStatusUpdate = async (
    bookingId: string,
    newStatus: CleaningStatus,
  ) => {
    try {
      await updateCleaningStatus({
        id: bookingId || "",
        cleaning_status: newStatus,
      }).unwrap();
      
      toast.success(`Cleaning status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      console.error("Error updating cleaning status:", error);
      toast.error("Failed to update cleaning status");
    }
  };

  // Handle assign cleaner
  const handleAssignCleaner = () => {
    // TODO: Implement assign cleaner logic
    console.log('Assign cleaner:', cleanerName, 'to room:', selectedCleaningId);
    toast.success(`Cleaner ${cleanerName || 'Unknown'} assigned to room`);
    setSelectedCleaningId(null);
    setCleanerName('');
  };

  // Stats calculations
  const totalRooms = filteredRooms.length;
  const availableCount = filteredRooms.filter(
    (room) => room.status === "completed"
  ).length;
  const occupiedCount = filteredRooms.filter(
    (room) => ["checked-in", "confirmed"].includes(String(room.status ?? ""))
  ).length;
  const checkoutPendingCount = filteredRooms.filter(
    (room) => room.status === "checked-in"
  ).length;
  const cleaningPendingCount = filteredRooms.filter(
    (room) => room.cleaning_status === "pending"
  ).length;
  const totalTasks = filteredRooms.length;
  const cleaningInProgressCount = filteredRooms.filter(
    (room) => room.cleaning_status === "in-progress"
  ).length;

  const statCards = [
    {
      title: "Total Rooms",
      value: totalRooms,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Available",
      value: availableCount,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Occupied",
      value: occupiedCount,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Checkout Pending",
      value: checkoutPendingCount,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Cleaning Pending",
      value: cleaningPendingCount,
      icon: Wrench,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "In Progress",
      value: cleaningInProgressCount,
      icon: Sparkles,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "in-progress":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "cleaned":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "inspected":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50";
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
      case "checked-in":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
      case "completed":
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error loading cleaning data</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Cleaning Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage room cleaning status and assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} dark:bg-opacity-10 rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by room, guest, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          
          <select
            value={roomStatusFilter}
            onChange={(e) => setRoomStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="all">All Room Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="checkout-pending">Checkout Pending</option>
          </select>

          <select
            value={cleaningStatusFilter}
            onChange={(e) => setCleaningStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="all">All Cleaning Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="cleaned">Cleaned</option>
            <option value="inspected">Inspected</option>
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Room Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cleaning Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Check-in/Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRooms.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {booking.room_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {booking.guest_first_name} {booking.guest_last_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {booking.guest_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {booking.booking_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoomStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        booking.cleaning_status
                      )}`}
                    >
                      {booking.cleaning_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      In: {new Date(booking.check_in_date).toLocaleDateString()}
                    </div>
                    <div>
                      Out: {new Date(booking.check_out_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {booking.cleaning_status === "pending" && (
                        <button
                          onClick={() =>
                            handleCleaningStatusUpdate(booking.id, "in-progress")
                          }
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          Start Cleaning
                        </button>
                      )}
                      {booking.cleaning_status === "in-progress" && (
                        <button
                          onClick={() =>
                            handleCleaningStatusUpdate(booking.id, "cleaned")
                          }
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          Mark Cleaned
                        </button>
                      )}
                      {booking.cleaning_status === "cleaned" && (
                        <button
                          onClick={() =>
                            handleCleaningStatusUpdate(booking.id, "inspected")
                          }
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                        >
                          Mark Inspected
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCleaningId(booking.id)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      >
                        Assign Cleaner
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Cleaner Modal */}
      {selectedCleaningId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border dark:border-gray-700 w-full max-w-md shadow-2xl rounded-xl bg-white dark:bg-gray-800 animate-in zoom-in-95 duration-200">
            <div className="mt-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Assign Cleaner
              </h3>
              <input
                type="text"
                placeholder="Enter cleaner name"
                value={cleanerName}
                onChange={(e) => setCleanerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-6"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedCleaningId(null);
                    setCleanerName("");
                  }}
                  className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCleaner}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
