"use client";

import { LogOut, Menu, X, Home, Users, MessageSquare, Settings, Bell, UserCircle, ChevronDown, BarChart3, Calendar, DollarSign, Wrench, Star, Shield, Sparkles } from "lucide-react";
import DashboardPage, { Haven } from "./DashboardPage";
import GuestAssistancePage from "./GuestAssistancePage";
import AddUnitModal from "./Modals/AddUnitModal";
import BookingModalSetting from "./Modals/BookingModalSetting";
import CreateEmployeeModal from "./Modals/CreateEmployeeModal";
import EditEmployeeModal from "./Modals/EditEmployeeModal";
import PaymentSettingsModal from "./Modals/PaymentSettingsModal";
import BookingDateModal from "./Modals/BookingDateModal";
import AddNewHavenModal from "./Modals/AddNewHavenModal";
import PoliciesModal from "./Modals/PoliciesModal";
import StaffActivityPage from "./StaffActivityPage";
import ViewAllUnits from "./ViewAllUnits";
import ProfilePage from "./ProfilePage";
import AnalyticsPage from "./AnalyticsPage";
import ReservationsPage from "./ReservationsPage";
import RevenueManagementPage from "./RevenueManagementPage";
import MaintenancePage from "./MaintenancePage";
import ReviewsPage from "./ReviewsPage";
import SettingsPage from "./SettingsPage";
import AuditLogsPage from "./AuditLogsPage";
import MessagesPage from "./MessagesPage";
import RoomManagement from "./CleaningManagement";
import AdminFooter from "../AdminFooter";
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useGetHavensQuery } from "@/redux/api/roomApi";

interface Haven {
  uuid_id?: string;
  haven_name?: string;
  name?: string;
  tower?: string;
  floor?: string;
  blocked_dates?: Array<{
    from_date: string;
    to_date: string;
  }>;
  [key: string]: unknown;
}

interface EmployeeData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  [key: string]: unknown;
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

// Placeholder component for Haven Management
interface HavenManagementPlaceholderProps {
  onAddHavenClick: () => void;
  onViewAllClick: () => void;
}

function HavenManagementPlaceholder({ onAddHavenClick, onViewAllClick }: HavenManagementPlaceholderProps) {
  const sampleHavens = ["Haven 1", "Haven 2", "Haven 3", "Haven 4"];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Home className="w-12 h-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Haven Management
          </h2>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            Manage your property units, availability, pricing, and amenities all
            in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onAddHavenClick}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Add New Haven
            </button>
            <button
              onClick={onViewAllClick}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              View All Units
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats for Haven Management */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg p-6">
          <p className="text-sm opacity-90 mb-2">Total Units</p>
          <p className="text-4xl font-bold">{sampleHavens.length}</p>
          <p className="text-sm mt-2 opacity-75">Active properties</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl shadow-lg p-6">
          <p className="text-sm opacity-90 mb-2">Available Now</p>
          <p className="text-4xl font-bold">3</p>
          <p className="text-sm mt-2 opacity-75">Ready for booking</p>
        </div>
        <div className="bg-brand-primary text-white rounded-2xl shadow-lg p-6">
          <p className="text-sm opacity-90 mb-2">Maintenance</p>
          <p className="text-4xl font-bold">1</p>
          <p className="text-sm mt-2 opacity-75">Under maintenance</p>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { data: session} = useSession();
  const [sidebar, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [havenView, setHavenView] = useState<"overview" | "list">("overview");
  const [modals, setModals] = useState({
    addUnit: false,
    payment: false,
    booking: false,
    employee: false,
    editEmployee: false,
    addHaven: false,
    policies: false,
  });
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [bookingDateModal, setBookingDateModal] = useState<{
    isOpen: boolean;
    selectedDate: Date | null;
    havenName: string;
  }>({
    isOpen: false,
    selectedDate: null,
    havenName: "",
  });

  // Fetch havens from database
  const { data: havensData } = useGetHavensQuery({});
  
  // Type guard for havensData
  const getAllHavens = (): Haven[] => {
    if (Array.isArray(havensData)) {
      return havensData as Haven[];
    }
    return [];
  };

  const allHavens = getAllHavens();

  // Group havens by name to get unique haven names
  const uniqueHavenNames = Array.from(
    new Set(allHavens.map((h: Haven) => h.haven_name?.trim()))
  ).filter(Boolean) as string[];

  // Create haven objects with the first matching haven's data for each unique name
  // Ensure haven_name, tower, and floor are required for DashboardPage compatibility
  const havens = uniqueHavenNames
    .map((name: string) => {
      const haven = allHavens.find((h: Haven) => h.haven_name?.trim() === name);
      if (haven && haven.haven_name && haven.tower && haven.floor) {
        return {
          ...haven,
          haven_name: haven.haven_name,
          tower: haven.tower,
          floor: haven.floor,
        };
      }
      return null;
    })
    .filter((haven): haven is Haven & { haven_name: string; tower: string; floor: string } => {
      return !!haven && !!haven.haven_name && !!haven.tower && !!haven.floor;
    });

  const openModal = (modal: string) => setModals({ ...modals, [modal]: true });
  const closeModal = (modal: string) =>
    setModals({ ...modals, [modal]: false });

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
      toast.success("Logged out successfully!")
    } catch (error) {
      console.error("Logout error: ", error);
      toast.error("Failed to logout")
    }
  }

  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard", color: "text-blue-500" },
    {
      id: "analytics",
      icon: BarChart3,
      label: "Analytics & Reports",
      color: "text-cyan-500",
    },
    {
      id: "reservations",
      icon: Calendar,
      label: "Reservations",
      color: "text-indigo-500",
    },
    {
      id: "havens",
      icon: Home,
      label: "Haven Management",
      color: "text-purple-500",
    },
    {
      id: "maintenance",
      icon: Wrench,
      label: "Maintenance",
      color: "text-amber-500",
    },
    {
      id: "roomManagement",
      icon: Sparkles,
      label: "Cleaning Management",
      color: "text-orange-500",
    },
    {
      id: "reviews",
      icon: Star,
      label: "Reviews & Feedback",
      color: "text-yellow-500",
    },
    {
      id: "revenue",
      icon: DollarSign,
      label: "Revenue Management",
      color: "text-emerald-500",
    },
    {
      id: "messages",
      icon: MessageSquare,
      label: "Messages",
      color: "text-green-500",
    },
    {
      id: "staff",
      icon: Users,
      label: "Staff Management",
      color: "text-brand-primary",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      color: "text-gray-500",
    },
    {
      id: "audit",
      icon: Shield,
      label: "Audit Logs",
      color: "text-red-500",
    },
  ];

  // Helper function to get user from session
  const getUser = (): User | null => {
    return session?.user || null;
  };

  // Helper function to get user session with role
  const getUserSession = (): UserSession | null => {
    const user = getUser();
    if (!user) return null;
    
    return {
      name: user.name,
      email: user.email,
      image: user.image,
      profile_image_url: (user as UserSession)?.profile_image_url,
      role: (user as UserSession)?.role || "Owner"
    };
  };

  const userSession = getUserSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 flex items-start">
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
        } bg-white border-r border-gray-200 transition-all duration-300 flex-col sticky top-0 self-start h-screen shadow-xl
        ${
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 z-50 flex animate-in slide-in-from-left duration-300"
            : "hidden"
        } md:flex`}
      >
        {/* Logo Section */}
        <div className="h-20 px-6 border-b border-gray-200 bg-white flex items-center">
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
                  <h1 className="font-bold text-lg text-gray-800">
                    Staycation Haven
                  </h1>
                  <p className="text-xs text-gray-500">Owner Portal</p>
                </div>
              )}
            </div>
            {/* Mobile Close Button */}
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/50 rounded-lg md:hidden transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center ${sidebar ? "gap-4 px-4" : "justify-center px-2"} py-3.5 rounded-xl transition-all duration-200 group ${
                  page === item.id
                    ? "bg-brand-primary text-white shadow-lg shadow-md"
                    : "text-gray-600 hover:bg-gray-50 hover:shadow-md"
                }`}
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
        </nav>

        {/* User Profile & Logout */}
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          {sidebar && (
            <div className="mb-2">
              <div className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                {userSession?.profile_image_url || userSession?.image ? (
                  <Image
                    src={userSession.profile_image_url || userSession.image || ''}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-brand-primary rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold">
                    {userSession?.name?.charAt(0) || "O"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {userSession?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userSession?.role || "Owner"}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <button 
                  className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          )}
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
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-x-hidden overflow-y-auto">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 px-6 h-20 min-h-20 flex-shrink-0 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebar(!sidebar)}
              className="p-2 hover:bg-gray-100 rounded-lg hidden md:block transition-colors"
            >
              {sidebar ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {navItems.find((item) => item.id === page)?.label ||
                  "Dashboard"}
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back! Here&apos;s what&apos;s happening today.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-6 h-6 text-gray-600" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {userSession?.profile_image_url || userSession?.image ? (
                  <Image
                    src={userSession.profile_image_url || userSession.image || ''}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold">
                    {userSession?.name?.charAt(0) || "O"}
                  </div>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {userSession?.profile_image_url || userSession?.image ? (
                      <Image
                        src={userSession.profile_image_url || userSession.image || ''}
                        alt="Profile"
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {userSession?.name?.charAt(0) || "O"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {userSession?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userSession?.role || "Owner"}
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
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCircle className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 pt-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
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
            {page === "dashboard" && (
              <DashboardPage
                onAddUnitClick={() => openModal("addUnit")}
                onPaymentClick={() => openModal("payment")}
                onBookingClick={() => openModal("booking")}
                onPoliciesClick={() => openModal("policies")}
                havens={havens}
                onDateClick={(date: Date, haven: Haven) => {
                  setBookingDateModal({
                    isOpen: true,
                    selectedDate: date,
                    havenName: haven.haven_name || haven.name || 'Unknown Haven',
                  });
                }}
              />
            )}
            {page === "havens" && havenView === "overview" && (
              <HavenManagementPlaceholder
                onAddHavenClick={() => openModal("addHaven")}
                onViewAllClick={() => setHavenView("list")}
              />
            )}
            {page === "havens" && havenView === "list" && (
              <ViewAllUnits onAddUnitClick={() => openModal("addHaven")} />
            )}
            {page === "analytics" && <AnalyticsPage />}
            {page === "reservations" && <ReservationsPage />}
            {page === "revenue" && <RevenueManagementPage />}
            {page === "maintenance" && <MaintenancePage />}
            {page === "reviews" && <ReviewsPage />}
            {page === "guest" && <GuestAssistancePage />}
            {page === "staff" && (
              <StaffActivityPage
                onCreateClick={() => openModal("employee")}
                onEditClick={(employee: EmployeeData) => {
                  setSelectedEmployee(employee);
                }}
              />
            )}
            {page === "settings" && <SettingsPage />}
            {page === "audit" && <AuditLogsPage />}
            {page === "roomManagement" && <RoomManagement />}
            {page === "audit" && <AuditLogsPage />}
            {page === "profile" && <ProfilePage />}
            {page === "messages" && <MessagesPage />}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-[1600px] mx-auto flex justify-between items-center text-sm text-gray-600">
            <p> 2024 Staycation Haven. All rights reserved.</p>
            <div className="flex gap-4">
              <button className="hover:text-brand-primary transition-colors">
                Help Center
              </button>
              <button className="hover:text-brand-primary transition-colors">
                Privacy Policy
              </button>
              <button className="hover:text-brand-primary transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
        <AdminFooter />
      </div>

      {/* MODALS */}
      <AddUnitModal
        isOpen={modals.addUnit}
        onClose={() => closeModal("addUnit")}
      />
      <PaymentSettingsModal
        isOpen={modals.payment}
        onClose={() => closeModal("payment")}
      />
      <BookingModalSetting
        isOpen={modals.booking}
        onClose={() => closeModal("booking")}
      />
      <CreateEmployeeModal
        isOpen={modals.employee}
        onClose={() => closeModal("employee")}
      />
      <EditEmployeeModal
        isOpen={modals.editEmployee}
        onClose={() => {
          closeModal("editEmployee");
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />
      <BookingDateModal
        isOpen={bookingDateModal.isOpen}
        onClose={() =>
          setBookingDateModal({
            isOpen: false,
            selectedDate: null,
            havenName: "",
          })
        }
        selectedDate={bookingDateModal.selectedDate || new Date()}
        havenName={bookingDateModal.havenName}
      />
      <AddNewHavenModal
        isOpen={modals.addHaven}
        onClose={() => closeModal("addHaven")}
      />
      <PoliciesModal
        isOpen={modals.policies}
        onClose={() => closeModal("policies")}
      />
    </div>
  );
}