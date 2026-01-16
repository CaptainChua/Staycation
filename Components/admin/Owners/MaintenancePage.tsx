'use client';

import { AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, ListTodo, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetReportsQuery, useUpdateReportAssignmentMutation } from "@/redux/api/reportApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import AssignToModal from "./Modals/AssignTo";
import ViewReportDetails from "./Modals/ViewReportDetails";
import { toast } from "react-hot-toast"; // Added toast import

type MaintenanceStatus = "Open" | "In Progress" | "Resolved" | "Closed";
type PriorityLevel = "Low" | "Medium" | "High" | "Urgent";

interface MaintenanceRow {
  report_id: string;
  haven_id: string;
  haven_name: string;
  issue_type: string;
  priority_level: PriorityLevel;
  specific_location: string;
  issue_description: string;
  created_at: string;
  status: MaintenanceStatus;
  user_id: string;
  reported_by?: string;
  assigned_to?: string;
  images?: Array<{
    image_url: string;
    cloudinary_public_id?: string;
  }>;
}

interface Report {
  report_id: string;
  haven_id: string;
  issue_type: string;
  priority_level: PriorityLevel;
  specific_location: string;
  issue_description: string;
  created_at: string;
  status?: MaintenanceStatus;
  user_id: string;
  haven_name?: string;
  assigned_to?: string;
  images?: Array<{
    image_url: string;
    cloudinary_public_id?: string;
  }>;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_id: string;
  hire_date: string;
  role: string;
  department?: string;
  monthly_salary?: number;
  street_address?: string;
  city?: string;
  zip_code?: string;
  created_at?: string;
  updated_at?: string;
  profile_image_url?: string;
}

interface StatsCard {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Skeleton Components
const StatsCardSkeleton = () => (
  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
      </div>
      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-2">
    {/* Header skeleton */}
    <div className="grid grid-cols-10 gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
      ))}
    </div>
    {/* Row skeletons */}
    {[...Array(5)].map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-10 gap-4 p-4 bg-white dark:bg-gray-800 rounded">
        {[...Array(10)].map((_, colIndex) => (
          <div key={colIndex} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    ))}
  </div>
);

const MaintenancePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | MaintenanceStatus>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "Low" | "Medium" | "High" | "Urgent">("all");
  const [currentPage, setCurrentPage] = useState(1); // Fixed: Added this line
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof MaintenanceRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null); // Added to track selected report
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewReportId, setViewReportId] = useState<string | null>(null);

  // Fetch data from API
  const { data: reportsData, error: reportsError, isLoading: reportsLoading } = useGetReportsQuery({});
  const { data: employeesData, isLoading: employeesLoading } = useGetEmployeesQuery({});
  const [updateReportAssignment, { isLoading: isAssigning }] = useUpdateReportAssignmentMutation();
  
  // Check if any data is still loading
  const isLoading = reportsLoading || employeesLoading;
  
  // Create user lookup map from all employees data
  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (employeesData?.success && employeesData?.data) {
      employeesData.data.forEach((employee: Employee) => {
        if (employee.id && employee.first_name && employee.last_name) {
          map[employee.id] = `${employee.first_name} ${employee.last_name}`;
        }
      });
    }
    return map;
  }, [employeesData]);
  
  // Transform API data to match our interface
  const rows = useMemo(() => {
    if (!reportsData?.data) return [];
    
    return reportsData.data.map((report: Report): MaintenanceRow => {
      // Debug log to see what we're getting from the API
      console.log('Report data:', report);
      
      return {
        report_id: report.report_id,
        haven_id: report.haven_id,
        haven_name: report.haven_name || 'Unknown Haven',
        issue_type: report.issue_type,
        priority_level: report.priority_level,
        specific_location: report.specific_location,
        issue_description: report.issue_description,
        created_at: report.created_at,
        status: report.status || 'Open', // Provide fallback if status is missing
        user_id: report.user_id,
        reported_by: userMap[report.user_id] || 'Unknown User',
        assigned_to: report.assigned_to || 'Unassigned',
        images: report.images || []
      };
    });
  }, [reportsData, userMap]);

  const stats = useMemo((): StatsCard[] => [
    {
      label: "Total Requests",
      value: rows.length,
      color: "bg-blue-500",
      icon: ListTodo,
    },
    {
      label: "Open",
      value: rows.filter((r: MaintenanceRow) => r.status === "Open").length,
      color: "bg-orange-500",
      icon: AlertCircle,
    },
    {
      label: "In Progress",
      value: rows.filter((r: MaintenanceRow) => r.status === "In Progress").length,
      color: "bg-yellow-500",
      icon: Clock,
    },
    {
      label: "Resolved",
      value: rows.filter((r: MaintenanceRow) => r.status === "Resolved").length,
      color: "bg-green-500",
      icon: CheckCircle,
    },
  ], [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row: MaintenanceRow) => {
      const matchesSearch = 
        row.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.haven_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.specific_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.reported_by && row.reported_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (row.assigned_to && row.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatusFilter = filterStatus === "all" || row.status === filterStatus;
      const matchesPriorityFilter = filterPriority === "all" || row.priority_level === filterPriority;
      
      return matchesSearch && matchesStatusFilter && matchesPriorityFilter;
    });
  }, [rows, searchTerm, filterStatus, filterPriority]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    
    return [...filteredRows].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof MaintenanceRow) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
      setCurrentPage(1); // Reset to first page when changing sort
    }
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case "Open":
        return "text-yellow-600 dark:text-yellow-400";
      case "In Progress":
        return "text-blue-600 dark:text-blue-400";
      case "Resolved":
        return "text-green-600 dark:text-green-400";
      case "Closed":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const handleAssignClick = (reportId: string) => {
    setSelectedReportId(reportId);
    setAssignModalOpen(true);
  };

  const handleViewClick = (reportId: string) => {
    setViewReportId(reportId);
    setViewModalOpen(true);
  };

  const handleAssignSuccess = async (employeeId: string, assignedTo: string) => {
    if (!selectedReportId) {
      toast.error('No report selected');
      return;
    }

    try {
      await updateReportAssignment({
        reportId: selectedReportId,
        assignedTo: assignedTo
      }).unwrap();
      
      toast.success(`Successfully assigned to ${assignedTo}`);
      setAssignModalOpen(false);
      setSelectedReportId(null);
    } catch (error) {
      console.error('Error assigning report:', error);
      toast.error('Failed to assign report. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Maintenance Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track and manage maintenance requests across all properties
        </p>
      </div>

      {/* Skeleton Loading State */}
      {isLoading && (
        <>
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8 animate-pulse"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                </div>
                <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <TableSkeleton />
          </div>
        </>
      )}

      {/* Error State */}
      {!isLoading && reportsError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Failed to load maintenance requests. Please try again.</p>
        </div>
      )}

      {!isLoading && !reportsError && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={i}
                  className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <IconComponent className="w-12 h-12 opacity-50" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
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
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
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
                    placeholder="Search by ID, haven, issue, location, type, or reported by..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as "all" | MaintenanceStatus);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => {
                    setFilterPriority(e.target.value as "all" | "Low" | "Medium" | "High" | "Urgent");
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          {/* Maintenance Requests Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("report_id")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        ID
                        {sortField === "report_id" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("haven_name")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Haven
                        {sortField === "haven_name" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("issue_description")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Issue
                        {sortField === "issue_description" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center justify-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Status
                        {sortField === "status" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("priority_level")}
                        className="flex items-center justify-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Priority
                        {sortField === "priority_level" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("reported_by")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Reported By
                        {sortField === "reported_by" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Location
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("assigned_to")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Assigned To
                        {sortField === "assigned_to" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("issue_type")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Type
                        {sortField === "issue_type" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                      >
                        Date
                        {sortField === "created_at" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No maintenance requests found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row: MaintenanceRow) => (
                      <tr
                        key={row.report_id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.report_id.slice(0, 8)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{row.haven_name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{row.issue_description}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm font-semibold ${getStatusColor(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(row.priority_level)}`}>
                            {row.priority_level}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{row.reported_by || 'Unknown User'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{row.specific_location}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{row.assigned_to || 'Unassigned'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{row.issue_type}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(row.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed" 
                              title="Assign to Employee" 
                              onClick={() => handleAssignClick(row.report_id)}
                              disabled={isAssigning && selectedReportId === row.report_id}
                            >
                              {isAssigning && selectedReportId === row.report_id ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <UserPlus className="w-4 h-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleViewClick(row.report_id)}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors" 
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
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

          {/* Assign Modal */}
          <AssignToModal
            isOpen={assignModalOpen}
            onClose={() => {
              setAssignModalOpen(false);
              setSelectedReportId(null);
            }}
            onAssign={handleAssignSuccess}
            reportId={selectedReportId || ""}
            isLoading={isAssigning}
          />

          {/* View Details Modal */}
          <ViewReportDetails
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setViewReportId(null);
            }}
            reportId={viewReportId || ""}
            onAssign={handleAssignClick}
          />

          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} entries
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                  type="button"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                  type="button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      pageNum === currentPage ||
                      pageNum === currentPage - 1 ||
                      pageNum === currentPage + 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            currentPage === pageNum
                              ? "bg-brand-primary text-white shadow-md"
                              : "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                          }`}
                          type="button"
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === 2 && currentPage > 3) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    } else if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
                  type="button"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last Page"
                  type="button"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MaintenancePage;