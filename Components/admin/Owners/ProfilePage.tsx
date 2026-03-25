'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Briefcase, DollarSign, Users, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUpdateEmployeeMutation } from "@/redux/api/employeeApi";

interface EmployeeProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_id: string;
  hire_date: string;
  role: string;
  department?: string;
  monthly_salary?: number;
  street_address?: string;
  city?: string;
  zip_code?: string;
  profile_image_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

interface UserSession {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

const ProfilePage = () => {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalProfileImage, setOriginalProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeId: "",
    role: "",
    department: "",
    hireDate: "",
    salary: "",
    address: "",
    city: "",
    zipCode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  // Fetch employee data from API
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!session?.user) return;

      const userId = (session.user as UserSession)?.id;
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/employees/${userId}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load employee profile");
        }

        const data = payload?.data;
        if (data) {
          setEmployee(data);

          // Update form with fresh data
          setFormData({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || "",
            phone: data.phone || "",
            employeeId: data.employment_id || "",
            role: data.role || "",
            department: data.department || "",
            hireDate: data.hire_date || "",
            salary: data.monthly_salary ? String(data.monthly_salary) : "",
            address: data.street_address || "",
            city: data.city || "",
            zipCode: data.zip_code || "",
            emergencyContactName: data.emergency_contact_name || "",
            emergencyContactPhone: data.emergency_contact_phone || "",
            emergencyContactRelation: data.emergency_contact_relation || "",
          });

          const image = data.profile_image_url || null;
          setProfileImage(image);
          setOriginalProfileImage(image);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch employee data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load profile data";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const userId = (session?.user as UserSession)?.id;
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      // Prepare update data
      const updateData: Record<string, string | number | null> = {
        id: userId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        monthly_salary: formData.salary ? parseFloat(formData.salary) : null,
        street_address: formData.address,
        city: formData.city,
        zip_code: formData.zipCode,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relation: formData.emergencyContactRelation,
      };

      // Only include profile_image_url if it changed
      if (profileImage && profileImage !== originalProfileImage) {
        updateData.profile_image_url = profileImage;
      }

      // Call update mutation
      const result = await updateEmployee(updateData).unwrap();

      // Update session with the data returned from the backend
      const fullName = `${result.data.first_name} ${result.data.last_name}`.trim();

      // Add cache-busting timestamp to image URL
      const imageUrl = result.data.profile_image_url
        ? `${result.data.profile_image_url}?t=${Date.now()}`
        : result.data.profile_image_url;

      await update({
        ...session,
        user: {
          ...session?.user,
          id: result.data.id,
          name: fullName,
          email: result.data.email,
          phone: result.data.phone,
          employment_id: result.data.employment_id,
          hire_date: result.data.hire_date,
          role: result.data.role,
          department: result.data.department,
          monthly_salary: result.data.monthly_salary,
          street_address: result.data.street_address,
          city: result.data.city,
          zip_code: result.data.zip_code,
          emergency_contact_name: result.data.emergency_contact_name,
          emergency_contact_phone: result.data.emergency_contact_phone,
          emergency_contact_relation: result.data.emergency_contact_relation,
          image: imageUrl,
          profile_image_url: imageUrl,
        }
      });

      toast.success("Profile updated successfully!");

      // Force a page reload to update all instances of the profile image
      window.location.reload();

      // Refetch employee data to get fresh data from database
      const response = await fetch(`/api/admin/employees/${userId}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await response.json();
      if (response.ok && payload?.data) {
        const data = payload.data;
        setEmployee(data);

        // Update form with fresh data
        setFormData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          employeeId: data.employment_id || "",
          role: data.role || "",
          department: data.department || "",
          hireDate: data.hire_date || "",
          salary: data.monthly_salary ? String(data.monthly_salary) : "",
          address: data.street_address || "",
          city: data.city || "",
          zipCode: data.zip_code || "",
          emergencyContactName: data.emergency_contact_name || "",
          emergencyContactPhone: data.emergency_contact_phone || "",
          emergencyContactRelation: data.emergency_contact_relation || "",
        });

        const image = data.profile_image_url || null;
        setProfileImage(image);
        setOriginalProfileImage(image);
      }

      setIsEditing(false);
      router.refresh();
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      const errorMessage = error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data &&
        typeof error.data.error === 'string'
        ? error.data.error
        : "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    if (employee) {
      setFormData({
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        employeeId: employee.employment_id || "",
        role: employee.role || "",
        department: employee.department || "",
        hireDate: employee.hire_date || "",
        salary: employee.monthly_salary ? String(employee.monthly_salary) : "",
        address: employee.street_address || "",
        city: employee.city || "",
        zipCode: employee.zip_code || "",
        emergencyContactName: employee.emergency_contact_name || "",
        emergencyContactPhone: employee.emergency_contact_phone || "",
        emergencyContactRelation: employee.emergency_contact_relation || "",
      });
    }
    setProfileImage(originalProfileImage);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-700">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={160}
                  height={160}
                  className="rounded-full object-cover border-4 border-orange-500 shadow-xl"
                />
              ) : (
                <div className="w-40 h-40 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-6xl border-4 border-orange-500 shadow-xl">
                  {formData.firstName?.charAt(0) || session?.user?.name?.charAt(0) || "O"}
                </div>
              )}

              {/* Camera Icon Overlay */}
              {isEditing && (
                <label
                  htmlFor="profile-image"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-8 h-8 text-white" />
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {isEditing && (
              <p className="text-xs text-gray-500 text-center">
                Click image to change
              </p>
            )}
          </div>

          {/* Profile Info Section */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                  {session?.user?.name || "User"}
                </h1>
                <p className="text-gray-500 flex items-center gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
                    {(session?.user as UserSession)?.role || "Owner"}
                  </span>
                </p>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {!isUpdating && <Save className="w-4 h-4" />}
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">First Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                      placeholder="Enter first name"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {formData.firstName || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Last Name</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                      placeholder="Enter last name"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {formData.lastName || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {formData.email || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">
                      {formData.phone || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employment Information Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-orange-500" />
          Employment Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee ID (Read-only) */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Employee ID</p>
              <p className="text-sm font-medium text-gray-800">
                {formData.employeeId || "Not provided"}
              </p>
            </div>
          </div>

          {/* Role (Read-only) */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Role</p>
              <p className="text-sm font-medium text-gray-800">
                {formData.role || "Not provided"}
              </p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Department</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter department"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.department || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Hire Date */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Hire Date</p>
              <p className="text-sm font-medium text-gray-800">
                {formData.hireDate ? new Date(formData.hireDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }) : "Not provided"}
              </p>
            </div>
          </div>

          {/* Monthly Salary */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Monthly Salary</p>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter monthly salary"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.salary ? `₱${parseFloat(formData.salary).toLocaleString()}` : "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Information Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-orange-500" />
          Address Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Street Address */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Street Address</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter street address"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.address || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* City */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">City</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter city"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.city || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Zip Code */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Zip Code</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter zip code"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.zipCode || "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-orange-500" />
          Emergency Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Emergency Contact Name */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Contact Name</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactName: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter contact name"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.emergencyContactName || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Emergency Contact Phone */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Contact Phone</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactPhone: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter contact phone"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.emergencyContactPhone || "Not provided"}
                </p>
              )}
            </div>
          </div>

          {/* Emergency Contact Relation */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Relationship</p>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.emergencyContactRelation}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContactRelation: e.target.value })
                  }
                  className="text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800">
                  {formData.emergencyContactRelation || "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;