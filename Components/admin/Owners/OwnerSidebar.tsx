"use client";

import { useState, useEffect } from "react";
import { LogOut, Menu, X, Home, Users, MessageSquare, Settings, User, Bell, UserCircle, ChevronDown, BarChart3, Calendar, DollarSign, Wrench, Star, Shield, TrendingUp, TrendingDown, Building2, Sparkles, Headphones, CalendarOff, UsersRound, Moon, Sun, Monitor, CreditCard, Handshake } from "lucide-react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";

interface OwnerSidebarProps {
  sidebar: boolean;
  setSidebar: (sidebar: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  page: string;
  setPage: (page: string) => void;
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

export default function OwnerSidebar({ sidebar, setSidebar, mobileMenuOpen, setMobileMenuOpen, page, setPage }: OwnerSidebarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  
  // Fetch employees for displaying names
  const { data: employeesData } = useGetEmployeesQuery({});
  const employees = employeesData?.data || [];

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

  // Get user ID for messages
  const userId = (session?.user as { id?: string })?.id;

  // Current owner profile (from employees list for freshest data)
  const currentEmployee = employees.find((emp: EmployeeProfile) => emp.id === userId) || null;

  const headerName =
    (currentEmployee
      ? `${currentEmployee.first_name ?? ""} ${currentEmployee.last_name ?? ""}`.trim() ||
        currentEmployee.email ||
        currentEmployee.employment_id
      : userSession?.name) || "User";

  const headerImage =
    currentEmployee?.profile_image_url ||
    userSession?.profile_image_url ||
    userSession?.image ||
    "";

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
        { id: "calendar", icon: Calendar, label: "Booking Calendar", color: "text-indigo-500" },
        { id: "reservations", icon: Calendar, label: "Reservations", color: "text-indigo-500" },
        { id: "blockedDates", icon: CalendarOff, label: "Blocked Dates", color: "text-red-500" },
      ],
    },
    {
      category: "Property",
      items: [
        { id: "havens", icon: Building2, label: "Haven Management", color: "text-purple-500" },
        { id: "maintenance", icon: Wrench, label: "Maintenance", color: "text-amber-500" },
        { id: "roomManagement", icon: Sparkles, label: "Cleaning Management", color: "text-orange-500" },
      ],
    },
    {
      category: "Finance",
      items: [
        { id: "revenue", icon: DollarSign, label: "Revenue Management", color: "text-emerald-500" },
        { id: "paymentMethods", icon: CreditCard, label: "Payment Methods", color: "text-purple-500" },
      ],
    },
    {
      category: "Communication",
      items: [
        { id: "guest", icon: Headphones, label: "Guest Assistance", color: "text-pink-500" },
        { id: "messages", icon: MessageSquare, label: "Messages", color: "text-green-500" },
        { id: "reviews", icon: Star, label: "Reviews & Feedback", color: "text-yellow-500" },
      ],
    },
    {
      category: "Team",
      items: [
        { id: "staff", icon: Users, label: "Staff Management", color: "text-brand-primary" },
        { id: "userManagement", icon: UsersRound, label: "User Management", color: "text-teal-500" },
        { id: "partnerManagement", icon: Handshake, label: "Partner Management", color: "text-indigo-500" },
      ],
    },
    {
      category: "System",
      items: [
        { id: "settings", icon: Settings, label: "Settings", color: "text-gray-500" },
        { id: "audit", icon: Shield, label: "Audit Logs", color: "text-rose-500" },
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
    <>
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR - Desktop and Mobile */}
      <div
        className={`${
          sidebar ? "w-72" : "w-20"
        } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-col md:sticky md:top-0 self-start h-screen shadow-xl
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Owner Portal</p>
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
        <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${
          !sidebar
            ? "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            : ""
        }`}>
          {navCategories.map((category, categoryIndex) => (
            <div key={category.category} className={categoryIndex > 0 ? "pt-2" : ""}>
              {/* Category Header - only show when sidebar is expanded */}
              {sidebar && (
                <div className="px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {category.category}
                  </span>
                </div>
              )}
              {/* Category Items */}
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
                      className={`w-full flex items-center ${sidebar ? "gap-4 px-4" : "justify-center px-2"} py-3 rounded-lg transition-all duration-200 group ${
                        page === item.id
                          ? "bg-brand-primary text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={!sidebar ? item.label : undefined}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          page === item.id
                            ? "text-white"
                            : `${item.color} group-hover:scale-110 transition-transform`
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

        {/* User Profile & Logout - Only for collapsed sidebar */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          {!sidebar && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold">
                {userSession?.profile_image_url || userSession?.image ? (
                  <Image
                    src={userSession.profile_image_url || userSession.image || ''}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{userSession?.name?.charAt(0) || "O"}</span>
                )}
              </div>
              <button 
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
