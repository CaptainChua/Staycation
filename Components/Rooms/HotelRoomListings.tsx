"use client";

import { useState } from "react";
import RoomCard from "./RoomCard";
import { SlidersHorizontal } from "lucide-react";
import { useGetHavensQuery } from "@/redux/api/roomApi";

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
  photoTour?: {
    livingArea?: string[];
    kitchenette?: string[];
    diningArea?: string[];
    fullBathroom?: string[];
    garage?: string[];
    exterior?: string[];
    pool?: string[];
    bedroom?: string[];
    additional?: string[];
  };
  youtubeUrl?: string;
}

interface HotelRoomListingsProps {
  initialHavens : any[];
}

const HotelRoomListings = ({ initialHavens  }: HotelRoomListingsProps) => {
  const { data, isLoading, isError } = useGetHavensQuery({});
  const [sortBy, setSortBy] = useState<string>("recommended");
  // const [rooms] = useState<Room[]>([
  //   {
  //     id: "1",
  //     name: "6-Hour Short Stay",
  //     price: "₱999",
  //     pricePerNight: "6 hours",
  //     images: [
  //       "/Images/haven_9_Living Area_haven_5_jpg_30.jpg",
  //       "/Images/haven9_Living_Area_haven_4_1763025826_3659.jpg",
  //       "/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg",
  //     ],
  //     rating: 4.8,
  //     reviews: 245,
  //     capacity: 2,
  //     amenities: ["WiFi", "AC", "TV", "Comfortable Bed"],
  //     description:
  //       "Perfect for a quick rest or day stay with all essential amenities.",
  //     fullDescription:
  //       "Our 6-Hour Short Stay is ideal for travelers needing a quick rest or day stay. Enjoy comfortable accommodations with all modern amenities in a cozy setting at Haven 9, Tower A.",
  //     beds: "Queen Size Bed",
  //     roomSize: "28 sq.m",
  //     location: "Haven 9",
  //     tower: "Tower A",
  //     photoTour: {
  //       livingArea: [
  //         "/Images/haven_9_Living Area_haven_5_jpg_30.jpg",
  //         "/Images/haven9_Living_Area_haven_4_1763025826_3659.jpg",
  //         "/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg",
  //       ],
  //       kitchenette: [
  //         "/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg",
  //       ],
  //       fullBathroom: [
  //         "/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg",
  //       ],
  //       bedroom: [
  //         "/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg",
  //       ],
  //     },
  //     youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  //   },
  //   {
  //     id: "2",
  //     name: "10-Hour Extended Stay",
  //     price: "₱1,599",
  //     pricePerNight: "10 hours",
  //     images: [
  //       "/Images/haven_9_Living Area_haven_5_jpg_31.jpg",
  //       "/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg",
  //       "/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg",
  //     ],
  //     rating: 4.9,
  //     reviews: 189,
  //     capacity: 2,
  //     amenities: ["WiFi", "AC", "Kitchen", "Living Area"],
  //     description:
  //       "Extended stay option with kitchenette and comfortable living space.",
  //     fullDescription:
  //       "Our 10-Hour Extended Stay offers more time to relax and unwind. Features a kitchenette and spacious living area, perfect for those who need a longer stay at Haven 67, Tower A.",
  //     beds: "King Size Bed",
  //     roomSize: "35 sq.m",
  //     location: "Haven 67",
  //     tower: "Tower A",
  //     photoTour: {
  //       livingArea: [
  //         "/Images/haven_9_Living Area_haven_5_jpg_31.jpg",
  //         "/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg",
  //       ],
  //       kitchenette: [
  //         "/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg",
  //       ],
  //       diningArea: [
  //         "/Images/haven_9_Dining Area_haven_7_jpg_35.jpg",
  //       ],
  //       garage: [
  //         "/Images/haven_9_Garage_haven_4_jpg_37.jpg",
  //       ],
  //     },
  //     youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  //   },
  //   {
  //     id: "3",
  //     name: "21-Hour Full Day",
  //     price: "₱1,799",
  //     pricePerNight: "21 hours",
  //     images: [
  //       "/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg",
  //       "/Images/haven_9_Dining Area_haven_7_jpg_35.jpg",
  //       "/Images/haven9_Pool_Black_and_Orange_Illustrative_Happy_Halloween_Instagram_Post_1763025712_1833.jpg",
  //     ],
  //     rating: 5,
  //     reviews: 312,
  //     capacity: 3,
  //     amenities: ["WiFi", "AC", "Kitchen", "Dining Area"],
  //     description:
  //       "Almost a full day experience with premium amenities and spacious layout.",
  //     fullDescription:
  //       "Enjoy 21 hours of comfort in our spacious haven. Features full kitchen, dining area, and modern furnishings perfect for a full day stay at Haven 1, Tower D.",
  //     beds: "1 King + 1 Single Bed",
  //     roomSize: "45 sq.m",
  //     location: "Haven 1",
  //     tower: "Tower D",
  //     photoTour: {
  //       livingArea: [
  //         "/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg",
  //         "/Images/haven_9_Living Area_haven_5_jpg_30.jpg",
  //       ],
  //       diningArea: [
  //         "/Images/haven_9_Dining Area_haven_7_jpg_35.jpg",
  //       ],
  //       pool: [
  //         "/Images/haven9_Pool_Black_and_Orange_Illustrative_Happy_Halloween_Instagram_Post_1763025712_1833.jpg",
  //       ],
  //       exterior: [
  //         "/Images/haven_9_Exterior_haven_5_jpg_38.jpg",
  //       ],
  //       garage: [
  //         "/Images/haven_9_Garage_haven_4_jpg_37.jpg",
  //       ],
  //       fullBathroom: [
  //         "/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg",
  //       ],
  //     },
  //     youtubeUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
  //   },
  //   {
  //     id: "4",
  //     name: "Weekday Special",
  //     price: "₱1,999",
  //     pricePerNight: "Mon-Thu",
  //     images: [
  //       "/Images/haven_9_Living Area_haven_5_jpg_30.jpg",
  //       "/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg",
  //       "/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg",
  //     ],
  //     rating: 4.6,
  //     reviews: 567,
  //     capacity: 2,
  //     amenities: ["WiFi", "AC", "Workstation", "Comfortable Bed"],
  //     description:
  //       "Perfect weekday rate for business travelers and mid-week getaways.",
  //     fullDescription:
  //       "Our Weekday Special offers the best value from Monday to Thursday. Ideal for business travelers with a comfortable workstation and all essential amenities at Haven 2, Tower D.",
  //     beds: "Queen Bed",
  //     roomSize: "30 sq.m",
  //     location: "Haven 2",
  //     tower: "Tower D",
  //   },
  //   {
  //     id: "5",
  //     name: "Weekend Haven",
  //     price: "₱2,499",
  //     pricePerNight: "Fri-Sat",
  //     images: [
  //       "/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg",
  //       "/Images/haven_9_Dining Area_haven_7_jpg_35.jpg",
  //       "/Images/haven_9_Garage_haven_4_jpg_37.jpg",
  //     ],
  //     rating: 4.7,
  //     reviews: 421,
  //     capacity: 2,
  //     amenities: ["WiFi", "AC", "Premium Bedding", "Entertainment"],
  //     description:
  //       "Weekend special rate with premium amenities for a perfect getaway.",
  //     fullDescription:
  //       "Make the most of your weekend with our Friday-Saturday special. Features premium bedding, entertainment options, and modern amenities at Haven 3, Tower D.",
  //     beds: "King Size Bed",
  //     roomSize: "32 sq.m",
  //     location: "Haven 3",
  //     tower: "Tower D",
  //   },
  //   {
  //     id: "6",
  //     name: "Multi-Day Suite",
  //     price: "₱1,899",
  //     pricePerNight: "per night",
  //     images: [
  //       "/Images/haven_9_Exterior_haven_5_jpg_38.jpg",
  //       "/Images/haven9_Pool_Black_and_Orange_Illustrative_Happy_Halloween_Instagram_Post_1763025712_1833.jpg",
  //       "/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg",
  //     ],
  //     rating: 5,
  //     reviews: 98,
  //     capacity: 4,
  //     amenities: ["WiFi", "AC", "Full Kitchen", "Living Room", "Pool Access"],
  //     description:
  //       "Perfect for extended stays with custom rates and flexible schedules.",
  //     fullDescription:
  //       "Our Multi-Day Suite is designed for guests planning longer stays. Enjoy spacious accommodations with full kitchen, living room, and pool access. Custom rates available for extended bookings at Haven 4, Tower D.",
  //     beds: "1 King + 2 Single Beds",
  //     roomSize: "50 sq.m",
  //     location: "Haven 4",
  //     tower: "Tower D",
  //   },
  //   {
  //     id: "7",
  //     name: "Luxury Haven 5",
  //     price: "₱2,299",
  //     pricePerNight: "per night",
  //     images: [
  //       "/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg",
  //       "/Images/haven_9_Dining Area_haven_7_jpg_35.jpg",
  //       "/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg",
  //     ],
  //     rating: 4.9,
  //     reviews: 156,
  //     capacity: 3,
  //     amenities: ["WiFi", "AC", "Kitchenette", "Dining Area", "Smart TV"],
  //     description:
  //       "Modern luxury haven with premium furnishings and smart home features.",
  //     fullDescription:
  //       "Experience modern luxury at Haven 5. Features smart home technology, premium furnishings, and a fully equipped kitchenette for your convenience at Tower D.",
  //     beds: "1 King + 1 Queen Bed",
  //     roomSize: "42 sq.m",
  //     location: "Haven 5",
  //     tower: "Tower D",
  //   },
  //   {
  //     id: "8",
  //     name: "Family Haven 6",
  //     price: "₱2,799",
  //     pricePerNight: "per night",
  //     images: [
  //       "/Images/haven_9_Living Area_haven_5_jpg_31.jpg",
  //       "/Images/haven9_Living_Area_haven_4_1764219962_3222.jpg",
  //       "/Images/haven9_Full_Bathroom_haven_7_1763025826_8427.jpg",
  //     ],
  //     rating: 4.8,
  //     reviews: 203,
  //     capacity: 5,
  //     amenities: ["WiFi", "AC", "Full Kitchen", "2 Bathrooms", "Kids Area"],
  //     description:
  //       "Spacious family haven with multiple rooms and kid-friendly amenities.",
  //     fullDescription:
  //       "Perfect for families, Haven 6 offers spacious accommodations with separate kids area, two bathrooms, and full kitchen facilities at Tower D.",
  //     beds: "2 King Beds + 1 Single",
  //     roomSize: "60 sq.m",
  //     location: "Haven 6",
  //     tower: "Tower D",
  //   },
  //   {
  //     id: "9",
  //     name: "Premium Haven 7",
  //     price: "₱2,199",
  //     pricePerNight: "per night",
  //     images: [
  //       "/Images/haven9_Pool_Black_and_Orange_Illustrative_Happy_Halloween_Instagram_Post_1763025712_1833.jpg",
  //       "/Images/haven_9_Garage_haven_4_jpg_37.jpg",
  //       "/Images/haven9_Living_Area_haven_7_1764217597_1817.jpg",
  //     ],
  //     rating: 4.7,
  //     reviews: 178,
  //     capacity: 2,
  //     amenities: ["WiFi", "AC", "Pool View", "Balcony", "Mini Bar"],
  //     description:
  //       "Premium room with stunning pool views and private balcony.",
  //     fullDescription:
  //       "Enjoy breathtaking pool views from your private balcony at Haven 7. Features modern amenities and a mini bar for your convenience at Tower D.",
  //     beds: "King Size Bed",
  //     roomSize: "38 sq.m",
  //     location: "Haven 7",
  //     tower: "Tower D",
  //   },
  //   {
  //     id: "10",
  //     name: "Cozy Haven 8",
  //     price: "₱1,699",
  //     pricePerNight: "per night",
  //     images: [
  //       "/Images/haven_9_Living Area_haven_5_jpg_30.jpg",
  //       "/Images/haven9_Kitchenette_haven_7_1763025826_3190.jpg",
  //       "/Images/haven9_Living_Area_haven_4_1763025826_3659.jpg",
  //     ],
  //     rating: 4.6,
  //     reviews: 289,
  //     capacity: 2,
  //     amenities: ["WiFi", "AC", "Kitchenette", "Work Desk"],
  //     description:
  //       "Comfortable and affordable haven perfect for couples and solo travelers.",
  //     fullDescription:
  //       "Haven 8 offers great value with modern comforts. Features a kitchenette and work desk, ideal for both leisure and business stays at Tower D.",
  //     beds: "Queen Bed",
  //     roomSize: "30 sq.m",
  //     location: "Haven 8",
  //     tower: "Tower D",
  //   },
  // ]);

  const rooms: Room[] = initialHavens.map((haven: any) => ({
    id: haven.uuid_id ?? haven.id,
    name: haven.haven_name ?? haven.name ?? "Unnamed Haven",
    price: `₱${haven.price ?? "N/A"}`,
    pricePerNight: haven.stay_type ?? "per night",
    images: haven.images?.map((img: any) => img.url) ?? [],
    rating: haven.rating ?? 4.5,
    reviews: haven.review_count ?? 0,
    capacity: haven.capacity ?? 2,
    amenities: haven.amenities ?? [],
    description: haven.description ?? "",
    fullDescription: haven.full_description,
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
  })) ?? [];

  return (
    <div className="min-h-screen bg-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Available Rooms Text */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Available Rooms
          </h2>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SlidersHorizontal className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer hover:border-gray-400 transition-all duration-300 text-sm sm:text-base"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rating</option>
              <option value="capacity">Capacity</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-20 text-gray-500">
            Loading rooms...
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-500">
              Failed to load rooms
          </div>
        )}

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {rooms.map((room, index) => (
            <div
              key={room.id}
              className="animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <RoomCard room={room} mode="browse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HotelRoomListings;
