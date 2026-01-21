"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User, Mail, Calendar, Shield, Edit } from "lucide-react";
import SidebarLayout from "@/Components/SidebarLayout";
import LoadingAnimation from "@/Components/LoadingAnimation";
import Image from "next/image";
import Link from "next/link";

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
      icon: <User className="w-5 h-5 text-brand-primary" />,
      label: "Full Name",
      value: session.user.name || "Not provided",
    },
    {
      icon: <Mail className="w-5 h-5 text-brand-primary" />,
      label: "Email Address",
      value: session.user.email || "Not provided",
    },
    {
      icon: <Calendar className="w-5 h-5 text-brand-primary" />,
      label: "Member Since",
      value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
    },
    {
      icon: <Shield className="w-5 h-5 text-brand-primary" />,
      label: "Account Status",
      value: "Active",
    },
  ];

  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            My Profile
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl mx-auto">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-brand-primary h-32 relative">
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
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white/80 flex items-center justify-center">
                  <User className="w-16 h-16 text-brand-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div className="mb-4 md:mb-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {session.user.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{session.user.email}</p>
              </div>
              <Link 
                href="/profile/edit"
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>

            {/* User Information Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {userInfo.map((info, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {info.icon}
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {info.label}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 ml-8">{info.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Booking History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-brand-primary/10">
                <Calendar className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Booking History
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">View your past and upcoming reservations</p>
            <Link 
              href="/bookings"
              className="inline-block px-6 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-medium rounded-lg transition-colors"
            >
              View Bookings
            </Link>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-brand-primary/10">
                <Shield className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Preferences
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Manage your account settings and preferences</p>
            <Link 
              href="/profile/settings"
              className="inline-block px-6 py-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-medium rounded-lg transition-colors"
            >
              Manage Settings
            </Link>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfilePage;