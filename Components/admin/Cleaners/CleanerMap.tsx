"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Image from "next/image";

// Fix for Leaflet default icon issues in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Cleaner {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  latitude?: number;
  longitude?: number;
  profile_image_url?: string;
  employment_id: string;
  department?: string;
}

interface CleanerMapProps {
  cleaners: Cleaner[];
  center: [number, number];
  selectedCleanerId: string | null;
  onMarkerClick: (id: string) => void;
}

// Component to handle map view updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function CleanerMap({ cleaners, center, selectedCleanerId, onMarkerClick }: CleanerMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading Map...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200";
      case "busy": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "inactive": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Available";
      case "busy": return "Busy";
      case "inactive": return "Inactive";
      default: return status || "Unknown";
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={true}
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} />

      {cleaners.map((cleaner) => {
        // Skip markers safely if coordinates are NULL
        if (!cleaner.latitude || !cleaner.longitude) {
          // TODO: Log missing location data for cleaner: ${cleaner.first_name} ${cleaner.last_name} (${cleaner.employment_id})
          return null;
        }

        return (
          <Marker
            key={cleaner.id}
            position={[cleaner.latitude, cleaner.longitude]}
            eventHandlers={{
              click: () => onMarkerClick(cleaner.id),
            }}
          >
            <Popup>
              <div className="text-center p-1 min-w-[150px]">
                <div className="w-12 h-12 bg-brand-primary rounded-full mx-auto mb-2 overflow-hidden flex items-center justify-center text-white font-bold">
                  {cleaner.profile_image_url ? (
                    <Image 
                      src={cleaner.profile_image_url} 
                      alt={cleaner.first_name} 
                      width={48} 
                      height={48} 
                      className="object-cover"
                    />
                  ) : (
                    <span>{cleaner.first_name.charAt(0)}</span>
                  )}
                </div>
                <p className="font-bold text-gray-900">{cleaner.first_name} {cleaner.last_name}</p>
                <p className="text-xs text-gray-600 mb-1">{cleaner.employment_id}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(cleaner.status)}`}>
                  {getStatusLabel(cleaner.status)}
                </span>
                <p className="text-[10px] text-gray-500 mt-2 italic">
                  {cleaner.department || "Cleaning Staff"}
                </p>
                {selectedCleanerId === cleaner.id && (
                  <p className="text-[10px] text-brand-primary mt-1 font-bold animate-pulse">
                    Currently Selected
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
