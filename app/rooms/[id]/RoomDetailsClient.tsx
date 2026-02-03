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
  six_hour_check_in?: string;
  six_hour_check_out?: string;
  ten_hour_check_in?: string;
  ten_hour_check_out?: string;
  twenty_one_hour_check_in?: string;
  twenty_one_hour_check_out?: string;
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

  // Debug logging
  console.log("🏠 Room data received:", haven);
  console.log("🖼️ Raw images data:", haven.images);
  console.log("🖼️ Mapped images:", haven.images?.map((img: { url: string }) => img.url) ?? []);

  // Transform photo_tours array to photoTour object format
  const transformPhotoTours = (photoTours?: Array<{ category: string; url: string }>) => {
    if (!photoTours || photoTours.length === 0) return undefined;

    const photoTourObj: Record<string, string[]> = {};
    photoTours.forEach(({ category, url }) => {
      const key = category.toLowerCase().replace(/\s+/g, '');
      if (!photoTourObj[key]) {
        photoTourObj[key] = [];
      }
      photoTourObj[key].push(url);
    });
    return photoTourObj;
  };

  // Transform haven data to room format expected by RoomsDetailsPage
  const room = {
    id: haven.uuid_id,
    uuid_id: haven.uuid_id,
    name: haven.haven_name,
    price: `₱${haven.six_hour_rate}`,
    pricePerNight: 'per night',
    images: haven.images?.map((img: { url: string }) => img.url) ?? [],
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
    floor: haven.floor,
    sixHourCheckIn: haven.six_hour_check_in,
    sixHourCheckOut: haven.six_hour_check_out,
    tenHourCheckIn: haven.ten_hour_check_in,
    tenHourCheckOut: haven.ten_hour_check_out,
    twentyOneHourCheckIn: haven.twenty_one_hour_check_in,
    twentyOneHourCheckOut: haven.twenty_one_hour_check_out,
    photoTour: transformPhotoTours(haven.photo_tours)
  };

  // Transform recommended rooms
  const recommendations = recommendedRooms.map((rec) => ({
    id: rec.uuid_id,
    uuid_id: rec.uuid_id,
    name: rec.haven_name,
    price: `₱${rec.six_hour_rate}`,
    pricePerNight: 'per night',
    images: rec.images?.map((img: { url: string }) => img.url) ?? [],
    rating: rec.rating ?? 4.5,
    reviews: rec.review_count ?? 0,
    capacity: rec.capacity,
    amenities: Object.entries(rec.amenities || {})
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    description: rec.description,
    fullDescription: rec.full_description || rec.description,
    beds: rec.beds,
    roomSize: rec.room_size,
    location: rec.location,
    tower: rec.tower,
    floor: rec.floor,
    sixHourCheckIn: rec.six_hour_check_in,
    sixHourCheckOut: rec.six_hour_check_out,
    tenHourCheckIn: rec.ten_hour_check_in,
    tenHourCheckOut: rec.ten_hour_check_out,
    twentyOneHourCheckIn: rec.twenty_one_hour_check_in,
    twentyOneHourCheckOut: rec.twenty_one_hour_check_out,
    photoTour: transformPhotoTours(rec.photo_tours)
  }));

  return <RoomsDetailsPage room={room} onBack={handleBack} recommendedRooms={recommendations} />;
}

