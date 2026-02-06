"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RoomCard from "@/Components/Rooms/RoomCard";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import SearchBarSticky from "@/Components/HeroSection/SearchBarSticky";
import Footer from "@/Components/Footer";

interface Room {
  id: string;
  name: string;
  price: string;
  pricePerNight: string;
  images: string[];
  rating: number;
  reviews: number;
  capacity: number;
  amenities: string[];
  description: string;
  fullDescription?: string;
  beds?: string;
  roomSize?: string;
  location?: string;
  tower?: string;
  floor?: string;
  photoTour?: Record<string, string[]>;
  youtubeUrl?: string;
}

interface Haven {
  uuid_id?: string;
  id?: string;
  haven_name?: string;
  name?: string;
  six_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  images?: Array<{ image_url: string }>;
  rating?: number;
  review_count?: number;
  capacity?: number;
  amenities?: Record<string, boolean>;
  description?: string;
  full_description?: string;
  beds?: string;
  room_size?: string;
  location?: string;
  tower?: string;
  floor?: string;
  photo_tours?: Array<{ category: string; url: string }>;
  youtube_url?: string;
}

interface HavenDetailsClientProps {
  havenId: string;
  havens: Haven[];
}

const HavenDetailsClient = ({ havenId, havens }: HavenDetailsClientProps) => {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<string>("recommended");

  const rooms: Room[] = havens.map((haven: Haven) => ({
    id: haven.uuid_id ?? haven.id ?? '',
    name: haven.haven_name ?? haven.name ?? "Unnamed Haven",
    price: `₱${haven.six_hour_rate ?? haven.weekday_rate ?? haven.weekend_rate ?? "N/A"}`,
    pricePerNight: "per night",
    images: haven.images?.map((img) => img.image_url) ?? [],
    rating: haven.rating ?? 4.5,
    reviews: haven.review_count ?? 0,
    capacity: haven.capacity ?? 2,
    amenities: Object.entries(haven.amenities || {})
      .filter(([, value]) => value === true)
      .map(([key]) => key),
    description: haven.description ?? "",
    fullDescription: haven.full_description,
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
    photoTour: haven.photo_tours
      ? haven.photo_tours.reduce((acc: Record<string, string[]>, item) => {
          acc[item.category] = acc[item.category] || [];
          acc[item.category].push(item.image_url);
          return acc;
        }, {} as Record<string, string[]>)
      : {},
    youtubeUrl: haven.youtube_url,
  }));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SearchBarSticky />
      <div className="pt-[220px] sm:pt-[240px] md:pt-[260px] lg:pt-[280px] bg-white dark:bg-gray-900">
        <div className="max-w-[2520px] mx-auto px-4 sm:px-6 lg:px-20 xl:px-20">
          {/* Back Button */}
          <button
            onClick={() => router.push('/rooms')}
            className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to all rooms</span>
          </button>

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            {/* Haven Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Haven {havenId}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
              </p>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500">
                <SlidersHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
              </button>

              {/* Price Range Filter */}
              <select className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                <option>Price Range</option>
                <option>Under ₱2,000</option>
                <option>₱2,000 - ₱5,000</option>
                <option>₱5,000 - ₱10,000</option>
                <option>Above ₱10,000</option>
              </select>

              {/* Sort By Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-8 mb-12">
            {rooms.map((room) => (
              <div key={room.id}>
                <RoomCard room={room} mode="browse" />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {rooms.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                No rooms found for Haven {havenId}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HavenDetailsClient;
