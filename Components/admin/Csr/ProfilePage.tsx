"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, User, Mail, Phone, Calendar, MapPin, Briefcase, DollarSign, Edit2, Save, X, Camera, Shield, Check } from "lucide-react";
import Image from "next/image";

interface AdminUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  picture?: string;
  image?: string | null;
}

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
}

interface ProfilePageProps {
  user: AdminUser | null | undefined;
  onClose: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return "Not specified";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "Not specified";
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numericValue)) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export default function ProfilePage({ user, onClose }: ProfilePageProps) {
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmployeeProfile>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'contact'>('personal');

  useEffect(() => {
    if (!user?.id) return;

    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/employees/${user.id}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load employee profile");
        }

        setEmployee(payload?.data ?? null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load employee profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [user?.id]);

  const displayName = useMemo(() => {
    if (employee) {
      return `${employee.first_name} ${employee.last_name}`.trim();
    }
    return user?.name ?? "Not specified";
  }, [employee, user?.name]);

  const profileImage = employee?.profile_image_url || user?.picture || user?.image || "";
  const contactEmail = employee?.email || user?.email || "Not specified";
  const employmentId = employee?.employment_id || "Not assigned";
  const roleLabel = employee?.role || user?.role || "CSR Staff";
  const department = employee?.department || "Not specified";
  const phone = employee?.phone || "Not specified";
  const hireDate = formatDate(employee?.hire_date);
  const salary = formatCurrency(employee?.monthly_salary);
  const address =
    [employee?.street_address, employee?.city, employee?.zip_code].filter(Boolean).join(", ") ||
    "Not specified";

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      first_name: employee?.first_name,
      last_name: employee?.last_name,
      email: employee?.email,
      phone: employee?.phone || '',
      street_address: employee?.street_address || '',
      city: employee?.city || '',
      zip_code: employee?.zip_code || '',
    });
  };

  const handleSave = async () => {
    if (!employee?.id) return;
    
    try {
      setSaveStatus('saving');
      
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedData = await response.json();
      setEmployee(updatedData.data);
      setIsEditing(false);
      setSaveStatus('success');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal and professional information</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Profile updated successfully</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Failed to update profile</span>
            </div>
          )}
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-brand-primary to-brand-primaryDark h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full p-1">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={displayName}
                      width={120}
                      height={120}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-primary to-brand-primaryDark flex items-center justify-center">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-2 right-2 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                <p className="text-gray-600 dark:text-gray-400">{roleLabel}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {department}
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    {employmentId}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              </div>
            ) : (
              <>
                {/* Personal Information Tab */}
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.first_name || ''}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{employee?.first_name || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.last_name || ''}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{employee?.last_name || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Information Tab */}
                {activeTab === 'professional' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Briefcase className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{roleLabel}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hire Date</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{hireDate}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Salary</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{salary}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Shield className="w-5 h-5 text-brand-primary" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employment ID</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{employmentId}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information Tab */}
                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{contactEmail}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editForm.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.street_address || ''}
                            onChange={(e) => handleInputChange('street_address', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{employee?.street_address || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.city || ''}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{employee?.city || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP Code</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.zip_code || ''}
                            onChange={(e) => handleInputChange('zip_code', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{employee?.zip_code || 'Not specified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}