import SearchBarSticky from "@/Components/HeroSection/SearchBarSticky";
import HotelRoomListings from "@/Components/Rooms/HotelRoomListings";
import Footer from "@/Components/Footer";
import { Metadata } from 'next';
import { Sparkles, Award, Star, Headphones } from 'lucide-react';

export const metadata: Metadata = {
  title: "Staycation Haven PH | Premium Rooms",
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
      <div className="pt-[150px] sm:pt-[230px] md:pt-[250px] lg:pt-[270px] bg-white dark:bg-gray-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Welcome Section with enhanced design */}
          <div className="mb-2 sm:mb-8 text-center relative">            
            <div className="relative">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 relative">
                Find Your Perfect <span className="text-brand-primary relative">
                  Staycation
                  {/* Underline decoration */}
                  <svg className="absolute -bottom-1 left-0 w-full h-3" viewBox="0 0 100 12" preserveAspectRatio="none">
                    <path d="M0,6 Q25,12 50,6 T100,6" fill="url(#gradient)" opacity="0.3"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              
              {/* Decorative line */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-brand-primary/20"></div>
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-brand-primary/20"></div>
              </div>
            </div>
            
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4 sm:px-0 leading-relaxed">
              Discover our premium havens with world-class amenities. Short stays, extended stays, or your perfect getaway - all at your fingertips.
            </p>
            
            {/* Stats section */}
            <div className="flex justify-center gap-8 mt-6 sm:mt-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  <div className="text-2xl sm:text-3xl font-bold text-brand-primary">{havens.length}</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Premium Havens</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  <div className="text-2xl sm:text-3xl font-bold text-brand-primary">4.8</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Headphones className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
                  <div className="text-2xl sm:text-3xl font-bold text-brand-primary">24/7</div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Support</div>
              </div>
            </div>
          </div>

          <HotelRoomListings initialHavens={havens}/>
        </div>
      </div>
      <Footer />
    </div>
  )
}