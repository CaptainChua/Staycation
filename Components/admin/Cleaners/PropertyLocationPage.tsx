"use client";

import { MapPin, Building2, CheckCircle, Clock, XCircle, Navigation } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { Building } from "./PropertyMap";

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
      
      interface PropertyTowerData {
        id: string;
        name: string;
        total_units: number;
        available_units: number;
      }

      const dataTowers: PropertyTowerData[] = await resTowers.json();
      
      const mappedBuildings: Building[] = dataTowers.map((item: PropertyTowerData) => {
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
      const dataHavens: HavenUnit[] = await resHavens.json();
      setHavens(dataHavens);

      setLastUpdated(new Date());
    } catch (error: unknown) {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Property Locations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View all property locations and their current status
        </p>
      </div>

      {/* Building (Tower) Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map((building, i) => (
          <div
            key={i}
            className="bg-brand-primary text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all cursor-pointer"
            onClick={() => handleBuildingClick(building)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{building.name}</p>
                <p className="text-3xl font-bold mt-2">{building.totalUnits}</p>
                <p className="text-xs opacity-75 mt-1">{building.availableUnits} Available</p>
              </div>
              <Building2 className="w-12 h-12 opacity-50" />
            </div>
          </div>
        ))}
      </div>

      {/* Map Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            Property Map
          </h2>
          <button 
            onClick={handleGetDirections}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Get Directions
          </button>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Interactive map view coming soon</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Integration with mapping service in progress
            </p>
          </div>
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