"use client";

import {
  Wallet,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  User,
  Eye,
  RotateCcw,
  Loader2,
  Trash2,
  CheckCircle,
  Clock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Banknote,
  CheckSquare,
  Square,
  Play,
  XCircle,
  Download
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// Highlight text function
const highlightText = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-medium">
        {part}
      </span>
    ) : (
      part
    )
  );
};

import { getDeposits, DepositRecord, updateDepositStatus, deleteDeposit, refundDeposit, processFullRefund, processPartialRefund, processForfeiture } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";
import MarkReturnModal from "./Modals/MarkReturnModal";
import MarkPartialModal from "./Modals/MarkPartialModal";
import MarkForfeitedModal from "./Modals/MarkForfeitedModal";
import MarkHeldModal from "./Modals/MarkHeldModal";
import ViewDepositModal from "./Modals/ViewDepositModal";
import BulkProcessingModal from "./Modals/BulkProcessingModal";
import BulkReturnedModal from "./Modals/BulkReturnedModal";
import BulkForfeitedModal from "./Modals/BulkForfeitedModal";
import BulkPartialModal from "./Modals/BulkPartialModal";

type DepositStatus = "Pending" | "Held" | "Returned" | "Partial" | "Forfeited";

// Translation content for guides
const guideTranslations = {
  en: {
    statusGuide: {
      title: "Deposit Status Guide",
      statuses: [
        {
          name: "Pending",
          description: "Waiting for payment (check-in) OR waiting for refund processing (check-out)"
        },
        {
          name: "Held",
          description: "Deposit is currently being held and will be processed after checkout"
        },
        {
          name: "Returned",
          description: "Full deposit amount has been refunded to guest"
        },
        {
          name: "Partial",
          description: "Only part of deposit refunded (deductions for damages/fees)"
        },
        {
          name: "Forfeited",
          description: "Entire deposit has been forfeited (no refund)"
        }
      ]
    },
    depositGuide: {
      title: "How to Manage Security Deposits",
      steps: [
        {
          title: "View Deposit Details",
          description: "Click the eye icon to view full deposit details including guest information and payment proof"
        },
        {
          title: "Mark as Held",
          description: "Update status to \"Held\" when deposit payment is received and being held for the booking"
        },
        {
          title: "Process Refund/Deduction",
          description: "After checkout, mark as \"Returned\" for full refund or \"Partial\" if deductions apply"
        },
        {
          title: "Handle Disputes",
          description: "Mark as \"Forfeited\" if guest caused damages or disputes, with documented reason"
        }
      ],
      actionGuideTitle: "Action Guide:",
      actions: [
        {
          title: "Returned",
          description: "Use when guest checked out with no issues and deposit should be fully refunded"
        },
        {
          title: "Partial",
          description: "Use when deducting for damages/cleaning/fees and refunding the remainder"
        },
        {
          title: "Forfeited",
          description: "Use when guest caused significant damages or violates terms (no refund)"
        },
        {
          title: "Held",
          description: "Use when payment is received but not yet processed for refund"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Select Deposits",
          description: "Check the checkboxes next to deposits you want to update, or use \"Select All\" in the table header"
        },
        {
          title: "Choose Action",
          description: "A bulk actions bar will appear at the top showing your selection with action buttons"
        },
        {
          title: "Confirm Details",
          description: "A modal will open asking for additional details (amounts, reasons, etc.)"
        },
        {
          title: "Apply to All",
          description: "The action will be applied to all selected deposits at once"
        }
      ],
      whenToUseTitle: "When to Use Bulk Operations:",
      useCases: [
        {
          title: "Mark as Held",
          description: "When multiple deposits are received on the same day and need to be held together"
        },
        {
          title: "Mark as Returned",
          description: "When multiple guests check out without issues and all deposits should be refunded"
        },
        {
          title: "Mark as Partial",
          description: "When processing end-of-month deposits with deductions for each guest (specify amounts per deposit)"
        },
        {
          title: "Mark as Forfeited",
          description: "When multiple guests violated policies or caused damages (specify reason for all)"
        }
      ]
    }
  },
  fil: {
    statusGuide: {
      title: "Deposit Status Guide",
      statuses: [
        {
          name: "Pending",
          description: "Naghihintay ng bayad (check-in) o refund (check-out)"
        },
        {
          name: "Held",
          description: "Nakahold ang deposit, ip-process pagkatapos ng check-out"
        },
        {
          name: "Returned",
          description: "Buong deposit ay na-refund na sa guest"
        },
        {
          name: "Partial",
          description: "Bahagi lang ng deposit ang na-refund (may damage/fees na ibinawas)"
        },
        {
          name: "Forfeited",
          description: "Walang natanggap na refund (walang refund)"
        }
      ]
    },
    depositGuide: {
      title: "Paano mag-manage ng Deposits",
      steps: [
        {
          title: "Tingnan ang Deposit Details",
          description: "I-click ang mata na icon para makita ang lahat ng deposit info, guest details, at payment proof"
        },
        {
          title: "I-mark as Held",
          description: "I-update sa \"Held\" pag nakatanggap na ng deposit para sa booking"
        },
        {
          title: "I-process ang Refund/Deduction",
          description: "Pagkatapos ng check-out, i-mark as \"Returned\" para sa full refund o \"Partial\" kung may damages"
        },
        {
          title: "Mag-handle ng Issues",
          description: "I-mark as \"Forfeited\" kung may damage o problema, with documented reason"
        }
      ],
      actionGuideTitle: "Paano gamitin:",
      actions: [
        {
          title: "Returned",
          description: "Gamitin pag walang problema ang guest at dapat buong refund ang deposit"
        },
        {
          title: "Partial",
          description: "Gamitin pag may diskwento para sa damage/cleaning at refund ang natitira"
        },
        {
          title: "Forfeited",
          description: "Gamitin pag ang guest ay nag-damage o nag-violate ng rules (walang refund)"
        },
        {
          title: "Held",
          description: "Gamitin pag nakatanggap na ng bayad pero hindi pa na-process ang refund"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Pumili ng Deposits",
          description: "I-check ang checkbox para sa deposits na gusto mong i-update, o gamitin \"Select All\" sa table"
        },
        {
          title: "Pumili ng Action",
          description: "Magpapakita ng bulk actions bar sa taas with action buttons"
        },
        {
          title: "I-confirm ang Details",
          description: "Magbubukas ang modal para sa additional details (amounts, reasons, etc.)"
        },
        {
          title: "I-apply sa Lahat",
          description: "Ang action ay ia-apply sa lahat ng selected deposits nang sabay-sabay"
        }
      ],
      whenToUseTitle: "Kailan gamitin ang Bulk Operations:",
      useCases: [
        {
          title: "Mark as Held",
          description: "Pag maraming deposits na natanggap sa same day at kailangan mag-hold together"
        },
        {
          title: "Mark as Returned",
          description: "Pag maraming guests ang nag-check-out walang problema at lahat dapat ma-refund"
        },
        {
          title: "Mark as Partial",
          description: "Pag may end-of-month deposits na may diskwento para sa bawat guest (specify amounts)"
        },
        {
          title: "Mark as Forfeited",
          description: "Pag maraming guests ang nag-damage o nag-violate ng rules (specify reason para sa lahat)"
        }
      ]
    }
  }
};

export default function DepositPage() {
  const { data: session } = useSession();
  const employeeId = (session?.user as any)?.id;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [filterDate, setFilterDate] = useState<"all" | "today_checkin" | "today_checkout" | "custom_range">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof DepositRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [rows, setRows] = useState<DepositRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isPartialModalOpen, setIsPartialModalOpen] = useState(false);
  const [isForfeitedModalOpen, setIsForfeitedModalOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRecord | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isBulkProcessingModalOpen, setIsBulkProcessingModalOpen] = useState(false);
  const [isBulkReturnedModalOpen, setIsBulkReturnedModalOpen] = useState(false);
  const [isBulkForfeitedModalOpen, setIsBulkForfeitedModalOpen] = useState(false);
  const [isBulkPartialModalOpen, setIsBulkPartialModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [showDepositGuide, setShowDepositGuide] = useState(false);
  const [showBulkGuide, setShowBulkGuide] = useState(false);
  const [guideLanguage, setGuideLanguage] = useState<"en" | "fil">("en");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Client-side pagination: Fetch ALL data once
      const data = await getDeposits();
      
      // CRITICAL: Overwrite state completely. Do NOT append.
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch deposits:", error);
      toast.error("Failed to load deposits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return rows.filter((row) => {
      const matchesSearch =
        row.deposit_id.toLowerCase().includes(term) ||
        row.booking_id.toLowerCase().includes(term) ||
        row.guest.toLowerCase().includes(term) ||
        row.haven.toLowerCase().includes(term);

      const matchesFilter = filterStatus === "all" || row.status === filterStatus;
      
      let matchesDateFilter = false;
      
      if (filterDate === "all") {
        matchesDateFilter = true;
      } else if (filterDate === "today_checkin") {
        matchesDateFilter = row.checkin_date_raw >= today && row.checkin_date_raw < tomorrow;
      } else if (filterDate === "today_checkout") {
        matchesDateFilter = row.checkout_date_raw >= today && row.checkout_date_raw < tomorrow;
      } else if (filterDate === "custom_range" && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        matchesDateFilter = (row.checkin_date_raw >= startDate && row.checkin_date_raw <= endDate) ||
                          (row.checkout_date_raw >= startDate && row.checkout_date_raw <= endDate);
      }

      return matchesSearch && matchesFilter && matchesDateFilter;
    });
  }, [filterStatus, filterDate, customStartDate, customEndDate, rows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      const aSortable = (typeof aVal === 'string' ? aVal : String(aVal)).toLowerCase();
      const bSortable = (typeof bVal === 'string' ? bVal : String(bVal)).toLowerCase();
      
      if (sortField === 'deposit_amount') {
          return sortDirection === "asc" ? (a.deposit_amount - b.deposit_amount) : (b.deposit_amount - a.deposit_amount);
      }

      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortDirection, sortField]);

  // Strict Slicing Logic
  // Ensure we rely on the numeric state of entriesPerPage (default 10)
  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  
  // This MUST be a new array slice every render
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof DepositRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
      const oldRows = [...rows];
      setRows(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

      try {
          await updateDepositStatus(id, newStatus, employeeId);
          toast.success(`Deposit marked as ${newStatus}`);
      } catch {
          setRows(oldRows);
          toast.error("Failed to update status");
      }
  };

  // PDF Export function - FIXED
  const exportToPDF = () => {
    // Import jsPDF and html2canvas dynamically
    Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]).then(([jsPDF, html2canvas]) => {
      const doc = new jsPDF.default();
      
      // Set font
      doc.setFont('helvetica');
      
      // Add custom header
      let yPosition = 20;
      
      // Logo placeholder (you can replace with actual logo image)
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Staycation Haven', 105, yPosition, { align: 'center' });
      
      // Address and contact info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;
      doc.text('M Place South Triangle Tower D, Panay Ave, Diliman, Quezon City, 1103 Metro Manila', 105, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text('0961 571 8391', 105, yPosition, { align: 'center' });
      
      // Add bottom border after header
      yPosition += 10;
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      
      // Add title
      yPosition += 15;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Deposit Records Report', 105, yPosition, { align: 'center' });
      
      // Add date generated
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated on: ${currentDate}`, 105, yPosition, { align: 'center' });
      
      // Add filters info if applied
      yPosition += 8;
      let filterText = '';
      if (searchTerm) filterText += `Search: ${searchTerm} `;
      if (filterStatus !== 'all') filterText += `Status: ${filterStatus} `;
      if (filterDate !== 'all') filterText += `Date: ${filterDate} `;
      if (filterText) {
        doc.text(`Filters: ${filterText}`, 105, yPosition, { align: 'center' });
        yPosition += 8;
      }
      
      // Add summary before table
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, yPosition);
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Records: ${sortedRows.length}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Total Amount: ${sortedRows.reduce((sum, row) => sum + row.deposit_amount, 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}`, 20, yPosition);
      
      // Create a clean table without Select and Actions columns
      const createCleanTable = () => {
        const originalTable = document.querySelector('table');
        if (!originalTable) return null;
        
        // Create a temporary div for the clean table
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '20px';
        tempDiv.style.width = originalTable.offsetWidth + 'px';
        
        // Create clean table
        const cleanTable = document.createElement('table');
        cleanTable.style.width = '100%';
        cleanTable.style.borderCollapse = 'collapse';
        cleanTable.style.fontSize = '12px';
        
        // Create header row (exclude Select and Actions columns)
        const headerRow = document.createElement('tr');
        headerRow.style.background = '#f3f4f6';
        headerRow.style.fontWeight = 'bold';
        
        const headers = ['Deposit ID', 'Haven & Booking', 'Guest', 'Amount', 'Refunded', 'Forfeited', 'Status', 'Check-in / Check-out Dates'];
        headers.forEach(headerText => {
          const th = document.createElement('th');
          th.style.padding = '8px';
          th.style.border = '1px solid #d1d5db';
          th.style.textAlign = 'left';
          th.style.fontSize = '11px';
          th.textContent = headerText;
          headerRow.appendChild(th);
        });
        
        cleanTable.appendChild(headerRow);
        
        // Create data rows
        sortedRows.forEach((row, index) => {
          const dataRow = document.createElement('tr');
          dataRow.style.background = index % 2 === 0 ? 'white' : '#f9fafb';
          
          // Deposit ID
          const depositIdCell = document.createElement('td');
          depositIdCell.style.padding = '8px';
          depositIdCell.style.border = '1px solid #d1d5db';
          depositIdCell.style.fontSize = '10px';
          depositIdCell.innerHTML = `
            <div style="font-weight: 600; color: #1f2937;">${row.deposit_id}</div>
            ${row.payment_method ? `<div style="font-size: 9px; color: #6b7280; margin-top: 2px;">${row.payment_method}</div>` : ''}
          `;
          dataRow.appendChild(depositIdCell);
          
          // Haven & Booking
          const havenCell = document.createElement('td');
          havenCell.style.padding = '8px';
          havenCell.style.border = '1px solid #d1d5db';
          havenCell.style.fontSize = '10px';
          havenCell.innerHTML = `
            <div style="font-weight: 500; color: #1f2937;">${row.haven}</div>
            <div style="font-size: 9px; color: #6b7280; margin-top: 2px;">Tower: ${row.tower}</div>
            <div style="font-size: 9px; color: #6b7280;">Booking ID: ${row.booking_id}</div>
          `;
          dataRow.appendChild(havenCell);
          
          // Guest
          const guestCell = document.createElement('td');
          guestCell.style.padding = '8px';
          guestCell.style.border = '1px solid #d1d5db';
          guestCell.style.fontSize = '10px';
          guestCell.innerHTML = `
            <div style="font-weight: 600; color: #1f2937;">${row.guest}</div>
            ${row.guest_email ? `<div style="font-size: 9px; color: #3b82f6; margin-top: 2px;">${row.guest_email}</div>` : ''}
            ${row.guest_phone ? `<div style="font-size: 9px; color: #059669; margin-top: 2px;">${row.guest_phone}</div>` : ''}
          `;
          dataRow.appendChild(guestCell);
          
          // Amount
          const amountCell = document.createElement('td');
          amountCell.style.padding = '8px';
          amountCell.style.border = '1px solid #d1d5db';
          amountCell.style.fontSize = '10px';
          amountCell.style.fontWeight = 'bold';
          amountCell.style.textAlign = 'right';
          amountCell.style.color = '#1f2937';
          amountCell.textContent = row.formatted_amount;
          dataRow.appendChild(amountCell);
          
          // Refunded Amount
          const refundedCell = document.createElement('td');
          refundedCell.style.padding = '8px';
          refundedCell.style.border = '1px solid #d1d5db';
          refundedCell.style.fontSize = '10px';
          refundedCell.style.fontWeight = 'bold';
          refundedCell.style.textAlign = 'right';
          refundedCell.style.color = row.refunded_amount > 0 ? '#059669' : '#6b7280';
          refundedCell.textContent = row.refunded_amount > 0 
            ? new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 0
              }).format(row.refunded_amount)
            : '₱0';
          dataRow.appendChild(refundedCell);
          
          // Forfeited Amount
          const forfeitedCell = document.createElement('td');
          forfeitedCell.style.padding = '8px';
          forfeitedCell.style.border = '1px solid #d1d5db';
          forfeitedCell.style.fontSize = '10px';
          forfeitedCell.style.fontWeight = 'bold';
          forfeitedCell.style.textAlign = 'right';
          forfeitedCell.style.color = row.forfeited_amount > 0 ? '#dc2626' : '#6b7280';
          forfeitedCell.textContent = row.forfeited_amount > 0 
            ? new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 0
              }).format(row.forfeited_amount)
            : '₱0';
          dataRow.appendChild(forfeitedCell);
          
          // Status
          const statusCell = document.createElement('td');
          statusCell.style.padding = '8px';
          statusCell.style.border = '1px solid #d1d5db';
          statusCell.style.fontSize = '10px';
          statusCell.style.textAlign = 'center';
          
          let statusColor = '#6b7280';
          let bgColor = '#f3f4f6';
          if (row.status === 'Pending') { statusColor = '#d97706'; bgColor = '#fef3c7'; }
          else if (row.status === 'Held') { statusColor = '#4f46e5'; bgColor = '#e0e7ff'; }
          else if (row.status === 'Returned') { statusColor = '#059669'; bgColor = '#d1fae5'; }
          else if (row.status === 'Partial') { statusColor = '#ea580c'; bgColor = '#fed7aa'; }
          else if (row.status === 'Forfeited') { statusColor = '#dc2626'; bgColor = '#fee2e2'; }
          
          statusCell.innerHTML = `<span style="background: ${bgColor}; color: ${statusColor}; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: 600;">${row.status}</span>`;
          dataRow.appendChild(statusCell);
          
          // Check-in / Check-out Dates
          const datesCell = document.createElement('td');
          datesCell.style.padding = '8px';
          datesCell.style.border = '1px solid #d1d5db';
          datesCell.style.fontSize = '10px';
          datesCell.innerHTML = `
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%;"></div>
              <span style="color: #059669; font-weight: 500;">Check-in: ${row.checkin_date}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></div>
              <span style="color: #dc2626; font-weight: 500;">Check-out: ${row.checkout_date}</span>
            </div>
          `;
          dataRow.appendChild(datesCell);
          
          cleanTable.appendChild(dataRow);
        });
        
        tempDiv.appendChild(cleanTable);
        document.body.appendChild(tempDiv);
        
        return tempDiv;
      };
      
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF...');
      
      // Create and capture clean table
      const cleanTableContainer = createCleanTable();
      if (!cleanTableContainer) {
        toast.error('Failed to create table. Please try again.', { id: loadingToast });
        return;
      }
      
      // Use html2canvas to capture the clean table
      (html2canvas as any)(cleanTableContainer.querySelector('table'), {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      }).then((canvas: any) => {
        // Remove temporary element
        document.body.removeChild(cleanTableContainer);

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = yPosition + 10; // Start after summary

        // Add image to PDF
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        }

        // Save the PDF
        doc.save('deposits-report.pdf');
        toast.success('PDF generated successfully', { id: loadingToast });
      }).catch((error: Error) => {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try again.', { id: loadingToast });
        if (cleanTableContainer && document.body.contains(cleanTableContainer)) {
          document.body.removeChild(cleanTableContainer);
        }
      });
    }).catch((error: Error) => {
      console.error('Error loading PDF libraries:', error);
      toast.error('Failed to load PDF generator');
    });
  };

  // Calculate summary counts
  const totalCount = rows.length;
  const pendingCount = rows.filter(row => row.status === "Pending").length;
  const heldCount = rows.filter(row => row.status === "Held").length;
  const returnedCount = rows.filter(row => row.status === "Returned").length;

  // Modal functions
  const openReturnModal = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setIsReturnModalOpen(true);
  };

  const openPartialModal = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setIsPartialModalOpen(true);
  };

  const openForfeitedModal = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setIsForfeitedModalOpen(true);
  };

  const openViewModal = (deposit: DepositRecord) => {
    setSelectedDeposit(deposit);
    setIsViewModalOpen(true);
  };

  const closeAllModals = () => {
    setIsReturnModalOpen(false);
    setIsPartialModalOpen(false);
    setIsForfeitedModalOpen(false);
    setIsViewModalOpen(false);
    setSelectedDeposit(null);
  };

  const closeAllBulkModals = () => {
    setIsBulkProcessingModalOpen(false);
    setIsBulkReturnedModalOpen(false);
    setIsBulkForfeitedModalOpen(false);
    setIsBulkPartialModalOpen(false);
    setBulkAction("");
  };

  const handleFullRefund = async (depositId: string) => {
    if (!selectedDeposit) return;
    
    setIsModalLoading(true);
    try {
      // Use the full deposit amount for refund
      await processFullRefund(selectedDeposit.id, selectedDeposit.deposit_amount, employeeId);
      toast.success("Deposit fully refunded");
      fetchData();
      closeAllModals();
    } catch (error) {
      toast.error("Failed to process refund");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handlePartialRefund = async (depositId: string, refundAmount: number, deductionReason: string) => {
    if (!selectedDeposit) return;
    
    console.log('Client-side handlePartialRefund called with:', {
      depositId,
      refundAmount,
      deductionReason,
      employeeId
    });
    
    setIsModalLoading(true);
    try {
      console.log('Calling processPartialRefund...');
      await processPartialRefund(selectedDeposit.id, refundAmount, deductionReason, employeeId);
      console.log('processPartialRefund completed successfully');
      toast.success("Partial refund processed");
      fetchData();
      closeAllModals();
    } catch (error) {
      console.error('Client-side error in handlePartialRefund:', error);
      toast.error("Failed to process partial refund");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleForfeiture = async (depositId: string, forfeitureReason: string) => {
    if (!selectedDeposit) return;
    
    setIsModalLoading(true);
    try {
      await processForfeiture(selectedDeposit.id, forfeitureReason, employeeId);
      toast.success("Deposit marked as forfeited");
      fetchData();
      closeAllModals();
    } catch (error) {
      toast.error("Failed to mark as forfeited");
    } finally {
      setIsModalLoading(false);
    }
  };

  // Bulk selection functions
  const handleSelectDeposit = (id: string, checked: boolean) => {
    setSelectedDeposits(prev => 
      checked ? [...prev, id] : prev.filter(depositId => depositId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeposits(paginatedRows.map(row => row.id));
    } else {
      setSelectedDeposits([]);
    }
  };

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    if (action === "Held") {
      setIsBulkProcessingModalOpen(true);
    } else if (action === "Returned") {
      setIsBulkReturnedModalOpen(true);
    } else if (action === "Partial") {
      setIsBulkPartialModalOpen(true);
    } else if (action === "Forfeited") {
      setIsBulkForfeitedModalOpen(true);
    }
  };

  const processBulkAction = async (reason?: string) => {
    if (selectedDeposits.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      // Process based on bulk action
      if (bulkAction === "Held") {
        // Update all selected deposits to Held
        await Promise.all(selectedDeposits.map(id => updateDepositStatus(id, "Held", employeeId)));
        toast.success(`${selectedDeposits.length} deposit(s) marked as Held`);
      } else if (bulkAction === "Returned") {
        // Process full refund for all selected
        await Promise.all(selectedDeposits.map(id => processFullRefund(id, 0, employeeId)));
        toast.success(`${selectedDeposits.length} deposit(s) marked as Returned`);
      } else if (bulkAction === "Forfeited" && reason) {
        // Process forfeiture for all selected
        await Promise.all(selectedDeposits.map(id => processForfeiture(id, reason, employeeId)));
        toast.success(`${selectedDeposits.length} deposit(s) marked as Forfeited`);
      }
      
      // Refresh data
      fetchData();
      // Clear selection
      setSelectedDeposits([]);
      // Close modal
      closeAllBulkModals();
    } catch (error) {
      toast.error("Failed to process bulk action");
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Deposit Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage security deposits for bookings</p>
        </div>
      </div>

      {/* Status Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowStatusGuide(!showStatusGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].statusGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showStatusGuide ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex gap-1 ml-2">
            {(['en', 'fil'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setGuideLanguage(lang)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  guideLanguage === lang
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'en' ? 'EN' : 'FIL'}
              </button>
            ))}
          </div>
        </div>

        {showStatusGuide && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {guideTranslations[guideLanguage].statusGuide.statuses.map((status, idx) => {
              const statusColors: Record<string, { dot: string; icon?: string }> = {
                Pending: { dot: 'bg-yellow-500' },
                Held: { dot: 'bg-indigo-500' },
                Returned: { dot: 'bg-green-500' },
                Partial: { dot: 'bg-orange-500' },
                Forfeited: { dot: 'bg-red-500' }
              };
              const color = statusColors[status.name] || { dot: 'bg-gray-500' };

              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-3 h-3 ${color.dot} rounded-full mt-1 flex-shrink-0`}></div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{status.name}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{status.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to Manage Security Deposits Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowDepositGuide(!showDepositGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].depositGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showDepositGuide ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex gap-1 ml-2">
            {(['en', 'fil'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setGuideLanguage(lang)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  guideLanguage === lang
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'en' ? 'EN' : 'FIL'}
              </button>
            ))}
          </div>
        </div>

        {showDepositGuide && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {guideTranslations[guideLanguage].depositGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{idx + 1}</div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">{guideTranslations[guideLanguage].depositGuide.actionGuideTitle}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                {guideTranslations[guideLanguage].depositGuide.actions.map((action, idx) => {
                  const getActionIconAndColor = (title: string) => {
                    const iconMap: Record<string, { Icon: typeof CheckCircle; color: string }> = {
                      Returned: { Icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
                      Partial: { Icon: RotateCcw, color: 'text-orange-600 dark:text-orange-400' },
                      Forfeited: { Icon: XCircle, color: 'text-red-600 dark:text-red-400' },
                      Held: { Icon: Play, color: 'text-indigo-600 dark:text-indigo-400' }
                    };
                    return iconMap[title];
                  };
                  const iconData = getActionIconAndColor(action.title);

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      {iconData && <iconData.Icon className={`w-4 h-4 ${iconData.color} flex-shrink-0 mt-0.5`} />}
                      <span><strong>{action.title}:</strong> {action.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Operations Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowBulkGuide(!showBulkGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].bulkGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showBulkGuide ? 'rotate-90' : ''}`} />
          </button>
          <div className="flex gap-1 ml-2">
            {(['en', 'fil'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setGuideLanguage(lang)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  guideLanguage === lang
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'en' ? 'EN' : 'FIL'}
              </button>
            ))}
          </div>
        </div>

        {showBulkGuide && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guideTranslations[guideLanguage].bulkGuide.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">{idx + 1}</div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{step.title}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">{guideTranslations[guideLanguage].bulkGuide.whenToUseTitle}</h5>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                {guideTranslations[guideLanguage].bulkGuide.useCases.map((useCase, idx) => {
                  const getUseCaseIcon = (title: string) => {
                    const iconMap: Record<string, typeof Play> = {
                      'Mark as Held': Play,
                      'Mark as Returned': CheckCircle,
                      'Mark as Partial': RotateCcw,
                      'Mark as Forfeited': XCircle
                    };
                    return iconMap[title] || Play;
                  };

                  const getUseCaseColor = (title: string) => {
                    const colorMap: Record<string, string> = {
                      'Mark as Held': 'text-indigo-600 dark:text-indigo-400',
                      'Mark as Returned': 'text-green-600 dark:text-green-400',
                      'Mark as Partial': 'text-orange-600 dark:text-orange-400',
                      'Mark as Forfeited': 'text-red-600 dark:text-red-400'
                    };
                    return colorMap[title] || 'text-gray-600 dark:text-gray-400';
                  };

                  const IconComponent = getUseCaseIcon(useCase.title);
                  const iconColor = getUseCaseColor(useCase.title);

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <IconComponent className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
                      <span><strong>{useCase.title}:</strong> {useCase.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Total Deposits", value: String(totalCount), color: "bg-indigo-500", icon: Wallet },
          { label: "Pending", value: String(pendingCount), color: "bg-yellow-500", icon: Clock },
          { label: "Held", value: String(heldCount), color: "bg-indigo-500", icon: Loader2 },
          { label: "Returned", value: String(returnedCount), color: "bg-green-500", icon: CheckCircle },
        ].map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-600`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <div className="text-3xl font-bold mt-2">
                    {isLoading ? (
                      <div className="w-16 h-8 bg-white/20 rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </div>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Actions Bar */}
      {selectedDeposits.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-900 dark:text-blue-200">
                {selectedDeposits.length} deposit{selectedDeposits.length !== 1 ? 's' : ''} selected for bulk operation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("Held")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Play className="w-4 h-4" /> Mark as Held</>
                )}
              </button>
              <button
                onClick={() => handleBulkAction("Returned")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Mark as Returned</>
                )}
              </button>
              <button
                onClick={() => handleBulkAction("Partial")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><RotateCcw className="w-4 h-4" /> Mark as Partial</>
                )}
              </button>
              <button
                onClick={() => handleBulkAction("Forfeited")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><XCircle className="w-4 h-4" /> Mark as Forfeited</>
                )}
              </button>
              <button
                onClick={() => setSelectedDeposits([])}
                disabled={bulkActionLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Show</label>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">entries</label>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by deposit ID, booking ID, guest, or haven..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => {
                const value = e.target.value;
                setFilterStatus(value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Held">Held</option>
              <option value="Returned">Returned</option>
              <option value="Partial">Partial</option>
              <option value="Forfeited">Forfeited</option>
            </select>
            <select
              value={filterDate}
              onChange={(e) => {
                const value = e.target.value;
                setFilterDate(value as "all" | "today_checkin" | "today_checkout" | "custom_range");
                if (value !== "custom_range") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              <option value="all">All Dates</option>
              <option value="today_checkin">Today's Check-ins</option>
              <option value="today_checkout">Today's Check-outs</option>
              <option value="custom_range">Custom Range</option>
            </select>
            {filterDate === "custom_range" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
                  placeholder="Start date"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600 text-sm"
                  placeholder="End date"
                />
              </div>
            )}
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-white dark:bg-gray-700 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm flex items-center gap-2"
              title="Export to PDF"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={fetchData}
              className="p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
          <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Loading deposit records...</p>
        </div>
      )}

      {/* Table Section - Fixed height and scrollable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDeposits.length === paginatedRows.length && paginatedRows.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span>Select</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort("deposit_id")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Deposit ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("haven")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Haven & Booking
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("guest")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Guest
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("deposit_amount")}
                  className="text-right py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-2">
                    Amount
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("checkin_date")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Check-in / Check-out Dates
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                  // Skeleton loading rows
                  Array.from({ length: entriesPerPage }).map((_, idx) => (
                    <tr
                      key={`skeleton-${idx}`}
                      className="border border-gray-200 dark:border-gray-700 animate-pulse"
                    >
                      {/* Select Checkbox */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </td>
                      {/* Deposit ID */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                      </td>
                      {/* Haven & Booking */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                      </td>
                      {/* Guest */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                        </div>
                      </td>
                      {/* Amount */}
                      <td className="py-4 px-4 text-right border border-gray-200 dark:border-gray-700">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto"></div>
                      </td>
                      {/* Status */}
                      <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mx-auto"></div>
                      </td>
                      {/* Check-in / Check-out */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : paginatedRows.length === 0 ? (
                  <tr>
                      <td colSpan={8} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No deposits found</p>
                      </td>
                  </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedDeposits.includes(row.id)}
                        onChange={(e) => handleSelectDeposit(row.id, e.target.checked)}
                        className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                      />
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{highlightText(row.deposit_id, searchTerm)}</span>
                        {row.payment_method ? (
                          ['cash', 'gcash', 'bank transfer'].includes(row.payment_method.toLowerCase()) && (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                {row.payment_method.toLowerCase() === 'cash' && <Banknote className="w-3 h-3 text-green-600" />}
                                {row.payment_method.toLowerCase() === 'gcash' && <CreditCard className="w-3 h-3 text-blue-600" />}
                                {row.payment_method.toLowerCase() === 'bank transfer' && <CreditCard className="w-3 h-3 text-purple-600" />}
                                <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{row.payment_method}</span>
                              </div>
                              {row.payment_proof_url && (
                                <a
                                  href={row.payment_proof_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Proof
                                </a>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">No deposit payment</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{highlightText(row.haven, searchTerm)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Tower:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{highlightText(row.tower, searchTerm)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Booking ID:</span>
                          <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{highlightText(row.booking_id, searchTerm)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{highlightText(row.guest, searchTerm)}</span>
                        </div>
                        {row.guest_email && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Email:</span>
                            <a href={`mailto:${row.guest_email}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                              {highlightText(row.guest_email, searchTerm)}
                            </a>
                          </div>
                        )}
                        {row.guest_phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Phone:</span>
                            <a href={`tel:${row.guest_phone}`} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline">
                              {highlightText(row.guest_phone, searchTerm)}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {row.guest_facebook_link && (
                            <a
                              href={row.guest_facebook_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                              title="View Facebook Profile"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Facebook
                            </a>
                          )}
                          {row.guest_valid_id_url && (
                            <a
                              href={row.guest_valid_id_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline"
                              title="View Valid ID"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Valid ID
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right border border-gray-200 dark:border-gray-700">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                          {highlightText(row.formatted_amount, searchTerm)}
                        </div>
                        {(row.refunded_amount > 0 || row.forfeited_amount > 0) && (
                          <div className="space-y-1 text-xs">
                            {row.refunded_amount > 0 && (
                              <div className="text-green-600 dark:text-green-400">
                                Refunded: {new Intl.NumberFormat('en-PH', {
                                  style: 'currency',
                                  currency: 'PHP',
                                  minimumFractionDigits: 0
                                }).format(row.refunded_amount)}
                              </div>
                            )}
                            {row.forfeited_amount > 0 && (
                              <div className="text-red-600 dark:text-red-400">
                                Forfeited: {new Intl.NumberFormat('en-PH', {
                                  style: 'currency',
                                  currency: 'PHP',
                                  minimumFractionDigits: 0
                                }).format(row.forfeited_amount)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          row.status === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : row.status === "Held"
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            : row.status === "Returned"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : row.status === "Partial"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                            : row.status === "Forfeited"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {highlightText(row.status, searchTerm)}
                      </span>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Check-in:</span>
                          <span className="text-xs font-semibold text-green-700 dark:text-green-300">{highlightText(row.checkin_date, searchTerm)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Check-out:</span>
                          <span className="text-xs font-semibold text-red-700 dark:text-red-300">{highlightText(row.checkout_date, searchTerm)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View Details"
                          type="button"
                          onClick={() => openViewModal(row)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {row.status === "Pending" ? (
                          <button
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Mark as Held"
                            type="button"
                            onClick={() => handleStatusUpdate(row.id, "Held")}
                          >
                            <Loader2 className="w-4 h-4" />
                          </button>
                        ) : row.status === "Returned" || row.status === "Partial" || row.status === "Forfeited" ? (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Completed</span>
                        ) : row.status === "Held" ? (
                          <>
                            <button
                              className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Mark as Held"
                              type="button"
                              onClick={() => handleStatusUpdate(row.id, "Held")}
                            >
                              <Loader2 className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Mark Returned"
                              type="button"
                              onClick={() => openReturnModal(row)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                              title="Mark Partial"
                              type="button"
                              onClick={() => openPartialModal(row)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Mark Forfeited"
                              type="button"
                              onClick={() => openForfeitedModal(row)}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Showing {sortedRows.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedRows.length)} of {sortedRows.length} entries
              {searchTerm || filterStatus !== "all" ? ` (filtered from ${rows.length} total entries)` : ""}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="First Page"
                type="button"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white shadow-md border-brand-primary"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                    disabled={totalPages === 0}
                    type="button"
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last Page"
                type="button"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Processing Modals */}
      <BulkProcessingModal
        isOpen={isBulkProcessingModalOpen}
        onClose={closeAllBulkModals}
        onConfirm={() => processBulkAction()}
        selectedDeposits={selectedDeposits}
        deposits={rows}
        isLoading={bulkActionLoading}
      />

      <BulkReturnedModal
        isOpen={isBulkReturnedModalOpen}
        onClose={closeAllBulkModals}
        onConfirm={() => processBulkAction()}
        selectedDeposits={selectedDeposits}
        deposits={rows}
        isLoading={bulkActionLoading}
      />

      <BulkPartialModal
        isOpen={isBulkPartialModalOpen}
        onClose={closeAllBulkModals}
        onConfirm={(refundData) => {
          // Process partial refund for each deposit with its specific amount and reason
          const processBulkPartial = async () => {
            setBulkActionLoading(true);
            try {
              await Promise.all(refundData.map(data => 
                processPartialRefund(data.depositId, data.refundAmount, data.deductionReason, employeeId)
              ));
              toast.success(`${refundData.length} deposit(s) processed as partial refund`);
              fetchData();
              setSelectedDeposits([]);
              closeAllBulkModals();
            } catch (error) {
              toast.error("Failed to process bulk partial refund");
            } finally {
              setBulkActionLoading(false);
            }
          };
          processBulkPartial();
        }}
        selectedDeposits={selectedDeposits}
        deposits={rows}
        isLoading={bulkActionLoading}
      />

      <BulkForfeitedModal
        isOpen={isBulkForfeitedModalOpen}
        onClose={closeAllBulkModals}
        onConfirm={(reason) => processBulkAction(reason)}
        selectedDeposits={selectedDeposits}
        deposits={rows}
        isLoading={bulkActionLoading}
      />

      {/* Individual Modals */}
      <MarkReturnModal
        isOpen={isReturnModalOpen}
        onClose={closeAllModals}
        onConfirm={handleFullRefund}
        deposit={selectedDeposit}
        isLoading={isModalLoading}
      />
      
      <MarkPartialModal
        isOpen={isPartialModalOpen}
        onClose={closeAllModals}
        onConfirm={handlePartialRefund}
        deposit={selectedDeposit}
        isLoading={isModalLoading}
      />
      
      <MarkForfeitedModal
        isOpen={isForfeitedModalOpen}
        onClose={closeAllModals}
        onConfirm={handleForfeiture}
        deposit={selectedDeposit}
        isLoading={isModalLoading}
      />

      {/* View Details Modal */}
      <ViewDepositModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        deposit={selectedDeposit}
      />
    </div>
  );
}