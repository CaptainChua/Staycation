"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  ClipboardList,
  AlertCircle,
  Navigation,
  CheckSquare,
  Building2,
  Shield,
  ShieldCheck,
  Loader2,
  Upload,
  X,
  Banknote,
  User,
  Phone,
  Pencil,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useGetCleaningTasksQuery } from "@/redux/api/cleanersApi";
import { updateDepositStatusByBookingId } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";
import { useTranslations, type Lang } from "./translations";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onNavigate?: (page: string) => void;
  onStartCleaning?: (havenId: string, bookingId?: string) => void;
  lang?: Lang;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalMidnight(dateStr: string): Date {
  // For pure date strings (no time), parse directly as local date
  if (!dateStr.includes("T") && !dateStr.includes("Z")) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  // For timestamps, parse then extract LOCAL date components to avoid UTC off-by-one
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfWeek(d: Date) {
  const copy = startOfWeek(d);
  copy.setDate(copy.getDate() + 6);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  const [h, m] = t.substring(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "upcoming":
      return {
        label: "Upcoming",
        bg: "bg-sky-100 dark:bg-sky-900/30",
        text: "text-sky-600 dark:text-sky-300",
        dot: "#0ea5e9",
      };
    case "ready":
      return {
        label: "Ready to Clean",
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-300",
        dot: "#f59e0b",
      };
    case "in-progress":
      return {
        label: "In Progress",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-600 dark:text-orange-300",
        dot: "#f97316",
      };
    case "completed":
    case "cleaned":
    case "inspected":
      return {
        label: "Completed",
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-300",
        dot: "#006543",
      };
    case "assigned":
      return {
        label: "Assigned",
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-300",
        dot: "#6366f1",
      };
    default:
      return {
        label: "Pending",
        bg: "bg-slate-100 dark:bg-slate-700/30",
        text: "text-slate-600 dark:text-slate-300",
        dot: "#94a3b8",
      };
  }
}

function openInMaps(location: string | undefined) {
  const query = location && location !== "Location TBD" ? location : "Quezon City, Philippines";
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    "_blank",
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MySchedulePage({ onNavigate = () => {}, onStartCleaning, lang = "en" }: Props) {
  const t = useTranslations(lang);
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const { data: allTasks = [], isLoading } = useGetCleaningTasksQuery(undefined);

  const assignments = useMemo(() => {
    if (!userId) return [];
    return allTasks.filter(
      (t: any) => String(t.assigned_cleaner_id ?? "") === String(userId),
    );
  }, [allTasks, userId]);

  const today = useMemo(() => new Date(), []);

  // Security deposit collection state
  const [collectedDeposits, setCollectedDeposits] = useState<Set<string>>(new Set());
  const [collectingDepositId, setCollectingDepositId] = useState<string | null>(null);

  // Deposit collection modal state
  const [depositModalTask, setDepositModalTask] = useState<any | null>(null);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState("cash");
  const [depositAmountReceived, setDepositAmountReceived] = useState<string>("");
  const [depositReferenceNumber, setDepositReferenceNumber] = useState<string>("");
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [depositProofPreview, setDepositProofPreview] = useState<string | null>(null);
  const [isConfirmingDeposit, setIsConfirmingDeposit] = useState(false);
  const [isDepositEditMode, setIsDepositEditMode] = useState(false);
  const [existingProofUrl, setExistingProofUrl] = useState<string | null>(null);
  const [depositErrors, setDepositErrors] = useState<Record<string, string>>({});
  const depositProofInputRef = useRef<HTMLInputElement>(null);
  const depositModalBodyRef = useRef<HTMLDivElement>(null);
  const taskPanelRef = useRef<HTMLDivElement>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  const openDepositModal = (a: any, isEdit = false) => {
    setDepositModalTask(a);
    setIsDepositEditMode(isEdit);
    setDepositPaymentMethod("cash");
    const secDep = Number(a.security_deposit) > 0 ? Number(a.security_deposit) : 1000;
    const remBal = Number(a.remaining_balance) > 0 ? Number(a.remaining_balance) : 0;
    const defaultAmt = String(secDep + remBal);
    setDepositAmountReceived(defaultAmt);
    setDepositReferenceNumber("");
    setDepositProofFile(null);
    setDepositProofPreview(null);
    setExistingProofUrl(null);
    setDepositErrors({});

    if (isEdit && a.booking_uuid) {
      fetch(`/api/admin/cleaners/deposit-proof?booking_uuid=${encodeURIComponent(a.booking_uuid)}`)
        .then(r => r.json())
        .then(data => { if (data.success && data.url) setExistingProofUrl(data.url); })
        .catch(() => {});
    }
    fetch("/api/payment-methods")
      .then(r => r.json())
      .then(data => setPaymentMethods(Array.isArray(data.data) ? data.data.filter((m: any) => m.is_active) : []))
      .catch(() => setPaymentMethods([]));
  };

  const closeDepositModal = () => {
    if (isConfirmingDeposit) return;
    setDepositModalTask(null);
    setDepositReferenceNumber("");
    setDepositProofFile(null);
    setDepositProofPreview(null);
  };

  const handleDepositProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDepositProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setDepositProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirmDeposit = async () => {
    if (!depositModalTask?.booking_uuid) {
      toast.error("Booking information not found");
      return;
    }

    // Validate
    const errs: Record<string, string> = {};
    const secDep = Number(depositModalTask.security_deposit) > 0 ? Number(depositModalTask.security_deposit) : 1000;
    const remBal = Number(depositModalTask.remaining_balance) > 0 ? Number(depositModalTask.remaining_balance) : 0;
    const requiredTotal = secDep + remBal;
    const enteredAmount = Number(depositAmountReceived);
    if (!depositAmountReceived || enteredAmount <= 0) {
      errs.amount = "Please enter the amount received from the guest.";
    } else if (enteredAmount < requiredTotal) {
      errs.amount = `Amount is less than the required total of ${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(requiredTotal)}.`;
    }
    if (depositPaymentMethod !== "cash" && !depositReferenceNumber.trim()) {
      errs.reference = "Please enter the reference number for this payment.";
    }
    if (!depositProofFile && !existingProofUrl) {
      errs.proof = "Please upload a proof of payment before confirming.";
    }
    if (Object.keys(errs).length > 0) {
      setDepositErrors(errs);
      setTimeout(() => {
        depositModalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 50);
      return;
    }
    setDepositErrors({});
    setIsConfirmingDeposit(true);
    setCollectingDepositId(depositModalTask.cleaning_id);
    try {
      const amountReceived = Number(depositAmountReceived) > 0 ? Number(depositAmountReceived) : 1000;
      const selectedPm = paymentMethods.find((m: any) => m.id === depositPaymentMethod);
      const methodLabel = depositPaymentMethod === "cash" ? "Cash" : (selectedPm?.payment_name ?? depositPaymentMethod);
      const notes = depositReferenceNumber.trim() ? `Ref: ${depositReferenceNumber.trim()} | Method: ${methodLabel}` : `Method: ${methodLabel}`;
      await updateDepositStatusByBookingId(depositModalTask.booking_uuid, "Paid", userId, notes, amountReceived, methodLabel, "cleaner");

      // If there is a remaining balance, update booking_payments so it's saved
      if (remBal > 0 && depositModalTask.booking_payment_id) {
        try {
          await fetch(`/api/booking-payments/${depositModalTask.booking_payment_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collect_amount: remBal,
              payment_status: "approved_full_payment",
              payment_method: methodLabel,
              reviewed_by: userId ?? undefined,
            }),
          });
        } catch (paymentErr) {
          console.error("Failed to update booking payment remaining balance:", paymentErr);
        }
      }

      // Upload proof file if provided
      if (depositProofFile) {
        const fd = new FormData();
        fd.append("file", depositProofFile);
        fd.append("booking_uuid", depositModalTask.booking_uuid);
        await fetch("/api/admin/cleaners/deposit-proof", { method: "POST", body: fd });
      }

      setCollectedDeposits(prev => new Set([...prev, depositModalTask.cleaning_id]));
      toast.success(`Security deposit of ₱${amountReceived.toLocaleString()} collected from ${depositModalTask.guest_first_name}`);
      setDepositModalTask(null);
      setDepositReferenceNumber("");
    } catch (err) {
      console.error("Failed to record security deposit:", err);
      toast.error("Failed to record security deposit");
    } finally {
      setIsConfirmingDeposit(false);
      setCollectingDepositId(null);
    }
  };

  const [calMonth, setCalMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const stats = useMemo(() => {
    const now = new Date();
    const wStart = startOfWeek(now);
    const wEnd   = endOfWeek(now);
    const mStart = startOfMonth(now);
    const mEnd   = endOfMonth(now);

    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);

    return {
      total:      assignments.length,
      todayCount: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        return isSameDay(new Date(a.check_out_date), now);
      }).length,
      thisWeek:  assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = new Date(a.check_out_date);
        return d >= wStart && d <= wEnd;
      }).length,
      thisMonth: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = new Date(a.check_out_date);
        return d >= mStart && d <= mEnd;
      }).length,
      completed: assignments.filter(
        (a: any) => a.cleaning_status === "cleaned" || a.cleaning_status === "inspected",
      ).length,
      readyCount: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = toLocalMidnight(a.check_out_date);
        const isDone = a.cleaning_status === "cleaned" || a.cleaning_status === "inspected";
        return d <= todayMidnight && !isDone;
      }).length,
      upcomingCount: assignments.filter((a: any) => {
        if (!a.check_out_date) return false;
        const d = toLocalMidnight(a.check_out_date);
        return d > todayMidnight;
      }).length,
    };
  }, [assignments]);

  // ── Schedule map: dateString → enhanced schedule info ────────────────────────
  const scheduleMap = useMemo(() => {
    const map: Record<string, {
      assignments: any[];
      effectiveStatus: string;
      labels: Record<string, string>;
      dayType: "checkIn" | "checkOut" | "middle" | "both";
    }> = {};

    assignments.forEach((a: any) => {
      if (!a.check_out_date) return;

      const startDate = toLocalMidnight(a.check_in_date || a.check_out_date);
      const endDate   = toLocalMidnight(a.check_out_date);

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const isPast = endDate < now;

      const effectiveStatus =
        a.cleaning_status === "in-progress" ? "in-progress"
        : a.cleaning_status === "cleaned" || a.cleaning_status === "inspected" || isPast
        ? "completed"
        : "assigned";

      const isSingleDay = isSameDay(startDate, endDate);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
      ) {
        const key = d.toDateString();
        const isCheckIn  = isSameDay(d, startDate);
        const isCheckOut = isSameDay(d, endDate);

        const newDayType: "checkIn" | "checkOut" | "middle" | "both" =
          isSingleDay  ? "both"     :
          isCheckIn    ? "checkIn"  :
          isCheckOut   ? "checkOut" :
                         "middle";

        if (!map[key]) {
          map[key] = { assignments: [], effectiveStatus, labels: {}, dayType: newDayType };
        } else {
          const priority = { both: 4, checkIn: 3, checkOut: 3, middle: 1 };
          if (priority[newDayType] > priority[map[key].dayType]) {
            map[key].dayType = newDayType;
          }
        }

        if (!map[key].assignments.find((x: any) => x.cleaning_id === a.cleaning_id)) {
          map[key].assignments.push(a);
        }

        const statusPriority: Record<string, number> = { "in-progress": 3, completed: 2, assigned: 1 };
        if ((statusPriority[effectiveStatus] || 0) > (statusPriority[map[key].effectiveStatus] || 0)) {
          map[key].effectiveStatus = effectiveStatus;
        }

        if (isCheckIn)  map[key].labels.checkIn  = a.cleaning_id;
        if (isCheckOut) map[key].labels.checkOut = a.cleaning_id;
      }
    });

    return map;
  }, [assignments]);

  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year  = calMonth.getFullYear();
    const month = calMonth.getMonth();
    return {
      daysInMonth:       new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay(),
    };
  }, [calMonth]);

  const selectedDateKey = selectedDate.toDateString();
  const selectedSchedule = scheduleMap[selectedDateKey];
  // Show tasks on their check-in day (deposit collection) or check-out day (cleaning)
  const selectedAssignments: any[] = selectedSchedule
    ? selectedSchedule.assignments.filter((a: any) => {
        const isCheckoutDay = a.check_out_date && isSameDay(toLocalMidnight(a.check_out_date), selectedDate);
        const isCheckinDay = a.check_in_date && isSameDay(toLocalMidnight(a.check_in_date), selectedDate);
        return isCheckoutDay || isCheckinDay;
      })
    : [];

  const handleTotalTasksClick = () => {
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Find the nearest assignment date that is ready or upcoming
    const nearest = assignments
      .filter((a: any) => a.check_out_date && typeof a.check_out_date === "string")
      .map((a: any) => toLocalMidnight(a.check_out_date))
      .filter((d: Date) => d >= todayMidnight)
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];

    if (nearest) {
      setSelectedDate(nearest);
      setCalMonth(new Date(nearest.getFullYear(), nearest.getMonth(), 1));
    }
    setTimeout(() => {
      taskPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const statsCards = [
    { label: t.totalTasks, value: stats.total,     color: "bg-brand-primary", icon: ClipboardList, sub: `${stats.readyCount} ${t.ready} · ${stats.upcomingCount} ${t.upcoming}`, onClick: handleTotalTasksClick },
    { label: t.thisWeek,   value: stats.thisWeek,  color: "bg-blue-500",      icon: Calendar,      sub: null, onClick: undefined },
    { label: t.thisMonth,  value: stats.thisMonth, color: "bg-green-500",     icon: Building2,     sub: null, onClick: undefined },
    { label: t.completed,  value: stats.completed, color: "bg-purple-500",    icon: CheckCircle2,  sub: null, onClick: undefined },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t.pageTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.pageSubtitle}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map(({ label, value, color, icon: Icon, sub, onClick }) => {
          const inner = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs opacity-90">{label}</p>
                <p className="text-lg sm:text-2xl font-bold mt-0.5">{isLoading ? "…" : value}</p>
                {sub && !isLoading && (
                  <p className="text-[9px] sm:text-[10px] opacity-75 mt-0.5 leading-tight">{sub}</p>
                )}
              </div>
              <Icon className="w-5 h-5 sm:w-8 sm:h-8 opacity-40" />
            </div>
          );
          return onClick ? (
            <button
              key={label}
              onClick={onClick}
              className={`${color} text-white rounded-lg p-2.5 sm:p-4 shadow dark:shadow-gray-900 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all text-left w-full`}
            >
              {inner}
            </button>
          ) : (
            <div
              key={label}
              className={`${color} text-white rounded-lg p-2.5 sm:p-4 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
            >
              {inner}
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Calendar ── */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-4 sm:p-6">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">
              {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-1">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d[0]}</span>
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const date = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
              const dateKey    = date.toDateString();
              const dayAbbr    = WEEK_DAYS[date.getDay()];
              const isToday    = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);

              const dateSchedule    = scheduleMap[dateKey];
              const hasTask         = !!dateSchedule;
              const effectiveStatus = dateSchedule?.effectiveStatus || "pending";
              const dayType         = dateSchedule?.dayType;
              const badge           = getStatusBadge(effectiveStatus);
              // Count checkout (clean) tasks and checkin (deposit) tasks separately
              const cleanCount    = dateSchedule?.assignments.filter((a: any) =>
                a.check_out_date && isSameDay(toLocalMidnight(a.check_out_date), date)
              ).length ?? 0;
              const depositCount  = dateSchedule?.assignments.filter((a: any) =>
                a.check_in_date && isSameDay(toLocalMidnight(a.check_in_date), date) &&
                !(a.check_out_date && isSameDay(toLocalMidnight(a.check_out_date), date))
              ).length ?? 0;
              const taskCount     = cleanCount + depositCount;

              const isMiddleDay   = hasTask && dayType === "middle";
              const isCheckOutDay = hasTask && (dayType === "checkOut" || dayType === "both");

              // Show task badge only when there are actual tasks this day
              const showTaskBadges = taskCount > 0;

              const cellClasses = [
                "aspect-square flex flex-col items-center justify-center rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg relative group p-0.5",
                isSelected
                  ? "bg-gradient-to-br from-brand-primary to-brand-primary/80 text-white shadow-xl ring-2 ring-white/50"
                  : isToday
                  ? "shadow-md text-gray-800 dark:text-gray-100"
                  : hasTask
                  ? `bg-gradient-to-br ${badge.bg} ${badge.text} shadow-xl border-2 border-white/30 dark:border-gray-600/50`
                  : "bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100",
              ].filter(Boolean).join(" ");

              const isCompleted = effectiveStatus === "completed";

              const cellStyle: React.CSSProperties =
                isSelected ? {} :
                isToday ? {
                  backgroundColor: "rgba(131, 49, 2, 0.15)",
                  border: "2px solid rgba(131, 49, 2, 0.5)",
                  color: "#833102",
                } :
                isMiddleDay ? {
                  backgroundColor: "rgba(255, 237, 213, 0.6)",
                  color: "#ea580c",
                  border: "1.5px dashed #fdba74"
                } :
                isCompleted ? {
                  backgroundColor: "rgba(22, 163, 74, 0.25)",
                  border: "2px solid rgba(74, 222, 128, 0.6)",
                  color: "#15803d"
                } :
                isCheckOutDay ? {
                  backgroundColor: "rgba(79, 70, 229, 0.25)",
                  border: "2px solid rgba(134, 239, 172, 0.6)",
                  color: "#4338ca"
                } :
                hasTask ? getStatusBadge(effectiveStatus).bg.includes("indigo") ? {
                  backgroundColor: "rgba(48, 40, 217, 0.25)",
                  border: "2px solid rgba(134, 239, 172, 0.6)",
                  color: "#4338ca"
                } : getStatusBadge(effectiveStatus).bg.includes("orange") ? {
                  backgroundColor: "rgba(255, 237, 213, 0.6)",
                  color: "#ea580c"
                } : {} : {};

              return (
                <button
                  key={day}
                  onClick={() => {
                    setSelectedDate(date);
                    setTimeout(() => {
                      taskPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
                  className={cellClasses}
                  style={cellStyle}
                  title={hasTask ? `${depositCount > 0 ? `${depositCount} deposit` : ""}${depositCount > 0 && cleanCount > 0 ? " · " : ""}${cleanCount > 0 ? `${cleanCount} cleaning` : ""}` : ""}
                >
                  {/* Task count badge — hidden on middle days */}
                  {showTaskBadges && !isSelected && !isToday && taskCount > 0 && (
                    <>
                      <div className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-white dark:bg-gray-800 border-2 border-current rounded-full text-xs font-black flex items-center justify-center z-30 shadow-md leading-none">
                        {taskCount}
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg backdrop-blur-sm" />
                    </>
                  )}

                  <div className={`font-bold text-lg leading-none ${isSelected ? "text-white" : ""}`}>
                    {day}
                  </div>
                  <div className={`text-[11px] font-semibold leading-none opacity-90 ${isSelected ? "text-white" : ""}`}>
                    {dayAbbr}
                  </div>

                  {/* Task indicators */}
                  {showTaskBadges && !isSelected && !isToday && (
                    <div className="flex flex-col items-center gap-0.5 mt-0.5">
                      {/* Mobile: small colored dots only */}
                      <div className="flex items-center gap-0.5 sm:hidden">
                        {depositCount > 0 && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#4338ca" }} />}
                        {cleanCount > 0 && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#15803d" }} />}
                      </div>
                      {/* Desktop: full pill labels */}
                      <div className="hidden sm:flex flex-col items-center gap-0.5">
                        {depositCount > 0 && (
                          <div
                            className="flex items-center gap-0.5 leading-none px-1 py-0.5 rounded-md shadow-sm whitespace-nowrap"
                            style={{ backgroundColor: "#e0e7ff", color: "#4338ca" }}
                          >
                            <span className="text-[9px] font-black leading-none">💰 {t.calDepositLabel}</span>
                          </div>
                        )}
                        {cleanCount > 0 && (
                          <div
                            className="flex items-center gap-0.5 leading-none px-1 py-0.5 rounded-md shadow-sm whitespace-nowrap"
                            style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
                          >
                            <span className="text-[9px] font-black leading-none">🧹 {t.calCleanLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {hasTask && isSelected && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/80 rounded-full shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-nowrap justify-between gap-x-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#6366f1" }} />
              <span className="font-medium whitespace-nowrap">{t.legendAssigned}</span>
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: "#10b981" }} />
              <span className="font-medium whitespace-nowrap">{t.legendCompleted}</span>
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-brand-primary/60" style={{ backgroundColor: "#833102" }} />
              <span className="font-medium whitespace-nowrap">{t.legendToday}</span>
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-dashed border-orange-400/80" style={{ backgroundColor: "#ffedd5" }} />
              <span className="font-medium whitespace-nowrap text-orange-700 dark:text-orange-400">{t.legendStaying}</span>
            </span>
          </div>

        </div>

        {/* ── Detail panel ── */}
        <div ref={taskPanelRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month:   "long",
                  day:     "numeric",
                })}
              </p>
              {isSameDay(selectedDate, today) && (
                <span className="text-xs font-semibold text-brand-primary">{t.today}</span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[520px] pr-0.5">
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-gray-100 dark:bg-gray-700 p-4 animate-pulse space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-600 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600 rounded" />
                </div>
              ))
            ) : selectedAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.noAssignments}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.noAssignmentsSub}</p>
              </div>
            ) : (
              selectedAssignments.map((a: any) => {
                const isCheckinDay = a.check_in_date && isSameDay(toLocalMidnight(a.check_in_date), selectedDate);
                const isCheckoutDay = a.check_out_date && isSameDay(toLocalMidnight(a.check_out_date), selectedDate);

                // ── Check-in day: show deposit collection card ──────────────
                if (isCheckinDay && !isCheckoutDay) {
                  const depositCollected =
                    a.deposit_status === "held" ||
                    a.deposit_status === "paid" ||
                    collectedDeposits.has(a.cleaning_id);
                  const secDepAmt = Number(a.security_deposit) > 0 ? Number(a.security_deposit) : 1000;
                  const remBalAmt = Number(a.remaining_balance) > 0 ? Number(a.remaining_balance) : 0;
                  const depositAmount = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(secDepAmt + remBalAmt);
                  const isCollecting = collectingDepositId === a.cleaning_id;

                  return (
                    <div
                      key={`checkin-${a.cleaning_id ?? a.id}`}
                      className="rounded-xl border border-green-100 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Banknote className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">{t.checkInToday}</span>
                          </div>
                          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
                            {a.haven ?? a.room_name ?? "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {a.guest_first_name} {a.guest_last_name}
                          </p>
                        </div>
                        {depositCollected ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> {t.collected}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full flex-shrink-0">
                            {t.pending}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {t.checkInLabel} {a.check_in_time ? formatTime(a.check_in_time) : "—"}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-green-700 dark:text-green-400">
                          <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                          {depositAmount}
                        </span>
                      </div>

                      {depositCollected ? (
                        <div className="w-full flex items-center gap-2">
                          <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.depositCollected}
                          </div>
                          <button
                            onClick={() => openDepositModal(a, true)}
                            className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openDepositModal(a)}
                          disabled={isCollecting}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                        >
                          <Banknote className="w-3.5 h-3.5" /> {t.securityDeposit}
                        </button>
                      )}
                    </div>
                  );
                }

                // ── Check-out day: show cleaning task card ──────────────────
                const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
                const checkoutDate = a.check_out_date ? toLocalMidnight(a.check_out_date) : null;
                const isUpcoming = checkoutDate ? checkoutDate > todayMidnight : false;
                const isDone = a.cleaning_status === "cleaned" || a.cleaning_status === "inspected";
                const effectiveBadgeStatus = isDone ? a.cleaning_status
                  : isUpcoming ? "upcoming"
                  : a.cleaning_status === "in-progress" ? "in-progress"
                  : "ready";
                const badge = getStatusBadge(effectiveBadgeStatus);
                const isActionable = !isDone && !isUpcoming;

                return (
                  <div
                    key={a.cleaning_id ?? a.id}
                    className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 p-4 space-y-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">
                        {a.haven ?? a.room_name ?? "—"}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {a.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{a.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t.checkoutLabel} {formatDate(a.check_out_date)}
                          {a.check_out_time ? ` · ${formatTime(a.check_out_time)}` : ""}
                        </span>
                      </div>
                      {(a.cleaning_time_in || a.cleaning_time_out) && (
                        <div className="flex items-center gap-3">
                          <span>{t.inLabel} {formatTime(a.cleaning_time_in)}</span>
                          <span>{t.outLabel} {formatTime(a.cleaning_time_out)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openInMaps(a.location); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        {t.openInMaps}
                      </button>

                      {isActionable && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const havenId = a.haven_id ?? a.booking_uuid;
                            if (onStartCleaning && havenId) {
                              onStartCleaning(String(havenId), a.booking_uuid ? String(a.booking_uuid) : undefined);
                            } else {
                              onNavigate("cleaning-checklist");
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary text-xs font-semibold hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          {t.startCleaning}
                        </button>
                      )}

                      {isUpcoming && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const havenId = a.haven_id ?? a.booking_uuid;
                            if (onStartCleaning && havenId) {
                              onStartCleaning(String(havenId), a.booking_uuid ? String(a.booking_uuid) : undefined);
                            } else {
                              onNavigate("cleaning-checklist");
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-xs font-semibold hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          {t.viewChecklist}
                        </button>
                      )}

                      {isDone && (
                        <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.done}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!isLoading && selectedAssignments.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{t.assignmentCount(selectedAssignments.length)}</span>
              <span>
                {selectedAssignments.filter(
                  (a: any) => a.cleaning_status === "cleaned" || a.cleaning_status === "inspected",
                ).length}{" "}
                {t.completedCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isLoading && !isSameDay(selectedDate, today) && stats.todayCount > 0 && (
        <button
          onClick={() => {
            setSelectedDate(today);
            setTimeout(() => {
              taskPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
          }}
          className="w-full flex items-center justify-between gap-3 bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/30 rounded-xl px-4 py-3 hover:bg-brand-primary/20 dark:hover:bg-brand-primary/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-brand-primary text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            {t.todayBanner(stats.todayCount)}
          </div>
          <span className="text-xs text-brand-primary font-medium">{t.viewToday}</span>
        </button>
      )}

      {/* ── Collect from Guest Modal ── */}
      {depositModalTask && typeof window !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[9980] bg-black/50" aria-hidden="true" onClick={closeDepositModal} />
          <div className="fixed z-[9991] w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.depositModalTitle}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.depositModalSub}</p>
                </div>
              </div>
              <button onClick={closeDepositModal} disabled={isConfirmingDeposit} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div ref={depositModalBodyRef} className="p-5 space-y-4 overflow-y-auto">

              {/* Booking info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                {/* Haven + deposit amount */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{depositModalTask.haven ?? depositModalTask.room_name ?? "—"}</p>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3" /> Check-in: {depositModalTask.check_in_time ? formatTime(depositModalTask.check_in_time) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-500">{t.collectFromGuest}</span>
                    {/* Breakdown */}
                    {Number(depositModalTask.remaining_balance) > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span>Balance:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(depositModalTask.remaining_balance))}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span>Security Deposit:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
                          Number(depositModalTask.security_deposit) > 0 ? Number(depositModalTask.security_deposit) : 1000
                        )}
                      </span>
                    </div>
                    {/* Total */}
                    <div className="flex items-center gap-1 mt-0.5 pt-0.5 border-t border-green-200 dark:border-green-700">
                      <span className="text-[10px] text-gray-400">Total:</span>
                      <span className="text-base font-black text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
                          (Number(depositModalTask.remaining_balance) > 0 ? Number(depositModalTask.remaining_balance) : 0) +
                          (Number(depositModalTask.security_deposit) > 0 ? Number(depositModalTask.security_deposit) : 1000)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700" />

                {/* Guest info */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{t.guestToMeet}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {depositModalTask.guest_first_name} {depositModalTask.guest_last_name}
                      </p>
                      {depositModalTask.guest_phone && (
                        <a
                          href={`tel:${depositModalTask.guest_phone}`}
                          className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" /> {depositModalTask.guest_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount received */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> {t.amountReceived}
                </label>
                <div className={`flex items-center border rounded-lg overflow-hidden bg-white dark:bg-gray-700 ${depositErrors.amount ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}>
                  <span className="px-3 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 select-none">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositAmountReceived}
                    onChange={e => { setDepositAmountReceived(e.target.value); setDepositErrors(p => ({ ...p, amount: "" })); }}
                    disabled={isConfirmingDeposit}
                    placeholder="1000.00"
                    className="flex-1 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none disabled:opacity-50"
                  />
                </div>
                {depositErrors.amount && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{depositErrors.amount}</p>}
              </div>

              {/* Payment method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> {t.paymentMethod}
                </label>
                <select
                  value={depositPaymentMethod}
                  onChange={e => { setDepositPaymentMethod(e.target.value); setDepositReferenceNumber(""); }}
                  disabled={isConfirmingDeposit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                >
                  <option value="cash">Cash</option>
                  {paymentMethods.filter((m: any) => m.payment_method !== "cash").map((m: any) => (
                    <option key={m.id} value={m.id}>{m.payment_name}</option>
                  ))}
                </select>
              </div>

              {/* QR code + account details for selected non-cash method */}
              {depositPaymentMethod !== "cash" && (() => {
                const pm = paymentMethods.find((m: any) => m.id === depositPaymentMethod);
                if (!pm) return null;
                return (
                  <div className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-4 space-y-3">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{pm.payment_name} Details</p>
                    {pm.payment_qr_link && (
                      <div className="flex justify-center">
                        <img
                          src={pm.payment_qr_link}
                          alt={`${pm.payment_name} QR Code`}
                          className="w-36 h-36 object-contain rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white p-1"
                        />
                      </div>
                    )}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Provider</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{pm.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Account</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{pm.account_details}</span>
                      </div>
                      {pm.description && (
                        <p className="text-gray-500 dark:text-gray-400 italic pt-1">{pm.description}</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Reference number — non-cash only */}
              {depositPaymentMethod !== "cash" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5" /> {t.referenceNumber}
                  </label>
                  <input
                    type="text"
                    value={depositReferenceNumber}
                    onChange={e => { setDepositReferenceNumber(e.target.value); setDepositErrors(p => ({ ...p, reference: "" })); }}
                    disabled={isConfirmingDeposit}
                    placeholder={t.referencePlaceholder}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${depositErrors.reference ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  />
                  {depositErrors.reference && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{depositErrors.reference}</p>}
                </div>
              )}

              {/* Upload Proof — styled like Cleaning Checklist */}
              <div className={`rounded-lg border-2 p-4 sm:p-5 ${depositProofFile || existingProofUrl ? "border-green-400 dark:border-green-600" : depositErrors.proof ? "border-red-500" : "border-amber-400 dark:border-amber-600"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${depositProofFile || existingProofUrl ? "bg-green-500" : "bg-amber-500"} text-white`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t.uploadProofTitle}</h3>
                        {depositProofFile || existingProofUrl ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Attached</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t.uploadProofRequired}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {isDepositEditMode ? "Previously uploaded proof shown below. Upload new to replace." : t.uploadProofSub}
                      </p>
                    </div>
                  </div>
                  {(depositProofFile || existingProofUrl) && <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />}
                </div>

                {/* New file selected */}
                {depositProofFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {depositProofPreview && depositProofFile.type.startsWith("image/") ? (
                        <img src={depositProofPreview} alt="proof" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{depositProofFile.name}</p>
                        <p className="text-xs text-gray-400">{(depositProofFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setDepositProofFile(null); setDepositProofPreview(null); if (depositProofInputRef.current) depositProofInputRef.current.value = ""; }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ) : existingProofUrl ? (
                  /* Existing proof from server (edit mode) */
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <img src={existingProofUrl} alt="existing proof" className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Previously uploaded proof</p>
                        <button
                          type="button"
                          onClick={() => depositProofInputRef.current?.click()}
                          className="text-xs text-indigo-500 hover:underline mt-0.5"
                        >
                          Replace with new photo
                        </button>
                      </div>
                      <a href={existingProofUrl} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0 text-xs text-indigo-500 font-medium">
                        View
                      </a>
                    </div>
                  </div>
                ) : (
                  /* No file yet — upload prompt */
                  <button
                    type="button"
                    onClick={() => depositProofInputRef.current?.click()}
                    disabled={isConfirmingDeposit}
                    className="w-full border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-6 flex flex-col items-center gap-2 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-8 h-8 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.uploadProofBtn}</span>
                    <span className="text-xs text-gray-400">{t.uploadProofHint}</span>
                  </button>
                )}
                <input
                  ref={depositProofInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => { handleDepositProofChange(e); setDepositErrors(p => ({ ...p, proof: "" })); }}
                />
              </div>
              {depositErrors.proof && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{depositErrors.proof}</p>}

              <p className="text-xs text-gray-400 italic">{t.depositDisclaimer}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <button onClick={closeDepositModal} disabled={isConfirmingDeposit} className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm disabled:opacity-50">
                {t.cancelBtn}
              </button>
              <button
                onClick={handleConfirmDeposit}
                disabled={isConfirmingDeposit}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isConfirmingDeposit
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.processing}</>
                  : <><Banknote className="w-4 h-4" /> {t.confirmCollected}</>}
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
