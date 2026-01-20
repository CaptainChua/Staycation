"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { MapPin, Building2, CheckCircle, Clock, XCircle, Navigation, Loader2, RefreshCw, Database } from "lucide-react";
import dynamic from "next/dynamic";
import { Building } from "./PropertyMap";
import { toast } from "react-hot-toast";

// Lazy load Map component
const PropertyMap = dynamic(
  () => import("./PropertyMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
        </div>
      </div>
    )
  }
);

// Coordinate Mapping for Towers
const TOWER_COORDINATES: Record<string, [number, number]> = {
  'tower-a': [14.6760, 121.0437],
  'tower-b': [14.6762, 121.0440],
  'tower-c': [14.6758, 121.0442],
  'tower-d': [14.6755, 121.0435],
  // Fallback
  'default': [14.6760, 121.0437]
};

interface HavenUnit {
  id: string;
  name: string;
  address: string;
  status: string;
  lastCleaned: string;
  nextScheduled: string;
}

export default function PropertyLocationPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [havens, setHavens] = useState<HavenUnit[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.6760, 121.0437]); // Default to QC
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPropertyData = useCallback(async () => {
    try {
      setIsUpdating(true);
      
      // Fetch Tower data (aggregated)
      const resTowers = await fetch('/api/admin/cleaners/properties');
      if (!resTowers.ok) throw new Error('Failed to fetch towers');
      const dataTowers = await resTowers.json();
      
      const mappedBuildings: Building[] = dataTowers.map((item: any) => {
        let status: "available" | "limited" | "full" = "available";
        // Logic can be adjusted based on real occupancy data
        if (item.available_units === 0) status = "full";
        else if (item.available_units <= 5) status = "limited";
        
        // Map coordinates from frontend constant
        const towerKey = item.id.toLowerCase();
        const [lat, lng] = TOWER_COORDINATES[towerKey] || TOWER_COORDINATES['default'];

        return {
          id: item.id,
          name: item.name, // Already formatted as "Tower X" from API
          totalUnits: item.total_units,
          availableUnits: item.available_units,
          latitude: lat,
          longitude: lng,
          status
        };
      });

      setBuildings(mappedBuildings);
      
      // Auto-center map on first tower during initial load
      if (isLoading && mappedBuildings.length > 0) {
        setMapCenter([mappedBuildings[0].latitude, mappedBuildings[0].longitude]);
      }

      // Fetch Individual Havens
      const resHavens = await fetch('/api/admin/cleaners/havens');
      if (!resHavens.ok) throw new Error('Failed to fetch havens');
      const dataHavens = await resHavens.json();
      setHavens(dataHavens);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching properties:", error);
      // Only toast on error if not initial load to avoid spamming on recurring errors
      if (isLoading) toast.error("Could not load property data");
    } finally {
      setIsUpdating(false);
      setIsLoading(false);
    }
  }, [isLoading]);

  // Initial Load & Polling
  useEffect(() => {
    fetchPropertyData();
    const intervalId = setInterval(fetchPropertyData, 15000);
    return () => clearInterval(intervalId);
  }, [fetchPropertyData]);

  const selectedBuilding = useMemo(
    () => buildings.find(b => b.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  );

  const handleBuildingClick = (building: Building) => {
    setSelectedBuildingId(building.id);
    setMapCenter([building.latitude, building.longitude]);
  };

  const handleGetDirections = () => {
    if (selectedBuilding) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedBuilding.latitude},${selectedBuilding.longitude}`;
      window.open(url, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return CheckCircle;
      case 'Needs Cleaning': return XCircle;
      case 'In Progress': return Clock;
      default: return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return "text-green-600";
      case 'Needs Cleaning': return "text-red-600";
      case 'In Progress': return "text-yellow-600";
      default: return "text-gray-600";
    }
  };
  
  const getBgColor = (status: string) => {
    switch (status) {
      case 'Available': return "bg-green-50 dark:bg-green-900/20";
      case 'Needs Cleaning': return "bg-red-50 dark:bg-red-900/20";
      case 'In Progress': return "bg-yellow-50 dark:bg-yellow-900/20";
      default: return "bg-gray-50 dark:bg-gray-900/20";
    }
  };

  if (isLoading && buildings.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-gray-500 font-medium">Connecting to Property Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-start flex-col sm:flex-row gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Property Locations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
             <Database className="w-3 h-3" /> Live Data from Neon DB
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
          <RefreshCw className={`w-3 h-3 ${isUpdating ? "animate-spin text-brand-primary" : ""}`} />
          <span>Last Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}</span>
        </div>
      </div>

      {/* Building (Tower) Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map((building) => (
          <div
            key={building.id}
            onClick={() => handleBuildingClick(building)}
            className={`cursor-pointer rounded-lg p-6 transition-all border relative overflow-hidden group ${
              selectedBuildingId === building.id
                ? "bg-brand-primary text-white shadow-lg border-brand-primary transform scale-[1.02]"
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:shadow-md border-gray-200 dark:border-gray-700 hover:border-brand-primary/50"
            }`}
          >
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${
              building.status === 'available' ? 'bg-green-400' : 
              building.status === 'limited' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            
            <div className="flex items-center justify-between pl-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-medium ${selectedBuildingId === building.id ? "opacity-90" : "text-gray-500 dark:text-gray-400 group-hover:text-brand-primary"}`}>
                    {building.name}
                  </p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase border ${
                     selectedBuildingId === building.id 
                     ? "bg-white/20 border-white/40 text-white"
                     : building.status === 'available' ? "bg-green-100 text-green-700 border-green-200"
                     : building.status === 'limited' ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                     : "bg-red-100 text-red-700 border-red-200"
                  }`}>
                    {building.status}
                  </span>
                </div>
                
                <p className="text-3xl font-bold mt-2">{building.totalUnits}</p>
                
                <div className="flex items-center gap-1.5 mt-1">
                   <span className={`w-2 h-2 rounded-full transition-colors ${
                      selectedBuildingId === building.id 
                        ? (building.status === 'available' ? 'bg-green-300' : building.status === 'limited' ? 'bg-yellow-300' : 'bg-red-300')
                        : (building.status === 'available' ? 'bg-green-500' : building.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500')
                   }`} />
                   <p className={`text-xs ${selectedBuildingId === building.id ? "opacity-90" : "text-gray-400 dark:text-gray-500"}`}>
                    {building.availableUnits} Available
                   </p>
                </div>
              </div>
              <Building2 className={`w-12 h-12 transition-opacity ${selectedBuildingId === building.id ? "opacity-50 text-white" : "text-gray-300 dark:text-gray-600 opacity-30"}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Map Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Property Map
          </h2>
          <button 
            onClick={handleGetDirections}
            disabled={!selectedBuilding}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              selectedBuilding 
                ? "bg-brand-primary hover:bg-brand-primaryDark text-white shadow-md" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Navigation className="w-4 h-4" />
            Get Directions
          </button>
        </div>
        
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 relative z-0">
          <PropertyMap 
            buildings={buildings}
            center={mapCenter}
            selectedBuildingId={selectedBuildingId}
            onMarkerClick={(id) => {
              const building = buildings.find(b => b.id === id);
              if (building) handleBuildingClick(building);
            }}
          />
        </div>
        
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Real-time updates active. Map markers and cards update automatically when data changes in the database.
            {selectedBuilding && (
              <span className="font-semibold ml-1 text-brand-primary">
                Selected: {selectedBuilding.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Properties List (Individual Havens) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Individual Havens
        </h2>
        <div className="space-y-3">
          {havens.map((property) => {
            const StatusIcon = getStatusIcon(property.status);
            const statusColor = getStatusColor(property.status);
            const bgColor = getBgColor(property.status);
            
            return (
              <div
                key={property.id}
                className={`${bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-brand-primary mt-1"></div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {property.name}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{property.address}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Last cleaned: {property.lastCleaned}</span>
                        <span>Next: {property.nextScheduled}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                    <span className={`text-sm font-bold ${statusColor}`}>
                      {property.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {havens.length === 0 && (
            <p className="text-gray-500 text-center py-4">No havens found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
