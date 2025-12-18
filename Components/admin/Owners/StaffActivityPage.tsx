"use client";

import {
  Plus,
  Trash2,
  Clock,
  User,
  LogIn,
  LogOut,
  Edit,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useGetEmployeesQuery, useDeleteEmployeeMutation } from "@/redux/api/employeeApi";
import toast from "react-hot-toast";
import Image from "next/image";

interface ActivityLog {
  id: number;
  timestamp: string;
  staffName: string;
  role: string;
  action: string;
  details: string;
  type: "login" | "logout" | "task_complete" | "task_pending" | "update" | "other";
}

const StaffActivityPage = ({ onCreateClick, onEditClick }: any) => {
  const [tab, setTab] = useState("activity");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Fetch employees from API
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({});
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();

  const employees = employeesData?.data || [];

  // Sample activity log data
  const activityLogs: ActivityLog[] = [
    {
      id: 1,
      timestamp: "2025-01-11 2:30 PM",
      staffName: "Maria Santos",
      role: "Cleaner",
      action: "Login",
      details: "Logged in from Mobile App",
      type: "login",
    },
    {
      id: 2,
      timestamp: "2025-01-11 1:15 PM",
      staffName: "Juan Dela Cruz",
      role: "CSR",
      action: "Task Completed",
      details: "Completed guest check-in for Haven 2",
      type: "task_complete",
    },
    {
      id: 3,
      timestamp: "2025-01-11 12:45 PM",
      staffName: "Carlos Reyes",
      role: "Manager",
      action: "Updated",
      details: "Updated Haven 3 availability status",
      type: "update",
    },
    {
      id: 4,
      timestamp: "2025-01-11 12:00 PM",
      staffName: "Rosa Garcia",
      role: "Cleaner",
      action: "Login",
      details: "Logged in from Admin Portal",
      type: "login",
    },
    {
      id: 5,
      timestamp: "2025-01-11 11:30 AM",
      staffName: "Pedro Cruz",
      role: "CSR",
      action: "Task Completed",
      details: "Processed payment for booking BK-2025-045",
      type: "task_complete",
    },
    {
      id: 6,
      timestamp: "2025-01-11 11:00 AM",
      staffName: "Anna Martinez",
      role: "Cleaner",
      action: "Task Completed",
      details: "Cleaned Haven 5 - Ready for next guest",
      type: "task_complete",
    },
    {
      id: 7,
      timestamp: "2025-01-11 10:45 AM",
      staffName: "Luis Reyes",
      role: "Partner",
      action: "Logout",
      details: "Logged out from Admin Portal",
      type: "logout",
    },
    {
      id: 8,
      timestamp: "2025-01-11 10:30 AM",
      staffName: "Sofia Santos",
      role: "CSR",
      action: "Task Pending",
      details: "Assigned to handle guest inquiry #234",
      type: "task_pending",
    },
    {
      id: 9,
      timestamp: "2025-01-11 10:15 AM",
      staffName: "Miguel Garcia",
      role: "Manager",
      action: "Updated",
      details: "Modified staff schedule for next week",
      type: "update",
    },
    {
      id: 10,
      timestamp: "2025-01-11 10:00 AM",
      staffName: "Carmen Lopez",
      role: "Cleaner",
      action: "Task Completed",
      details: "Cleaned Haven 1 and restocked amenities",
      type: "task_complete",
    },
  ];

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      log.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case "login":
        return <LogIn className="w-5 h-5 text-green-600" />;
      case "logout":
        return <LogOut className="w-5 h-5 text-gray-600" />;
      case "task_complete":
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case "task_pending":
        return <Clock className="w-5 h-5 text-orange-600" />;
      case "update":
        return <Edit className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "login":
        return "bg-green-100 text-green-700";
      case "logout":
        return "bg-gray-100 text-gray-700";
      case "task_complete":
        return "bg-blue-100 text-blue-700";
      case "task_pending":
        return "bg-orange-100 text-orange-700";
      case "update":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Staff Management</h2>
        <button
          onClick={onCreateClick}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Employee
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setTab("activity")}
          className={`pb-3 font-semibold whitespace-nowrap ${
            tab === "activity"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-600"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setTab("users")}
          className={`pb-3 font-semibold whitespace-nowrap ${
            tab === "users"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-600"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`pb-3 font-semibold whitespace-nowrap ${
            tab === "logs"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-600"
          }`}
        >
          Activity Log
        </button>
      </div>

      {tab === "activity" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { title: "Active CSR", count: "5" },
            { title: "Active Cleaners", count: "8" },
            { title: "Logged Out", count: "3" },
            { title: "Total", count: "13" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-6 text-center animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {stat.title}
              </p>
              <p className="text-4xl font-bold text-orange-600">{stat.count}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {isLoadingEmployees ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No employees found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Click "Create Employee" to add your first team member
                </p>
              </div>
            ) : (
              <div className="space-y-3">
              {employees
                .filter((user: any) =>
                  user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.role?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user: any, i: number) => (
                  <div
                    key={user.id}
                    className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:border-orange-300 transition-colors animate-in fade-in duration-500"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      {user.profile_image_url ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={user.profile_image_url}
                            alt={`${user.first_name} ${user.last_name}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-800">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role} • {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            📱 {user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          user.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedEmployee(user);
                          onEditClick(user);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Employee"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) {
                            try {
                              await deleteEmployee(user.id).unwrap();
                              toast.success(`Successfully deleted ${user.first_name} ${user.last_name}`);
                            } catch (error: any) {
                              toast.error(error?.data?.error || "Failed to delete employee");
                            }
                          }
                        }}
                        disabled={isDeleting}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Employee"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-4">
          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by staff name, action, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              >
                <option value="all">All Activities</option>
                <option value="login">Logins</option>
                <option value="logout">Logouts</option>
                <option value="task_complete">Tasks Completed</option>
                <option value="task_pending">Tasks Pending</option>
                <option value="update">Updates</option>
              </select>
            </div>
          </div>

          {/* Activity Log Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b-2 border-orange-200">
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Time
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Staff Member
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Action
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                      Details
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-600 font-medium">
                            No activity logs found
                          </p>
                          <p className="text-sm text-gray-500">
                            Try adjusting your search or filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-100 hover:bg-orange-50 transition-colors animate-in fade-in duration-500"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {log.timestamp}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                              {log.staffName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {log.staffName}
                              </p>
                              <p className="text-xs text-gray-500">{log.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.type)}
                            <span className="text-sm font-medium text-gray-800">
                              {log.action}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">
                            {log.details}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${getActionColor(
                              log.type
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredLogs.length} of {activityLogs.length}{" "}
                  activities
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Previous
                  </button>
                  <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    1
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffActivityPage;