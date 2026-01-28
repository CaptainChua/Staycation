"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, User, Mail, Phone, Calendar, MapPin, Briefcase, DollarSign, Edit2, Save, X, Camera, Shield, Check, Key, Eye, EyeOff, Activity, Headphones, FileText, Bell, Settings } from "lucide-react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import toast from "react-hot-toast";

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
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'contact' | 'security'>('personal');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordSaveStatus, setPasswordSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const { update: updateSession } = useSession();

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
  const address = `${employee?.street_address || ''} ${employee?.city || ''} ${employee?.zip_code || ''}`.trim() || "Not specified";

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
    
    // Email validation (only if email is provided)
    if (editForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        toast.error('Please enter a valid email address');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
    }
    
    // Phone validation (if provided)
    if (editForm.phone && editForm.phone.trim() !== '') {
      const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(editForm.phone)) {
        toast.error('Please enter a valid phone number');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
    }
    
    try {
      setSaveStatus('saving');
      setError(null);
      
      // Prepare update data with only changed fields
      const updateData: Partial<EmployeeProfile> = {};
      
      Object.keys(editForm).forEach(key => {
        const field = key as keyof EmployeeProfile;
        const currentValue = employee[field];
        const newValue = editForm[field];
        
        // Compare values (handle string vs number conversions)
        if (currentValue !== newValue) {
          if (field === 'monthly_salary' && newValue) {
            updateData[field] = parseFloat(newValue as string);
          } else {
            updateData[field] = newValue;
          }
        }
      });
      
      // If no changes were made, show message and exit
      if (Object.keys(updateData).length === 0) {
        toast.error('No changes were made');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
      
      console.log('Sending update data:', updateData);
      
      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to update profile');
      }

      const updatedData = await response.json();
      
      // Update local state with new data
      setEmployee(updatedData.data);
      
      // Show success toast
      toast.success('Profile updated successfully');
      
      // Log activity
      try {
        // Get client IP and user agent
        const clientInfo = await fetch('/api/admin/client-info').then(res => res.json()).catch(() => ({}));
        
        await fetch('/api/admin/activity-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employment_id: employee.id,
            action_type: 'update',
            action: `Updated profile information: ${Object.keys(updateData).join(', ')}`,
            details: {
              entity_type: 'employee',
              entity_id: employee.id,
              ip_address: clientInfo.ipAddress,
              user_agent: clientInfo.userAgent,
            },
          }),
        });
      } catch (logError) {
        console.warn('Failed to log activity:', logError);
        // Continue even if logging fails
      }
      
      // Update the user session if name or email changed
      if (updatedData.data.first_name || updatedData.data.last_name || updatedData.data.email) {
        try {
          // Update session with new user information
          await updateSession({
            ...user,
            name: `${updatedData.data.first_name} ${updatedData.data.last_name}`.trim(),
            email: updatedData.data.email,
          });
        } catch (sessionError) {
          console.warn('Failed to update session:', sessionError);
          // Continue even if session update fails
        }
      }
      
      setIsEditing(false);
      setEditForm({});
      setSaveStatus('success');
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
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

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handlePasswordChange = async () => {
    if (!user?.email) return;

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setPasswordSaveStatus('saving');

      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSaveStatus('success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Password changed successfully');
      
      // Log activity
      try {
        // Get client IP and user agent
        const clientInfo = await fetch('/api/admin/client-info').then(res => res.json()).catch(() => ({}));
        
        console.log('🔍 Password change logging data:', {
          employment_id: user?.id,
          action_type: 'update',
          action: 'Changed account password',
          details: {
            entity_type: 'employee',
            entity_id: user?.id,
            ip_address: clientInfo.ipAddress,
            user_agent: clientInfo.userAgent,
          },
        });
        
        const logResponse = await fetch('/api/admin/activity-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            employment_id: user?.id,
            action_type: 'update',
            action: 'Changed account password',
            details: {
              entity_type: 'employee',
              entity_id: user?.id,
              ip_address: clientInfo.ipAddress,
              user_agent: clientInfo.userAgent,
            },
          }),
        });
        
        const logResult = await logResponse.json();
        console.log('🔍 Activity log response:', logResult);
      } catch (logError) {
        console.warn('❌ Failed to log activity:', logError);
        // Continue even if logging fails
      }
      
      setTimeout(() => setPasswordSaveStatus('idle'), 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
      setPasswordSaveStatus('error');
      setTimeout(() => setPasswordSaveStatus('idle'), 3000);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'security', label: 'Security', icon: Key },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-6 bg-white dark:bg-gray-800 shadow dark:shadow-gray-900">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your personal and professional information</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Profile updated successfully</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Failed to update profile</span>
            </div>
          )}
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors text-xs sm:text-sm"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-xs sm:text-sm"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-xs sm:text-sm"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                    Save Changes
                  </>
                )}
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
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
          
          <div className="pt-20 px-4 sm:px-8 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{displayName}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{roleLabel}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{department}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{employmentId}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs sm:text-sm font-medium">
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1 sm:gap-2 py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
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

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
                    
                    {passwordSaveStatus === 'success' && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Password changed successfully</span>
                      </div>
                    )}
                    
                    {passwordSaveStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Failed to change password</span>
                      </div>
                    )}

                    {/* Password Change Section */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-4">
                        <Key className="w-5 h-5 text-brand-primary" />
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h4>
                      </div>
                      
                      <div className="max-w-md space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('current')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 8 characters long</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={handlePasswordChange}
                            disabled={passwordSaveStatus === 'saving'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {passwordSaveStatus === 'saving' ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Changing Password...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4" />
                                Change Password
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Security Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Account Security</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Good</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">Password updated recently</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">Two-factor authentication available</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">Secure login method</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">5 successful logins</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">2 failed attempts</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">1 password change</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Security Best Practices</h4>
                          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Use a strong password with at least 8 characters</li>
                            <li>• Include a mix of letters, numbers, and symbols</li>
                            <li>• Don't reuse passwords from other accounts</li>
                            <li>• Change your password regularly</li>
                            <li>• Enable two-factor authentication when available</li>
                            <li>• Never share your login credentials</li>
                            <li>• Log out from shared devices</li>
                            <li>• Keep your software and browser updated</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">
                          <Headphones className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-300">Contact Support</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">
                          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-300">View Logs</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">
                          <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-300">Alert Settings</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm">
                          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          <span className="text-gray-700 dark:text-gray-300">Privacy Settings</span>
                        </button>
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