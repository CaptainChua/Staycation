"use client";

import OwnerSidebar from "./OwnerSidebar";
import OwnerHeader from "./OwnerHeader";
import DashboardPage, { Haven } from "./DashboardPage";
import CalendarPage from "./CalendarPage";
import GuestAssistancePage from "./GuestAssistancePage";
import AddUnitModal from "./Modals/AddUnitModal";
import BookingModalSetting from "./Modals/BookingModalSetting";
import CreateEmployeeModal from "./Modals/CreateEmployeeModal";
import EditEmployeeModal from "./Modals/EditEmployeeModal";
import PaymentSettingsModal from "./Modals/PaymentSettingsModal";
import BookingDateModal from "./Modals/BookingDateModal";
import AddNewHavenModal from "./Modals/AddNewHavenModal";
import PoliciesModal from "./Modals/PoliciesModal";
import NotificationModal from "./Modals/NotificationModal";
import MessageModal from "./Modals/MessageModal";
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
import BlockedDatesManagementPage from "./BlockedDatesManagementPage";
import UserManagementPage from "./UserManagementPage";
import AdminFooter from "../AdminFooter";
import toast from 'react-hot-toast';
import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import { Home, BarChart3, Calendar, CalendarOff, Building2, Wrench, Sparkles, DollarSign, Headphones, MessageSquare, Star, Users, UsersRound, Settings, Shield } from "lucide-react";

interface OwnerHaven {
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

export default function OwnerDashboard() {
  const { data: session} = useSession();
  const [sidebar, setSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [page, setPage] = useState("dashboard");
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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Get user ID for messages
  const userId = (session?.user as { id?: string })?.id;

  // Fetch havens from database
  const { data: havensData } = useGetHavensQuery({});

  // Type guard for havensData
  const getAllHavens = (): OwnerHaven[] => {
    if (Array.isArray(havensData)) {
      return havensData as OwnerHaven[];
    }
    return [];
  };

  const allHavens = getAllHavens();

  // Group havens by name to get unique haven names
  const uniqueHavenNames = Array.from(
    new Set(allHavens.map((h: OwnerHaven) => h.haven_name?.trim()))
  ).filter(Boolean) as string[];

  // Create haven objects with the first matching haven's data for each unique name
  const havens = uniqueHavenNames
    .map((name: string) => {
      const haven = allHavens.find((h: OwnerHaven) => h.haven_name?.trim() === name);
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
    .filter((haven): haven is OwnerHaven & { haven_name: string; tower: string; floor: string } => {
      return !!haven && !!haven.haven_name && !!haven.tower && !!haven.floor;
    });

  const openModal = (modal: string) => setModals({ ...modals, [modal]: true });
  const closeModal = (modal: string) =>
    setModals({ ...modals, [modal]: false });

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start">
      <OwnerSidebar
        sidebar={sidebar}
        setSidebar={setSidebar}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        page={page}
        setPage={setPage}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-x-hidden overflow-y-auto">
        <OwnerHeader
          sidebar={sidebar}
          setSidebar={setSidebar}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          page={page}
          setPage={setPage}
          navCategories={navCategories}
          selectedConversationId={selectedConversationId}
          setSelectedConversationId={setSelectedConversationId}
        />

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
              />
            )}
            {page === "calendar" && <CalendarPage havens={havens} />}
            {page === "havens" && (
              <div className="space-y-6">
                <ViewAllUnits onAddUnitClick={() => openModal("addHaven")} hideHeader={true} />
              </div>
            )}
            {page === "blockedDates" && <BlockedDatesManagementPage />}
            {page === "userManagement" && <UserManagementPage />}
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
                  openModal("editEmployee");
                }}
              />
            )}
            {page === "settings" && <SettingsPage />}
            {page === "audit" && <AuditLogsPage />}
            {page === "roomManagement" && <RoomManagement />}
            {page === "profile" && <ProfilePage />}
            {page === "messages" && (
              <MessagesPage
                initialConversationId={selectedConversationId}
                onClose={() => {
                  setSelectedConversationId(null);
                  setPage("dashboard");
                }}
              />
            )}
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