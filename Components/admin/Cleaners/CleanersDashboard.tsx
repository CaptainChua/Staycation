"use client";

import {
  Menu,
  X,
  Home,
  ClipboardList,
  MapPin,
  CheckSquare,
  AlertCircle,
  Bell,
  Calendar,
  BookOpen,
  LogOut,
  MessageSquare,
  ChevronDown,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGetConversationsQuery } from "@/redux/api/messagesApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";

// Page Components
import DashboardPage from "./DashboardPage";
import MyAssignmentPage from "./MyAssignmentPage";
import PropertyLocationPage from "./PropertyLocationPage";
import CleaningChecklistPage from "./CleaningChecklistPage";
import ReportIssuePage from "./ReportIssuePage";
import NotificationsPage from "./NotificationsPage";
import MySchedulePage from "./MySchedulePage";
import UserGuidePage from "./UserGuidePage";
import ProfilePage from "./ProfilePage";
import MessagesPage from "./MessagesPage";
import AdminFooter from "../AdminFooter";
import NotificationModal from "./Modals/NotificationModal";
import MessageModal from "./Modals/MessageModal";

interface EmployeeProfile {
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
  profile_image_url?: string;
  updated_at?: string;
}

interface AdminUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  image?: string | null;
  profile_image_url?: string;
}

const ACTIVE_PAGE_STORAGE_KEY = "cleaners-dashboard-active-page";

export default function CleanersDashboard() {
  const router = useRouter();
  const [sidebar, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageBadge, setMessageBadge] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const messageButtonRef = useRef<HTMLButtonElement | null>(null);
  const { data: session } = useSession();

  const userId = (session?.user as AdminUser)?.id;
  const {
    data: headerConversationsData,
    isLoading: isLoadingHeaderConversations,
  } = useGetConversationsQuery(
    { userId: userId || "" },
    { skip: !userId, pollingInterval: 5000 }
  );

  const { data: employeesData } = useGetEmployeesQuery({});
  const employees = useMemo(() => {
    return employeesData?.data || [];
  }, [employeesData?.data]);
  const employeeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp: EmployeeProfile) => {
      const name = `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim();
      map[emp.id] = name || emp.email || emp.employment_id || "Employee";
    });
    return map;
  }, [employees]);
  const employeeProfileImageById = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((emp: EmployeeProfile) => {
      if (emp?.id && emp?.profile_image_url) {
        map[emp.id] = emp.profile_image_url;
      }
    });
    return map;
  }, [employees]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      // Clear any stored data
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
      }
      // Redirect to login or home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fetch employee data
  const fetchEmployeeData = async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/employees/${session.user.id}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load employee data");
      }

      setEmployee(payload?.data ?? null);
    } catch (err: unknown) {
      console.error("Error fetching employee data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const controller = new AbortController();

    fetchEmployeeData();

    // Listen for profile update events
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail?.employeeId === session.user.id) {
        fetchEmployeeData();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);

    return () => {
      controller.abort();
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, [session?.user?.id]);

  // Mock cleaner data - replace with actual session/auth data
  const cleanerData = {
    name: employee ? `${employee.first_name} ${employee.last_name}` : "Maria Santos",
    email: employee?.email || "maria.santos@staycation.com",
    employeeId: employee?.employment_id || "EMP-001",
    role: employee?.role || "Senior Cleaner",
    profile_image_url: employee?.profile_image_url || "", // No image - will show initials instead
  };

  const notifications = [
    {
      id: 1,
      title: "New Assignment",
      message: "Haven 3 needs cleaning after checkout at 11:00 AM",
      time: "5 mins ago",
      type: "info" as const,
      read: false,
    },
    {
      id: 2,
      title: "Reminder",
      message: "Haven 7 cleaning scheduled for 2:00 PM today",
      time: "1 hr ago",
      type: "warning" as const,
      read: false,
    },
    {
      id: 3,
      title: "Task Completed",
      message: "Your cleaning report for Haven 2 was approved",
      time: "2 hrs ago",
      type: "success" as const,
      read: true,
    },
  ];

  // Restore persisted page on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPage = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
    if (savedPage) {
      setPage(savedPage);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNow(new Date());
    }, 0);
    
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(id);
    };
  }, []);

  // Persist page changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, page);
  }, [page]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);


  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", color: "text-blue-500" },
    { id: "my-assignment", icon: ClipboardList, label: "My Assignment", color: "text-green-500" },
    { id: "property-location", icon: MapPin, label: "Property Location", color: "text-purple-500" },
    { id: "cleaning-checklist", icon: CheckSquare, label: "Cleaning Checklist", color: "text-pink-500" },
    { id: "report-issue", icon: AlertCircle, label: "Report an Issue", color: "text-red-500" },
    { id: "notifications", icon: Bell, label: "Notifications", color: "text-yellow-500" },
    { id: "my-schedule", icon: Calendar, label: "My Schedule", color: "text-indigo-500" },
    { id: "user-guide", icon: BookOpen, label: "User Guide", color: "text-teal-500" },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage />;
      case "my-assignment":
        return <MyAssignmentPage />;
      case "property-location":
        return <PropertyLocationPage />;
      case "cleaning-checklist":
        return <CleaningChecklistPage />;
      case "report-issue":
        return <ReportIssuePage />;
      case "notifications":
        return <NotificationsPage notifications={notifications} />;
      case "my-schedule":
        return <MySchedulePage />;
      case "user-guide":
        return <UserGuidePage />;
      case "messages":
        return <MessagesPage />;
      case "profile":
        return <ProfilePage cleanerData={cleanerData} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR - Desktop and Mobile */}
      <div
        className={`${
          sidebar ? "w-72" : "w-20"
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-col sticky top-0 self-start h-screen shadow-xl ${
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 z-50 flex animate-in slide-in-from-left duration-300"
            : "hidden"
        } md:flex`}
      >
        {/* Logo Section */}
        <div className="h-20 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center">
          <div className="flex items-center justify-between gap-3 w-full">
            <div
              className={`flex items-center ${sidebar ? "gap-3" : "justify-center w-full"}`}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
                <Image
                  src="/haven_logo.png"
                  alt="Staycation Haven logo"
                  width={48}
                  height={48}
                  className="object-cover"
                  priority
                />
              </div>
              {sidebar && (
                <div>
                  <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                    Staycation Haven
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cleaners Portal</p>
                </div>
              )}
            </div>
            {/* Mobile Close Button */}
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800 rounded-lg md:hidden transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-brand-primary text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-white"
                      : `${item.color}`
                  }`}
                />
                {sidebar && (
                  <span className="text-sm font-semibold truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          {sidebar && (
            <div className="mb-2">
              {isLoading ? (
                <div className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  {employee?.profile_image_url ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={employee.profile_image_url}
                        alt={cleanerData.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        key={`${employee.profile_image_url}-${employee.updated_at || ''}`}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 flex items-center justify-center text-gray-700 dark:text-gray-200 font-medium text-lg overflow-hidden">
                      <span>{cleanerData.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {cleanerData.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {cleanerData.role}
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          )}
          {!sidebar && (
            <div className="flex justify-center py-2">
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col min-h-screen ${mobileMenuOpen ? 'overflow-hidden md:overflow-x-hidden md:overflow-y-auto' : 'overflow-x-hidden overflow-y-auto'}`}>
        {/* HEADER */}
        <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 h-20 min-h-20 flex-shrink-0 flex justify-between items-center fixed top-0 right-0 left-0 z-30 shadow-sm ${
          sidebar ? "md:left-20 lg:left-72" : "md:left-20 lg:left-20"
        }`}>
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebar(!sidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg hidden md:block transition-colors"
            >
              {sidebar ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            <div className="flex flex-col pl-4 h-10 justify-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {now
                  ? now.toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : ""}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {now
                  ? now.toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Messages */}
            <button
              ref={messageButtonRef}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => {
                setMessageBadge(false);
                setMessageModalOpen((prev) => !prev);
              }}
            >
              <MessageSquare className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              {messageBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications */}
            <button
              ref={notificationButtonRef}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setNotificationOpen((prev) => !prev)}
            >
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar with Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div className="hidden sm:block space-y-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 sm:gap-3 p-1 sm:px-2 sm:py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold cursor-pointer transition-colors">
                      {employee?.profile_image_url ? (
                        <Image
                          src={employee.profile_image_url}
                          alt={cleanerData.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          key={`${employee.profile_image_url}-${employee.updated_at || ''}`}
                        />
                      ) : (
                        <span>{cleanerData.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[120px]">
                        {cleanerData.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                        {cleanerData.role}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${
                        profileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      {/* User Info Header */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          {employee?.profile_image_url ? (
                            <Image
                              src={employee.profile_image_url}
                              alt={cleanerData.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                              key={`${employee.profile_image_url}-${employee.updated_at || ''}`}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                              {cleanerData.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {cleanerData.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setPage("profile");
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                        >
                          <User className="w-4 h-4 text-brand-primary" />
                          <span className="text-sm font-medium">My Profile</span>
                        </button>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-6 pt-24">
          <div className="max-w-[1600px] mx-auto w-full">{renderPage()}</div>
        </div>

        {/* FOOTER */}
        <AdminFooter />
      </div>

      {/* Notification Modal */}
      {notificationOpen && (
        <NotificationModal
          notifications={notifications.map(n => ({
            id: n.id.toString(),
            title: n.title,
            description: n.message,
            timestamp: n.time,
            type: n.type
          }))}
          onClose={() => setNotificationOpen(false)}
          onViewAll={() => {
            setNotificationOpen(false);
            setPage("notifications");
          }}
          anchorRef={notificationButtonRef}
        />
      )}
      
      {/* Message Modal */}
      {messageModalOpen && (
        <MessageModal
          conversations={headerConversationsData?.data || []}
          currentUserId={userId || ""}
          employeeNameById={employeeNameById}
          employeeProfileImageById={employeeProfileImageById}
          isLoading={isLoadingHeaderConversations}
          onSelectConversation={(conversationId) => {
            setSelectedConversationId(conversationId);
            setMessageModalOpen(false);
            setPage("messages");
          }}
          onClose={() => setMessageModalOpen(false)}
          onViewAll={() => {
            setMessageModalOpen(false);
            setPage("messages");
          }}
          anchorRef={messageButtonRef}
        />
      )}
    </div>
  );
}