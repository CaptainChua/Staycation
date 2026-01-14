'use client';

import { Wrench, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, ListTodo } from "lucide-react";
import { useState } from "react";

const MaintenancePage = () => {
  const [filter, setFilter] = useState("all");

  const maintenanceRequests = [
    {
      id: "MNT-001",
      haven: "Haven A - City View",
      issue: "Air conditioning not cooling properly",
      priority: "high",
      status: "pending",
      reportedBy: "Juan Dela Cruz",
      reportedDate: "2024-12-17",
      assignedTo: "Maintenance Team A"
    },
    {
      id: "MNT-002",
      haven: "Haven B - Ocean View",
      issue: "Leaking faucet in bathroom",
      priority: "medium",
      status: "in-progress",
      reportedBy: "Maria Santos",
      reportedDate: "2024-12-16",
      assignedTo: "Maintenance Team B"
    },
    {
      id: "MNT-003",
      haven: "Haven C - Pool View",
      issue: "Broken TV remote",
      priority: "low",
      status: "completed",
      reportedBy: "Pedro Reyes",
      reportedDate: "2024-12-15",
      assignedTo: "Maintenance Team A",
      completedDate: "2024-12-16"
    },
    {
      id: "MNT-004",
      haven: "Haven D - Garden View",
      issue: "WiFi not working",
      priority: "high",
      status: "in-progress",
      reportedBy: "Ana Garcia",
      reportedDate: "2024-12-17",
      assignedTo: "IT Team"
    },
  ];

  // Calculate stats for cards matching Analytics page style
  const totalRequests = maintenanceRequests.length;
  const pendingCount = maintenanceRequests.filter(r => r.status === "pending").length;
  const inProgressCount = maintenanceRequests.filter(r => r.status === "in-progress").length;
  const completedCount = maintenanceRequests.filter(r => r.status === "completed").length;

  // Stats cards matching Analytics page style with colored backgrounds
  const stats = [
    { label: "Total Requests", value: totalRequests.toString(), icon: ListTodo, color: "bg-green-500", change: "+2", trending: "up" },
    { label: "Pending", value: pendingCount.toString(), icon: Clock, color: "bg-blue-500", change: "+1", trending: "up" },
    { label: "In Progress", value: inProgressCount.toString(), icon: Wrench, color: "bg-indigo-500", change: "+1", trending: "up" },
    { label: "Completed", value: completedCount.toString(), icon: CheckCircle, color: "bg-yellow-500", change: "+1", trending: "up" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-yellow-600 dark:text-yellow-400";
      case "in-progress": return "text-blue-600 dark:text-blue-400";
      case "completed": return "text-green-600 dark:text-green-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const filtered = filter === "all" ? maintenanceRequests : maintenanceRequests.filter(r => r.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching Analytics page style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Maintenance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and manage maintenance requests</p>
        </div>
      </div>

      {/* Stats Cards - Matching Analytics page style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  {/* Show trend indicator below value */}
                  <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${stat.trending === 'up' ? 'text-green-100' : 'text-red-100'}`}>
                    {stat.trending === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance Requests - Matching Analytics page table style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Maintenance Requests</h2>
          {/* Filters - Matching Analytics page styling */}
          <div className="flex gap-2 overflow-x-auto">
            {["all", "pending", "in-progress", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                  filter === status 
                    ? "bg-brand-primary text-white" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Request ID
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Issue
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Haven
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Status
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Priority
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Assigned To
                </th>
                <th className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No maintenance requests available.
                  </td>
                </tr>
              ) : (
                filtered.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{request.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{request.issue}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{request.haven}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-sm font-semibold ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{request.assignedTo}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {new Date(request.reportedDate).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
