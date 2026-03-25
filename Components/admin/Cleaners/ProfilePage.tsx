"use client";

import { Mail, Phone, MapPin, Calendar, Award, Star, Clock, CheckCircle, TrendingUp, Edit2, X, Save, Camera, Upload, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useUpdateEmployeeMutation } from "@/redux/api/employeeApi";
import toast from "react-hot-toast";

interface EmployeeProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employment_id?: string;
  hire_date?: string;
  role?: string;
  department?: string;
  monthly_salary?: number;
  street_address?: string;
  city?: string;
  zip_code?: string;
  profile_image_url?: string;
  updated_at?: string;
}

interface CleanerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  employeeId?: string;
  department?: string;
  rating?: number;
  profileImage?: string;
}

interface ProfilePageProps {
  cleanerData?: CleanerData;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Not specified";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Not specified";
  }
};

const skeletonPulse = "animate-pulse bg-gray-100 dark:bg-gray-800";

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className={`w-24 h-24 rounded-full ${skeletonPulse}`} />
      <div className="flex-1 space-y-4 w-full">
        <div className={`h-8 w-48 rounded-lg ${skeletonPulse}`} />
        <div className={`h-4 w-32 rounded-lg ${skeletonPulse}`} />
        <div className={`h-4 w-40 rounded-lg ${skeletonPulse}`} />
        <div className={`h-6 w-24 rounded-lg ${skeletonPulse}`} />
      </div>
      <div className={`h-12 w-32 rounded-lg ${skeletonPulse}`} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={`stat-${idx}`} className={`h-32 rounded-lg ${skeletonPulse}`} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div key={`card-${idx}`} className={`h-64 rounded-lg ${skeletonPulse}`} />
      ))}
    </div>
  </div>
);

export default function ProfilePage({ cleanerData }: ProfilePageProps) {
  const { data: session } = useSession();
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
  });
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [workHistory, setWorkHistory] = useState<any[]>([]);
  const [workHistoryPeriod, setWorkHistoryPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(true);
  const [isLoadingWorkHistory, setIsLoadingWorkHistory] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/employees/${session.user.id}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load employee profile");
        }

        const employeeData = payload?.data ?? null;
        setEmployee(employeeData);
        
        // Initialize form data when employee is loaded
        if (employeeData) {
          setFormData({
            firstName: employeeData.first_name || "",
            lastName: employeeData.last_name || "",
            email: employeeData.email || "",
            phone: employeeData.phone || "",
            address: employeeData.street_address || "",
            city: employeeData.city || "",
            zipCode: employeeData.zip_code || "",
          });
          
          // Initialize profile image
          const image = employeeData.profile_image_url || null;
          setProfileImage(image);
          setOriginalProfileImage(image);
          setProfilePreview(null);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load employee profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [session?.user?.id]);

  // Fetch performance stats
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoadingStats(false);
      return;
    }

    const fetchPerformanceStats = async () => {
      try {
        setIsLoadingStats(true);
        const response = await fetch(`/api/admin/cleaners/${session.user.id}/performance`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();
        if (payload.success && payload.data) {
          setPerformanceStats(payload.data);
        }
      } catch (error) {
        console.error("Error fetching performance stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchPerformanceStats();
  }, [session?.user?.id]);

  // Fetch achievements
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoadingAchievements(false);
      return;
    }

    const fetchAchievements = async () => {
      try {
        setIsLoadingAchievements(true);
        const response = await fetch(`/api/admin/cleaners/${session.user.id}/achievements`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();
        if (payload.success && payload.data) {
          setAchievements(payload.data);
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setIsLoadingAchievements(false);
      }
    };

    fetchAchievements();
  }, [session?.user?.id]);

  // Fetch work history
  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoadingWorkHistory(false);
      return;
    }

    const fetchWorkHistory = async () => {
      try {
        setIsLoadingWorkHistory(true);
        const response = await fetch(`/api/admin/cleaners/${session.user.id}/work-history?period=${workHistoryPeriod}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();
        if (payload.success && payload.data) {
          setWorkHistory(payload.data);
        }
      } catch (error) {
        console.error("Error fetching work history:", error);
      } finally {
        setIsLoadingWorkHistory(false);
      }
    };

    fetchWorkHistory();
  }, [session?.user?.id, workHistoryPeriod]);

  const handleSave = async () => {
    if (!employee?.id) {
      toast.error("Employee ID not found");
      return;
    }

    try {
      const updateData: Record<string, string | number | null> = {
        id: employee.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        street_address: formData.address,
        city: formData.city,
        zip_code: formData.zipCode,
      };

      // Include profile image if it changed
      if (profilePreview) {
        updateData.profile_image_url = profilePreview;
      } else if (profileImage === null && originalProfileImage) {
        // User removed the image
        updateData.profile_image_url = null;
      }

      const result = await updateEmployee(updateData).unwrap();

      if (result.success) {
        toast.success("Profile updated successfully!");
        setEmployee(result.data);
        
        // Update profile image state
        const imageUrl = result.data.profile_image_url || null;
        setProfileImage(imageUrl);
        setOriginalProfileImage(imageUrl);
        setProfilePreview(null);
        
        setIsEditing(false);
        
        // Refetch to get updated data
        const response = await fetch(`/api/admin/employees/${employee.id}`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = await response.json();
        if (payload?.data) {
          setEmployee(payload.data);
          const updatedImage = payload.data.profile_image_url || null;
          setProfileImage(updatedImage);
          setOriginalProfileImage(updatedImage);
        }
        
        // Dispatch custom event to notify other components (like CleanersDashboard) to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { employeeId: employee.id } 
          }));
        }
      }
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data &&
        typeof error.data.error === 'string'
        ? error.data.error
        : error instanceof Error
        ? error.message
        : "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfilePreview(null);
    setProfileImage(null);
  };

  const handleCancel = () => {
    if (employee) {
      setFormData({
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        address: employee.street_address || "",
        city: employee.city || "",
        zipCode: employee.zip_code || "",
      });
      
      // Reset profile image
      setProfileImage(originalProfileImage);
      setProfilePreview(null);
    }
    setIsEditing(false);
  };

  const profile = useMemo(() => {
    if (employee) {
      const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
      const address = [employee.street_address, employee.city, employee.zip_code]
        .filter(Boolean)
        .join(", ") || "Not specified";
      
      // Use preview if available, otherwise use current image
      const currentImage = profilePreview || profileImage || employee.profile_image_url;
      
      // Use dynamic rating from performance stats if available
      const dynamicRating = performanceStats?.averageRating || cleanerData?.rating || 4.8;
      
      return {
        name: fullName || cleanerData?.name || "Unknown",
        email: employee.email || cleanerData?.email || "Not specified",
        phone: employee.phone || cleanerData?.phone || "Not specified",
        address: address,
        joinDate: formatDate(employee.hire_date) || cleanerData?.joinDate || "Not specified",
        employeeId: employee.employment_id || cleanerData?.employeeId || "Not assigned",
        department: employee.department || cleanerData?.department || "Not specified",
        rating: dynamicRating,
        profileImage: currentImage || undefined,
      };
    }
    return cleanerData ? {
      ...cleanerData,
      profileImage: cleanerData.profileImage || undefined,
    } : {
    name: "Maria Santos",
    email: "maria.santos@staycation.com",
    phone: "+63 912 345 6789",
    address: "Manila, Philippines",
    joinDate: "January 15, 2024",
    employeeId: "CLN-2024-001",
    department: "Housekeeping",
      rating: performanceStats?.averageRating || 4.8,
      profileImage: undefined,
  };
  }, [employee, cleanerData, profilePreview, profileImage, performanceStats]);

  // Dynamic stats from API
  const stats = useMemo(() => {
    if (!performanceStats) {
      return [
    {
      label: "Tasks Completed",
          value: "0",
          change: "0%",
      color: "bg-green-500",
      icon: CheckCircle,
    },
    {
      label: "Average Rating",
          value: "0.0",
          change: "0",
      color: "bg-yellow-500",
      icon: Star,
    },
    {
      label: "On-Time Rate",
          value: "0%",
          change: "0%",
      color: "bg-brand-primary",
      icon: Clock,
    },
    {
      label: "Performance",
          value: "Good",
          change: "Top 50%",
      color: "bg-purple-500",
      icon: TrendingUp,
    },
  ];
    }

    return [
    {
        label: "Tasks Completed",
        value: performanceStats.tasksCompleted?.toString() || "0",
        change: performanceStats.tasksCompletedChange || "0%",
        color: "bg-green-500",
        icon: CheckCircle,
    },
    {
        label: "Average Rating",
        value: performanceStats.averageRating?.toFixed(1) || "0.0",
        change: performanceStats.ratingChange || "0",
        color: "bg-yellow-500",
        icon: Star,
      },
      {
        label: "On-Time Rate",
        value: `${performanceStats.onTimeRate || 0}%`,
        change: performanceStats.onTimeRateChange || "0%",
        color: "bg-brand-primary",
      icon: Clock,
    },
    {
        label: "Performance",
        value: performanceStats.performance || "Good",
        change: performanceStats.performanceChange || "Top 50%",
        color: "bg-purple-500",
        icon: TrendingUp,
    },
  ];
  }, [performanceStats]);

  // Map achievement icons
  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "Award":
        return Award;
      case "Clock":
        return Clock;
      case "Star":
        return Star;
      default:
        return Award;
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage your profile information
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View and manage your profile information
        </p>
      </div>

      {isLoading ? (
        <ProfileSkeleton />
      ) : (
        <>
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {profilePreview ? (
                    <Image
                      src={profilePreview}
                      alt={profile.name || "Profile image"}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt={profile.name || "Profile image"}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      key={`${profile.profileImage}-${employee?.updated_at || ''}`}
                    />
                  ) : (
                    <span>{((profile.name || 'Unknown') as string).split(" ").map((n) => n[0]).join("")}</span>
                  )}
                </div>
                {isEditing && (
                  <div className="absolute bottom-0 right-0">
                    <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg transition-colors flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
                {isEditing && (profilePreview || profile.profileImage) && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
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
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancel}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              ))
            ) : (
              stats.map((stat, i) => {
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
              })
            )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Contact Information
          </h2>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Recent Achievements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            Recent Achievements
          </h2>
          {isLoadingAchievements ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                  <div className="w-9 h-9 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No achievements yet</p>
            </div>
          ) : (
          <div className="space-y-3">
              {achievements.map((achievement, index) => {
                const AchievementIcon = getAchievementIcon(achievement.icon);
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
          )}
        </div>
      </div>

      {/* Work History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Work History
        </h2>
          <div className="relative">
            <select
              value={workHistoryPeriod}
              onChange={(e) => setWorkHistoryPeriod(e.target.value as "weekly" | "monthly" | "yearly")}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
        {isLoadingWorkHistory ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="flex gap-6">
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : workHistory.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No work history available</p>
          </div>
        ) : (
        <div className="space-y-3">
            {workHistory.map((period, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {period.period}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasks</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{period.tasks}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <p className="font-bold text-gray-800 dark:text-gray-100">{period.rating}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
