"use client";

import { useState } from "react";
import { Edit, Trash2, Search, Plus, Home } from "lucide-react";
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
}

const ViewAllUnits = ({ onAddUnitClick }: ViewAllUnitsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditHavnModal, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHaven, setSelectedHaven] = useState<HavenUnit | null>(null)

  // RTK Query call
  const { data, isLoading, isError } = useGetAllAdminRoomsQuery({});
  const [deleteHaven, { isLoading: isDeleting }] = useDeleteHavenMutation();
  const units = data?.data || []; // assuming API returns { success, data: [...] }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        {/* Header Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <th key={i} className="py-4 px-6">
                      <div className="h-4 bg-purple-200 rounded animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-b border-gray-100">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
                      <td key={col} className="py-4 px-6">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Failed to load units</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">There was an error fetching the haven units.</p>
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

  // Filter function
  const filteredUnits = units.filter(
    (unit: HavenUnit) =>
      unit.haven_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.tower.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.view_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "occupied":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "maintenance":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
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
      const errorMessage =
        error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data &&
        typeof error.data.error === 'string'
        ? error.data.error
        : "Failed to delete haven";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header - Matching Analytics page style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All Haven Units</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your property units, rates, and availability</p>
        </div>
        <button
          onClick={onAddUnitClick}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Haven
        </button>
      </div>

      {/* Table - Matching Analytics page table style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-200 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Haven Units</h2>
          {/* Search - Integrated in table header */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by haven name, tower, or view..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-b-2 border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Haven Name
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Tower
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Floor
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  View
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  6H Rate
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  10H Rate
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Weekday Rate
                </th>
                <th className="text-left py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Weekend Rate
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Status
                </th>
                <th className="text-center py-4 px-4 text-sm font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No units found.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit: HavenUnit) => (
                  <tr
                    key={unit.uuid_id || unit.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold">
                          <Home className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {unit.haven_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{unit.tower}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{unit.floor}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{unit.view_type}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.six_hour_rate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.ten_hour_rate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.weekday_rate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">₱{unit.weekend_rate}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(
                          unit.status || "Available"
                        )} dark:bg-opacity-30`}
                      >
                        {unit.status || "Available"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(unit)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(unit)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
