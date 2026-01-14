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
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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
import AdminFooter from "../AdminFooter";

const ACTIVE_PAGE_STORAGE_KEY = "cleaners-dashboard-active-page";

export default function CleanersDashboard() {
  const router = useRouter();
  const [sidebar, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Mock cleaner data - replace with actual session/auth data
  const cleanerData = {
    name: "Maria Santos",
    email: "maria.santos@staycation.com",
    employeeId: "EMP-001",
    role: "Senior Cleaner",
    profile_image_url: "", // No image - will show initials instead
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

      {/* SIDEBAR */}
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
              <div className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-brand-primary flex-shrink-0 flex items-center justify-center text-white font-medium text-lg overflow-hidden">
                  <span>{cleanerData.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {cleanerData.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {cleanerData.role}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all font-medium"
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
                <LogOut className="w-5 h-5 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-x-hidden overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 h-20 min-h-20 flex-shrink-0 flex justify-between items-center sticky top-0 z-30 shadow-sm">
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
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MessageSquare className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setNotificationOpen((prev) => !prev)}
            >
              <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Avatar with Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-brand-primary rounded-full overflow-hidden flex items-center justify-center text-white font-bold cursor-pointer transition-colors">
                  {cleanerData.profile_image_url ? (
                    <Image
                      src={cleanerData.profile_image_url}
                      alt={cleanerData.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{cleanerData.name.charAt(0).toUpperCase()}</span>
                  )}
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
                      {cleanerData.profile_image_url ? (
                        <Image
                          src={cleanerData.profile_image_url}
                          alt={cleanerData.name}
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
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-6">
          <div className="max-w-[1600px] mx-auto">{renderPage()}</div>
        </div>

        {/* FOOTER */}
        <AdminFooter />
      </div>

      {/* Notification Dropdown */}
      {notificationOpen && (
        <div className="fixed top-20 right-6 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
            <button
              onClick={() => setNotificationOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">{notif.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{notif.time}</p>
              </div>
            ))}
          </div>
          <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setPage("notifications");
                setNotificationOpen(false);
              }}
              className="text-sm text-brand-primary hover:text-brand-primaryDark font-medium"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {/* Click Outside to Close Notifications */}
      {notificationOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotificationOpen(false)}
        ></div>
      )}
    </div>
  );
}
