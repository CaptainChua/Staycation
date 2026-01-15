'use client';

import { Wrench, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown, ListTodo, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type MaintenanceStatus = "pending" | "in-progress" | "completed";

interface MaintenanceRow {
  id: string;
  haven: string;
  issue: string;
  priority: "high" | "medium" | "low";
  status: MaintenanceStatus;
  reportedBy: string;
  reportedDate: string;
  assignedTo?: string;
  completedDate?: string;
}

const MaintenancePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | MaintenanceStatus>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof MaintenanceRow | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [rows, setRows] = useState<MaintenanceRow[]>([
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
    {
      id: "MNT-005",
      haven: "Haven E - Mountain View",
      issue: "Broken window lock",
      priority: "medium",
      status: "pending",
      reportedBy: "Carlos Mendoza",
      reportedDate: "2024-12-14",
      assignedTo: "Maintenance Team C"
    },
    {
      id: "MNT-006",
      haven: "Haven F - Beach View",
      issue: "Water heater not working",
      priority: "high",
      status: "completed",
      reportedBy: "Liza Tan",
      reportedDate: "2024-12-13",
      assignedTo: "Maintenance Team B",
      completedDate: "2024-12-14"
    },
    {
      id: "MNT-007",
      haven: "Haven G - Lake View",
      issue: "Electrical outlet not working",
      priority: "low",
      status: "pending",
      reportedBy: "Roberto Cruz",
      reportedDate: "2024-12-17",
      assignedTo: "Maintenance Team A"
    },
    {
      id: "MNT-008",
      haven: "Haven H - Forest View",
      issue: "Gutter cleaning needed",
      priority: "medium",
      status: "in-progress",
      reportedBy: "Diana Lee",
      reportedDate: "2024-12-12",
      assignedTo: "Maintenance Team C"
    }
  ]);

  const stats = useMemo(() => [
    {
      label: "Total Requests",
      value: rows.length,
      color: "bg-blue-500",
      icon: ListTodo,
    },
    {
      label: "Pending",
      value: rows.filter(r => r.status === "pending").length,
      color: "bg-yellow-500",
      icon: Clock,
    },
    {
      label: "In Progress",
      value: rows.filter(r => r.status === "in-progress").length,
      color: "bg-orange-500",
      icon: TrendingUp,
    },
    {
      label: "Completed",
      value: rows.filter(r => r.status === "completed").length,
      color: "bg-green-500",
      icon: CheckCircle,
    },
  ], [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = 
        row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.haven.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.assignedTo && row.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatusFilter = filterStatus === "all" || row.status === filterStatus;
      const matchesPriorityFilter = filterPriority === "all" || row.priority === filterPriority;
      
      return matchesSearch && matchesStatusFilter && matchesPriorityFilter;
    });
  }, [rows, searchTerm, filterStatus, filterPriority]);

  const sortedRows = useMemo(() => {
    if (!sortField) return filteredRows;
    
    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
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
    }
  };

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "in-progress":
        return "text-blue-600 dark:text-blue-400";
      case "completed":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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
                placeholder="Search by ID, haven, issue, or reported by..."
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
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value as "all" | "high" | "medium" | "low");
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-orange-500 text-sm"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
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
                    onClick={() => handleSort("id")}
                    className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                  >
                    ID
                    {sortField === "id" && (
                      sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <button
                    onClick={() => handleSort("haven")}
                    className="flex items-center gap-1 hover:text-orange-500 transition-colors"
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
                    className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                  >
                    Issue
                    {sortField === "issue" && (
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
                    onClick={() => handleSort("priority")}
                    className="flex items-center justify-center gap-1 hover:text-orange-500 transition-colors"
                  >
                    Priority
                    {sortField === "priority" && (
                      sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <button
                    onClick={() => handleSort("reportedBy")}
                    className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                  >
                    Reported By
                    {sortField === "reportedBy" && (
                      sortDirection === "asc" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Assigned To
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <button
                    onClick={() => handleSort("reportedDate")}
                    className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                  >
                    Date
                    {sortField === "reportedDate" && (
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
                  <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No maintenance requests found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{row.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.haven}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.issue}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`text-sm font-semibold ${getStatusColor(row.status)}`}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1).replace("-", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(row.priority)}`}>
                        {row.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.reportedBy}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.assignedTo || "Unassigned"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.reportedDate}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" title="View Details">
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
                  (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
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
                      disabled={totalPages === 0}
                      type="button"
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-brand-primary hover:text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last Page"
              type="button"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
