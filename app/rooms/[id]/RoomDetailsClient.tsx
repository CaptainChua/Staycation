"use client";

import { useRouter } from "next/navigation";
import RoomsDetailsPage from "@/Components/Rooms/RoomsDetailsPage";

interface RoomDetailsClientProps {
  room: any;
}

export default function RoomDetailsClient({ room: haven }: RoomDetailsClientProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/rooms');
  };

  // Transform haven data to room format expected by RoomsDetailsPage
  const room = {
    id: haven.uuid_id,
    name: haven.haven_name,
    price: `₱${haven.six_hour_rate}`,
    pricePerNight: 'per night',
    images: haven.images?.map((img: any) => img.url) ?? [],
    rating: haven.rating ?? 4.5,
    reviews: haven.review_count ?? 0,
    capacity: haven.capacity,
    amenities: Object.entries(haven.amenities || {})
      .filter(([_, value]) => value === true)
      .map(([key]) => key),
    description: haven.description,
    fullDescription: haven.full_description || haven.description,
    beds: haven.beds,
    roomSize: haven.room_size,
    location: haven.location,
    tower: haven.tower,
    photoTour: haven.photo_tours
      ? haven.photo_tours.reduce((acc: any, item: any) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item.url);
          return acc;
        }, {})
      : {},
    youtubeUrl: haven.youtube_url,
  };

  return <RoomsDetailsPage room={room} onBack={handleBack} />;
}

