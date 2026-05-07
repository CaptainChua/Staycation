'use client';

import OwnerPageHeader from "./OwnerPageHeader";
import { Shield, User, Calendar, Activity, Filter, TrendingUp, Lock, Plus, Pencil, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

interface AuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  userRole: string;
  timestamp: string;
  ipAddress: string;
  type: string;
  severity: string;
}

const PAGE_SIZE = 50;

const AuditLogsPage = () => {
  const [filterType, setFilterType] = useState("all");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(page * PAGE_SIZE),
          type: filterType,
        });
        const res = await fetch(`/api/admin/audit-logs?${params}`);
        const data = await res.json();
        if (data.success) {
          setLogs(data.data);
          setTotal(data.total);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [page, filterType]);

  // Reset to page 0 when filter changes
  const handleFilterChange = (type: string) => {
    setFilterType(type);
    setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const todayCount = useMemo(() => {
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return logs.filter(l => l.timestamp.startsWith(today.split('/').reverse().join('/'))).length;
  }, [logs]);

  const securityCount = useMemo(() => logs.filter(l => l.severity === 'error' || l.severity === 'critical').length, [logs]);
  const activeUsers = useMemo(() => new Set(logs.map(l => l.user)).size, [logs]);

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

  const stats = [
    { label: "Total Events", value: total.toLocaleString(), icon: Activity, color: "bg-blue-500" },
    { label: "Active Users", value: String(activeUsers), icon: User, color: "bg-green-500" },
    { label: "Security Events", value: String(securityCount), icon: Shield, color: "bg-indigo-500" },
    { label: "Today's Events", value: String(todayCount), icon: Calendar, color: "bg-yellow-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <OwnerPageHeader
        title="Audit Logs"
        description="Monitor all system activities and security events"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`${stat.color} text-white rounded-lg p-6 shadow hover:shadow-lg transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{isLoading ? "—" : stat.value}</p>
                  <div className="flex items-center gap-1 text-xs font-semibold mt-2 text-green-100">
                    <TrendingUp className="w-3 h-3" />
                    Live
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex gap-2 overflow-x-auto">
            {["all", "auth", "create", "update", "delete"].map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange(type)}
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

      {/* Logs Table */}
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
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">No audit logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || isLoading}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || isLoading}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
