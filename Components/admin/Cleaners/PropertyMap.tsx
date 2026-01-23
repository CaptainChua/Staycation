"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2 } from "lucide-react";

// Custom Marker Icons Generator
const getMarkerIcon = (status: "available" | "limited" | "full") => {
  let color = "#22c55e"; // green-500
  if (status === "limited") color = "#eab308"; // yellow-500
  if (status === "full") color = "#ef4444"; // red-500

  // SVG Marker
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `;

  return L.divIcon({
    className: "custom-map-marker",
    html: svgString,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -45],
  });
};

export interface Building {
  id: string;
  name: string;
  totalUnits: number;
  availableUnits: number;
  latitude: number;
  longitude: number;
  status: "available" | "limited" | "full";
}

interface PropertyMapProps {
  buildings: Building[];
  center: [number, number];
  selectedBuildingId: string | null;
  onMarkerClick: (id: string) => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function PropertyMap({ buildings, center, selectedBuildingId, onMarkerClick }: PropertyMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-gray-100 dark:bg-gray-700 animate-pulse flex items-center justify-center rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">Loading Map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={false}
      className="h-full w-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} />

      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={[building.latitude, building.longitude]}
          icon={getMarkerIcon(building.status)}
          eventHandlers={{
            click: () => onMarkerClick(building.id),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[150px] text-center">
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white ${
                building.status === 'available' ? 'bg-green-500' : 
                building.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800 text-sm">{building.name}</h3>
              <p className="text-xs font-semibold text-gray-700 mt-2">
                Total Havens: {building.totalUnits}
              </p>
              <p className="text-xs text-gray-600">
                {building.availableUnits} available
              </p>
              <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                building.status === 'available' ? 'bg-green-100 text-green-700' : 
                building.status === 'limited' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {building.status}
              </span>
              {selectedBuildingId === building.id && (
                <p className="text-[10px] text-brand-primary mt-1 font-bold">
                  Selected
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}