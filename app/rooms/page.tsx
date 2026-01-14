import SearchBarSticky from "@/Components/HeroSection/SearchBarSticky";
import HotelRoomListings from "@/Components/Rooms/HotelRoomListings";
import Footer from "@/Components/Footer";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Staycation Haven | Premium Rooms",
  description: "Browse our premium rooms and havens for your perfect staycation experience",
};

const getAllHavens = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || '';
  const res = await fetch(`${baseUrl}/api/haven`, {
    cache: 'no-cache'
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function RoomsPage() {
  const response = await getAllHavens();
  const havens = response?.data || [];
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <SearchBarSticky />
      {/* Add top padding to account for fixed header + sticky search bar */}
      <div className="pt-[150px] sm:pt-[230px] md:pt-[250px] lg:pt-[270px] bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Welcome Section */}
          <div className="mb-2 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Find Your Perfect <span className="text-brand-primary">Staycation</span>
            </h1>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 sm:px-0">
              Discover our premium havens with world-class amenities. Short stays, extended stays, or your perfect getaway - all at your fingertips.
            </p>
          </div>

          <HotelRoomListings initialHavens={havens}/>
        </div>
      </div>
      <Footer />
    </div>
  )
}