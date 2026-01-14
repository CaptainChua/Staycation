"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, Calendar, Shield, Edit, Settings, Clock, MapPin, Save, X } from "lucide-react";
import LoadingAnimation from "@/Components/LoadingAnimation";
import Image from "next/image";
import SidebarLayout from "@/Components/SidebarLayout";

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      const newName = session.user.name || "";
      const newEmail = session.user.email || "";
      
      // Only update if values actually changed to prevent unnecessary re-renders
      setFormData(prev => {
        if (prev.name !== newName || prev.email !== newEmail) {
          return { name: newName, email: newEmail };
        }
        return prev;
      });
    }
  }, [session]);

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

  const quickActions = [
    {
      icon: <Clock className="w-6 h-6 text-brand-primary" />,
      title: "Booking History",
      description: "View your past and upcoming reservations",
      href: "/bookings",
      gradient: "from-brand-primaryLighter to-brand-primarySoft",
    },
    {
      icon: <Settings className="w-6 h-6 text-brand-primary" />,
      title: "Account Settings",
      description: "Manage your account preferences and security",
      href: "/settings",
      gradient: "from-brand-primarySoft to-brand-primaryLighter",
    },
    {
      icon: <MapPin className="w-6 h-6 text-brand-primary" />,
      title: "Saved Locations",
      description: "View your favorite staycation spots",
      href: "/saved-locations",
      gradient: "from-brand-primaryLighter to-brand-primarySoft",
    },
  ];

  return (
    <SidebarLayout>
      {/* Hero Section */}
      <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">My Profile</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Card */}
        <section className="mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header with brand gradient background */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-primaryDark h-32 relative">
              <div className="absolute -bottom-16 left-8">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={128}
                    height={128}
                    className="rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-gradient-to-r from-brand-primary to-brand-primaryDark flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-20 px-8 pb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
                        {session.user.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">{session.user.email}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          // Here you would typically save the data
                          setIsEditing(false);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primaryDark hover:from-brand-primaryDark hover:to-brand-primary text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primaryDark hover:from-brand-primaryDark hover:to-brand-primary text-white rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                {userInfo.map((info, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-gradient-to-br from-brand-primaryLighter to-brand-primarySoft dark:from-gray-700 dark:to-gray-600 hover:shadow-md transition-all duration-300 border border-brand-primarySoft dark:border-gray-600"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {info.icon}
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {info.label}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium ml-8">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    {action.icon}
                    <h4 className="text-lg font-display font-semibold text-gray-900 dark:text-white">
                      {action.title}
                    </h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                    {action.description}
                  </p>
                  <button className="w-full px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-brand-primary dark:text-brand-primary font-medium rounded-lg transition-all duration-300 border border-brand-primary dark:border-brand-primary">
                    {action.title === "Booking History" ? "View Bookings" : 
                     action.title === "Account Settings" ? "Manage Settings" : 
                     "View Locations"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Card */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-brand-primaryLighter dark:bg-gray-700">
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Profile updated</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-brand-primarySoft dark:bg-gray-700">
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">New booking confirmed</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-brand-primaryLighter dark:bg-gray-700">
                <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Account created</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
};

export default ProfilePage;