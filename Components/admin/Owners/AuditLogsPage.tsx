'use client';

import { Shield, User, Calendar, Activity, Filter } from "lucide-react";
import { useState } from "react";

const AuditLogsPage = () => {
  const [filterType, setFilterType] = useState("all");

  const auditLogs = [
    {
      id: "LOG-001",
      action: "User Login",
      user: "admin@staycation.com",
      userRole: "Owner",
      timestamp: "2024-12-17 10:30:45",
      ipAddress: "192.168.1.100",
      details: "Successful login from Chrome browser",
      type: "auth",
      severity: "info"
    },
    {
      id: "LOG-002",
      action: "Haven Created",
      user: "admin@staycation.com",
      userRole: "Owner",
      timestamp: "2024-12-17 09:15:22",
      ipAddress: "192.168.1.100",
      details: "Created new haven: Haven A - City View",
      type: "create",
      severity: "info"
    },
    {
      id: "LOG-003",
      action: "Booking Modified",
      user: "staff@staycation.com",
      userRole: "Staff",
      timestamp: "2024-12-17 08:45:10",
      ipAddress: "192.168.1.105",
      details: "Updated booking BK-2024-001 - Changed check-in date",
      type: "update",
      severity: "warning"
    },
    {
      id: "LOG-004",
      action: "Failed Login Attempt",
      user: "unknown@example.com",
      userRole: "N/A",
      timestamp: "2024-12-17 07:22:33",
      ipAddress: "203.123.45.67",
      details: "Failed login attempt - Invalid credentials",
      type: "auth",
      severity: "error"
    },
    {
      id: "LOG-005",
      action: "Pricing Updated",
      user: "admin@staycation.com",
      userRole: "Owner",
      timestamp: "2024-12-16 16:30:12",
      ipAddress: "192.168.1.100",
      details: "Updated weekend rates for all havens",
      type: "update",
      severity: "info"
    },
    {
      id: "LOG-006",
      action: "User Created",
      user: "admin@staycation.com",
      userRole: "Owner",
      timestamp: "2024-12-16 14:20:05",
      ipAddress: "192.168.1.100",
      details: "Created new staff account: staff2@staycation.com",
      type: "create",
      severity: "info"
    },
    {
      id: "LOG-007",
      action: "Haven Deleted",
      user: "admin@staycation.com",
      userRole: "Owner",
      timestamp: "2024-12-16 11:10:45",
      ipAddress: "192.168.1.100",
      details: "Deleted haven: Haven E - Test Unit",
      type: "delete",
      severity: "critical"
    },
    {
      id: "LOG-008",
      action: "Settings Changed",
      user: "admin@staycation.com",
      userRole: "Owner",
      timestamp: "2024-12-15 15:45:30",
      ipAddress: "192.168.1.100",
      details: "Updated system notification settings",
      type: "update",
      severity: "info"
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info": return "bg-blue-100 text-blue-700";
      case "warning": return "bg-yellow-100 text-yellow-700";
      case "error": return "bg-orange-100 text-orange-700";
      case "critical": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "auth": return "🔐";
      case "create": return "➕";
      case "update": return "✏️";
      case "delete": return "🗑️";
      default: return "📝";
    }
  };

  const filtered = filterType === "all" ? auditLogs : auditLogs.filter(log => log.type === filterType);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Audit Logs</h1>
        <p className="text-gray-600">Monitor all system activities and security events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-gray-500">Total Events</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">1,247</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-500">Active Users</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">8</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-red-500" />
            <p className="text-sm text-gray-500">Security Events</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">3</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            <p className="text-sm text-gray-500">Today's Events</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">24</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2 overflow-x-auto">
            {["all", "auth", "create", "update", "delete"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filterType === type ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">IP Address</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-2xl">{getTypeIcon(log.type)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{log.action}</p>
                    <p className="text-sm text-gray-500">{log.details}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">{log.user}</p>
                    <p className="text-xs text-gray-500">{log.userRole}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{log.timestamp}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-gray-600">{log.ipAddress}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(log.severity)}`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
