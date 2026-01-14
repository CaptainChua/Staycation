"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User, Mail, Calendar, Shield, Edit } from "lucide-react";
import Footer from "@/Components/Footer";
import LoadingAnimation from "@/Components/LoadingAnimation";
import Image from "next/image";

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingAnimation />;
  }

  if (!session?.user) {
    return null;
  }

  const userInfo = [
    {
      icon: <User className="w-5 h-5 text-orange-500" />,
      label: "Full Name",
      value: session.user.name || "Not provided",
    },
    {
      icon: <Mail className="w-5 h-5 text-orange-500" />,
      label: "Email Address",
      value: session.user.email || "Not provided",
    },
    {
      icon: <Calendar className="w-5 h-5 text-orange-500" />,
      label: "Member Since",
      value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
    },
    {
      icon: <Shield className="w-5 h-5 text-orange-500" />,
      label: "Account Status",
      value: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-in fade-in slide-in-from-bottom duration-700">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                My Profile
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Manage your account information and preferences
            </p>
          </div>
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom duration-700">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-32 relative">
              <div className="absolute -bottom-16 left-8">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={128}
                    height={128}
                    className="rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-20 px-8 pb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {session.user.name}
                  </h2>
                  <p className="text-gray-600">{session.user.email}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              {/* User Information Grid */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {userInfo.map((info, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {info.icon}
                      <span className="text-sm font-semibold text-gray-600">
                        {info.label}
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium ml-8">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Booking History */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-left duration-700">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-orange-500" />
                Booking History
              </h3>
              <p className="text-gray-600 mb-4">View your past and upcoming reservations</p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 text-orange-700 font-medium rounded-lg transition-all duration-300">
                View Bookings
              </button>
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right duration-700">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-orange-500" />
                Preferences
              </h3>
              <p className="text-gray-600 mb-4">Manage your account settings and preferences</p>
              <button className="w-full px-4 py-2 bg-gradient-to-r from-orange-100 to-yellow-100 hover:from-orange-200 hover:to-yellow-200 text-orange-700 font-medium rounded-lg transition-all duration-300">
                Manage Settings
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfilePage;