"use client";

import { X, Upload, User } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { DatePicker } from "@nextui-org/date-picker";
import { parseDate, toZoned } from "@internationalized/date";
import type { DateValue } from "@nextui-org/date-picker";
import { useCreateEmployeeMutation } from "@/redux/api/employeeApi";
import toast from "react-hot-toast";
import Image from "next/image";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateEmployeeModal = ({ isOpen, onClose }: CreateEmployeeModalProps) => {
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const formRef = useRef<HTMLFormElement>(null);

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
    password: "",
    confirmPassword: "",
    profile_image: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");

  const roles = [
    { value: "Owner", label: "Owner" },
    { value: "CSR", label: "Customer Service Representative" },
    { value: "Cleaner", label: "Cleaner" },
    { value: "Partner", label: "Partner" },
  ];

  const departmentByRole: Record<
    string,
    Array<{ value: string; label: string }>
  > = {
    Owner: [{ value: "management", label: "Management" }],
    CSR: [
      { value: "front-desk", label: "Front Desk" },
      { value: "customer-service", label: "Customer Service" },
    ],
    Cleaner: [
      { value: "housekeeping", label: "housekeeping" },
      { value: "maintenance", label: "Maintenance" },
    ],
    Partner: [
      { value: "management", label: "Management" },
      { value: "customer-service", label: "Customer Service" },
    ],
  };

  const getAvailableDepartments = () => {
    if (!formData.role) return [];
    return departmentByRole[formData.role] || [];
  };

  const handleRoleChange = (value: string) => {
    const rolePrefix = value.substring(0, 3).toUpperCase();
    const timeStamp = Date.now().toString().slice(-6);
    const generatedId = `${rolePrefix}-${timeStamp}`;

    setFormData((prev) => ({
      ...prev,
      role: value,
      employeeId: generatedId,
      department: ""
    }));
  };

  // const departments = [
  //   { value: "front-desk", label: "Front Desk" },
  //   { value: "housekeeping", label: "Housekeeping" },
  //   { value: "maintenance", label: "Maintenance" },
  //   { value: "management", label: "Management" },
  //   { value: "customer-service", label: "Customer Service" },
  // ];

  const handleProfilePictureUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) return "This field is required";
        if (value.trim().length < 2) return "Must be at least 2 characters";
        return "";

      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Invalid email format";
        return "";

      case "phone":
        if (!value.trim()) return "Phone number is required";
        const phoneRegex = /^(\+63|0)?9\d{9}$/;
        if (!phoneRegex.test(value.replace(/[\s-]/g, ""))) {
          return "Invalid PH phone number (e.g., 09123456789)";
        }
        return "";

      case "role":
        if (!value) return "Please select a role";
        return "";

      case "department":
        if (!value) return "Please select a department";
        return "";

      case "hireDate":
        if (!value) return "Hire date is required";
        return "";

      case "salary":
        if (!value) return "Salary is required";
        if (parseFloat(value) <= 0) return "Salary must be greater than 0";
        return "";

      case "address":
        if (!value.trim()) return "Address is required";
        return "";

      case "city":
        if (!value.trim()) return "City is required";
        return "";

      case "zipCode":
        if (!value.trim()) return "Zip code is required";
        if (!/^\d{4}$/.test(value)) return "Zip code must be 4 digits";
        return "";

      case "emergencyContactName":
        if (!value.trim()) return "Emergency contact name is required";
        return "";

      case "emergencyContactPhone":
        if (!value.trim()) return "Emergency contact phone is required";
        const emergencyPhoneRegex = /^(\+63|0)?9\d{9}$/;
        if (!emergencyPhoneRegex.test(value.replace(/[\s-]/g, ""))) {
          return "Invalid PH phone number";
        }
        return "";

      case "emergencyContactRelation":
        if (!value.trim()) return "Relationship is required";
        return "";

      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";

      case "confirmPassword":
        if (!value) return "Please confirm password";
        if (value !== formData.password) return "Passwords do not match";
        return "";

      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fields = [
      "firstName", "lastName", "email", "phone", "role", "department",
      "hireDate", "salary", "address", "city", "zipCode",
      "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation",
      "password", "confirmPassword"
    ];

    fields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFirstError = () => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField && formRef.current) {
      const errorElement = formRef.current.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          (errorElement as HTMLElement).focus();
        }, 500);
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, formData[fieldName as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouchedFields(allFields);

    // Validate all fields
    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      setTimeout(scrollToFirstError, 100);
      return;
    }

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
        password: formData.password,
        profile_image: profileImageBase64,
      };

      const result = await createEmployee(employeeData).unwrap();

      if (result.success) {
        toast.success("Employee created successfully!");
        setFormData({
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
          password: "",
          confirmPassword: "",
          profile_image: "",
        });
        setProfilePicture(null);
        setProfilePreview("");
        setErrors({});
        setTouchedFields({});
        onClose();
      }
    } catch (error: unknown) {
      console.error("Error creating employee: ", error);
      const errorMessage =
        error && typeof error === 'object' && 'data' in error &&
        error.data && typeof error.data === 'object' && 'error' in error.data &&
        typeof error.data.error === 'string'
        ? error.data.error
        : error instanceof Error
        ? error.message
        : "Failed to create employee";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col">
          {/* Header - Sticky */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Create New Employee
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the employee information below
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Personal Information
                </h3>

                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="relative">
                    {profilePreview ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg">
                        <Image
                          src={profilePreview}
                          alt="Profile Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <label htmlFor="profile-picture-upload">
                      <input
                        type="file"
                        id="profile-picture-upload"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {profilePreview ? "Change Photo" : "Upload Photo"}
                      </span>
                    </label>

                    {profilePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`transition-all duration-300 ${touchedFields.firstName && errors.firstName ? 'animate-shake' : ''}`}>
                    <Input
                      type="text"
                      name="firstName"
                      label="First Name *"
                      placeholder="Enter first name"
                      labelPlacement="outside"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (touchedFields.firstName) {
                          const error = validateField("firstName", e.target.value);
                          setErrors(prev => ({ ...prev, firstName: error }));
                        }
                      }}
                      onBlur={() => handleBlur("firstName")}
                      isInvalid={touchedFields.firstName && !!errors.firstName}
                      errorMessage={touchedFields.firstName && errors.firstName}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                  <div className={`transition-all duration-300 ${touchedFields.lastName && errors.lastName ? 'animate-shake' : ''}`}>
                    <Input
                      type="text"
                      name="lastName"
                      label="Last Name *"
                      placeholder="Enter last name"
                      labelPlacement="outside"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (touchedFields.lastName) {
                          const error = validateField("lastName", e.target.value);
                          setErrors(prev => ({ ...prev, lastName: error }));
                        }
                      }}
                      onBlur={() => handleBlur("lastName")}
                      isInvalid={touchedFields.lastName && !!errors.lastName}
                      errorMessage={touchedFields.lastName && errors.lastName}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`transition-all duration-300 ${touchedFields.email && errors.email ? 'animate-shake' : ''}`}>
                    <Input
                      type="email"
                      name="email"
                      label="Email Address *"
                      placeholder="employee@example.com"
                      labelPlacement="outside"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (touchedFields.email) {
                          const error = validateField("email", e.target.value);
                          setErrors(prev => ({ ...prev, email: error }));
                        }
                      }}
                      onBlur={() => handleBlur("email")}
                      isInvalid={touchedFields.email && !!errors.email}
                      errorMessage={touchedFields.email && errors.email}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                  <div className={`transition-all duration-300 ${touchedFields.phone && errors.phone ? 'animate-shake' : ''}`}>
                    <Input
                      type="tel"
                      name="phone"
                      label="Phone Number *"
                      placeholder="+63 912 345 6789"
                      labelPlacement="outside"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (touchedFields.phone) {
                          const error = validateField("phone", e.target.value);
                          setErrors(prev => ({ ...prev, phone: error }));
                        }
                      }}
                      onBlur={() => handleBlur("phone")}
                      isInvalid={touchedFields.phone && !!errors.phone}
                      errorMessage={touchedFields.phone && errors.phone}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className={`transition-all duration-300 ${touchedFields.password && errors.password ? 'animate-shake' : ''}`}>
                  <Input
                    type="password"
                    name="password"
                    label="Password *"
                    placeholder="Enter password (min 8 characters)"
                    labelPlacement="outside"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (touchedFields.password) {
                        const error = validateField("password", e.target.value);
                        setErrors(prev => ({ ...prev, password: error }));
                      }
                    }}
                    onBlur={() => handleBlur("password")}
                    isInvalid={touchedFields.password && !!errors.password}
                    errorMessage={touchedFields.password && errors.password}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700 mb-1",
                    }}
                  />
                </div>

                <div className={`transition-all duration-300 ${touchedFields.confirmPassword && errors.confirmPassword ? 'animate-shake' : ''}`}>
                  <Input
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password *"
                    placeholder="Re-enter password"
                    labelPlacement="outside"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (touchedFields.confirmPassword) {
                        const error = validateField("confirmPassword", e.target.value);
                        setErrors(prev => ({ ...prev, confirmPassword: error }));
                      }
                    }}
                    onBlur={() => handleBlur("confirmPassword")}
                    isInvalid={touchedFields.confirmPassword && !!errors.confirmPassword}
                    errorMessage={touchedFields.confirmPassword && errors.confirmPassword}
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700 mb-1",
                    }}
                  />
                </div>
              </div>

              {/* Employment Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Employment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      label="Employee ID *"
                      placeholder="Auto-generated"
                      labelPlacement="outside"
                      value={formData.employeeId}
                      isReadOnly
                      isDisabled
                      description="Auto-generated base on role"
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                  <div>
                    <DatePicker
                      label="Hire Date *"
                      labelPlacement="outside"
                      value={
                        formData.hireDate
                          ? (toZoned(parseDate(formData.hireDate), "UTC") as DateValue)
                          : undefined
                      }
                      onChange={(date: DateValue | null) => {
                        if (date) {
                          const dateStr = `${date.year}-${String(
                            date.month
                          ).padStart(2, "0")}-${String(date.day).padStart(
                            2,
                            "0"
                          )}`;
                          setFormData({ ...formData, hireDate: dateStr });
                        }
                      }}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Select
                      label="Role *"
                      placeholder="Select a role"
                      labelPlacement="outside"
                      selectedKeys={formData.role ? [formData.role] : []}
                      onSelectionChange={(keys) => {
                        const selectedValue = Array.from(keys)[0] as string;
                        handleRoleChange(selectedValue);
                      }}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    >
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Select
                      label="Department *"
                      placeholder="Select a department"
                      labelPlacement="outside"
                      selectedKeys={
                        formData.department ? [formData.department] : []
                      }
                      onSelectionChange={(keys) => {
                        const selectedValue = Array.from(keys)[0] as string;
                        setFormData({ ...formData, department: selectedValue });
                      }}
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    >
                      {getAvailableDepartments().map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      label="Monthly Salary (₱) *"
                      placeholder="25000"
                      labelPlacement="outside"
                      value={formData.salary}
                      onChange={(e) =>
                        setFormData({ ...formData, salary: e.target.value })
                      }
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Address Information
                </h3>
                <div>
                  <Input
                    type="text"
                    label="Street Address *"
                    placeholder="123 Main Street, Barangay Name"
                    labelPlacement="outside"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    isRequired
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-medium text-gray-700 mb-1",
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      label="City *"
                      placeholder="Manila"
                      labelPlacement="outside"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      label="Zip Code *"
                      placeholder="1000"
                      labelPlacement="outside"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      label="Contact Name *"
                      placeholder="Full name"
                      labelPlacement="outside"
                      value={formData.emergencyContactName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactName: e.target.value,
                        })
                      }
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      label="Contact Phone *"
                      placeholder="+63 912 345 6789"
                      labelPlacement="outside"
                      value={formData.emergencyContactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactPhone: e.target.value,
                        })
                      }
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      label="Relationship *"
                      placeholder="e.g., Spouse, Parent, Sibling"
                      labelPlacement="outside"
                      value={formData.emergencyContactRelation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContactRelation: e.target.value,
                        })
                      }
                      isRequired
                      classNames={{
                        base: "w-full",
                        label: "text-sm font-medium text-gray-700 mb-1",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer - Sticky */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? "Creating..." : "Create Employee"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateEmployeeModal;
