"use client";

import { X, Upload, User } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { DatePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import { useCreateEmployeeMutation } from "@/redux/api/employeeApi";
import { useCreateActivityLogMutation } from "@/redux/api/activityLogApi";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateEmployeeModal = ({ isOpen, onClose }: CreateEmployeeModalProps) => {
  const { data: session } = useSession();
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const [createActivityLog] = useCreateActivityLogMutation();
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

  const departmentByRole: Record<string, Array<{ value: string; label: string }>> = {
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
      department: "",
    }));
  };

  // ── Numeric-only helpers ─────────────────────────────────────

  /** Strips non-digit characters; keeps + only if it's the first character (for phone) */
  const toPhoneNumeric = (value: string) => {
    // Allow digits, spaces, hyphens, and leading +
    return value.replace(/[^\d\s\-+]/g, "");
  };

  const toDigitsOnly = (value: string) => value.replace(/\D/g, "");

  const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block e, E, +, -, . (common non-numeric keys on number inputs)
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  // ── Profile picture ──────────────────────────────────────────

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setProfilePicture(null);
    setProfilePreview("");
  };

  // ── Validation ───────────────────────────────────────────────

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) return "This field is required";
        if (value.trim().length < 2) return "Must be at least 2 characters";
        return "";

      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return "";

      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!/^(\+63|0)?9\d{9}$/.test(value.replace(/[\s-]/g, "")))
          return "Invalid PH phone number (e.g., 09123456789)";
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
        if (!/^(\+63|0)?9\d{9}$/.test(value.replace(/[\s-]/g, "")))
          return "Invalid PH phone number";
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
      "password", "confirmPassword",
    ];
    fields.forEach((field) => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newErrors[field] = error;
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
        setTimeout(() => (errorElement as HTMLElement).focus(), 500);
      }
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, formData[fieldName as keyof typeof formData]);
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allFields = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouchedFields(allFields);

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
        try {
          await createActivityLog({
            employee_id: (session?.user as any)?.id,
            action_type: "create",
            description: `Created new staff: ${formData.firstName} ${formData.lastName}`,
            details: `Role: ${formData.role}, Dept: ${formData.department}`,
            entity_type: "staff",
            entity_id: result.data.id,
          }).unwrap();
        } catch (logError) {
          console.error("Failed to create activity log:", logError);
        }

        toast.success("Employee created successfully!");
        setFormData({
          firstName: "", lastName: "", email: "", phone: "",
          employeeId: "", role: "", department: "", hireDate: "",
          salary: "", address: "", city: "", zipCode: "",
          emergencyContactName: "", emergencyContactPhone: "",
          emergencyContactRelation: "", password: "", confirmPassword: "",
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
        error && typeof error === "object" && "data" in error &&
        error.data && typeof error.data === "object" && "error" in error.data &&
        typeof (error.data as any).error === "string"
          ? (error.data as any).error
          : error instanceof Error
          ? error.message
          : "Failed to create employee";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  const inputClasses = {
    base: "w-full",
    label: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
    input: "bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700",
    innerWrapper: "bg-transparent",
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">

          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create New Employee</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Fill in the employee information below</p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Personal Information
                </h3>

                {/* Profile Picture */}
                <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="relative">
                    {profilePreview ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg">
                        <Image src={profilePreview} alt="Profile Preview" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                        <User className="w-16 h-16 text-slate-400 dark:text-slate-600" />
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
                        disabled={isLoading}
                        className="hidden"
                      />
                      <span className={`inline-flex items-center gap-2 px-4 py-2 ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 cursor-pointer"} text-white rounded-lg font-medium transition-colors text-sm`}>
                        <Upload className="w-4 h-4" />
                        {profilePreview ? "Change Photo" : "Upload Photo"}
                      </span>
                    </label>
                    {profilePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        disabled={isLoading}
                        className={`px-4 py-2 ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"} text-white rounded-lg font-medium transition-colors text-sm`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>

                {/* First / Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`transition-all duration-300 ${touchedFields.firstName && errors.firstName ? "animate-shake" : ""}`}>
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
                          setErrors((prev) => ({ ...prev, firstName: validateField("firstName", e.target.value) }));
                        }
                      }}
                      onBlur={() => handleBlur("firstName")}
                      isInvalid={touchedFields.firstName && !!errors.firstName}
                      errorMessage={touchedFields.firstName && errors.firstName}
                      isRequired
                      isDisabled={isLoading}
                      classNames={inputClasses}
                    />
                  </div>
                  <div className={`transition-all duration-300 ${touchedFields.lastName && errors.lastName ? "animate-shake" : ""}`}>
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
                          setErrors((prev) => ({ ...prev, lastName: validateField("lastName", e.target.value) }));
                        }
                      }}
                      onBlur={() => handleBlur("lastName")}
                      isInvalid={touchedFields.lastName && !!errors.lastName}
                      errorMessage={touchedFields.lastName && errors.lastName}
                      isRequired
                      isDisabled={isLoading}
                      classNames={inputClasses}
                    />
                  </div>
                </div>

                {/* Email / Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`transition-all duration-300 ${touchedFields.email && errors.email ? "animate-shake" : ""}`}>
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
                          setErrors((prev) => ({ ...prev, email: validateField("email", e.target.value) }));
                        }
                      }}
                      onBlur={() => handleBlur("email")}
                      isInvalid={touchedFields.email && !!errors.email}
                      errorMessage={touchedFields.email && errors.email}
                      isRequired
                      isDisabled={isLoading}
                      classNames={inputClasses}
                    />
                  </div>

                  {/* ── Phone — digits, spaces, hyphens, + only ── */}
                  <div className={`transition-all duration-300 ${touchedFields.phone && errors.phone ? "animate-shake" : ""}`}>
                    <Input
                      type="tel"
                      name="phone"
                      label="Phone Number *"
                      placeholder="09123456789"
                      labelPlacement="outside"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const cleaned = toPhoneNumeric(e.target.value);
                        setFormData({ ...formData, phone: cleaned });
                        if (touchedFields.phone) {
                          setErrors((prev) => ({ ...prev, phone: validateField("phone", cleaned) }));
                        }
                      }}
                      onBlur={() => handleBlur("phone")}
                      isInvalid={touchedFields.phone && !!errors.phone}
                      errorMessage={touchedFields.phone && errors.phone}
                      isRequired
                      isDisabled={isLoading}
                      classNames={inputClasses}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className={`transition-all duration-300 ${touchedFields.password && errors.password ? "animate-shake" : ""}`}>
                  <Input
                    type="password"
                    name="password"
                    label="Password *"
                    placeholder="Enter password"
                    labelPlacement="outside"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (touchedFields.password) {
                        setErrors((prev) => ({ ...prev, password: validateField("password", e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("password")}
                    isInvalid={touchedFields.password && !!errors.password}
                    errorMessage={touchedFields.password && errors.password}
                    isRequired
                    classNames={inputClasses}
                  />
                </div>
                <div className={`transition-all duration-300 ${touchedFields.confirmPassword && errors.confirmPassword ? "animate-shake" : ""}`}>
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
                        setErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword", e.target.value) }));
                      }
                    }}
                    onBlur={() => handleBlur("confirmPassword")}
                    isInvalid={touchedFields.confirmPassword && !!errors.confirmPassword}
                    errorMessage={touchedFields.confirmPassword && errors.confirmPassword}
                    isRequired
                    classNames={inputClasses}
                  />
                </div>
              </div>

              {/* Employment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Employment Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Employee ID *"
                    placeholder="Auto-generated"
                    labelPlacement="outside"
                    value={formData.employeeId}
                    isReadOnly
                    isDisabled
                    description="Auto-generated based on role"
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      input: "bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300",
                      description: "dark:text-slate-500",
                    }}
                  />
                  <DatePicker
                    label="Hire Date *"
                    labelPlacement="outside"
                    value={formData.hireDate ? (parseDate(formData.hireDate) as any) : null}
                    onChange={(date: DateValue | null) => {
                      if (date) {
                        const dateStr = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                        setFormData({ ...formData, hireDate: dateStr });
                      }
                    }}
                    isRequired
                    isDisabled={isLoading}
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      calendarContent: "dark:bg-slate-900",
                      calendar: "dark:bg-slate-900 dark:text-white",
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Role *"
                    placeholder="Select a role"
                    labelPlacement="outside"
                    selectedKeys={formData.role ? [formData.role] : []}
                    onSelectionChange={(keys) => handleRoleChange(Array.from(keys)[0] as string)}
                    isRequired
                    isDisabled={isLoading}
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      trigger: "bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700",
                      popoverContent: "dark:bg-slate-900 dark:text-white",
                    }}
                  >
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="dark:text-slate-200 dark:hover:bg-slate-800">
                        {role.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Department *"
                    placeholder="Select a department"
                    labelPlacement="outside"
                    selectedKeys={formData.department ? [formData.department] : []}
                    onSelectionChange={(keys) => setFormData({ ...formData, department: Array.from(keys)[0] as string })}
                    isRequired
                    isDisabled={isLoading}
                    classNames={{
                      base: "w-full",
                      label: "text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      trigger: "bg-slate-50 dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700",
                      popoverContent: "dark:bg-slate-900 dark:text-white",
                    }}
                  >
                    {getAvailableDepartments().map((dept) => (
                      <SelectItem key={dept.value} value={dept.value} className="dark:text-slate-200 dark:hover:bg-slate-800">
                        {dept.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* ── Monthly Salary — digits only ── */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    name="salary"
                    label="Monthly Salary (₱) *"
                    placeholder="25000"
                    labelPlacement="outside"
                    inputMode="numeric"
                    value={formData.salary}
                    onChange={(e) => {
                      const cleaned = toDigitsOnly(e.target.value);
                      setFormData({ ...formData, salary: cleaned });
                      if (touchedFields.salary) {
                        setErrors((prev) => ({ ...prev, salary: validateField("salary", cleaned) }));
                      }
                    }}
                    onKeyDown={blockNonNumericKeys}
                    onBlur={() => handleBlur("salary")}
                    isInvalid={touchedFields.salary && !!errors.salary}
                    errorMessage={touchedFields.salary && errors.salary}
                    isRequired
                    isDisabled={isLoading}
                    classNames={inputClasses}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Address Information
                </h3>
                <Input
                  type="text"
                  label="Street Address *"
                  placeholder="123 Main Street, Barangay Name"
                  labelPlacement="outside"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  isRequired
                  classNames={inputClasses}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="City *"
                    placeholder="Manila"
                    labelPlacement="outside"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    isRequired
                    isDisabled={isLoading}
                    classNames={inputClasses}
                  />

                  {/* ── Zip Code — 4 digits only ── */}
                  <Input
                    type="text"
                    name="zipCode"
                    label="Zip Code *"
                    placeholder="1000"
                    labelPlacement="outside"
                    inputMode="numeric"
                    maxLength={4}
                    value={formData.zipCode}
                    onChange={(e) => {
                      const cleaned = toDigitsOnly(e.target.value).slice(0, 4);
                      setFormData({ ...formData, zipCode: cleaned });
                      if (touchedFields.zipCode) {
                        setErrors((prev) => ({ ...prev, zipCode: validateField("zipCode", cleaned) }));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                    }}
                    onBlur={() => handleBlur("zipCode")}
                    isInvalid={touchedFields.zipCode && !!errors.zipCode}
                    errorMessage={touchedFields.zipCode && errors.zipCode}
                    isRequired
                    isDisabled={isLoading}
                    classNames={inputClasses}
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Contact Name *"
                    placeholder="Full name"
                    labelPlacement="outside"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    isRequired
                    isDisabled={isLoading}
                    classNames={inputClasses}
                  />

                  {/* ── Emergency Phone — same rules as main phone ── */}
                  <Input
                    type="tel"
                    name="emergencyContactPhone"
                    label="Contact Phone *"
                    placeholder="09123456789"
                    labelPlacement="outside"
                    inputMode="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => {
                      const cleaned = toPhoneNumeric(e.target.value);
                      setFormData({ ...formData, emergencyContactPhone: cleaned });
                      if (touchedFields.emergencyContactPhone) {
                        setErrors((prev) => ({ ...prev, emergencyContactPhone: validateField("emergencyContactPhone", cleaned) }));
                      }
                    }}
                    onBlur={() => handleBlur("emergencyContactPhone")}
                    isInvalid={touchedFields.emergencyContactPhone && !!errors.emergencyContactPhone}
                    errorMessage={touchedFields.emergencyContactPhone && errors.emergencyContactPhone}
                    isRequired
                    isDisabled={isLoading}
                    classNames={inputClasses}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Relationship *"
                    placeholder="e.g., Spouse, Parent, Sibling"
                    labelPlacement="outside"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    isRequired
                    isDisabled={isLoading}
                    classNames={inputClasses}
                  />
                </div>
              </div>

            </div>
          </form>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-white dark:hover:bg-slate-800 font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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