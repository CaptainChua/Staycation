'use client';

import React from 'react';
import { 
    Wifi, 
    Wind, 
    Tv, 
    Gamepad2, 
    Car, 
    Home, 
    Utensils, 
    Film, 
    Droplets,
    Sofa,
    BedDouble,
    WashingMachine
} from "lucide-react";

interface AmenityBadgeProps {
    amenity: string;
}

const AmenityBadge = ({amenity}:AmenityBadgeProps) => {
    
    // Comprehensive mapping for all possible amenity name variations
    const getIcon = (name: string) => {
        const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
        
        // Icon mapping
        const iconMap: Record<string, React.ReactElement> = {
            'wifi': <Wifi className="w-4 h-4" />,
            'ac': <Wind className="w-4 h-4" />,
            'airconditioning': <Wind className="w-4 h-4" />,
            'tv': <Tv className="w-4 h-4" />,
            'television': <Tv className="w-4 h-4" />,
            'ps4': <Gamepad2 className="w-4 h-4" />,
            'playstation': <Gamepad2 className="w-4 h-4" />,
            'playstation4': <Gamepad2 className="w-4 h-4" />,
            'gaming': <Gamepad2 className="w-4 h-4" />,
            'parking': <Car className="w-4 h-4" />,
            'kitchen': <Utensils className="w-4 h-4" />,
            'netflix': <Film className="w-4 h-4" />,
            'towels': <Droplets className="w-4 h-4" />,
            'balcony': <Sofa className="w-4 h-4" />,
            'glowbed': <BedDouble className="w-4 h-4" />,
            'glow': <BedDouble className="w-4 h-4" />,
            'bed': <BedDouble className="w-4 h-4" />,
            'poolaccess': <Home className="w-4 h-4" />,
            'pool': <Home className="w-4 h-4" />,
            'washerdryer': <WashingMachine className="w-4 h-4" />,
            'washer': <WashingMachine className="w-4 h-4" />,
            'dryer': <WashingMachine className="w-4 h-4" />,
        };
        
        return iconMap[normalizedName] || null;
    }

    const formatText = (name: string) => {
        const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
        
        // Text formatting mapping
        const textMap: Record<string, string> = {
            'wifi': 'WiFi',
            'ac': 'Air Conditioning',
            'airconditioning': 'Air Conditioning',
            'tv': 'TV',
            'television': 'TV',
            'ps4': 'PS4',
            'playstation': 'PlayStation',
            'parking': 'Parking',
            'kitchen': 'Kitchen',
            'netflix': 'Netflix',
            'towels': 'Towels',
            'balcony': 'Balcony',
            'glowbed': 'Glow Bed',
            'glow': 'Glow Bed',
            'bed': 'Bed',
            'poolaccess': 'Pool Access',
            'pool': 'Pool Access',
            'washerDryer': 'Washer/Dryer',
            'washer': 'Washer',
            'dryer': 'Dryer',
        };
        
        return textMap[normalizedName] || name.charAt(0).toUpperCase() + name.slice(1);
    }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm whitespace-nowrap">
      {getIcon(amenity)}
      <span>{formatText(amenity)}</span>
    </div>
  )
}

export default AmenityBadge