"use client";

import {
  Plus,
  Trash2,
  Clock,
  User,
  Users,
  UsersRound,
  LogIn,
  LogOut,
  Edit,
  CheckCircle,
  FileText,
  Search,
  Loader2,
} from "lucide-react";


import { useState } from "react";
import { useGetEmployeesQuery, useDeleteEmployeeMutation } from "@/redux/api/employeeApi";
import { useGetActivityLogsQuery, useGetActivityStatsQuery } from "@/redux/api/activityLogApi";
import toast from "react-hot-toast";
import Image from "next/image";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: string;
  phone?: string;
  status?: string;
  profile_image_url?: string;
  [key: string]: unknown;
}

interface ActivityLog {
  id: string;
  first_name?: string;
  last_name?: string;
  action: string;
  action_type: string;
  details?: string;
  created_at: string;
  role?: string;
  profile_image_url?: string;
  [key: string]: unknown;
}

interface StaffActivityPageProps {
  onCreateClick: () => void;
  onEditClick: (employee: Employee) => void;
}



/*main component*/

const StaffActivityPage = ({ onCreateClick, onEditClick }: StaffActivityPageProps) => {
  //const [tab, setTab] = useState("activity");//
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Fetch employees from API
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({});
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();

  // Fetch activity logs and stats from API
  const { data: activityLogsData, isLoading: isLoadingLogs } = useGetActivityLogsQuery({
    action_type: filterType !== "all" ? filterType : undefined,
    limit: 30,
  });
  const { data: statsData, isLoading: isLoadingStats } = useGetActivityStatsQuery({});

  const employees = employeesData?.data || [];
      const filteredEmployees = employees.filter((user: Employee) => {
        const query = searchQuery.toLowerCase();

        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const email = user.email?.toLowerCase() || "";
        const role = user.role?.toLowerCase() || "";
        const phone = user.phone?.toLowerCase() || "";
        const id = user.id?.toLowerCase() || "";

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          role.includes(query) ||
          phone.includes(query) ||
          id.includes(query)
        );
      });

  const activityLogs = activityLogsData?.data || [];
  const stats = statsData?.data || { active_csr: 0, active_cleaners: 0, logged_out: 0, total: 0 };

  const filteredLogs = activityLogs.filter((log: ActivityLog) => {
    const staffName = `${log.first_name || ''} ${log.last_name || ''}`.toLowerCase();
    const matchesSearch =
      staffName.includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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

  const statCards = [
  {
    title: "Active CSR",
    count: stats.active_csr,
    color: "from-pink-500 to-pink-400",
    icon: <User className="w-10 h-10 text-white/40" />,
  },
  {
    title: "Active Cleaners",
    count: stats.active_cleaners,
    color: "from-green-500 to-green-400",
    icon: <Users className="w-10 h-10 text-white/40" />,
  },
  {
    title: "Logged Out",
    count: stats.logged_out,
    color: "from-yellow-500 to-yellow-400",
    icon: <LogOut className="w-10 h-10 text-white/40" />,
  },
  {
    title: "Total Staff",
    count: stats.total,
    color: "from-red-500 to-red-400",
    icon: <UsersRound className="w-10 h-10 text-white/40" />,
  },
];


  return (
    <div className="space-y-6 animate-in fade-in duration-700">
    {/* Header */}
<div className="flex justify-between items-center">
    <div className="flex flex-col">
    <h2 className="text-3xl font-bold">Staff Management</h2>
    <span className="text-gray-500 mt-1">
      Manage staff accounts, roles, and monitor activity logs
    </span>
    </div>

  <button
    onClick={onCreateClick}
    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
  >
    <Plus className="w-5 h-5" />
    Create Employee
  </button>
</div>


    {/* STATS */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {isLoadingStats ? (
    <div className="col-span-4 flex justify-center py-12">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  ) : (
    statCards.map((stat, i) => (
      <div
        key={i}
        className={`relative rounded-xl p-6 text-white shadow-lg bg-gradient-to-r ${stat.color}`}
      >
        <p className="text-sm font-semibold opacity-90">{stat.title}</p>
        <p className="text-4xl font-bold mt-2">{stat.count}</p>

        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {stat.icon}
        </div>
      </div>
    ))
  )}
</div>


{/* Search */}
<div className="bg-white rounded-xl shadow p-4">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      placeholder="Search by name, email, role..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
    />
  </div>
</div>

{/* Users Table */}
<div className="bg-white rounded-xl shadow overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
        <th className="px-6 py-4 text-left text-sm font-semibold">Number</th>
        <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
        <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredEmployees.map((user: Employee) => (
        <tr key={user.id} className="border-t hover:bg-orange-50">
    <td className="px-6 py-4 flex items-center gap-3">
              {user.profile_image_url ? (
    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <Image
                src={user.profile_image_url}
                alt={`${user.first_name} ${user.last_name}`}
                fill
                className="object-cover"/>
    </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold flex-shrink-0">
            {user.first_name?.[0] ?? "U"}
        </div>
      )}

        <div className="flex flex-col">
          <span className="font-medium">
            {user.first_name} {user.last_name}
          </span>
            <span className="text-xs text-gray-500">
              ID: {user.id}
            </span>
        </div>
    </td>

          <td className="px-6 py-4">{user.role}</td>
          <td className="px-6 py-4">{user.email}</td>
          <td className="px-6 py-4">
            {user.phone ? (
              <span className="text-gray-800">{user.phone}</span>
            ) : (
              <span className="text-gray-800 text-sm">N/A</span>
            )}
          </td>
          <td className="px-6 py-4 text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              user.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {user.status}
            </span>
          </td>
          <td className="px-6 py-4 text-center flex justify-center gap-2">
            <button onClick={() => onEditClick(user)} className="text-blue-600">
              <Edit size={16} />
            </button>
            <button onClick={() => deleteEmployee(user.id)} className="text-red-600">
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        <h3 className="text-xl font-bold mt-10">Activity Logs</h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">

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
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex justify-center items-center">
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
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
                    filteredLogs.map((log: ActivityLog, index: number) => {
                      const staffName = `${log.first_name || ''} ${log.last_name || ''}`.trim();
                      const initial = staffName.charAt(0) || 'U';
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-gray-100 hover:bg-orange-50 transition-colors animate-in fade-in duration-500"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {formatTimestamp(log.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {log.profile_image_url ? (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                  <Image
                                    src={log.profile_image_url}
                                    alt={staffName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                  {initial}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {staffName}
                                </p>
                                <p className="text-xs text-gray-500">{log.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action_type)}
                              <span className="text-sm font-medium text-gray-800">
                                {log.action}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-600">
                              {log.details || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${getActionColor(
                                log.action_type
                              )}`}
                            >
                              {log.action}
                            </span>
                          </td>
                        </tr>
                      );
                    })
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
      </div>
    );
 };

export default StaffActivityPage;