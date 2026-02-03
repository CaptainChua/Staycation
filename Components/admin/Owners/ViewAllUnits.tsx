"use client";

import { useState, useMemo } from "react";
import { 
  Edit, 
  Trash2, 
  Search, 
  Plus, 
  Home, 
  ArrowUpDown, 
  Filter, 
  ChevronsLeft, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsRight,
  Loader2
} from "lucide-react";
import { useGetAllAdminRoomsQuery, useDeleteHavenMutation } from "@/redux/api/roomApi";
import EditHavenModal from "./Modals/EditHavenModal";
import DeleteHavenModal from "./Modals/DeleteHavenModal";
import toast from 'react-hot-toast';

interface HavenUnit {
  uuid_id?: string;
  id?: string;
  haven_name: string;
  tower: string;
  floor: string;
  view_type: string;
  six_hour_rate: number;
  ten_hour_rate: number;
  weekday_rate: number;
  weekend_rate: number;
  status?: string;
  [key: string]: unknown;
}

interface ViewAllUnitsProps {
  onAddUnitClick: () => void;
  hideHeader?: boolean;
}

const ViewAllUnits = ({ onAddUnitClick, hideHeader = false }: ViewAllUnitsProps) => {
  // State for Table Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10); // Default to 10 to match DepositPage
  const [sortField, setSortField] = useState<keyof HavenUnit | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // State for Modals
  const [isEditHavnModal, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHaven, setSelectedHaven] = useState<HavenUnit | null>(null);

  // RTK Query call
  const { data, isLoading, isError } = useGetAllAdminRoomsQuery({});
  const [deleteHaven, { isLoading: isDeleting }] = useDeleteHavenMutation();
  const units: HavenUnit[] = data?.data || [];

  // Filter Logic
  const filteredUnits = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return units.filter((unit) => {
      const matchesSearch =
        unit.haven_name.toLowerCase().includes(term) ||
        unit.tower.toLowerCase().includes(term) ||
        unit.view_type.toLowerCase().includes(term);
      
      const matchesStatus = filterStatus === "all" || (unit.status || "Available").toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [units, searchQuery, filterStatus]);

  // Sort Logic
  const sortedUnits = useMemo(() => {
    const copy = [...filteredUnits];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      const aSortable = (typeof aVal === 'string' ? aVal.toLowerCase() : aVal) as string | number;
      const bSortable = (typeof bVal === 'string' ? bVal.toLowerCase() : bVal) as string | number;

      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUnits, sortField, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedUnits.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedUnits = sortedUnits.slice(startIndex, endIndex);

  const handleSort = (field: keyof HavenUnit) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "occupied":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      case "maintenance":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const handleEdit = (unit: HavenUnit) => {
    setSelectedHaven(unit);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (unit: HavenUnit) => {
    setSelectedHaven(unit);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedHaven) return;
    try {
      await deleteHaven(selectedHaven.uuid_id).unwrap();
      toast.success(`${selectedHaven.haven_name} deleted successfully!`);
      setIsDeleteModalOpen(false);
      setSelectedHaven(null);
    } catch (error: unknown) {
      console.error("Failed to delete haven:", error);
      toast.error("Failed to delete haven");
    }
  };

  // Helper for highlighting text (simplified version of DepositPage)
  const highlightText = (text: string | number, searchTerm: string) => {
      const strText = String(text);
      if (!searchTerm.trim()) return strText;
      
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = strText.split(regex);
      
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

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Failed to load units</h3>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All Haven Units</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your property units, rates, and availability</p>
          </div>
          <button
            onClick={onAddUnitClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primaryDark text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-semibold shadow-[rgba(186,144,60,0.35)]"
          >
            <Plus className="w-5 h-5" />
            Add Haven
          </button>
        </div>
      )}

      {/* Controls: Search, Filter, Show Entries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 flex-shrink-0 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            
            {/* Show Entries */}
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

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by haven name, tower, or view..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
              />
            </div>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-amber-600"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section - Fixed height and scrollable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-1 flex flex-col min-h-0 border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto overflow-y-auto flex-1 h-[600px] max-h-[600px]">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th onClick={() => handleSort("haven_name")} className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center gap-2">Haven Name <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("tower")} className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center gap-2">Tower <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("floor")} className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center gap-2">Floor <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("view_type")} className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center gap-2">View <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("six_hour_rate")} className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">6H Rate <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("ten_hour_rate")} className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">10H Rate <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("weekday_rate")} className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">Weekday <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("weekend_rate")} className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">Weekend <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 dark:group-hover:text-gray-100" /></div>
                </th>
                <th onClick={() => handleSort("status")} className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">Status <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-300" /></div>
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-200 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                  <tr>
                      <td colSpan={10} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                          <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading haven units...</p>
                      </td>
                  </tr>
              ) : paginatedUnits.length === 0 ? (
                  <tr>
                      <td colSpan={10} className="py-20 text-center border border-gray-200 dark:border-gray-700">
                          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No units found.</p>
                      </td>
                  </tr>
              ) : (
                paginatedUnits.map((unit) => (
                  <tr key={unit.uuid_id || unit.id} className="border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                          <Home className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{highlightText(unit.haven_name, searchQuery)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700"><span className="text-sm text-gray-700 dark:text-gray-200">{highlightText(unit.tower, searchQuery)}</span></td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700"><span className="text-sm text-gray-700 dark:text-gray-200">{unit.floor}</span></td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700"><span className="text-sm text-gray-700 dark:text-gray-200">{highlightText(unit.view_type, searchQuery)}</span></td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700"><span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.six_hour_rate}</span></td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700"><span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.ten_hour_rate}</span></td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700"><span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.weekday_rate}</span></td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700"><span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.weekend_rate}</span></td>
                    <td className="py-4 px-4 text-center border border-gray-200 dark:border-gray-700">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(unit.status || "Available")}`}>
                        {unit.status || "Available"}
                      </span>
                    </td>
                    <td className="py-4 px-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="p-2 text-brand-primary hover:bg-brand-primaryLighter rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(unit)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete"
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

        {/* Footer / Pagination */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden flex-shrink-0 mt-auto border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Showing {sortedUnits.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedUnits.length)} of {sortedUnits.length} entries
                {searchQuery || filterStatus !== "all" ? ` (filtered from ${units.length} total entries)` : ""}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || totalPages === 0}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Page Numbers */}
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
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditHavenModal
        isOpen={isEditHavnModal}
        onClose={() => setIsEditOpen(false)}
        havenData={selectedHaven}
      />
      <DeleteHavenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedHaven?.haven_name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ViewAllUnits;