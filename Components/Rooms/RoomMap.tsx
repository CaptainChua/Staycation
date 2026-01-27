'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoomMapProps {
  roomName: string;
  tower?: string;
  location?: string;
}

const RoomMap = ({ roomName, tower, location }: RoomMapProps) => {
  // Correct coordinates for M Place South Triangle Tower D, Panay Ave, Diliman, Quezon City
  const defaultPosition: [number, number] = [14.6395, 121.0360];
  
  // Use the fixed address for all rooms
  const displayAddress = "M Place South Triangle Tower D, Panay Ave, Diliman, Quezon City, 1103 Metro Manila";

  useEffect(() => {
    // Fix for default marker icon issue in Leaflet with Next.js
    const prototype = L.Icon.Default.prototype as { _getIconUrl?: unknown };
    delete prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
      <MapContainer
        center={defaultPosition}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={defaultPosition}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <div className="text-center">
              <p className="font-bold text-gray-800">{roomName}</p>
              <p className="text-sm text-gray-600">{displayAddress}</p>
            </div>
          </Tooltip>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-gray-800">{roomName}</p>
              {tower && <p className="text-sm text-gray-600">{tower}</p>}
              <p className="text-sm text-gray-600">{displayAddress}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default RoomMap;