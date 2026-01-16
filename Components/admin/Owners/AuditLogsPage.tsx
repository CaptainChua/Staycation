'use client';

import { Shield, User, Calendar, Activity, Filter, TrendingUp, TrendingDown, Lock, Plus, Pencil, Trash2, FileText } from "lucide-react";
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
      case "auth": return <Lock className="w-5 h-5 text-blue-500" />;
      case "create": return <Plus className="w-5 h-5 text-green-500" />;
      case "update": return <Pencil className="w-5 h-5 text-amber-500" />;
      case "delete": return <Trash2 className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const filtered = filterType === "all" ? auditLogs : auditLogs.filter(log => log.type === filterType);

  // Define stats to match AnalyticsClient structure
  const stats = [
    {
      label: "Total Events",
      value: "1,247",
      change: "+12%",
      trending: "up",
      icon: Activity,
      color: "bg-blue-500" // Match AnalyticsClient/Bookings color
    },
    {
      label: "Active Users",
      value: "8",
      change: "+2",
      trending: "up",
      icon: User,
      color: "bg-green-500" // Match AnalyticsClient/Bookings color
    },
    {
      label: "Security Events",
      value: "3",
      change: "-50%",
      trending: "down",
      icon: Shield,
      color: "bg-indigo-500" // Using Indigo to match generic card style, or could be red if critical
    },
    {
      label: "Today's Events",
      value: "24",
      change: "+5",
      trending: "up",
      icon: Calendar,
      color: "bg-yellow-500" // Match AnalyticsClient/Bookings color
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching AnalyticsClient style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor all system activities and security events</p>
        </div>
      </div>

      {/* Stats Cards - Matching AnalyticsClient style */}
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

      {/* Filters - Styled to match card container style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex gap-2 overflow-x-auto">
            {["all", "auth", "create", "update", "delete"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filterType === type 
                    ? "bg-brand-primary text-white" 
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table - Matching AnalyticsClient table style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Type</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Action</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">User</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Timestamp</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">IP Address</th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr 
                  key={log.id} 
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg inline-block">
                      {getTypeIcon(log.type)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{log.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{log.details}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{log.user}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{log.userRole}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{log.timestamp}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-300">{log.ipAddress}</p>
                  </td>
                  <td className="py-4 px-4">
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
