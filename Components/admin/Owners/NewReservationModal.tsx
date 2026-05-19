import { User, Users, ArrowLeft, Upload, Plus, Minus, CreditCard, CheckCircle, ChevronRight, X as XIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

interface GuestInfo {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  validId: File | null;
  validIdPreview: string;
}

interface AddOns {
  poolPass: number;
  towels: number;
  bathRobe: number;
  extraComforter: number;
  guestKit: number;
  extraSlippers: number;
}

const ADD_ON_PRICES = {
  poolPass: 100,
  towels: 50,
  bathRobe: 150,
  extraComforter: 100,
  guestKit: 75,
  extraSlippers: 30,
};

interface AdditionalGuestPayload {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  validId: string;
}

interface BookingPayload {
  booking_id: string;
  user_id: string | null;
  guest_first_name: string;
  guest_last_name: string;
  guest_age: string;
  guest_gender: string;
  guest_email: string;
  guest_phone: string;
  facebook_link: string;
  valid_id: string;
  additional_guests: AdditionalGuestPayload[];
  room_name: string;
  stay_type: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string;
  check_out_time: string;
  adults: number;
  children: number;
  infants: number;
  payment_method: string;
  payment_proof: string;
  room_rate: number;
  security_deposit: number;
  add_ons_total: number;
  total_amount: number;
  down_payment: number;
  addOns: AddOns;
}

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: BookingPayload) => Promise<void>;
}

const NewReservationModal = ({ isOpen, onClose, onSubmit }: NewReservationModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialFormData = {
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    email: "",
    phone: "",
    facebookLink: "",
    validId: null as File | null,
    validIdPreview: "",
    adults: 1,
    children: 0,
    infants: 0,
    stayType: "",
    checkInDate: "",
    checkOutDate: "",
    checkInTime: "",
    checkOutTime: "",
    roomName: "",
    paymentProof: null as File | null,
    paymentProofPreview: "",
    termsAccepted: false,
    paymentMethod: "gcash",
  };

  const [formData, setFormData] = useState(initialFormData);

  const initialAddOns: AddOns = {
    poolPass: 0,
    towels: 0,
    bathRobe: 0,
    extraComforter: 0,
    guestKit: 0,
    extraSlippers: 0,
  };

  const [additionalGuests, setAdditionalGuests] = useState<GuestInfo[]>([]);
  const [addOns, setAddOns] = useState<AddOns>(initialAddOns);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData(initialFormData);
    setAdditionalGuests([]);
    setAddOns(initialAddOns);
    setCurrentStep(1);
    setCompletedSteps([]);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRoomRateFromStayType = (): number => {
    if (!formData.stayType) return 0;
    if (formData.stayType === "10 Hours - ₱1,599") return 1599;
    if (formData.stayType.includes("weekday")) return 1799;
    if (formData.stayType.includes("Fri-Sat")) return 1999;
    if (formData.stayType === "Multi-Day Stay") return 1799 * calculateNumberOfDays();
    return 0;
  };

  const calculateNumberOfDays = (): number => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    const diffTime = Math.abs(new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const roomRate = getRoomRateFromStayType();
  const securityDeposit = formData.stayType ? 1000 : 0;
  const downPayment = 500;
  const addOnsTotal = Object.entries(addOns).reduce(
    (total, [key, quantity]) => total + quantity * ADD_ON_PRICES[key as keyof AddOns],
    0
  );
  const totalAmount = roomRate + securityDeposit + addOnsTotal;

  const updateAdditionalGuests = (adults: number, children: number) => {
    const totalAdditionalGuests = adults + children - 1;
    setAdditionalGuests((prev) => {
      if (totalAdditionalGuests > prev.length) {
        const newGuests = Array(totalAdditionalGuests - prev.length)
          .fill(null)
          .map(() => ({ firstName: "", lastName: "", age: "", gender: "", validId: null, validIdPreview: "" }));
        return [...prev, ...newGuests];
      }
      return prev.slice(0, totalAdditionalGuests);
    });
  };

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  const handlePhoneChange = (value: string): string => {
    const cleaned = value.replace(/[^0-9]/g, "");
    return cleaned.slice(0, 11);
  };

  const handleAgeChange = (value: string): string => {
    return value.replace(/[^0-9]/g, "").slice(0, 3);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone: handlePhoneChange(value) }));
      return;
    }

    if (name === "age") {
      setFormData((prev) => ({ ...prev, age: handleAgeChange(value) }));
      return;
    }

    if (name === "adults" || name === "children") {
      const newValue = parseInt(value) || 0;
      const currentAdults = name === "adults" ? newValue : formData.adults;
      const currentChildren = name === "children" ? newValue : formData.children;

      if (currentAdults + currentChildren > 4) {
        toast.error("Maximum 4 guests allowed (adults + children).");
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: newValue }));
      updateAdditionalGuests(currentAdults, currentChildren);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "payment" | "id", guestIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "payment") {
      setFormData((prev) => ({ ...prev, paymentProof: file, paymentProofPreview: URL.createObjectURL(file) }));
    } else if (guestIndex === undefined) {
      setFormData((prev) => ({ ...prev, validId: file, validIdPreview: URL.createObjectURL(file) }));
    } else {
      const updatedGuests = [...additionalGuests];
      updatedGuests[guestIndex].validId = file;
      updatedGuests[guestIndex].validIdPreview = URL.createObjectURL(file);
      setAdditionalGuests(updatedGuests);
    }
  };

  const handleAdditionalGuestChange = (index: number, field: keyof GuestInfo, value: string) => {
    const updatedGuests = [...additionalGuests];
    const sanitizedValue = field === "age" ? handleAgeChange(value) : value;
    updatedGuests[index] = { ...updatedGuests[index], [field]: sanitizedValue };
    setAdditionalGuests(updatedGuests);
  };

  const handleStayTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStayType = e.target.value;
    let defaultCheckInTime = "";
    let defaultCheckOutTime = "";

    if (selectedStayType === "10 Hours - ₱1,599") {
      defaultCheckInTime = "14:00";
      defaultCheckOutTime = "00:00";
    } else if (selectedStayType.includes("21 Hours") || selectedStayType === "Multi-Day Stay") {
      defaultCheckInTime = "14:00";
      defaultCheckOutTime = "11:00";
    }

    setFormData((prev) => ({ ...prev, stayType: selectedStayType, checkInTime: defaultCheckInTime, checkOutTime: defaultCheckOutTime }));

    if (formData.checkInDate && selectedStayType) {
      const checkOutDate = new Date(formData.checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      setFormData((prev) => ({ ...prev, checkOutDate: checkOutDate.toISOString().split("T")[0] }));
    }
  };

  const handleAddOnChange = (item: keyof AddOns, increment: boolean) => {
    setAddOns((prev) => ({ ...prev, [item]: Math.max(0, prev[item] + (increment ? 1 : -1)) }));
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.age) newErrors.age = "Age is required";
    if (!formData.gender) newErrors.gender = "Please select a gender";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (formData.age && parseInt(formData.age) >= 10 && !formData.validId) {
      newErrors.validId = "Valid ID is required for guests 10+ years old";
    }
    for (let i = 0; i < additionalGuests.length; i++) {
      const guest = additionalGuests[i];
      if (!guest.firstName) newErrors[`guest${i}FirstName`] = `Guest ${i + 2} first name is required`;
      if (!guest.lastName) newErrors[`guest${i}LastName`] = `Guest ${i + 2} last name is required`;
      if (!guest.age) newErrors[`guest${i}Age`] = `Guest ${i + 2} age is required`;
      if (!guest.gender) newErrors[`guest${i}Gender`] = `Guest ${i + 2} gender is required`;
      if (guest.age && parseInt(guest.age) >= 10 && !guest.validId) {
        newErrors[`guest${i}ValidId`] = `Valid ID required for Guest ${i + 2}`;
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      const remaining = Object.keys(newErrors).length - 1;
      toast.error(remaining > 0 ? `${firstError} (+${remaining} more)` : firstError);
    }
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.stayType) newErrors.stayType = "Please select a stay type";
    if (!formData.checkInDate) newErrors.checkInDate = "Check-in date is required";
    if (!formData.checkOutDate) newErrors.checkOutDate = "Check-out date is required";
    if (!formData.checkInTime) newErrors.checkInTime = "Check-in time is required";
    if (!formData.checkOutTime) newErrors.checkOutTime = "Check-out time is required";
    if (!formData.roomName) newErrors.roomName = "Room/Haven name is required";

    if (formData.checkInDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formData.checkInDate) < today) {
        newErrors.checkInDate = "Check-in date cannot be in the past";
      }
    }
    if (formData.checkInDate && formData.checkOutDate) {
      if (new Date(formData.checkOutDate) <= new Date(formData.checkInDate)) {
        newErrors.checkOutDate = "Check-out date must be after check-in date";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.paymentProof) newErrors.paymentProof = "Proof of payment is required";
    if (!formData.termsAccepted) newErrors.termsAccepted = "You must accept the terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCompletedSteps((prev) => [...prev, 1]);
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCompletedSteps((prev) => [...prev, 2]);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCompletedSteps((prev) => [...prev, 3]);
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const toBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

      const validIdBase64 = formData.validId ? await toBase64(formData.validId) : "";
      const paymentProofBase64 = formData.paymentProof ? await toBase64(formData.paymentProof) : "";

      const additionalGuestsData = [];
      for (const guest of additionalGuests) {
        const guestIdBase64 = guest.validId ? await toBase64(guest.validId) : "";
        additionalGuestsData.push({
          firstName: guest.firstName,
          lastName: guest.lastName,
          age: guest.age,
          gender: guest.gender,
          validId: guestIdBase64,
        });
      }

      const bookingData = {
        booking_id: `BK${Date.now()}`,
        user_id: null,
        guest_first_name: formData.firstName,
        guest_last_name: formData.lastName,
        guest_age: formData.age,
        guest_gender: formData.gender,
        guest_email: formData.email,
        guest_phone: formData.phone,
        facebook_link: formData.facebookLink,
        valid_id: validIdBase64,
        additional_guests: additionalGuestsData,
        room_name: formData.roomName,
        stay_type: formData.stayType,
        check_in_date: formData.checkInDate,
        check_out_date: formData.checkOutDate,
        check_in_time: formData.checkInTime,
        check_out_time: formData.checkOutTime,
        adults: formData.adults,
        children: formData.children,
        infants: formData.infants,
        payment_method: formData.paymentMethod,
        payment_proof: paymentProofBase64,
        room_rate: roomRate,
        security_deposit: securityDeposit,
        add_ons_total: addOnsTotal,
        total_amount: totalAmount,
        down_payment: downPayment,
        addOns,
      };

      await onSubmit(bookingData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to create reservation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getStepTitle = () =>
    ["Guest Information", "Booking Details", "Optional Add-ons", "Payment & Review"][currentStep - 1];

  const inputClass =
    "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition disabled:opacity-50 placeholder:text-gray-400";
  const labelClass = "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300";
  const sectionClass = "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm";

  const stepDescriptions = [
    "Tell us about the main guest and any additional guests staying with them.",
    "Pick a haven, set the dates and times for the stay.",
    "Add optional extras like pool passes, towels, or a guest kit.",
    "Review the booking and confirm payment to finalize the reservation.",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="text-white px-6 py-5 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-brand-primary to-brand-primaryDark">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{getStepTitle()}</h2>
            <p className="text-sm opacity-90 mt-0.5">Step {currentStep} of 4</p>
          </div>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((step, idx) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all font-semibold ${
                      completedSteps.includes(step)
                        ? "bg-green-500 text-white"
                        : currentStep === step
                        ? "text-white bg-brand-primary"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {completedSteps.includes(step) ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  <span
                    className={`text-xs font-medium text-center whitespace-nowrap ${
                      completedSteps.includes(step) || currentStep === step
                        ? "text-brand-primary"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {["Guest", "Booking", "Add-ons", "Payment"][idx]}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`w-24 h-1 mx-4 -mt-8 ${
                      completedSteps.includes(step) ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Guide box */}
            <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl mb-6">
              <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">
                ?
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">
                  What is this step?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {stepDescriptions[currentStep - 1]}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Guest Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <User className="w-5 h-5 text-brand-primary" />
                      Main Guest Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={`${inputClass} ${errors.firstName ? "border-red-500" : ""}`} placeholder="Enter first name" />
                        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className={`${inputClass} ${errors.lastName ? "border-red-500" : ""}`} placeholder="Enter last name" />
                        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Age *</label>
                        <input type="number" name="age" value={formData.age} onChange={handleInputChange} required min="1" max="999" inputMode="numeric" className={`${inputClass} ${errors.age ? "border-red-500" : ""}`} placeholder="Enter age" />
                        {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Gender *</label>
                        <select name="gender" aria-label="Gender" title="Gender" value={formData.gender} onChange={handleInputChange} required className={`${inputClass} ${errors.gender ? "border-red-500" : ""}`}>
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={`${inputClass} ${errors.email ? "border-red-500" : ""}`} placeholder="Enter email" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Phone *</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required inputMode="numeric" className={`${inputClass} ${errors.phone ? "border-red-500" : ""}`} placeholder="Enter Mobile Number" />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Valid ID (Required for 10+ years old)
                    </h4>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "id")} className="hidden" id="valid-id" />
                    <label
                      htmlFor="valid-id"
                      className={`cursor-pointer flex flex-col items-center p-8 border-2 border-dashed bg-gray-50 dark:bg-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition ${
                        errors.validId ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <Upload className="w-12 h-12 text-blue-500 mb-3" />
                      <p className="text-blue-600 dark:text-blue-400 font-medium">Click to upload ID</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </label>
                    {errors.validId && <p className="text-red-500 text-xs mt-2 text-center">{errors.validId}</p>}
                    {formData.validIdPreview && (
                      <div className="mt-4 relative">
                        <Image src={formData.validIdPreview} alt="ID preview" width={300} height={200} className="max-w-xs mx-auto rounded-lg shadow border border-gray-200 dark:border-gray-600" />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, validId: null, validIdPreview: "" }))}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          title="Remove image"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="w-5 h-5 text-brand-primary" />
                      Number of Guests
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Adults *</label>
                        <input type="number" name="adults" aria-label="Adults" title="Adults" placeholder="Adults" value={formData.adults} onChange={handleInputChange} min="1" max="4" required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Children</label>
                        <input type="number" name="children" aria-label="Children" title="Children" placeholder="Children" value={formData.children} onChange={handleInputChange} min="0" max="4" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Infants</label>
                        <input type="number" name="infants" aria-label="Infants" title="Infants" placeholder="Infants" value={formData.infants} onChange={handleInputChange} min="0" max="2" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {additionalGuests.map((guest, index) => (
                    <div key={index} className={sectionClass}>
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <User className="w-5 h-5 text-brand-primary" />
                        {index < formData.adults - 1 ? `Adult ${index + 2}` : `Child ${index - (formData.adults - 1) + 1}`}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <input type="text" value={guest.firstName} onChange={(e) => handleAdditionalGuestChange(index, "firstName", e.target.value)} placeholder="First Name *" className={`${inputClass} ${errors[`guest${index}FirstName`] ? "border-red-500" : ""}`} />
                          {errors[`guest${index}FirstName`] && <p className="text-red-500 text-xs mt-1">{errors[`guest${index}FirstName`]}</p>}
                        </div>
                        <div>
                          <input type="text" value={guest.lastName} onChange={(e) => handleAdditionalGuestChange(index, "lastName", e.target.value)} placeholder="Last Name *" className={`${inputClass} ${errors[`guest${index}LastName`] ? "border-red-500" : ""}`} />
                          {errors[`guest${index}LastName`] && <p className="text-red-500 text-xs mt-1">{errors[`guest${index}LastName`]}</p>}
                        </div>
                        <div>
                          <input type="number" value={guest.age} onChange={(e) => handleAdditionalGuestChange(index, "age", e.target.value)} placeholder="Age *" min="1" max="999" inputMode="numeric" className={`${inputClass} ${errors[`guest${index}Age`] ? "border-red-500" : ""}`} />
                          {errors[`guest${index}Age`] && <p className="text-red-500 text-xs mt-1">{errors[`guest${index}Age`]}</p>}
                        </div>
                        <div>
                          <select aria-label="Guest gender" title="Guest gender" value={guest.gender} onChange={(e) => handleAdditionalGuestChange(index, "gender", e.target.value)} className={`${inputClass} ${errors[`guest${index}Gender`] ? "border-red-500" : ""}`}>
                            <option value="">Select Gender *</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          {errors[`guest${index}Gender`] && <p className="text-red-500 text-xs mt-1">{errors[`guest${index}Gender`]}</p>}
                        </div>
                      </div>

                      {guest.age && parseInt(guest.age) >= 10 && (
                        <div className="mt-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100 text-sm">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            Valid ID Required (10+ years old)
                          </h4>
                          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "id", index)} className="hidden" id={`valid-id-guest-${index}`} />
                          <label
                            htmlFor={`valid-id-guest-${index}`}
                            className={`cursor-pointer flex flex-col items-center p-6 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition ${errors[`guest${index}ValidId`] ? "border-2 border-red-500" : ""}`}
                          >
                            <Upload className="w-10 h-10 text-blue-500 mb-2" />
                            <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">Click to upload ID</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                          </label>
                          {errors[`guest${index}ValidId`] && <p className="text-red-500 text-xs mt-2">{errors[`guest${index}ValidId`]}</p>}
                          {guest.validIdPreview && (
                            <div className="mt-3 relative">
                              <Image src={guest.validIdPreview} alt={`Guest ${index + 2} ID preview`} width={200} height={130} className="max-w-xs mx-auto rounded-lg shadow border border-gray-200 dark:border-gray-600" />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedGuests = [...additionalGuests];
                                  updatedGuests[index].validId = null;
                                  updatedGuests[index].validIdPreview = "";
                                  setAdditionalGuests(updatedGuests);
                                }}
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                title="Remove image"
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: Booking Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Stay Type & Room</h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Room/Haven Name *</label>
                        <select name="roomName" aria-label="Room or Haven Name" title="Room or Haven Name" value={formData.roomName} onChange={handleInputChange} required className={`${inputClass} ${errors.roomName ? "border-red-500" : ""}`}>
                          <option value="">Select Room/Haven</option>
                          {["Haven 1", "Haven 2", "Haven 3", "Haven 4", "Haven 5"].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        {errors.roomName && <p className="text-red-500 text-xs mt-1">{errors.roomName}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Stay Type *</label>
                        <select name="stayType" aria-label="Stay Type" title="Stay Type" value={formData.stayType} onChange={handleStayTypeChange} required className={`${inputClass} ${errors.stayType ? "border-red-500" : ""}`}>
                          <option value="">Select Stay Type</option>
                          <option value="10 Hours - ₱1,599">10 Hours - ₱1,599</option>
                          <option value="21 Hours (Sun-Thu weekday) - ₱1,799">21 Hours (Weekday) - ₱1,799</option>
                          <option value="21 Hours (Fri-Sat) - ₱1,999">21 Hours (Weekend) - ₱1,999</option>
                          <option value="Multi-Day Stay">Multi-Day Stay</option>
                        </select>
                        {errors.stayType && <p className="text-red-500 text-xs mt-1">{errors.stayType}</p>}
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Dates & Times</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Check-in Date *</label>
                        <input type="date" name="checkInDate" aria-label="Check-in Date" title="Check-in Date" value={formData.checkInDate} onChange={handleInputChange} onKeyDown={handleDateKeyDown} required className={`${inputClass} ${errors.checkInDate ? "border-red-500" : ""}`} min={new Date().toISOString().split("T")[0]} />
                        {errors.checkInDate && <p className="text-red-500 text-xs mt-1">{errors.checkInDate}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Check-out Date *</label>
                        <input type="date" name="checkOutDate" aria-label="Check-out Date" title="Check-out Date" value={formData.checkOutDate} onChange={handleInputChange} onKeyDown={handleDateKeyDown} required className={`${inputClass} ${errors.checkOutDate ? "border-red-500" : ""}`} min={formData.checkInDate || new Date().toISOString().split("T")[0]} />
                        {errors.checkOutDate && <p className="text-red-500 text-xs mt-1">{errors.checkOutDate}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Check-in Time *</label>
                        <input type="time" name="checkInTime" aria-label="Check-in Time" title="Check-in Time" value={formData.checkInTime} onChange={handleInputChange} required className={`${inputClass} ${errors.checkInTime ? "border-red-500" : ""}`} />
                        {errors.checkInTime && <p className="text-red-500 text-xs mt-1">{errors.checkInTime}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Check-out Time *</label>
                        <input type="time" name="checkOutTime" aria-label="Check-out Time" title="Check-out Time" value={formData.checkOutTime} onChange={handleInputChange} required className={`${inputClass} ${errors.checkOutTime ? "border-red-500" : ""}`} />
                        {errors.checkOutTime && <p className="text-red-500 text-xs mt-1">{errors.checkOutTime}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Add-ons */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Optional Add-ons</h3>
                    <div className="space-y-3">
                      {(
                        [
                          { key: "poolPass", label: "Pool Pass", price: ADD_ON_PRICES.poolPass },
                          { key: "towels", label: "Towels", price: ADD_ON_PRICES.towels },
                          { key: "bathRobe", label: "Bath Robe", price: ADD_ON_PRICES.bathRobe },
                          { key: "extraComforter", label: "Extra Comforter", price: ADD_ON_PRICES.extraComforter },
                          { key: "guestKit", label: "Guest Kit", price: ADD_ON_PRICES.guestKit },
                          { key: "extraSlippers", label: "Extra Slippers", price: ADD_ON_PRICES.extraSlippers },
                        ] as { key: keyof AddOns; label: string; price: number }[]
                      ).map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">₱{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" title="Remove" aria-label="Remove" onClick={() => handleAddOnChange(item.key, false)} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full flex items-center justify-center transition">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900 dark:text-gray-100">{addOns[item.key]}</span>
                            <button type="button" title="Add" aria-label="Add" onClick={() => handleAddOnChange(item.key, true)} className="w-8 h-8 text-white rounded-full flex items-center justify-center transition bg-brand-primary">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          <strong>Add-ons Total:</strong> ₱{addOnsTotal.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Payment & Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Booking Summary</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div><span className="text-gray-600 dark:text-gray-400">Guest:</span> <strong className="text-gray-900 dark:text-gray-100">{formData.firstName} {formData.lastName}</strong></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Email:</span> <strong className="text-gray-900 dark:text-gray-100">{formData.email}</strong></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Phone:</span> <strong className="text-gray-900 dark:text-gray-100">{formData.phone}</strong></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Room:</span> <strong className="text-gray-900 dark:text-gray-100">{formData.roomName}</strong></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Check-in:</span> <strong className="text-gray-900 dark:text-gray-100">{formData.checkInDate} at {formData.checkInTime}</strong></div>
                      <div><span className="text-gray-600 dark:text-gray-400">Check-out:</span> <strong className="text-gray-900 dark:text-gray-100">{formData.checkOutDate} at {formData.checkOutTime}</strong></div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
                      <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Price Breakdown</h4>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Room Rate</span><span>₱{roomRate.toLocaleString()}</span></div>
                      <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Security Deposit</span><span>₱{securityDeposit.toLocaleString()}</span></div>
                      {addOnsTotal > 0 && <div className="flex justify-between text-gray-700 dark:text-gray-300"><span>Add-ons</span><span>₱{addOnsTotal.toLocaleString()}</span></div>}
                      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600 font-bold text-lg">
                        <span className="text-gray-900 dark:text-gray-100">Total</span>
                        <span className="text-brand-primary">₱{totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4 space-y-2 border border-green-200 dark:border-green-800">
                        <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100"><span>Downpayment</span><strong>₱{downPayment.toLocaleString()}</strong></div>
                        <div className="flex justify-between text-sm text-gray-900 dark:text-gray-100"><span>Remaining Balance</span><strong>₱{(totalAmount - downPayment).toLocaleString()}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Payment Method</h3>
                    <div className="space-y-3">
                      {[
                        { value: "gcash", label: "GCash" },
                        { value: "bank", label: "Bank Transfer" },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-3 p-4 border-2 bg-white dark:bg-gray-700 rounded-lg cursor-pointer transition ${
                            formData.paymentMethod === method.value
                              ? "border-brand-primary"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          <input type="radio" name="paymentMethod" value={method.value} checked={formData.paymentMethod === method.value} onChange={handleInputChange} className="w-4 h-4 accent-brand-primary" />
                          <span className="text-gray-900 dark:text-gray-100 font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6">
                      <label className={labelClass}>Upload Proof of Payment *</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "payment")} className="hidden" id="payment-proof" />
                      <label
                        htmlFor="payment-proof"
                        className={`cursor-pointer flex flex-col items-center p-8 border-2 border-dashed bg-gray-50 dark:bg-gray-800 rounded-lg hover:border-brand-primary transition ${
                          errors.paymentProof ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="font-medium text-gray-600 dark:text-gray-300">Click to upload payment screenshot</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                      </label>
                      {errors.paymentProof && <p className="text-red-500 text-xs mt-2">{errors.paymentProof}</p>}
                      {formData.paymentProofPreview && (
                        <div className="mt-4 relative">
                          <Image src={formData.paymentProofPreview} alt="Payment proof" width={300} height={200} className="max-w-xs mx-auto rounded-lg shadow border border-gray-200 dark:border-gray-600" />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, paymentProof: null, paymentProofPreview: "" }))}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                            title="Remove image"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={`flex items-start gap-3 cursor-pointer ${errors.termsAccepted ? "text-red-500" : ""}`}>
                      <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} className="w-5 h-5 mt-1 rounded accent-brand-primary" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">I agree to the Terms and Conditions and Cancellation Policy</span>
                    </label>
                    {errors.termsAccepted && <p className="text-red-500 text-xs mt-2">{errors.termsAccepted}</p>}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6 flex flex-col-reverse sm:flex-row gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold py-3 px-6 rounded-xl transition active:scale-95"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                )}
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-3 px-6 rounded-xl shadow-md transition active:scale-95"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl shadow-md transition active:scale-95 ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {isSubmitting ? "Creating Reservation..." : "Confirm Booking"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewReservationModal;