"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Menu, X, MessageSquare, Bell, User, Settings, LogOut, UserCircle, ChevronDown, Moon, Sun, Monitor } from "lucide-react";
import Image from "next/image";
import { useGetConversationsQuery } from "@/redux/api/messagesApi";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import { useGetUnreadCountQuery } from "@/redux/api/notificationsApi";
import NotificationModal from "./Modals/NotificationModal";
import MessageModal from "./Modals/MessageModal";

interface OwnerHeaderProps {
  sidebar: boolean;
  setSidebar: (sidebar: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  page: string;
  setPage: (page: string) => void;
  navCategories: Array<{
    category: string;
    items: Array<{
      id: string;
      icon: any;
      label: string;
      color: string;
    }>;
  }>;
  selectedConversationId: string | null;
  setSelectedConversationId: (id: string | null) => void;
}

interface EmployeeProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  employment_id?: string;
  profile_image_url?: string;
}

interface UserSession {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profile_image_url?: string;
  role?: string;
}

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function OwnerHeader({
  sidebar,
  setSidebar,
  mobileMenuOpen,
  setMobileMenuOpen,
  page,
  setPage,
  navCategories,
  selectedConversationId,
  setSelectedConversationId,
}: OwnerHeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageBadge, setMessageBadge] = useState(true);
  const [now, setNow] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);
  const messageButtonRef = useRef<HTMLButtonElement | null>(null);

  // Get user ID for messages
  const userId = (session?.user as { id?: string })?.id;

  // Fetch employees for displaying names
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

  // Fetch conversations for message modal
  const {
    data: headerConversationsData,
    isLoading: isLoadingHeaderConversations,
  } = useGetConversationsQuery(
    { userId: userId || "" },
    { skip: !userId, pollingInterval: 5000 }
  );

  // Fetch unread count for notifications badge
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, {
    skip: !userId,
    pollingInterval: 30000
  });

  // Helper function to get user from session
  function getUser(): User | null {
    return session?.user || null;
  }

  // Helper function to get user session with role
  function getUserSession(): UserSession | null {
    const user = getUser();
    if (!user) return null;

    return {
      name: user.name,
      email: user.email,
      image: user.image,
      profile_image_url: (user as UserSession)?.profile_image_url,
      role: (user as UserSession)?.role || "Owner",
    };
  }

  const userSession = getUserSession();

  // Current owner profile (from employees list for freshest data)
  const currentEmployee = employees.find((emp: EmployeeProfile) => emp.id === userId) || null;

  const headerName =
    (currentEmployee
      ? `${currentEmployee.first_name ?? ""} ${currentEmployee.last_name ?? ""}`.trim() ||
        currentEmployee.email ||
        currentEmployee.employment_id
      : userSession?.name) || "User";

  const headerRole = userSession?.role || "Owner";

  const headerImage =
    currentEmployee?.profile_image_url ||
    userSession?.profile_image_url ||
    userSession?.image ||
    "";

  // Live date and time update logic
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

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
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-20 min-h-20 flex-shrink-0 flex justify-between items-center sticky top-0 z-10">
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg hidden md:flex transition-colors"
        >
          {sidebar ? (
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Current Date & Time */}
        <div className="flex flex-col items-start">
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
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 p-1 sm:px-2 sm:py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-full overflow-hidden flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold cursor-pointer transition-colors">
              {headerImage ? (
                <Image
                  src={headerImage}
                  alt={headerName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{headerName?.charAt(0).toUpperCase() || "O"}</span>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[120px]">
                {headerName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                {headerRole}
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
                  {headerImage ? (
                    <Image
                      src={headerImage}
                      alt={headerName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                      {headerName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {userSession?.email || headerRole}
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
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm">My Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setPage("settings");
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm">Settings</span>
                  </div>
                </button>
              </div>

              {/* Theme Toggle - Exact copy from navbar */}
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
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {notificationOpen && (
        <NotificationModal
          notifications={[]} // Required prop, handled internally by API if userId is present
          onClose={() => setNotificationOpen(false)}
          onViewAll={() => {
            setNotificationOpen(false);
            // Navigate to notifications page if needed in the future
          }}
          anchorRef={notificationButtonRef}
          userId={userId || undefined}
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
