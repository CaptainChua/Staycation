"use client";

import { X, Upload } from "lucide-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { DatePicker } from "@nextui-org/date-picker";
import { parseDate, type DateValue } from "@internationalized/date";
import { useUpdateEmployeeMutation } from "@/redux/api/employeeApi";
import toast from "react-hot-toast";
import Image from "next/image";

interface EmployeeData {
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
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  profile_image_url?: string;
  status?: string;
  [key: string]: unknown;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeData | null;
}

const EditEmployeeModal = ({ isOpen, onClose, employee }: EditEmployeeModalProps) => {
  const [updateEmployee, { isLoading }] = useUpdateEmployeeMutation();

  // Track which employee ID we've initialized for
  const initializedEmployeeId = useRef<string | null>(null);

  // Initialize with default values or employee data
  const getInitialFormData = useCallback(() => {
    if (employee) {
      let hireDateFormatted = "";
      if (employee.hire_date) {
        const dateObj = new Date(employee.hire_date);
        hireDateFormatted = dateObj.toISOString().split('T')[0];
      }

      return {
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        employeeId: employee.employment_id || "",
        role: employee.role || "",
        department: employee.department || "",
        hireDate: hireDateFormatted,
        salary: employee.monthly_salary?.toString() || "",
        address: employee.street_address || "",
        city: employee.city || "",
        zipCode: employee.zip_code || "",
        emergencyContactName: employee.emergency_contact_name || "",
        emergencyContactPhone: employee.emergency_contact_phone || "",
        emergencyContactRelation: employee.emergency_contact_relation || "",
        status: employee.status || "active",
      };
    }
    
    return {
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
      status: "active",
    };
  }, [employee]);

  const [formData, setFormData] = useState(() => getInitialFormData());
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>(() => employee?.profile_image_url || "");

  // Use useEffect to handle resetting form data when modal opens with a new employee
  useEffect(() => {
    if (isOpen && employee && initializedEmployeeId.current !== employee.id) {
      const timer = setTimeout(() => {
        const initialData = getInitialFormData();
        setFormData(initialData);
        setProfilePicture(null);
        setProfilePreview(employee.profile_image_url || "");
        initializedEmployeeId.current = employee.id;
      }, 0);
      
      return () => clearTimeout(timer);
    }
    
    // Reset initializedEmployeeId when modal closes
    if (!isOpen) {
      initializedEmployeeId.current = null;
    }
  }, [isOpen, employee, getInitialFormData]);

  const roles = useMemo(() => [
    { value: "Owner", label: "Owner" },
    { value: "CSR", label: "Customer Service Representative" },
    { value: "Cleaner", label: "Cleaner" },
    { value: "Partner", label: "Partner" },
  ], []);

  const departmentByRole = useMemo(() => ({
    Owner: [{ value: "management", label: "Management" }],
    CSR: [
      { value: "front-desk", label: "Front Desk" },
      { value: "customer-service", label: "Customer Service" },
    ],
    Cleaner: [
      { value: "housekeeping", label: "Housekeeping" },
      { value: "maintenance", label: "Maintenance" },
    ],
    Partner: [
      { value: "management", label: "Management" },
      { value: "customer-service", label: "Customer Service" },
    ],
  }), []);

  const statusOptions = useMemo(() => [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ], []);

  // Handle modal close and reset state
  const handleClose = () => {
    setProfilePicture(null);
    onClose();
  };

  const getAvailableDepartments = () => {
    if (!formData.role) return [];
    return departmentByRole[formData.role as keyof typeof departmentByRole] || [];
  };

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let profileImageBase64 = null;
    if (profilePicture) {
      const reader = new FileReader();
      profileImageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(profilePicture);
      });
    }

    try {
      const employeeData = {
        id: employee?.id || "",
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        employment_id: formData.employeeId,
        hire_date: formData.hireDate,
        role: formData.role,
        department: formData.department,
        monthly_salary: parseFloat(formData.salary),
        street_address: formData.address,
        city: formData.city,
        zip_code: formData.zipCode,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relation: formData.emergencyContactRelation,
        status: formData.status,
        ...(profileImageBase64 && { profile_image: profileImageBase64 }),
      };

      const result = await updateEmployee(employeeData).unwrap();

      if (result.success) {
        toast.success("Employee updated successfully!");
        handleClose();
      }
    } catch (error: unknown) {
      console.error("Error updating employee:", error);
      const errorMessage =
        error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data &&
        typeof error.data.error === 'string'
        ? error.data.error
        : error instanceof Error
        ? error.message
        : "Failed to update employee";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Employee</h2>
              <p className="text-sm text-gray-600 mt-1">Update employee information</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  {profilePreview ? (
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-orange-200">
                      <Image
                        src={profilePreview}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-orange-200">
                      {formData.firstName.charAt(0)}
                      {formData.lastName.charAt(0)}
                    </div>
                  )}
                  {profilePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <label
                  htmlFor="profilePicture"
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Change Profile Picture
                </label>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                />
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
                <Input
                  type="email"
                  label="Email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
                <Input
                  label="Phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
              </div>

              {/* Employment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Employee ID"
                  value={formData.employeeId}
                  isReadOnly
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm bg-gray-100",
                  }}
                />
                <Select
                  label="Role"
                  placeholder="Select role"
                  selectedKeys={formData.role ? [formData.role] : []}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, department: "" })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    value: "text-sm",
                  }}
                >
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Department"
                  placeholder="Select department"
                  selectedKeys={formData.department ? [formData.department] : []}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  isDisabled={!formData.role}
                  classNames={{
                    label: "text-sm font-medium",
                    value: "text-sm",
                  }}
                >
                  {getAvailableDepartments().map((dept: { value: string; label: string }) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </Select>
                <DatePicker
                  label="Hire Date"
                  value={formData.hireDate ? (parseDate(formData.hireDate) as any) : null}
                  onChange={(date: DateValue | null) => {
                    if (date) {
                      const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      setFormData({ ...formData, hireDate: dateStr });
                    }
                  }}
                  classNames={{
                    label: "text-sm font-medium",
                  }}
                />
                <Input
                  type="number"
                  label="Monthly Salary (₱)"
                  placeholder="Enter monthly salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
                <Select
                  label="Status"
                  placeholder="Select status"
                  selectedKeys={formData.status ? [formData.status] : []}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  classNames={{
                    label: "text-sm font-medium",
                    value: "text-sm",
                  }}
                >
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Street Address"
                  placeholder="Enter street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="md:col-span-2"
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
                <Input
                  label="City"
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
                <Input
                  label="Zip Code"
                  placeholder="Enter zip code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  classNames={{
                    label: "text-sm font-medium",
                    input: "text-sm",
                  }}
                />
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Name"
                    placeholder="Full name"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                  />
                  <Input
                    label="Contact Phone"
                    placeholder="+63 912 345 6789"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                  />
                  <Input
                    label="Relationship"
                    placeholder="e.g., Spouse, Parent, Sibling"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    classNames={{
                      label: "text-sm font-medium",
                      input: "text-sm",
                    }}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditEmployeeModal;