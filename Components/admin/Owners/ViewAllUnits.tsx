"use client";

import { useState } from "react";
import { Edit, Trash2, Search, Plus, Home } from "lucide-react";
import { useGetAllAdminRoomsQuery, useDeleteHavenMutation } from "@/redux/api/roomApi";
import EditHavenModal from "./Modals/EditHavenModal";
import DeleteHavenModal from "./Modals/DeleteHavenModal";
import toast from 'react-hot-toast';

const ViewAllUnits = ({ onAddUnitClick }: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditHavnModal, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHaven, setSelectedHaven] = useState<any>(null)

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
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load units</h3>
          <p className="text-gray-600 mb-4">There was an error fetching the haven units.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter function
  const filteredUnits = units.filter(
    (unit: any) =>
      unit.haven_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.tower.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.view_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-700";
      case "occupied":
        return "bg-red-100 text-red-700";
      case "maintenance":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleEdit = (unit: any) => {
    setSelectedHaven(unit);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (unit: any) => {
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
      
    } catch (error: any) {
      console.error("Failed to delete haven:", error);
      toast.error(error?.data?.error || "Failed to delete haven");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              All Haven Units
            </h2>
            <p className="text-sm text-gray-600">
              Manage your property units, rates, and availability
            </p>
          </div>
          <button
            onClick={onAddUnitClick}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Haven
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by haven name, tower, or view..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Haven Name
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Tower
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Floor
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  View
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  6H Rate
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  10H Rate
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Weekday Rate
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">
                  Weekend Rate
                </th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">
                  Status
                </th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit: any, index: number) => (
                <tr
                  key={unit.uuid_id || unit.id}
                  className="border-b border-gray-100 hover:bg-purple-50 transition-colors animate-in fade-in duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        <Home className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {unit.haven_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{unit.tower}</td>
                  <td className="py-4 px-6">{unit.floor}</td>
                  <td className="py-4 px-6">{unit.view_type}</td>
                  <td className="py-4 px-6">₱{unit.six_hour_rate}</td>
                  <td className="py-4 px-6">₱{unit.ten_hour_rate}</td>
                  <td className="py-4 px-6">₱{unit.weekday_rate}</td>
                  <td className="py-4 px-6">₱{unit.weekend_rate}</td>
                  <td className="py-4 px-6 text-center">
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColor(
                        unit.status || "Available"
                      )}`}
                    >
                      {unit.status || "Available"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(unit)}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(unit)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
