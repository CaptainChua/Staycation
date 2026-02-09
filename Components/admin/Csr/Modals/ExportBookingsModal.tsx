"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, Calendar, FileSpreadsheet, File, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface BookingData {
  id: string;
  booking_id: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guest_phone: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  payment_method: string;
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  remaining_balance: number;
  status: string;
  created_at?: string;
}

interface ExportBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingData[];
}

export default function ExportBookingsModal({ isOpen, onClose, bookings }: ExportBookingsModalProps) {
  const [dateFilter, setDateFilter] = useState<"all" | "weekly" | "monthly" | "yearly" | "custom">("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previewModalRef = useRef<HTMLDivElement>(null);

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  
  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Date range helper
  const getDateRange = (filterType: "all" | "weekly" | "monthly" | "yearly" | "custom") => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "weekly": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return { start: weekStart, end: weekEnd };
      }
      case "monthly": {
        // Use selected month and year (month is 1-12, but Date uses 0-11)
        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
        const monthEnd = new Date(selectedYear, selectedMonth, 0); // Last day of selected month
        monthEnd.setHours(23, 59, 59, 999);
        return { start: monthStart, end: monthEnd };
      }
      case "yearly": {
        // Use selected year
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        return { start: yearStart, end: yearEnd };
      }
      case "custom": {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return null;
      }
      default:
        return null;
    }
  };

  // Filter bookings based on date filter
  const filteredBookingsForExport = useMemo(() => {
    if (dateFilter === "all") return bookings;

    const dateRange = getDateRange(dateFilter);
    if (!dateRange) return bookings;

    return bookings.filter((booking) => {
      const bookingDate = booking.created_at
        ? new Date(booking.created_at)
        : booking.check_in_date
        ? new Date(booking.check_in_date)
        : null;

      if (!bookingDate) return false;

      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate >= dateRange.start && bookingDate <= dateRange.end;
    });
  }, [bookings, dateFilter, customStartDate, customEndDate, selectedMonth, selectedYear]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Download blob helper
  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Escape HTML helper
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Export to PDF
  const handleExportPDF = () => {
    try {
      if (filteredBookingsForExport.length === 0) {
        toast.error("No bookings to export");
        return;
      }

      const printWindow = window.open("", "_blank", "noopener,noreferrer");

      if (!printWindow) {
        toast.error("Please allow pop-ups for this site to export PDF");
        return;
      }

      const tableRows = filteredBookingsForExport
        .map((booking) => {
          const guestName = `${booking.guest_first_name || ""} ${booking.guest_last_name || ""}`.trim();
          return `
            <tr>
              <td>${escapeHtml(booking.booking_id)}</td>
              <td>${escapeHtml(guestName)}</td>
              <td>${escapeHtml(booking.guest_email || "")}</td>
              <td>${escapeHtml(booking.guest_phone || "")}</td>
              <td>${escapeHtml(booking.room_name || "")}</td>
              <td>${escapeHtml(formatDate(booking.check_in_date))}</td>
              <td>${escapeHtml(booking.check_in_time || "")}</td>
              <td>${escapeHtml(formatDate(booking.check_out_date))}</td>
              <td>${escapeHtml(booking.check_out_time || "")}</td>
              <td>${booking.adults || 0}</td>
              <td>${booking.children || 0}</td>
              <td>${booking.infants || 0}</td>
              <td>${escapeHtml(booking.payment_method || "")}</td>
              <td>${formatCurrency(booking.room_rate || 0)}</td>
              <td>${formatCurrency(booking.security_deposit || 0)}</td>
              <td>${formatCurrency(booking.add_ons_total || 0)}</td>
              <td>${formatCurrency(booking.total_amount || 0)}</td>
              <td>${formatCurrency(booking.down_payment || 0)}</td>
              <td>${formatCurrency(booking.remaining_balance || 0)}</td>
              <td>${escapeHtml(booking.status || "")}</td>
              <td>${booking.created_at ? escapeHtml(formatDate(booking.created_at)) : ""}</td>
            </tr>
          `;
        })
        .join("");

      const dateRangeLabel = dateFilter !== "all" ? ` (${dateFilter})` : "";
      const doc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Bookings Report${dateRangeLabel}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; }
              h1 { text-align: center; margin-bottom: 8px; color: #333; }
              .subtitle { text-align: center; margin-bottom: 16px; color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f3f4f6; font-weight: bold; }
              tr:nth-child(even) { background: #f9fafb; }
              .currency { text-align: right; }
            </style>
          </head>
          <body>
            <h1>Bookings Report${dateRangeLabel}</h1>
            <p class="subtitle">Generated: ${escapeHtml(new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" }))}</p>
            <p class="subtitle">Total Bookings: ${filteredBookingsForExport.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Haven</th>
                  <th>Check-In Date</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Date</th>
                  <th>Check-Out Time</th>
                  <th>Adults</th>
                  <th>Children</th>
                  <th>Infants</th>
                  <th>Payment Method</th>
                  <th class="currency">Room Rate</th>
                  <th class="currency">Security Deposit</th>
                  <th class="currency">Add-ons Total</th>
                  <th class="currency">Total Amount</th>
                  <th class="currency">Down Payment</th>
                  <th class="currency">Remaining Balance</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || "<tr><td colspan='21'>No data to display</td></tr>"}
              </tbody>
            </table>
          </body>
        </html>
      `;

      printWindow.document.write(doc);
      printWindow.document.close();

      // Wait for content to load before printing
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      // Fallback if onload doesn't fire
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 250);

      toast.success("Bookings exported to PDF successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please check the console for errors.");
    }
  };

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    if (filteredBookingsForExport.length === 0) {
      toast.error("No bookings to export");
      return;
    }

    const headers = [
      "Booking ID",
      "Guest Name",
      "Email",
      "Phone",
      "Haven",
      "Check-In Date",
      "Check-In Time",
      "Check-Out Date",
      "Check-Out Time",
      "Adults",
      "Children",
      "Infants",
      "Payment Method",
      "Room Rate",
      "Security Deposit",
      "Add-ons Total",
      "Total Amount",
      "Down Payment",
      "Remaining Balance",
      "Status",
      "Created At",
    ];

    const csvLines = [headers.join(",")];

    filteredBookingsForExport.forEach((booking) => {
      const guestName = `${booking.guest_first_name || ""} ${booking.guest_last_name || ""}`.trim();
      const line = [
        booking.booking_id,
        guestName,
        booking.guest_email || "",
        booking.guest_phone || "",
        booking.room_name || "",
        formatDate(booking.check_in_date),
        booking.check_in_time || "",
        formatDate(booking.check_out_date),
        booking.check_out_time || "",
        booking.adults || 0,
        booking.children || 0,
        booking.infants || 0,
        booking.payment_method || "",
        booking.room_rate || 0,
        booking.security_deposit || 0,
        booking.add_ons_total || 0,
        booking.total_amount || 0,
        booking.down_payment || 0,
        booking.remaining_balance || 0,
        booking.status || "",
        booking.created_at ? formatDate(booking.created_at) : "",
      ]
        .map((value) => {
          const safe = String(value ?? "").replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",");
      csvLines.push(line);
    });

    const timestamp = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(new Date())
      .replace(/[^\d]/g, "");

    const dateRangeLabel = dateFilter !== "all" ? `_${dateFilter}` : "";
    downloadBlob(csvLines.join("\n"), `bookings${dateRangeLabel}_${timestamp}.csv`, "text/csv;charset=utf-8;");
    toast.success("Bookings exported to Excel successfully");
    onClose();
  };

  // Handle click outside
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (modalRef.current && !modalRef.current.contains(target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle click outside for preview modal
  const handlePreviewClickOutside = (event: MouseEvent) => {
    const target = event.target as Node;
    if (previewModalRef.current && !previewModalRef.current.contains(target)) {
      setIsPreviewModalOpen(false);
    }
  };

  useEffect(() => {
    if (isPreviewModalOpen) {
      document.addEventListener("mousedown", handlePreviewClickOutside);
      return () => {
        document.removeEventListener("mousedown", handlePreviewClickOutside);
      };
    }
  }, [isPreviewModalOpen]);

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />
      <div
        ref={modalRef}
        className="fixed z-[9991] w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500/10 to-green-600/5 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Export Bookings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Export bookings data to CSV or Excel format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Date Filter Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Date Filter</h3>
            </div>

            <div className="space-y-4">
              {/* Date Filter Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Time</option>
                  <option value="weekly">This Week</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Month selector - shown when monthly filter is selected */}
              {dateFilter === "monthly" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {monthNames.map((month, index) => (
                        <option key={index} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Year selector - shown when yearly filter is selected */}
              {dateFilter === "yearly" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Date Range */}
              {dateFilter === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Preview Count */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">{filteredBookingsForExport.length}</span> booking(s) will be exported
                  </p>
                  <button
                    onClick={() => setIsPreviewModalOpen(true)}
                    disabled={filteredBookingsForExport.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    View Preview
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleExportPDF}
                disabled={filteredBookingsForExport.length === 0}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <File className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Export as PDF</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Print-friendly document</p>
                </div>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredBookingsForExport.length === 0}
                className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Export as Excel</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Spreadsheet format</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <>
          <div className="fixed inset-0 z-[9992] bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setIsPreviewModalOpen(false)} />
          <div
            ref={previewModalRef}
            className="fixed z-[9993] w-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-blue-600/5 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Export Preview</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Preview {filteredBookingsForExport.length} booking(s) that will be exported
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Table Content */}
            <div className="p-6 max-h-[calc(95vh-150px)] overflow-y-auto">
              {filteredBookingsForExport.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No bookings to preview
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Booking ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Guest Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Haven</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Check-In</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Check-Out</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Guests</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-200">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookingsForExport.map((booking, index) => {
                        const guestName = `${booking.guest_first_name || ""} ${booking.guest_last_name || ""}`.trim();
                        return (
                          <tr
                            key={booking.id || index}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-xs text-gray-800 dark:text-gray-100">{booking.booking_id}</td>
                            <td className="py-3 px-4 text-gray-800 dark:text-gray-100">{guestName || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{booking.guest_email || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{booking.room_name || "N/A"}</td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                              {formatDate(booking.check_in_date)}
                              <br />
                              <span className="text-xs text-gray-500">{booking.check_in_time || ""}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                              {formatDate(booking.check_out_date)}
                              <br />
                              <span className="text-xs text-gray-500">{booking.check_out_time || ""}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                              {booking.adults || 0} A, {booking.children || 0} C, {booking.infants || 0} I
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                booking.status === "approved" ? "bg-green-100 text-green-700" :
                                booking.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                                booking.status === "declined" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {booking.status || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-gray-100">
                              {formatCurrency(booking.total_amount || 0)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
