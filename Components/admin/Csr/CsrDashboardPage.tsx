"use client";

import { Menu, X, Home, Calendar, DollarSign, FileText, Users, Wallet, Package, Settings, Bell, ChevronDown, User, MessageSquare, BarChart3, Headphones, Moon, Sun, Monitor } from "lucide-react";
import Image from "next/image";
import { useMemo, useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import DashboardPage, {
  BookingsPage,
  PaymentsPage,
  DeliverablesPage,
  CleanersPage,
  DepositsPage,
  InventoryPage,
} from "./DashboardPage";
import NotificationPage from "./NotificationPage";
import NotificationModal from "./Modals/Notification";
import MessageModal from "./Modals/MessageModal";
import MessagePage from "./MessagePage";
import SettingsPage from "./SettingsPage";
import AdminFooter from "../AdminFooter";
import { useGetConversationsQuery } from "@/redux/api/messagesApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";

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
}

interface AdminUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  image?: string | null;
  profile_image_url?: string;
}

const ACTIVE_PAGE_STORAGE_KEY = "csr-dashboard-active-page";

export default function CsrDashboard() {
  const [sidebar, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageBadge, setMessageBadge] = useState(true);
  const [now, setNow] = useState<Date | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const messageButtonRef = useRef<HTMLButtonElement | null>(null);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

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
  const notifications = [
    {
      id: "1",
      title: "New booking pending approval",
      description: "A new booking for Haven 2 requires CSR confirmation.",
      timestamp: "2 mins ago",
      type: "info" as const,
    },
    {
      id: "2",
      title: "Payment received",
      description: "₱12,500 from Emily Brown was confirmed.",
      timestamp: "15 mins ago",
      type: "success" as const,
    },
    {
      id: "3",
      title: "Guest check-in reminder",
      description: "Mike Wilson will arrive today at 3:00 PM.",
      timestamp: "1 hr ago",
      type: "warning" as const,
    },
  ];

  // Prevent back navigation to login page after login
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Push current state to history
      window.history.pushState(null, '', window.location.href);

      // Prevent back navigation
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  // Restore persisted page on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedPage = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
    if (savedPage) {
      setPage(savedPage);
    }
  }, []);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  // Fetch employee data
  useEffect(() => {
    if (!session?.user?.id) return;

    const controller = new AbortController();

    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/employees/${session.user.id}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load employee data");
        }

        setEmployee(payload?.data ?? null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error fetching employee data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();

    return () => controller.abort();
  }, [session?.user?.id]);

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

  // Navigation items organized by category for better discoverability
  const navCategories = [
    {
      category: "Overview",
      items: [
        { id: "dashboard", icon: Home, label: "Dashboard", color: "text-blue-500" },
        { id: "analytics", icon: BarChart3, label: "Analytics & Reports", color: "text-cyan-500" },
      ],
    },
    {
      category: "Bookings",
      items: [
        { id: "bookings", icon: Calendar, label: "Bookings Management", color: "text-green-500" },
        { id: "reservations", icon: Calendar, label: "Reservations", color: "text-indigo-500" },
      ],
    },
    {
      category: "Finance",
      items: [
        { id: "payments", icon: DollarSign, label: "Payment Management", color: "text-purple-500" },
        { id: "deposits", icon: Wallet, label: "Security Deposit", color: "text-indigo-500" },
      ],
    },
    {
      category: "Operations",
      items: [
        { id: "deliverables", icon: FileText, label: "Deliverables Management", color: "text-pink-500" },
        { id: "cleaners", icon: Users, label: "Cleaners Management", color: "text-brand-primary" },
        { id: "inventory", icon: Package, label: "Inventory Management", color: "text-teal-500" },
      ],
    },
    {
      category: "Communication",
      items: [
        { id: "messages", icon: MessageSquare, label: "Messages", color: "text-green-500" },
      ],
    },
    {
      category: "System",
      items: [
        { id: "settings", icon: Settings, label: "Settings", color: "text-gray-500" },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/admin/login",
        redirect: true
      });
    } catch (error) {
      console.error("Logout error: ", error);
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
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-col sticky top-0 h-screen shadow-xl flex-shrink-0
        ${
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSR Portal</p>
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navCategories.map((category) => (
            <div key={category.category}>
              {sidebar && (
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">
                  {category.category}
                </h3>
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all duration-200 group ${
                        page === item.id
                          ? "bg-brand-primary text-white shadow-md"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={!sidebar ? item.label : undefined}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${
                          page === item.id
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
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-x-hidden overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-20 min-h-20 flex-shrink-0 flex justify-between items-center sticky top-0 z-10 shadow-sm">
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
            <div className="flex flex-col">
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
              className={`relative p-2 rounded-lg transition-colors ${
                messageModalOpen
                  ? "bg-brand-primaryLighter text-brand-primary"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => {
                setMessageBadge(false);
                setNotificationOpen(false);
                setMessageModalOpen((prev) => !prev);
              }}
            >
              <MessageSquare className={`w-6 h-6 ${messageModalOpen ? "text-brand-primary" : "text-gray-600 dark:text-gray-300"}`} />
              {messageBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications */}
            <button
              ref={notificationButtonRef}
              className={`relative p-2 rounded-lg transition-colors ${
                notificationOpen
                  ? "bg-brand-primaryLighter text-brand-primary"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => {
                setMessageModalOpen(false);
                setNotificationOpen((prev) => !prev);
              }}
            >
              <Bell className={`w-6 h-6 ${notificationOpen ? "text-brand-primary" : "text-gray-600 dark:text-gray-300"}`} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar with Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold cursor-pointer transition-colors">
                  {isLoading ? (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ) : employee?.profile_image_url ? (
                    <Image
                      src={employee.profile_image_url}
                      alt={employee.first_name ? `${employee.first_name} ${employee.last_name}` : "Profile"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'C'}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[120px]">
                    {isLoading ? (
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ) : employee ? (
                      `${employee.first_name} ${employee.last_name}`.trim() || employee.email || employee.employment_id
                    ) : (
                      session?.user?.name || "User"
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {employee?.role || "CSR"}
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
                          alt={employee.first_name ? `${employee.first_name} ${employee.last_name}` : "Profile"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-primary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                          {isLoading ? (
                            <span className="inline-block h-4 bg-gray-200 rounded animate-pulse w-24"></span>
                          ) : employee ? (
                            `${employee.first_name} ${employee.last_name}`.trim()
                          ) : (
                            session?.user?.name || 'CSR Account'
                          )}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {isLoading ? (
                            <span className="inline-block h-3 bg-gray-100 rounded animate-pulse w-20 mt-0.5"></span>
                          ) : (
                            session?.user?.email || 'Loading...'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setPage("settings");
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <Settings className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">Settings</span>
                    </button>
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex justify-center py-2 border-t border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme('dark');
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-white dark:bg-gray-600 text-brand-primary shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                        aria-label="Dark mode"
                        title="Dark"
                      >
                        <Moon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme('light');
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          theme === 'light'
                            ? 'bg-white dark:bg-gray-600 text-brand-primary shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                        aria-label="Light mode"
                        title="Light"
                      >
                        <Sun className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme('system');
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          theme === 'system'
                            ? 'bg-white dark:bg-gray-600 text-brand-primary shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                        aria-label="System mode"
                        title="System"
                      >
                        <Monitor className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-left"
                    >
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-6">
          <div className="max-w-[1600px] mx-auto">
            {page === "dashboard" && <DashboardPage />}
            {page === "bookings" && <BookingsPage />}
            {page === "payments" && <PaymentsPage />}
            {page === "deliverables" && <DeliverablesPage />}
            {page === "cleaners" && <CleanersPage />}
            {page === "deposits" && <DepositsPage />}
            {page === "inventory" && <InventoryPage />}
            {page === "notifications" && <NotificationPage />}
            {page === "messages" && (
              <MessagePage
                initialConversationId={selectedConversationId}
                onClose={() => {
                  setSelectedConversationId(null);
                  setPage("dashboard");
                }}
              />
            )}
            {page === "settings" && <SettingsPage />}
          </div>
        </div>

        {/* FOOTER */}
        <AdminFooter />
      </div>

      {/* MODALS */}
      {notificationOpen && (
        <NotificationModal
          notifications={notifications}
          onClose={() => setNotificationOpen(false)}
          onViewAll={() => {
            setNotificationOpen(false);
            setPage("notifications");
          }}
        />
      )}

      {messageModalOpen && (
        <MessageModal
          onClose={() => setMessageModalOpen(false)}
          conversations={headerConversationsData?.data || []}
          employeeNameById={employeeNameById}
          employeeProfileImageById={employeeProfileImageById}
          onSelectConversation={(conversationId) => {
            setSelectedConversationId(conversationId);
            setMessageModalOpen(false);
            setPage("messages");
          }}
        />
      )}
    </div>
  );
}
