"use client";

import {
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Edit,
  CheckSquare,
  Square,
  Download,
  CreditCard,
  Banknote,
  ExternalLink
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

import { getDiscounts, DiscountRecord, deleteDiscount, toggleDiscountStatus } from "@/app/admin/csr/actions";
import { toast } from "react-hot-toast";
import ViewDiscountModal from "./Modals/ViewDiscountModal";
import DeleteConfirmation from "./Modals/DeleteConfirmation";
import CreateDiscountModal from "./Modals/CreateDiscountModal";
import EditDiscountModal from "./Modals/EditDiscountModal";

// Translation content for guides
const guideTranslations = {
  en: {
    statusGuide: {
      title: "Discount Status Guide",
      statuses: [
        {
          name: "Active",
          description: "Discount is currently available for use"
        },
        {
          name: "Inactive",
          description: "Discount is temporarily disabled or expired"
        }
      ]
    },
    discountGuide: {
      title: "How to Manage Discounts",
      steps: [
        {
          title: "Create Discount",
          description: "Click 'New Discount' button to create promotional codes with specific values and limits"
        },
        {
          title: "View Discount Details",
          description: "Click the eye icon to view full discount details including usage statistics"
        },
        {
          title: "Edit Discount",
          description: "Update discount parameters like value, usage limits, or expiration dates"
        },
        {
          title: "Toggle Status",
          description: "Activate or deactivate discounts as needed without deleting them"
        }
      ],
      actionGuideTitle: "Action Guide:",
      actions: [
        {
          title: "Active",
          description: "Discount is available for guests to use during booking"
        },
        {
          title: "Inactive",
          description: "Discount is temporarily disabled (won't appear during booking)"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Select Discounts",
          description: "Check the checkboxes next to discounts you want to update, or use 'Select All' in the table header"
        },
        {
          title: "Choose Action",
          description: "A bulk actions bar will appear at the top showing your selection with action buttons"
        },
        {
          title: "Confirm Details",
          description: "The selected action will be applied to all selected discounts at once"
        }
      ],
      whenToUseTitle: "When to Use Bulk Operations:",
      useCases: [
        {
          title: "Activate Multiple",
          description: "When launching a new promotion with multiple discount codes"
        },
        {
          title: "Deactivate Multiple",
          description: "When ending a promotion or seasonal discounts"
        },
        {
          title: "Delete Expired",
          description: "When cleaning up old discounts that are no longer needed"
        }
      ]
    },
    propertyGuide: {
      title: "Property Selection Guide",
      description: "Learn how to apply discounts to properties",
      tips: [
        {
          title: "Apply to Specific Properties",
          description: "Check the properties you want in the properties list when creating a discount. The discount will only apply to those selected properties."
        },
        {
          title: "Apply to All Properties",
          description: "Leave all properties unchecked (no selection) when creating a discount to apply it to all your properties automatically."
        },
        {
          title: "Multiple Properties",
          description: "You can select multiple properties at once using the checkboxes. Simply check all the properties where you want the discount to be available."
        }
      ]
    }
  },
  fil: {
    statusGuide: {
      title: "Discount Status Guide",
      statuses: [
        {
          name: "Active",
          description: "Available ang discount para magamit"
        },
        {
          name: "Inactive",
          description: "Hindi available o expired na ang discount"
        }
      ]
    },
    discountGuide: {
      title: "Paano mag-manage ng Discounts",
      steps: [
        {
          title: "Gumawa ng Discount",
          description: "I-click ang 'New Discount' button para gumawa ng promotional codes"
        },
        {
          title: "Tingnan ang Details",
          description: "I-click ang mata na icon para makita ang lahat ng discount info"
        },
        {
          title: "I-edit ang Discount",
          description: "I-update ang discount value, limits, o expiration dates"
        },
        {
          title: "I-toggle ang Status",
          description: "I-activate o i-deactivate ang discounts"
        }
      ],
      actionGuideTitle: "Paano gamitin:",
      actions: [
        {
          title: "Active",
          description: "Available ang discount para gamitin sa booking"
        },
        {
          title: "Inactive",
          description: "Hindi available ang discount (hindi lalabas sa booking)"
        }
      ]
    },
    bulkGuide: {
      title: "Bulk Operations Guide",
      steps: [
        {
          title: "Pumili ng Discounts",
          description: "I-check ang checkbox para sa discounts na gusto mong i-update, o gamitin 'Select All'"
        },
        {
          title: "Pumili ng Action",
          description: "Magpapakita ng bulk actions bar sa taas with action buttons"
        },
        {
          title: "I-confirm ang Action",
          description: "Ang action ay ia-apply sa lahat ng selected discounts nang sabay-sabay"
        }
      ],
      whenToUseTitle: "Kailan gamitin ang Bulk Operations:",
      useCases: [
        {
          title: "I-activate ang Marami",
          description: "Pag naglulunsad ng bagong promotion na may multiple discount codes"
        },
        {
          title: "I-deactivate ang Marami",
          description: "Pag tapos na ang promotion o seasonal discounts"
        },
        {
          title: "I-delete ang Expired",
          description: "Pag naglilinis ng mga lumang discounts"
        }
      ]
    },
    propertyGuide: {
      title: "Property Selection Guide",
      description: "Matuto kung paano mag-apply ng discounts sa properties",
      tips: [
        {
          title: "I-apply sa Specific Properties",
          description: "I-check ang properties na gusto mo sa properties list kapag lumilikha ng discount. Ang discount ay gagana lang sa selected properties."
        },
        {
          title: "I-apply sa Lahat ng Properties",
          description: "Iwanan na walang napili ang properties (no selection) para mag-apply ito sa lahat ng properties mo automatically."
        },
        {
          title: "Multiple Properties",
          description: "Pwede kang pumili ng multiple properties nang sabay-sabay gamit ang checkboxes. I-check lang lahat ng properties na gusto mo."
        }
      ]
    }
  }
};

const DiscountPage = () => {
  const { data: session } = useSession();
  const [rows, setRows] = useState<DiscountRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof DiscountRecord | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountRecord | null>(null);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountRecord | null>(null);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Guide states
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [showDiscountGuide, setShowDiscountGuide] = useState(false);
  const [showBulkGuide, setShowBulkGuide] = useState(false);
  const [showPropertyGuide, setShowPropertyGuide] = useState(false);
  const [guideLanguage, setGuideLanguage] = useState<"en" | "fil">("en");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await getDiscounts();
      setRows(data);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
      toast.error("Failed to load discounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    return rows.filter((row) => {
      const matchesSearch =
        row.discount_code.toLowerCase().includes(term) ||
        row.name.toLowerCase().includes(term) ||
        (row.haven_name?.toLowerCase().includes(term) || false);

      const matchesFilter = filterStatus === "all" || 
        (filterStatus === "active" && row.active) ||
        (filterStatus === "inactive" && !row.active);

      return matchesSearch && matchesFilter;
    });
  }, [filterStatus, rows, searchTerm]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    if (!sortField) return copy;
    
    return copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      const aSortable = (typeof aVal === 'string' ? aVal : String(aVal)).toLowerCase();
      const bSortable = (typeof bVal === 'string' ? bVal : String(bVal)).toLowerCase();
      
      if (sortField === 'discount_value') {
        return sortDirection === "asc" ? (a.discount_value - b.discount_value) : (b.discount_value - a.discount_value);
      }
      
      if (sortField === 'created_at') {
        return sortDirection === "asc" 
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedRows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleSort = (field: keyof DiscountRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const openDeleteModal = (discount: DiscountRecord) => {
    setDiscountToDelete(discount);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setDiscountToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!discountToDelete) return;
    
    setIsDeleting(true);
    const oldRows = [...rows];
    setRows(prev => prev.filter(r => r.id !== discountToDelete.id));

    try {
      await deleteDiscount(discountToDelete.id, session?.user?.id);
      toast.success("Discount deleted successfully");
      closeDeleteModal();
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to delete discount");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (discount: DiscountRecord) => {
    const oldRows = [...rows];
    setRows(prev => prev.map(r => 
      r.id === discount.id ? { ...r, active: !r.active } : r
    ));

    try {
      await toggleDiscountStatus(discount.id, !discount.active, session?.user?.id);
      toast.success(`Discount ${!discount.active ? "activated" : "deactivated"}`);
    } catch (error) {
      setRows(oldRows);
      toast.error("Failed to update discount status");
      console.error(error);
    }
  };

  // Bulk selection functions
  const handleSelectDiscount = (id: string, checked: boolean) => {
    setSelectedDiscounts(prev => 
      checked ? [...prev, id] : prev.filter(discountId => discountId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDiscounts(paginatedRows.map(row => row.id));
    } else {
      setSelectedDiscounts([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedDiscounts.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      if (action === "activate") {
        // Activate all selected
        await Promise.all(selectedDiscounts.map(id => {
          const discount = rows.find(d => d.id === id);
          if (discount && !discount.active) {
            return toggleDiscountStatus(id, true, session?.user?.id);
          }
          return Promise.resolve();
        }));
        toast.success(`${selectedDiscounts.length} discount(s) activated`);
      } else if (action === "deactivate") {
        // Deactivate all selected
        await Promise.all(selectedDiscounts.map(id => {
          const discount = rows.find(d => d.id === id);
          if (discount && discount.active) {
            return toggleDiscountStatus(id, false, session?.user?.id);
          }
          return Promise.resolve();
        }));
        toast.success(`${selectedDiscounts.length} discount(s) deactivated`);
      } else if (action === "delete") {
        // Delete all selected
        if (!confirm(`Are you sure you want to delete ${selectedDiscounts.length} discount(s)?`)) {
          setBulkActionLoading(false);
          return;
        }
        await Promise.all(selectedDiscounts.map(id => deleteDiscount(id, session?.user?.id)));
        toast.success(`${selectedDiscounts.length} discount(s) deleted`);
      }
      
      fetchData();
      setSelectedDiscounts([]);
    } catch (error) {
      toast.error("Failed to process bulk action");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Calculate summary counts
  const totalCount = rows.length;
  const activeCount = rows.filter(row => row.active).length;
  const inactiveCount = rows.filter(row => !row.active).length;

  // Modal functions
  const openViewModal = (discount: DiscountRecord) => {
    setSelectedDiscount(discount);
    setIsViewModalOpen(true);
  };

  const openEditModal = (discount: DiscountRecord) => {
    setSelectedDiscount(discount);
    setIsEditModalOpen(true);
  };

  // PDF Export function
  const exportToPDF = () => {
    toast.success("PDF export functionality coming soon!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Discount Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage promotional discounts for your properties</p>
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {guideTranslations[guideLanguage].statusGuide.statuses.map((status, idx) => {
              const statusColors: Record<string, { dot: string }> = {
                Active: { dot: 'bg-green-500' },
                Inactive: { dot: 'bg-red-500' }
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

      {/* How to Manage Discounts Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowDiscountGuide(!showDiscountGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].discountGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showDiscountGuide ? 'rotate-90' : ''}`} />
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

        {showDiscountGuide && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {guideTranslations[guideLanguage].discountGuide.steps.map((step, idx) => (
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
              <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">{guideTranslations[guideLanguage].discountGuide.actionGuideTitle}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                {guideTranslations[guideLanguage].discountGuide.actions.map((action, idx) => {
                  const getActionIconAndColor = (title: string) => {
                    const iconMap: Record<string, { Icon: typeof CheckCircle; color: string }> = {
                      Active: { Icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
                      Inactive: { Icon: XCircle, color: 'text-red-600 dark:text-red-400' }
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
                    const iconMap: Record<string, typeof CheckCircle> = {
                      'Activate Multiple': CheckCircle,
                      'Deactivate Multiple': XCircle,
                      'Delete Expired': Trash2
                    };
                    return iconMap[title] || CheckCircle;
                  };

                  const getUseCaseColor = (title: string) => {
                    const colorMap: Record<string, string> = {
                      'Activate Multiple': 'text-green-600 dark:text-green-400',
                      'Deactivate Multiple': 'text-red-600 dark:text-red-400',
                      'Delete Expired': 'text-gray-600 dark:text-gray-400'
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

      {/* Property Selection Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowPropertyGuide(!showPropertyGuide)}
            className="flex-1 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{guideTranslations[guideLanguage].propertyGuide.title}</h4>
            <ChevronRight className={`w-5 h-5 text-gray-600 dark:text-gray-300 transform transition-transform ${showPropertyGuide ? 'rotate-90' : ''}`} />
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
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {showPropertyGuide && (
          <div className="mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{guideTranslations[guideLanguage].propertyGuide.description}</p>
            <div className="space-y-3">
              {guideTranslations[guideLanguage].propertyGuide.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">{idx + 1}</div>
                  <div>
                    <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{tip.title}</h5>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {[
          { label: "Total Discounts", value: String(totalCount), color: "bg-indigo-500", icon: Tag },
          { label: "Active", value: String(activeCount), color: "bg-green-500", icon: CheckCircle },
          { label: "Inactive", value: String(inactiveCount), color: "bg-red-500", icon: XCircle },
          { label: "Usage Rate", value: `${Math.round((rows.filter(r => r.used_count > 0).length / Math.max(rows.length, 1)) * 100)}%`, color: "bg-blue-500", icon: RefreshCw },
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
      {selectedDiscounts.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-900 dark:text-blue-200">
                {selectedDiscounts.length} discount{selectedDiscounts.length !== 1 ? 's' : ''} selected for bulk operation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("activate")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Activate</>
                )}
              </button>
              <button
                onClick={() => handleBulkAction("deactivate")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><XCircle className="w-4 h-4" /> Deactivate</>
                )}
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-2"
              >
                {bulkActionLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete</>
                )}
              </button>
              <button
                onClick={() => setSelectedDiscounts([])}
                disabled={bulkActionLoading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 font-medium text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-start flex-shrink-0">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap font-medium shadow"
        >
        <Plus className="w-5 h-5" />
          New Discount
        </button>
      </div>

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
                placeholder="Search by discount code, name, or property..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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

      {/* Table Section - Fixed height and scrollable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDiscounts.length === paginatedRows.length && paginatedRows.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span>Select</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort("discount_code")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Discount Info
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("discount_value")}
                  className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    Value & Usage
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("active")}
                  className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-2">
                    Status & Date
                    <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
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
                      {/* Discount Info - Combined */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                        </div>
                      </td>
                      {/* Value & Usage - Combined */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                      </td>
                      {/* Status & Date - Combined */}
                      <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                        <div className="space-y-2 flex flex-col items-center">
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-1">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : paginatedRows.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No discounts found</p>
                      </td>
                  </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr key={`${row.id}-${index}`} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedDiscounts.includes(row.id)}
                        onChange={(e) => handleSelectDiscount(row.id, e.target.checked)}
                        className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                      />
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm font-mono">
                          {highlightText(row.discount_code, searchTerm)}
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-200">
                          {highlightText(row.name, searchTerm)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {row.haven_name || "All Properties"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <div className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                          {highlightText(row.formatted_value, searchTerm)}
                        </div>
                        {row.min_booking_amount && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Min: {row.formatted_minimum_amount}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {row.max_uses ? (
                            <div className="space-y-1">
                              <div>{row.used_count}/{row.max_uses} used</div>
                              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${row.usage_percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="text-green-600 dark:text-green-400 font-medium">
                              Unlimited
                            </div>
                          )}
                        </div>
                        {row.expires_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Expires: {new Date(row.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2 flex flex-col items-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            row.active
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {row.active ? "Active" : "Inactive"}
                        </span>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          Start: {new Date(row.start_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          End: {new Date(row.end_date).toLocaleDateString()}
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
                        <button
                          className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                          title="Edit Discount"
                          type="button"
                          onClick={() => openEditModal(row)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title={row.active ? "Deactivate" : "Activate"}
                          type="button"
                          onClick={() => handleToggleStatus(row)}
                        >
                          {row.active ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Discount"
                          type="button"
                          onClick={() => openDeleteModal(row)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                        ? "bg-brand-primary text-white shadow-md border-brand-primary"
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

      {/* Modals */}
      <ViewDiscountModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedDiscount(null);
        }}
        discount={selectedDiscount}
      />

      <EditDiscountModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDiscount(null);
        }}
        discount={selectedDiscount}
        onSuccess={() => {
          fetchData();
          setIsEditModalOpen(false);
          setSelectedDiscount(null);
        }}
      />

      <CreateDiscountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsCreateModalOpen(false);
        }}
      />

      {isDeleteModalOpen && discountToDelete && (
        <DeleteConfirmation
          itemName="discount"
          itemId={discountToDelete.discount_code}
          onCancel={closeDeleteModal}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          confirmLabel="Delete discount"
          title="Delete Discount"
        />
      )}
    </div>
  );
};

export default DiscountPage;