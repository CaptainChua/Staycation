"use client";

import {
  MapPin,
  Search,
  Filter,
  ArrowUpDown,
  User,
  Eye,
  Loader2,
  Users,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Navigation,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useGetEmployeesQuery } from "@/redux/api/employeeApi";
import Image from "next/image";

import { getHavensForCleaning, MappedHaven } from "@/app/admin/cleaners/actions";

// Lazy load Map component to avoid SSR issues with Leaflet
const CleanerMap = dynamic(
  () => import("./CleanerMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Initializing map interface...</p>
        </div>
      </div>
    )
  }
);

interface Cleaner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_id: string;
  status: string; // active (available), busy, inactive
  latitude?: number;
  longitude?: number;
  profile_image_url?: string;
  department?: string;
}

export default function CleanersManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "busy" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof Cleaner | null>("first_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6760, 121.0437]); // default to Quezon City
  const [havens, setHavens] = useState<MappedHaven[]>([]);

  // Fetch cleaners from API
  const { data: employeesData, isLoading, refetch } = useGetEmployeesQuery({ role: "Cleaner" });

  useEffect(() => {
    const fetchHavens = async () => {
      try {
        const data = await getHavensForCleaning();
        setHavens(data);
      } catch (error) {
        console.error("Failed to fetch havens", error);
      }
    };
    fetchHavens();
  }, []);
  
  const cleaners: Cleaner[] = useMemo(() => {
    return (employeesData?.data || []).map((emp: any) => ({
      ...emp,
      // Map 'active' to 'available' for display purposes if needed, 
      // but keeping database values 'active', 'busy', 'inactive'
    }));
  }, [employeesData]);

  const filteredCleaners = useMemo(() => {
    return cleaners.filter((cleaner) => {
      const name = `${cleaner.first_name} ${cleaner.last_name}`.toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        name.includes(term) ||
        cleaner.email.toLowerCase().includes(term) ||
        cleaner.employment_id.toLowerCase().includes(term);

      const matchesFilter = filterStatus === "all" || cleaner.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [cleaners, filterStatus, searchTerm]);

  const sortedCleaners = useMemo(() => {
    const copy = [...filteredCleaners];
    if (!sortField) return copy;
    return copy.sort((a, b) => {
      const aSortable = String(a[sortField] ?? "").toLowerCase();
      const bSortable = String(b[sortField] ?? "").toLowerCase();
      if (aSortable < bSortable) return sortDirection === "asc" ? -1 : 1;
      if (aSortable > bSortable) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCleaners, sortDirection, sortField]);

  const totalPages = Math.ceil(sortedCleaners.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedCleaners = sortedCleaners.slice(startIndex, endIndex);

  const handleSort = (field: keyof Cleaner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "busy":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "inactive":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Available";
      case "busy":
        return "Busy";
      case "inactive":
        return "Inactive";
      default:
        return status || "Unknown";
    }
  };

  // Sync map center when a cleaner is selected
  useEffect(() => {
    if (selectedCleanerId) {
      const cleaner = cleaners.find((c) => c.id === selectedCleanerId);
      if (cleaner && cleaner.latitude && cleaner.longitude) {
        setMapCenter([cleaner.latitude, cleaner.longitude]);
      }
    }
  }, [selectedCleanerId, cleaners]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Cleaners Real-time Location</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track cleaner locations and availability status</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md"
        >
          <Navigation className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Cleaners", value: String(cleaners.length), color: "bg-blue-500", icon: Users },
          { label: "Available", value: String(cleaners.filter(c => c.status === "active").length), color: "bg-green-500", icon: User },
          { label: "Busy", value: String(cleaners.filter(c => c.status === "busy").length), color: "bg-yellow-500", icon: Loader2 },
          { label: "Inactive", value: String(cleaners.filter(c => c.status === "inactive").length), color: "bg-red-500", icon: MapPin },
        ].map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <IconComponent className="w-12 h-12 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, email, or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Available</option>
              <option value="busy">Busy</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th
                  onClick={() => handleSort("employment_id")}
                  className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    ID
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("first_name")}
                  className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    Cleaner Name
                    <ArrowUpDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200">Email & Phone</th>
                <th className="text-left py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200">Department</th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200">Status</th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200">Location</th>
                <th className="text-center py-4 px-6 text-sm font-bold text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="w-10 h-10 text-brand-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading cleaners data...</p>
                  </td>
                </tr>
              ) : paginatedCleaners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No cleaners found</p>
                  </td>
                </tr>
              ) : (
                paginatedCleaners.map((cleaner) => (
                  <tr 
                    key={cleaner.id} 
                    className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${selectedCleanerId === cleaner.id ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-l-brand-primary' : ''}`}
                    onClick={() => setSelectedCleanerId(cleaner.id)}
                  >
                    <td className="py-4 px-6 font-semibold text-gray-800 dark:text-gray-100 text-sm">
                      {cleaner.employment_id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold overflow-hidden">
                          {cleaner.profile_image_url ? (
                            <Image 
                              src={cleaner.profile_image_url} 
                              alt={cleaner.first_name} 
                              width={40} 
                              height={40} 
                              className="object-cover"
                            />
                          ) : (
                            <span>{cleaner.first_name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{cleaner.first_name} {cleaner.last_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{cleaner.email}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{cleaner.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{cleaner.department || "Cleaning Staff"}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(cleaner.status)}`}>
                        {getStatusLabel(cleaner.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        {cleaner.latitude && cleaner.longitude ? (
                          <div className="flex items-center gap-1 text-brand-primary">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-medium">Mapped</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No coordinates</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="View Details"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Logic to view details
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-brand-primary hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                          title="Show on Map"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCleanerId(cleaner.id);
                            if (cleaner.latitude && cleaner.longitude) {
                              setMapCenter([cleaner.latitude, cleaner.longitude]);
                            }
                          }}
                        >
                          <MapPin className="w-4 h-4" />
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Showing {sortedCleaners.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, sortedCleaners.length)} of {sortedCleaners.length} cleaners
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
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section - Moved below the list as per requirements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Interactive Location Map</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {cleaners.filter(c => c.latitude && c.longitude).length} markers displayed
          </span>
        </div>
        <div className="h-[400px] w-full relative z-0">
          <CleanerMap 
            cleaners={cleaners} 
            center={mapCenter} 
            selectedCleanerId={selectedCleanerId}
            onMarkerClick={(id) => setSelectedCleanerId(id)}
          />
        </div>
        {/* TODO: Document missing latitude/longitude columns in 'employees' table. 
            Currently these fields are expected by the UI but missing from the Neon PostgreSQL schema.
            Markers will only appear once 'latitude' and 'longitude' (NUMERIC or FLOAT) are added to the table. */}
      </div>

      {/* Havens Overview Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Havens Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {havens.length > 0 ? (
            havens.map((haven) => (
              <div key={haven.uuid} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{haven.displayString}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Loading havens data...</p>
          )}
        </div>
      </div>
      
      {/* TODO: Implement area assignment logic if stored in DB */}
      {/* // TODO: Add real-time updates if needed, currently using safe re-fetching */}
    </div>
  );
}
