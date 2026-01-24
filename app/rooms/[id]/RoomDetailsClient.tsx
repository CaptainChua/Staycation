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
  floor?: string;
  photo_tours?: Array<{ category: string; url: string }>;
  youtube_url?: string;
}

interface RoomDetailsClientProps {
  room: HavenData;
  recommendedRooms?: HavenData[];
}

export default function RoomDetailsClient({ room: haven, recommendedRooms = [] }: RoomDetailsClientProps) {
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

  // Helper function to transform haven data to room format
  const transformHavenToRoom = (havenData: HavenData) => ({
    id: havenData.uuid_id,
    uuid_id: havenData.uuid_id,
    name: havenData.haven_name,
    price: `₱${havenData.six_hour_rate}`,
    pricePerNight: 'per night',
    images: havenData.images?.map((img) => img.url) ?? [],
    rating: havenData.rating ?? 4.5,
    reviews: havenData.review_count ?? 0,
    capacity: havenData.capacity,
    amenities: Object.entries(havenData.amenities || {})
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    description: havenData.description,
    fullDescription: havenData.full_description || havenData.description,
    beds: havenData.beds,
    roomSize: havenData.room_size,
    location: havenData.location,
    tower: havenData.tower,
    floor: havenData.floor,
    photoTour: havenData.photo_tours
      ? havenData.photo_tours.reduce((acc: Record<string, string[]>, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item.url);
          return acc;
        }, {} as Record<string, string[]>)
      : {},
    youtubeUrl: havenData.youtube_url,
  });

  // Transform haven data to room format expected by RoomsDetailsPage
  const room = transformHavenToRoom(haven);

  // Transform recommended rooms
  const recommendations = recommendedRooms.map(transformHavenToRoom);

  return <RoomsDetailsPage room={room} onBack={handleBack} recommendedRooms={recommendations} />;
}

