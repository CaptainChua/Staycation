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
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  ArrowRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useState, useMemo } from "react";
import { useGetEmployeesQuery, useDeleteEmployeeMutation } from "@/redux/api/employeeApi";
import { useGetActivityLogsQuery, useGetActivityStatsQuery, useCreateActivityLogMutation } from "@/redux/api/activityLogApi";
import { useSession } from "next-auth/react";
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
  description: string;
  activity_type: string;
  details?: string;
  created_at: string;
  role?: string;
  profile_image_url?: string;
  ip_address?: string;
  user_agent?: string;
  entity_type?: string;
  entity_id?: string;
  [key: string]: unknown;
}

interface StaffActivityPageProps {
  onCreateClick: () => void;
  onEditClick: (employee: Employee) => void;
}

const StaffActivityPage = ({ onCreateClick, onEditClick }: StaffActivityPageProps) => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Fetch employees from API
  const { data: employeesData, isLoading: isLoadingEmployees } = useGetEmployeesQuery({});
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation();
  const [createActivityLog] = useCreateActivityLogMutation();

  // Fetch activity logs with server-side filtering and pagination
  const { data: activityLogsData, isLoading: isLoadingLogs } = useGetActivityLogsQuery({
    action_type: filterType !== "all" ? filterType : undefined,
    search: searchQuery || undefined,
    date_range: dateRange !== "all" ? dateRange : undefined,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
  });
  
  const { data: statsData, isLoading: isLoadingStats } = useGetActivityStatsQuery({});

  const employees = employeesData?.data || [];
  const filteredEmployees = useMemo(() => {
    return employees.filter((user: Employee) => {
      const query = searchQuery.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email?.toLowerCase() || "";
      const role = user.role?.toLowerCase() || "";
      const id = user.id?.toLowerCase() || "";

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        role.includes(query) ||
        id.includes(query)
      );
    });
  }, [employees, searchQuery]);

  const activityLogs = activityLogsData?.data?.logs || [];
  const totalLogsCount = activityLogsData?.data?.total_count || 0;
  const stats = statsData?.data || { active_csr: 0, active_cleaners: 0, logged_out: 0, total: 0 };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      relative: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      full: date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getActionIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('login')) return <LogIn className="w-4 h-4" />;
    if (t.includes('logout')) return <LogOut className="w-4 h-4" />;
    if (t.includes('create')) return <Plus className="w-4 h-4" />;
    if (t.includes('update')) return <Edit className="w-4 h-4" />;
    if (t.includes('delete') || t.includes('deactivate')) return <Trash2 className="w-4 h-4" />;
    if (t.includes('role')) return <Users className="w-4 h-4" />;
    if (t.includes('password')) return <Shield className="w-4 h-4" />;
    if (t.includes('complete')) return <CheckCircle className="w-4 h-4" />;
    if (t.includes('pending')) return <Clock className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getActionStyles = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('login') || t.includes('complete')) 
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
    if (t.includes('logout') || t.includes('deactivate') || t.includes('delete')) 
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
    if (t.includes('update') || t.includes('role')) 
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    if (t.includes('create')) 
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    if (t.includes('pending') || t.includes('password')) 
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  };

  const statCards = [
    {
      title: "Active CSR",
      count: stats.active_csr,
      color: "from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700",
      icon: <User className="w-8 h-8 text-white/30" />,
    },
    {
      title: "Active Cleaners",
      count: stats.active_cleaners,
      color: "from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700",
      icon: <Users className="w-8 h-8 text-white/30" />,
    },
    {
      title: "Logged Out",
      count: stats.logged_out,
      color: "from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700",
      icon: <LogOut className="w-8 h-8 text-white/30" />,
    },
    {
      title: "Total Staff",
      count: stats.total,
      color: "from-rose-500 to-pink-600 dark:from-rose-600 dark:to-pink-700",
      icon: <UsersRound className="w-8 h-8 text-white/30" />,
    },
  ];

  const handleDelete = async (id: string) => {
    const employee = employees.find((e: Employee) => e.id === id);
    const empName = employee ? `${employee.first_name} ${employee.last_name}` : id;
    
    if (window.confirm(`Are you sure you want to delete ${empName}?`)) {
      try {
        await deleteEmployee(id).unwrap();
        
        // Create activity log
        try {
          await createActivityLog({
            employee_id: (session?.user as any)?.id,
            action_type: "deactivate",
            description: `Deleted staff: ${empName}`,
            details: `Employee ID ${id} was removed from the system`,
            entity_type: "staff",
            entity_id: id
          }).unwrap();
        } catch (logError) {
          console.error("Failed to create activity log:", logError);
        }

        toast.success("Employee deleted successfully");
      } catch (err) {
        toast.error("Failed to delete employee");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Staff Management</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitor activity logs and manage your team efficiently
          </p>
        </div>

        <button
          onClick={onCreateClick}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Add New Employee
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          ))
        ) : (
          statCards.map((stat, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${stat.color} transition-transform hover:scale-[1.02]`}
            >
              <div className="relative z-10">
                <p className="text-sm font-bold uppercase tracking-wider opacity-80">{stat.title}</p>
                <p className="text-4xl font-black mt-1">{stat.count}</p>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] transform rotate-12">
                {stat.icon}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Staff Table (8 cols) */}
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Active Staff Directory
              </h3>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                    <th className="px-6 py-4 text-left">Staff Member</th>
                    <th className="px-6 py-4 text-left">Role & Dept</th>
                    <th className="px-6 py-4 text-left">Contact Info</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoadingEmployees ? (
                    Array(3).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-6 py-8 h-20 bg-slate-50/50 dark:bg-slate-800/20"></td>
                      </tr>
                    ))
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No employees found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((user: Employee) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-orange-100 dark:bg-orange-900/30 flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                              {user.profile_image_url ? (
                                <Image
                                  src={user.profile_image_url}
                                  alt={user.first_name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-orange-600 dark:text-orange-400">
                                  {user.first_name?.[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{user.first_name} {user.last_name}</p>
                              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wide">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">{user.email}</span>
                            <span className="text-xs text-slate-400">{user.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            user.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-slate-400"}`}></span>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => onEditClick(user)} 
                              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(user.id)} 
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
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
        </div>

        {/* Bottom Section: Activity Log (Fullscreen Width or could be split) */}
        <div className="lg:col-span-12 space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <Clock className="w-7 h-7 text-orange-500" />
              Staff Activity Feed
            </h3>
            
            {/* Advanced Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold dark:text-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="create">Staff Creation</option>
                  <option value="update">Updates</option>
                  <option value="deactivate">Deactivations</option>
                  <option value="password">Password Reset</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative flex-1 sm:flex-none">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={dateRange}
                  onChange={(e) => { setDateRange(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold dark:text-slate-200 focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6">
            {isLoadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="mt-4 text-slate-500 font-medium">Loading activity stream...</p>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="mt-4 text-xl font-bold text-slate-700 dark:text-slate-300">No activity recorded</h4>
                <p className="text-slate-500 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                  There are no logs matching your current filters or search query.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activityLogs.map((log: ActivityLog, index: number) => {
                  const timestamp = formatTimestamp(log.created_at);
                  const isExpanded = expandedLogId === log.id;
                  const staffName = `${log.first_name || ''} ${log.last_name || ''}`.trim() || "System";
                  
                  return (
                    <div 
                      key={log.id} 
                      className="group relative pl-12 pb-8 last:pb-2 animate-in slide-in-from-left-4 duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Timeline Line */}
                      {index !== activityLogs.length - 1 && (
                        <div className="absolute left-[20px] top-[40px] bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30 transition-colors"></div>
                      )}
                      
                      {/* Timeline Icon Circle */}
                      <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${getActionStyles(log.activity_type)}`}>
                        {getActionIcon(log.activity_type)}
                      </div>

                      {/* Content Card */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        isExpanded 
                          ? "bg-slate-50 dark:bg-slate-800/80 border-orange-200 dark:border-orange-900/50 shadow-sm" 
                          : "bg-transparent border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200">{staffName}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${getActionStyles(log.activity_type)}`}>
                                {log.activity_type}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timestamp.time}
                              </span>
                            </div>
                            <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                              {log.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md hidden sm:inline-block">
                              {timestamp.relative}
                            </span>
                            <button 
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-orange-500 hover:text-orange-600 flex items-center gap-1 group/btn"
                            >
                              {isExpanded ? "Hide Details" : "View Details"}
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 transition-transform group-hover/btn:translate-y-0.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Details Area */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
                            <div className="space-y-3 min-w-0">
                              <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Metadata</h5>
                              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 shadow-inner">
                                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
                                  <span className="text-slate-500 text-xs">Exact Time:</span>
                                  <span className="text-slate-800 dark:text-slate-200 text-xs font-mono break-words">
                                    {timestamp.full}
                                  </span>
                                  <span className="text-slate-500 text-xs">IP Address:</span>
                                  <span className="text-slate-800 dark:text-slate-200 text-xs font-mono break-words">
                                    {log.ip_address || "127.0.0.1"}
                                  </span>
                                  <span className="text-slate-500 text-xs">User Agent:</span>
                                  <span
                                    className="text-slate-800 dark:text-slate-200 text-[10px] font-mono break-words"
                                    title={log.user_agent}
                                  >
                                    {log.user_agent || "Unknown Browser"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3 min-w-0">
                              <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Activity Details</h5>
                              <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 h-full min-h-[80px] min-w-0 w-full max-w-full overflow-hidden">
                                {log.details ? (
                                  <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words leading-normal">
                                    {log.details}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-slate-400 italic text-xs">
                                    <ArrowRight className="w-3 h-3" />
                                    No additional data available for this action
                                  </div>
                                )}
                                {log.entity_type && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400">TARGET:</span>
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase break-all">
                                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoadingLogs && totalLogsCount > itemsPerPage && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-slate-800 dark:text-slate-200">{activityLogs.length}</span> of <span className="text-slate-800 dark:text-slate-200">{totalLogsCount}</span> records
                </p>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.ceil(totalLogsCount / itemsPerPage) }).map((_, i) => {
                    const pageNum = i + 1;
                    // Only show first, last, and pages around current
                    if (
                      pageNum === 1 || 
                      pageNum === Math.ceil(totalLogsCount / itemsPerPage) ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-black transition-all ${
                            currentPage === pageNum 
                              ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30 scale-110" 
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === 2 && currentPage > 3) || 
                      (pageNum === Math.ceil(totalLogsCount / itemsPerPage) - 1 && currentPage < Math.ceil(totalLogsCount / itemsPerPage) - 2)
                    ) {
                      return <span key={pageNum} className="px-1 text-slate-400 font-bold">...</span>;
                    }
                    return null;
                  })}

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalLogsCount / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(totalLogsCount / itemsPerPage)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffActivityPage;
