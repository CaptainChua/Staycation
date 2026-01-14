"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import RoomsDetailsPage from "@/Components/Rooms/RoomsDetailsPage";
import RoomDetailsSkeleton from "@/Components/Rooms/RoomDetailsSkeleton";

interface HavenData {
  uuid_id: string;
  haven_name: string;
  six_hour_rate: number;
  images?: Array<{ url: string }>;
  rating?: number;
  review_count?: number;
  capacity: number;
  amenities?: Record<string, boolean>;
  description: string;
  full_description?: string;
  beds?: string;
  room_size?: string;
  location?: string;
  tower?: string;
  photo_tours?: Array<{ category: string; url: string }>;
  youtube_url?: string;
}

interface RoomDetailsClientProps {
  room: HavenData;
}

export default function RoomDetailsClient({ room: haven }: RoomDetailsClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    router.push('/rooms');
  };

  // Simulate loading for smooth transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <RoomDetailsSkeleton />;
  }

  // Transform haven data to room format expected by RoomsDetailsPage
  const room = {
    id: haven.uuid_id,
    name: haven.haven_name,
    price: `₱${haven.six_hour_rate}`,
    pricePerNight: 'per night',
    images: haven.images?.map((img) => img.url) ?? [],
    rating: haven.rating ?? 4.5,
    reviews: haven.review_count ?? 0,
    capacity: haven.capacity,
    amenities: Object.entries(haven.amenities || {})
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    description: haven.description,
    fullDescription: haven.full_description || haven.description,
    beds: haven.beds,
    roomSize: haven.room_size,
    location: haven.location,
    tower: haven.tower,
    photoTour: haven.photo_tours
      ? haven.photo_tours.reduce((acc: Record<string, string[]>, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item.url);
          return acc;
        }, {} as Record<string, string[]>)
      : {},
    youtubeUrl: haven.youtube_url,
  };

  return <RoomsDetailsPage room={room} onBack={handleBack} />;
}

