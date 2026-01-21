"use client";

import { Search, Filter, Plus, Eye, Trash2, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, TrendingUp, TrendingDown, ClipboardList, AlertTriangle, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useGetReportsQuery, useDeleteReportMutation } from "@/redux/api/reportApi";
import ViewReportDetails from "./Modals/ViewReportDetails";
import ReportIssueModal from "./Modals/ReportIssueModal";

export default function ReportIssuePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "Open" | "In Progress" | "Resolved" | "Closed">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "Low" | "Medium" | "High" | "Urgent">("all");
  const [filterIssueType, setFilterIssueType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof any | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [editReportData, setEditReportData] = useState<any>(null);

  // Fetch reports from API
  const { data: reports = [], isLoading: isLoadingReports, error: reportsError } = useGetReportsQuery({});
  const [deleteReport] = useDeleteReportMutation();

  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'text-green-600';
      case 'in progress':
        return 'text-blue-600';
      case 'open':
        return 'text-yellow-600';
      case 'closed':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const issueTypes = [
    { label: "Maintenance Needed", value: "maintenance" },
    { label: "Damage Found", value: "damage" },
    { label: "Missing Items", value: "missing" },
    { label: "Plumbing Issue", value: "plumbing" },
    { label: "Electrical Issue", value: "electrical" },
    { label: "Other", value: "other" },
  ];

  // Transform API reports data to match the expected format
  const reportsData = reports?.data || reports; // Handle both direct array and nested data structure
  const allReports = useMemo(() => {
    if (!Array.isArray(reportsData)) return [];
    return reportsData.map((report: any, index: number) => ({
    id: report.report_id || index + 1,
      report_id: report.report_id || `RPT-${index + 1}`,
    haven: report.haven_name || "Unknown Haven",
    issue: report.issue_description || "No issue description",
      status: report.status || "Open",
      date: report.created_at ? new Date(report.created_at) : new Date(),
      dateString: report.created_at ? new Date(report.created_at).toLocaleDateString() : "Unknown date",
      statusColor: getStatusColor(report.status || "Open"),
    priority: report.priority_level || "Medium",
    location: report.specific_location || "Not specified",
      type: report.issue_type || "Other",
      images: report.images || []
    }));
  }, [reportsData]);

  // Filter reports
  const filteredReports = useMemo(() => {
    return allReports.filter((report: any) => {
      const matchesSearch = 
        report.report_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.haven.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      const matchesPriority = filterPriority === "all" || report.priority === filterPriority;
      const matchesIssueType = filterIssueType === "all" || report.type === filterIssueType;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesIssueType;
    });
  }, [allReports, searchTerm, filterStatus, filterPriority, filterIssueType]);

  // Sort reports
  const sortedReports = useMemo(() => {
    if (!sortField) return filteredReports;
    
    return [...filteredReports].sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === "date") {
        aVal = a.date.getTime();
        bVal = b.date.getTime();
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredReports, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedReports.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedReports = sortedReports.slice(startIndex, endIndex);

  const handleSort = (field: keyof any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
      setSortField(field);
      setSortDirection("asc");
      setCurrentPage(1);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "High":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = allReports.length;
    const open = allReports.filter((r: any) => r.status === "Open").length;
    const inProgress = allReports.filter((r: any) => r.status === "In Progress").length;
    const resolved = allReports.filter((r: any) => r.status === "Resolved").length;
    const closed = allReports.filter((r: any) => r.status === "Closed").length;

    return [
      {
        label: "Total Reports",
        value: total,
        color: "bg-blue-500",
        icon: ClipboardList,
      },
      {
        label: "Open",
        value: open,
        color: "bg-yellow-500",
        icon: AlertTriangle,
      },
      {
        label: "In Progress",
        value: inProgress,
        color: "bg-orange-500",
        icon: Clock,
      },
      {
        label: "Resolved",
        value: resolved,
        color: "bg-green-500",
        icon: CheckCircle,
      },
      {
        label: "Closed",
        value: closed,
        color: "bg-gray-500",
        icon: XCircle,
      },
    ];
  }, [allReports]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Report Issue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Report any issues found during cleaning
        </p>
      </div>
        <button
          onClick={() => setReportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          New Issue Report
        </button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
                return (
            <div
              key={index}
              className={`${stat.color} text-white rounded-lg p-6 shadow-lg dark:shadow-gray-900 hover:shadow-xl transition-all`}
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

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            All Reports
          </h2>
          
          {/* Filters and Search */}
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
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
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
                  placeholder="Search by ID, haven, issue, location, or type..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as "all" | "Open" | "In Progress" | "Resolved" | "Closed");
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
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
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                <option value="all">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <select
                value={filterIssueType}
                onChange={(e) => {
                  setFilterIssueType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
              >
                <option value="all">All Types</option>
                {issueTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
                </div>
              </div>
          </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoadingReports ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
            </div>
          ) : reportsError ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load reports</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-brand-primary hover:text-brand-primaryDark text-sm"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("report_id")}
                        className="flex items-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Report ID
                        {sortField === "report_id" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("haven")}
                        className="flex items-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Haven
                        {sortField === "haven" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("issue")}
                        className="flex items-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Issue Description
                        {sortField === "issue" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("type")}
                        className="flex items-center justify-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Type
                        {sortField === "type" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("priority")}
                        className="flex items-center justify-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Priority
                        {sortField === "priority" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      Location
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center justify-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Status
                        {sortField === "status" && (
                          sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      <button
                        onClick={() => handleSort("date")}
                        className="flex items-center gap-1 hover:text-brand-primary transition-colors"
                      >
                        Date
                        {sortField === "date" && (
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
                  {paginatedReports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No reports found.
                      </td>
                    </tr>
                  ) : (
                    paginatedReports.map((report: any) => (
                      <tr
                key={report.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                            {report.report_id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{report.haven}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 max-w-xs">
                            {report.issue}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {report.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(report.priority)}`}>
                            {report.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{report.location}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`text-sm font-semibold ${report.statusColor}`}>
                    {report.status}
                  </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {report.dateString}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedReportId(report.report_id);
                                setViewModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(report.status === "Open" || report.status === "Pending") && (
                              <button
                                onClick={() => {
                                  // Find the full report data from allReports
                                  const fullReport = allReports.find((r: any) => r.report_id === report.report_id);
                                  if (fullReport) {
                                    setEditReportId(fullReport.report_id);
                                    setEditReportData({
                                      haven: fullReport.haven,
                                      issueType: fullReport.type,
                                      priority: fullReport.priority,
                                      description: fullReport.issue,
                                      location: fullReport.location,
                                      images: fullReport.images || []
                                    });
                                    setReportModalOpen(true);
                                  }
                                }}
                                className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                title="Edit Report"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this report?")) {
                                  try {
                                    await deleteReport(report.report_id).unwrap();
                                    toast.success("Report deleted successfully");
                                  } catch (error) {
                                    toast.error("Failed to delete report");
                                  }
                                }
                              }}
                              className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Showing {startIndex + 1} to {Math.min(endIndex, sortedReports.length)} of {sortedReports.length} entries
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
              )}
            </>
          )}
        </div>
      </div>

      {/* View Report Details Modal */}
      <ViewReportDetails
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedReportId(null);
        }}
        reportId={selectedReportId || ""}
      />

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setEditReportId(null);
          setEditReportData(null);
        }}
        onSuccess={() => {
          // Optionally refetch reports or show success message
          setEditReportId(null);
          setEditReportData(null);
        }}
        reportId={editReportId || undefined}
        initialData={editReportData || undefined}
      />
    </div>
  );
}