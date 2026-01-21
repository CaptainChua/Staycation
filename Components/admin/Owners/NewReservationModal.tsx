import { Calendar, User, Users, Mail, Phone, ArrowLeft, Upload, Plus, Minus, CreditCard, AlertCircle, CheckCircle, Clock, Package, Camera, Wallet, Info, ChevronRight, Building2, Receipt, LogIn, LogOut, X as XIcon } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";

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

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bookingData: any) => void;
}

const NewReservationModal = ({ isOpen, onClose, onSubmit }: NewReservationModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [formData, setFormData] = useState({
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
  });

  const [additionalGuests, setAdditionalGuests] = useState<GuestInfo[]>([]);
  const [addOns, setAddOns] = useState<AddOns>({
    poolPass: 0,
    towels: 0,
    bathRobe: 0,
    extraComforter: 0,
    guestKit: 0,
    extraSlippers: 0,
  });

  const getRoomRateFromStayType = (): number => {
    if (!formData.stayType) return 0;
    if (formData.stayType === "10 Hours - ₱1,599") return 1599;
    else if (formData.stayType.includes("weekday")) return 1799;
    else if (formData.stayType.includes("Fri-Sat")) return 1999;
    else if (formData.stayType === "Multi-Day Stay") {
      const numberOfDays = calculateNumberOfDays();
      return 1799 * numberOfDays;
    }
    return 0;
  };

  const calculateNumberOfDays = (): number => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const roomRate = getRoomRateFromStayType();
  const numberOfDays = calculateNumberOfDays();
  const securityDeposit = formData.stayType ? 1000 : 0;
  const downPayment = 500;
  const addOnsTotal = Object.entries(addOns).reduce((total, [key, quantity]) => {
    return total + quantity * ADD_ON_PRICES[key as keyof AddOns];
  }, 0);
  const totalAmount = roomRate + securityDeposit + addOnsTotal;

  const updateAdditionalGuests = (adults: number, children: number) => {
    const totalAdditionalGuests = adults + children - 1;
    setAdditionalGuests(prev => {
      const currentLength = prev.length;
      if (totalAdditionalGuests > currentLength) {
        const newGuests = Array(totalAdditionalGuests - currentLength).fill(null).map(() => ({
          firstName: "",
          lastName: "",
          age: "",
          gender: "",
          validId: null,
          validIdPreview: "",
        }));
        return [...prev, ...newGuests];
      } else if (totalAdditionalGuests < currentLength) {
        return prev.slice(0, totalAdditionalGuests);
      }
      return prev;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === "adults" || name === "children") {
      const newValue = parseInt(value) || 0;
      const currentAdults = name === "adults" ? newValue : formData.adults;
      const currentChildren = name === "children" ? newValue : formData.children;
      const newTotal = currentAdults + currentChildren;

      if (newTotal > 4) {
        alert("Maximum 4 guests allowed (adults + children).");
        return;
      }

      const updatedFormData = {
        ...formData,
        [name]: type === "number" ? newValue : value,
      };
      setFormData(updatedFormData);
      updateAdditionalGuests(currentAdults, currentChildren);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'payment' | 'id', guestIndex?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'payment') {
        setFormData((prev) => ({
          ...prev,
          paymentProof: file,
          paymentProofPreview: URL.createObjectURL(file),
        }));
      } else if (guestIndex === undefined) {
        setFormData((prev) => ({
          ...prev,
          validId: file,
          validIdPreview: URL.createObjectURL(file),
        }));
      } else {
        const updatedGuests = [...additionalGuests];
        updatedGuests[guestIndex].validId = file;
        updatedGuests[guestIndex].validIdPreview = URL.createObjectURL(file);
        setAdditionalGuests(updatedGuests);
      }
    }
  };

  const handleAdditionalGuestChange = (index: number, field: keyof GuestInfo, value: string) => {
    const updatedGuests = [...additionalGuests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setAdditionalGuests(updatedGuests);
  };

  const handleStayTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStayType = e.target.value;
    let defaultCheckInTime = "";
    let defaultCheckOutTime = "";

    if (selectedStayType === "10 Hours - ₱1,599") {
      defaultCheckInTime = "14:00";
      defaultCheckOutTime = "00:00";
    } else if (selectedStayType.includes("21 Hours")) {
      defaultCheckInTime = "14:00";
      defaultCheckOutTime = "11:00";
    } else if (selectedStayType === "Multi-Day Stay") {
      defaultCheckInTime = "14:00";
      defaultCheckOutTime = "11:00";
    }

    setFormData((prev) => ({
      ...prev,
      stayType: selectedStayType,
      checkInTime: defaultCheckInTime,
      checkOutTime: defaultCheckOutTime,
    }));

    if (formData.checkInDate && selectedStayType) {
      const checkInDate = new Date(formData.checkInDate);
      const checkOutDate = new Date(checkInDate);

      if (selectedStayType === "10 Hours - ₱1,599" || selectedStayType.includes("21 Hours")) {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      } else if (selectedStayType === "Multi-Day Stay") {
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      const checkOutStr = checkOutDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, checkOutDate: checkOutStr }));
    }
  };

  const handleAddOnChange = (item: keyof AddOns, increment: boolean) => {
    setAddOns((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] + (increment ? 1 : -1)),
    }));
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
      setCompletedSteps(prev => [...prev, 1]);
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCompletedSteps(prev => [...prev, 2]);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCompletedSteps(prev => [...prev, 3]);
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    const bookingData = {
      ...formData,
      additionalGuests,
      addOns,
      roomRate,
      securityDeposit,
      addOnsTotal,
      totalAmount,
      downPayment,
      remainingBalance: totalAmount - downPayment,
    };

    onSubmit(bookingData);
  };

  if (!isOpen) return null;

  const getStepTitle = () => {
    const titles = ["Guest Information", "Booking Details", "Optional Add-ons", "Payment & Review"];
    return titles[currentStep - 1];
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300";
  const sectionClass = "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl p-6";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-orange-500 text-white p-6 rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{getStepTitle()}</h2>
            <p className="text-sm opacity-90">Step {currentStep} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all font-semibold ${
                    completedSteps.includes(step) 
                      ? "bg-green-500 text-white" 
                      : currentStep === step 
                      ? "bg-orange-500 text-white" 
                      : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  }`}>
                    {completedSteps.includes(step) ? <CheckCircle className="w-6 h-6" /> : step}
                  </div>
                  <span className={`text-xs font-medium text-center ${
                    completedSteps.includes(step) || currentStep === step 
                      ? "text-orange-500" 
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    {["Guest", "Booking", "Add-ons", "Payment"][idx]}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-2 -mt-8 ${
                    completedSteps.includes(step) 
                      ? "bg-green-500" 
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Guest Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <User className="w-5 h-5 text-orange-500" />
                      Main Guest Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={inputClass} placeholder="Enter first name" />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className={inputClass} placeholder="Enter last name" />
                      </div>
                      <div>
                        <label className={labelClass}>Age *</label>
                        <input type="number" name="age" value={formData.age} onChange={handleInputChange} required min="1" max="120" className={inputClass} placeholder="Enter age" />
                      </div>
                      <div>
                        <label className={labelClass}>Gender *</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} required className={inputClass}>
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} placeholder="Enter email" />
                      </div>
                      <div>
                        <label className={labelClass}>Phone *</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className={inputClass} placeholder="e.g., 9123456789" />
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Valid ID (Required for 10+ years old)
                    </h4>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'id')} className="hidden" id="valid-id" />
                    <label htmlFor="valid-id" className="cursor-pointer flex flex-col items-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition">
                      <Upload className="w-12 h-12 text-blue-500 mb-3" />
                      <p className="text-blue-600 dark:text-blue-400 font-medium">Click to upload ID</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                    </label>
                    {formData.validIdPreview && (
                      <div className="mt-4">
                        <Image src={formData.validIdPreview} alt="ID preview" width={300} height={200} className="max-w-xs mx-auto rounded-lg shadow border border-gray-200 dark:border-gray-600" />
                      </div>
                    )}
                  </div>

                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="w-5 h-5 text-orange-500" />
                      Number of Guests
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Adults *</label>
                        <input type="number" name="adults" value={formData.adults} onChange={handleInputChange} min="1" max="4" required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Children</label>
                        <input type="number" name="children" value={formData.children} onChange={handleInputChange} min="0" max="4" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Infants</label>
                        <input type="number" name="infants" value={formData.infants} onChange={handleInputChange} min="0" max="2" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {additionalGuests.map((guest, index) => (
                    <div key={index} className={sectionClass}>
                      <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <User className="w-5 h-5 text-orange-500" />
                        {index < formData.adults - 1 ? `Adult ${index + 2}` : `Child ${index - (formData.adults - 1) + 1}`}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" value={guest.firstName} onChange={(e) => handleAdditionalGuestChange(index, 'firstName', e.target.value)} placeholder="First Name" className={inputClass} />
                        <input type="text" value={guest.lastName} onChange={(e) => handleAdditionalGuestChange(index, 'lastName', e.target.value)} placeholder="Last Name" className={inputClass} />
                        <input type="number" value={guest.age} onChange={(e) => handleAdditionalGuestChange(index, 'age', e.target.value)} placeholder="Age" className={inputClass} />
                        <select value={guest.gender} onChange={(e) => handleAdditionalGuestChange(index, 'gender', e.target.value)} className={inputClass}>
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
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
                        <input type="text" name="roomName" value={formData.roomName} onChange={handleInputChange} required className={inputClass} placeholder="Enter room/haven name" />
                      </div>
                      <div>
                        <label className={labelClass}>Stay Type *</label>
                        <select name="stayType" value={formData.stayType} onChange={handleStayTypeChange} required className={inputClass}>
                          <option value="">Select Stay Type</option>
                          <option value="10 Hours - ₱1,599">10 Hours - ₱1,599</option>
                          <option value="21 Hours (Sun-Thu weekday) - ₱1,799">21 Hours (Weekday) - ₱1,799</option>
                          <option value="21 Hours (Fri-Sat) - ₱1,999">21 Hours (Weekend) - ₱1,999</option>
                          <option value="Multi-Day Stay">Multi-Day Stay</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Dates & Times</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Check-in Date *</label>
                        <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleInputChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Check-out Date *</label>
                        <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleInputChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Check-in Time *</label>
                        <input type="time" name="checkInTime" value={formData.checkInTime} onChange={handleInputChange} required className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Check-out Time *</label>
                        <input type="time" name="checkOutTime" value={formData.checkOutTime} onChange={handleInputChange} required className={inputClass} />
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
                      {[
                        { key: "poolPass", label: "Pool Pass", price: ADD_ON_PRICES.poolPass },
                        { key: "towels", label: "Towels", price: ADD_ON_PRICES.towels },
                        { key: "bathRobe", label: "Bath Robe", price: ADD_ON_PRICES.bathRobe },
                        { key: "extraComforter", label: "Extra Comforter", price: ADD_ON_PRICES.extraComforter },
                        { key: "guestKit", label: "Guest Kit", price: ADD_ON_PRICES.guestKit },
                        { key: "extraSlippers", label: "Extra Slippers", price: ADD_ON_PRICES.extraSlippers },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">₱{item.price} each</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => handleAddOnChange(item.key as keyof AddOns, false)}
                              className="w-8 h-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-full flex items-center justify-center transition">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900 dark:text-gray-100">{addOns[item.key as keyof AddOns]}</span>
                            <button type="button" onClick={() => handleAddOnChange(item.key as keyof AddOns, true)}
                              className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-gray-900 dark:text-gray-100"><strong>Add-ons Total:</strong> ₱{addOnsTotal.toLocaleString()}</p>
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
                        <span className="text-orange-500">₱{totalAmount.toLocaleString()}</span>
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
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 transition">
                        <input type="radio" name="paymentMethod" value="gcash" checked={formData.paymentMethod === "gcash"} onChange={handleInputChange} className="w-4 h-4 text-orange-500 focus:ring-orange-500" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">GCash</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 transition">
                        <input type="radio" name="paymentMethod" value="bank" checked={formData.paymentMethod === "bank"} onChange={handleInputChange} className="w-4 h-4 text-orange-500 focus:ring-orange-500" />
                        <span className="text-gray-900 dark:text-gray-100 font-medium">Bank Transfer</span>
                      </label>
                    </div>

                    <div className="mt-6">
                      <label className={labelClass}>Upload Proof of Payment *</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'payment')} className="hidden" id="payment-proof" />
                      <label htmlFor="payment-proof" className="cursor-pointer flex flex-col items-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded-lg hover:border-orange-500 dark:hover:border-orange-400 transition">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="font-medium text-gray-600 dark:text-gray-300">Click to upload payment screenshot</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                      </label>
                      {formData.paymentProofPreview && (
                        <div className="mt-4">
                          <Image src={formData.paymentProofPreview} alt="Payment proof" width={300} height={200} className="max-w-xs mx-auto rounded-lg shadow border border-gray-200 dark:border-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleInputChange} className="w-5 h-5 mt-1 text-orange-500 focus:ring-orange-500 rounded" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">I agree to the Terms and Conditions and Cancellation Policy</span>
                    </label>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 rounded-b-2xl flex gap-4 flex-shrink-0">
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={handleBack}
              className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold py-3 px-6 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button 
              type="button" 
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Next Step
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              type="submit" 
              onClick={handleSubmit}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewReservationModal;