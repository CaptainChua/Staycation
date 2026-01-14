"use client";

import { useState } from "react";
import { Users, Home, CheckCircle, AlertCircle, Wrench, Filter, Search, UserPlus, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface Room {
  id: string;
  roomNumber: string;
  status: "occupied" | "available" | "cleaning";
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  assignedCleaner?: string;
  cleanerContact?: string;
  lastCleaned?: string;
}

const RoomManagement = () => {
  // Static data for demonstration
  const [rooms] = useState<Room[]>([
    {
      id: "1",
      roomNumber: "101",
      status: "occupied",
      guestName: "John Doe",
      checkIn: "2024-01-14",
      checkOut: "2024-01-16",
      assignedCleaner: "Maria Santos",
      cleanerContact: "+63 912 345 6789",
      lastCleaned: "2024-01-13"
    },
    {
      id: "2", 
      roomNumber: "102",
      status: "occupied",
      guestName: "Jane Smith",
      checkIn: "2024-01-13",
      checkOut: "2024-01-17",
      assignedCleaner: "Carlos Rodriguez",
      cleanerContact: "+63 912 345 6790",
      lastCleaned: "2024-01-12"
    },
    {
      id: "3",
      roomNumber: "103",
      status: "cleaning",
      assignedCleaner: "Ana Lopez",
      cleanerContact: "+63 912 345 6791",
      lastCleaned: "2024-01-14"
    },
    {
      id: "4",
      roomNumber: "104",
      status: "available",
      lastCleaned: "2024-01-14"
    },
    {
      id: "5",
      roomNumber: "105",
      status: "occupied",
      guestName: "Robert Johnson",
      checkIn: "2024-01-12",
      checkOut: "2024-01-18",
      assignedCleaner: "Luis Martinez",
      cleanerContact: "+63 912 345 6792",
      lastCleaned: "2024-01-11"
    }
  ]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "occupied" | "available" | "cleaning">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Filter rooms based on status and search
  const filteredRooms = rooms.filter(room => {
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.assignedCleaner?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRooms.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  const getStatusColor = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200";
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "cleaning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return <Users className="w-4 h-4" />;
      case "available":
        return <CheckCircle className="w-4 h-4" />;
      case "cleaning":
        return <Wrench className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: Room["status"]) => {
    switch (status) {
      case "occupied":
        return "Occupied";
      case "available":
        return "Available";
      case "cleaning":
        return "Cleaning";
      default:
        return "Unknown";
    }
  };

  const totalRooms = filteredRooms.length;
  const availableCount = filteredRooms.filter((room) => room.status === "available").length;
  const occupiedCount = filteredRooms.filter((room) => room.status === "occupied").length;
  const cleaningCount = filteredRooms.filter((room) => room.status === "cleaning").length;

  const statCards = [
    {
      id: "total",
      label: "Total Rooms",
      value: totalRooms,
      color: "bg-blue-500",
      Icon: Home,
    },
    {
      id: "available",
      label: "Available",
      value: availableCount,
      color: "bg-green-500",
      Icon: CheckCircle,
    },
    {
      id: "occupied",
      label: "Occupied",
      value: occupiedCount,
      color: "bg-red-500",
      Icon: Users,
    },
    {
      id: "cleaning",
      label: "In Cleaning",
      value: cleaningCount,
      color: "bg-amber-500",
      Icon: Wrench,
    },
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="occupied">Occupied</option>
                <option value="available">Available</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Room</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Guest</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Check In</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Check Out</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Cleaner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Last Cleaned</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{room.roomNumber}</td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{getStatusText(room.status)}</td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{room.guestName || "N/A"}</td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{room.checkIn || "N/A"}</td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{room.checkOut || "N/A"}</td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{room.assignedCleaner || "Unassigned"}</td>
                  <td className="px-6 py-4 text-left text-sm text-gray-600 dark:text-gray-300">{room.lastCleaned || "Unknown"}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">Actions</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Pagination */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {paginatedRooms.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredRooms.length)} of {filteredRooms.length} rooms
            </p>
            <div className="flex gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Show</label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <label className="text-sm text-gray-600 whitespace-nowrap">entries</label>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || totalPages === 0}
              className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="First Page"
              type="button"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    currentPage === pageNum
                      ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md"
                      : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                  disabled={totalPages === 0}
                  type="button"
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last Page"
              type="button"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today&apos;s Cleaning Schedule</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Rooms to monitor closely for the next shift</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredRooms
              .filter((r) => r.status === "cleaning" || r.status === "occupied")
              .map((room) => (
                <div key={room.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">Room {room.roomNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Guest: {room.guestName || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {room.assignedCleaner || "Unassigned"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{room.status === "cleaning" ? "Currently cleaning" : "Awaiting cleaning"}</p>
                  </div>
                </div>
              ))}
            {filteredRooms.filter((r) => r.status === "cleaning" || r.status === "occupied").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Nothing scheduled for today. All rooms are clear!
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
            {filteredRooms
              .filter((r) => r.status === "available")
              .map((room) => (
                <div key={room.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">Room {room.roomNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last cleaned: {room.lastCleaned || "Unknown"}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    Needs Assignment
                  </span>
                </div>
              ))}
            {filteredRooms.filter((r) => r.status === "available").length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                All available rooms already have post-stay cleaning planned.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;