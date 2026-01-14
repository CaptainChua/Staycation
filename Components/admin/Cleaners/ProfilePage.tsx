"use client";

import { Mail, Phone, MapPin, Calendar, Award, Star, Clock, CheckCircle, TrendingUp } from "lucide-react";

interface CleanerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  employeeId?: string;
  department?: string;
  rating?: number;
}

interface ProfilePageProps {
  cleanerData?: CleanerData;
}

export default function ProfilePage({ cleanerData }: ProfilePageProps) {
  const profile = cleanerData || {
    name: "Maria Santos",
    email: "maria.santos@staycation.com",
    phone: "+63 912 345 6789",
    address: "Manila, Philippines",
    joinDate: "January 15, 2024",
    employeeId: "CLN-2024-001",
    department: "Housekeeping",
    rating: 4.8,
  };

  const stats = [
    {
      label: "Tasks Completed",
      value: "248",
      change: "+12%",
      color: "bg-green-500",
      icon: CheckCircle,
    },
    {
      label: "Average Rating",
      value: (profile.rating || 0).toFixed(1),
      change: "+0.3",
      color: "bg-yellow-500",
      icon: Star,
    },
    {
      label: "On-Time Rate",
      value: "96%",
      change: "+2%",
      color: "bg-brand-primary",
      icon: Clock,
    },
    {
      label: "Performance",
      value: "Excellent",
      change: "Top 10%",
      color: "bg-purple-500",
      icon: TrendingUp,
    },
  ];

  const recentAchievements = [
    {
      title: "Perfect Week",
      description: "Completed all tasks with 5-star ratings",
      date: "Jan 8, 2026",
      icon: Award,
    },
    {
      title: "Speed Demon",
      description: "Finished 10 tasks ahead of schedule",
      date: "Jan 1, 2026",
      icon: Clock,
    },
    {
      title: "Guest Favorite",
      description: "Received 50 positive reviews",
      date: "Dec 28, 2025",
      icon: Star,
    },
  ];

  const workHistory = [
    { month: "December 2025", tasks: 82, rating: 4.9 },
    { month: "November 2025", tasks: 78, rating: 4.8 },
    { month: "October 2025", tasks: 88, rating: 4.7 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage your profile information
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {((profile.name || 'Unknown') as string).split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {(profile.name || 'Unknown') as string}
            </h2>
            <p className="text-brand-primary font-semibold">{profile.department}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Employee ID: {profile.employeeId}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor((profile.rating || 0) as number)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-2">
                {(profile.rating || 0)} / 5.0
              </span>
            </div>
          </div>
          <button className="bg-brand-primary hover:bg-brand-primaryDark text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Edit Profile
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={i}
              className={`${stat.color} text-white rounded-lg p-6 shadow dark:shadow-gray-900 hover:shadow-lg transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <IconComponent className="w-8 h-8 opacity-50" />
                <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-90 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Contact Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 p-3 rounded-lg">
                <Mail className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 p-3 rounded-lg">
                <Phone className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{profile.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 p-3 rounded-lg">
                <MapPin className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{profile.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 p-3 rounded-lg">
                <Calendar className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{profile.joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Recent Achievements
          </h2>
          <div className="space-y-3">
            {recentAchievements.map((achievement, index) => {
              const AchievementIcon = achievement.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="bg-brand-primary text-white p-2 rounded-lg">
                    <AchievementIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {achievement.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Work History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          Work History
        </h2>
        <div className="space-y-3">
          {workHistory.map((month, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {month.month}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100">{month.tasks}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <p className="font-bold text-gray-800 dark:text-gray-100">{month.rating}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
