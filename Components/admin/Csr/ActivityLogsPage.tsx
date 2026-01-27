"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Loader2
} from "lucide-react";

// Highlight text function
const highlightText = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-medium">
        {part}
      </span>
    ) : (
      part
    )
  );
};

interface ActivityLog {
  id: string;
  employee_id: string;
  activity_type: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  profile_image_url?: string;
}

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(logs.length / entriesPerPage);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    return logs.filter((log) => {
      const matchesSearch =
        (log.activity_type && log.activity_type.toLowerCase().includes(term)) ||
        (log.description && log.description.toLowerCase().includes(term)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(term)) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(term)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(term));

      const matchesActionFilter = filterAction === "all" || log.activity_type === filterAction;
      
      let matchesDateFilter = false;
      
      if (filterDateRange === "all") {
        matchesDateFilter = true;
      } else if (filterDateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const logDate = new Date(log.created_at);
        matchesDateFilter = logDate >= today && logDate < tomorrow;
      } else if (filterDateRange === "yesterday") {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const logDate = new Date(log.created_at);
        matchesDateFilter = logDate >= yesterday && logDate < today;
      } else if (filterDateRange === "last_7_days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const logDate = new Date(log.created_at);
        matchesDateFilter = logDate >= sevenDaysAgo;
      } else if (filterDateRange === "last_30_days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const logDate = new Date(log.created_at);
        matchesDateFilter = logDate >= thirtyDaysAgo;
      } else if (filterDateRange === "custom" && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        const logDate = new Date(log.created_at);
        matchesDateFilter = logDate >= startDate && logDate <= endDate;
      }

      return matchesSearch && matchesActionFilter && matchesDateFilter;
    });
  }, [logs, searchTerm, filterAction, filterDateRange, customStartDate, customEndDate]);

  // Calculate pagination for filtered logs
  const { paginatedLogs, filteredTotalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const paginated = filteredLogs.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredLogs.length / entriesPerPage);
    
    return {
      paginatedLogs: paginated,
      filteredTotalPages: totalPages
    };
  }, [filteredLogs, currentPage, entriesPerPage]);

  const fetchActivityLogs = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      // Fetch all data without pagination for client-side filtering
      const params = new URLSearchParams({
        employee_id: userId,
      });

      const response = await fetch(`/api/admin/activity-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [userId]);

  const getActionIcon = (activityType: string) => {
    if (!activityType) {
      return <Activity className="w-4 h-4 text-gray-500" />;
    }
    switch (activityType.toLowerCase()) {
      case 'login':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'logout':
        return <User className="w-4 h-4 text-red-500" />;
      case 'create_booking':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'update_booking':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      case 'update_deposit_status':
      case 'process_full_refund':
      case 'process_partial_refund':
      case 'process_forfeiture':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionColor = (activityType: string) => {
    if (!activityType) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
    switch (activityType.toLowerCase()) {
      case 'login':
        return 'bg-blue-500 text-white';
      case 'logout':
        return 'bg-red-500 text-white';
      case 'create_booking':
        return 'bg-green-500 text-white';
      case 'update_booking':
        return 'bg-yellow-500 text-white';
      case 'update_deposit_status':
      case 'process_full_refund':
      case 'process_partial_refund':
      case 'process_forfeiture':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create_booking', label: 'Create Booking' },
    { value: 'update_booking', label: 'Update Booking' },
    { value: 'update_deposit_status', label: 'Update Deposit Status' },
    { value: 'process_full_refund', label: 'Process Full Refund' },
    { value: 'process_partial_refund', label: 'Process Partial Refund' },
    { value: 'process_forfeiture', label: 'Process Forfeiture' },
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Activity Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your activity history and system actions</p>
        </div>
        <button
          onClick={fetchActivityLogs}
          className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</label>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={filterDateRange}
              onChange={(e) => {
                setFilterDateRange(e.target.value);
                if (e.target.value !== "custom") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            {filterDateRange === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
                  placeholder="Start date"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
                  placeholder="End date"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Activity Type
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Description
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Entity Type
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Entity ID
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    IP Address
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    Date & Time
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                  <tr>
                      <td colSpan={6} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading activity logs...</p>
                      </td>
                  </tr>
              ) : filteredLogs.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No activity logs found</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters or search criteria</p>
                      </td>
                  </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.activity_type)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.activity_type)}`}>
                          {highlightText(log.activity_type ? log.activity_type.replace('_', ' ') : 'Unknown', searchTerm)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-800 dark:text-gray-200 max-w-xs truncate" title={log.description}>
                        {highlightText(log.description || '', searchTerm)}
                      </p>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={log.entity_type || 'N/A'}>
                        {highlightText(log.entity_type || 'N/A', searchTerm)}
                      </p>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate" title={log.entity_id || 'N/A'}>
                        {highlightText(log.entity_id ? log.entity_id.substring(0, 8) + '...' : 'N/A', searchTerm)}
                      </p>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate" title={log.ip_address || 'N/A'}>
                        {highlightText(log.ip_address || 'N/A', searchTerm)}
                      </p>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredLogs.length === 0 ? 0 : ((currentPage - 1) * entriesPerPage) + 1} to {Math.min(currentPage * entriesPerPage, filteredLogs.length)} of {filteredLogs.length} entries
              {searchTerm || filterAction !== 'all' || filterDateRange !== 'all' ? ` (filtered from ${logs.length} total entries)` : ""}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
                type="button"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, filteredTotalPages || 1) }, (_, i) => {
                let pageNum;
                
                if (filteredTotalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= filteredTotalPages - 2) {
                  pageNum = filteredTotalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md border-brand-primary"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                    disabled={filteredLogs.length === 0}
                    type="button"
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(filteredTotalPages, currentPage + 1))}
                disabled={currentPage === filteredTotalPages || filteredLogs.length === 0}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(filteredTotalPages)}
                disabled={currentPage === filteredTotalPages || filteredLogs.length === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
                type="button"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
