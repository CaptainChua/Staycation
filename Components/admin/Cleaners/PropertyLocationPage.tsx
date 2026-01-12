"use client";

import { MapPin, Building2, CheckCircle, Clock, XCircle, Navigation } from "lucide-react";

export default function PropertyLocationPage() {
  const properties = [
    {
      id: 1,
      name: "Haven 3",
      address: "Building A, Floor 2, Room 203",
      status: "In Progress",
      statusColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: Clock,
      lastCleaned: "2 days ago",
      nextScheduled: "Today, 2:00 PM",
    },
    {
      id: 2,
      name: "Haven 7",
      address: "Building B, Floor 1, Room 107",
      status: "Available",
      statusColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      icon: CheckCircle,
      lastCleaned: "1 hour ago",
      nextScheduled: "Tomorrow, 10:00 AM",
    },
    {
      id: 3,
      name: "Haven 12",
      address: "Building A, Floor 3, Room 312",
      status: "Needs Cleaning",
      statusColor: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      icon: XCircle,
      lastCleaned: "5 days ago",
      nextScheduled: "Today, 5:30 PM",
    },
    {
      id: 4,
      name: "Haven 15",
      address: "Building C, Floor 2, Room 215",
      status: "Available",
      statusColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      icon: CheckCircle,
      lastCleaned: "30 minutes ago",
      nextScheduled: "Tomorrow, 2:00 PM",
    },
    {
      id: 5,
      name: "Haven 18",
      address: "Building B, Floor 3, Room 318",
      status: "In Progress",
      statusColor: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      icon: Clock,
      lastCleaned: "3 days ago",
      nextScheduled: "Today, 4:00 PM",
    },
  ];

  const buildings = [
    { name: "Building A", units: 15, available: 10 },
    { name: "Building B", units: 12, available: 8 },
    { name: "Building C", units: 10, available: 7 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Property Locations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View all property locations and their current status
        </p>
      </div>

      {/* Building Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map((building, i) => (
          <div
            key={i}
            className="bg-brand-primary text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{building.name}</p>
                <p className="text-3xl font-bold mt-2">{building.units}</p>
                <p className="text-xs opacity-75 mt-1">{building.available} Available</p>
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
          <button className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
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

      {/* Properties List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          All Properties
        </h2>
        <div className="space-y-3">
          {properties.map((property) => {
            const StatusIcon = property.icon;
            return (
              <div
                key={property.id}
                className={`${property.bgColor} rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all`}
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
                    <StatusIcon className={`w-5 h-5 ${property.statusColor}`} />
                    <span className={`text-sm font-bold ${property.statusColor}`}>
                      {property.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
