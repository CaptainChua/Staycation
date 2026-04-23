"use client";

import { MapPin, Shield, Star, Users, Wifi, Zap } from "lucide-react";
import FeatureCard from "./FeatureCard";

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureSectionMain = () => {
  const features: Feature[] = [
    {
      id: "1",
      icon: <Wifi className="w-10 h-10" />,
      title: "Premium Amenities",
      description: "High-speed WiFi, Netflix, PS4, and Glow Beds in every unit",
    },
    {
      id: "2",
      icon: <MapPin className="w-10 h-10" />,
      title: "Prime Location",
      description:
        "Located in the heart of Quezon City with stunning city views",
    },
    {
      id: "3",
      icon: (
        <div className="flex gap-1">
          <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
          <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
          <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
          <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
          <Star className="w-5 h-5 fill-orange-400 text-orange-400" />
        </div>
      ),
      title: "Exceptional Service",
      description: "24/7 support and concierge services for a perfect stay",
    },
    {
      id: "4",
      icon: <Zap className="w-10 h-10" />,
      title: "Quick Booking",
      description:
        "Easy and instant booking process with flexible cancellation",
    },
    {
      id: "5",
      icon: <Shield className="w-10 h-10" />,
      title: "Safe & Secure",
      description: "Modern security systems and health protocols in place",
    },
    {
      id: "6",
      icon: <Users className="w-10 h-10" />,
      title: "Guest Community",
      description: "Connect with other travelers and share experiences",
    },
  ];
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-in fade-in slide-in-from-top duration-700">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white mb-4">
            Why Choose
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent ml-3">
              Staycation Haven
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Experience the perfect blend of comfort, convenience, and luxury at
            out premium hotel
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>


        <div
          className="mt-16 sm:mt-20 lg:mt-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-2xl p-8 sm:p-12 lg:p-16 text-center animate-in fade-in slide-in-from-bottom duration-700"
          style={{ animationDelay: "1000ms" }}
        >
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready for Your Perfect Staycation?
          </h3>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Book now and enjoyy an unforgettable experience with world class
            amenities and service
          </p>
          <button className="bg-white text-orange-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95 text-lg shadow-lg hover:shadow-lg">
            Book Your Stay Now
          </button>

          {/* Decorative Elements  */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSectionMain;
