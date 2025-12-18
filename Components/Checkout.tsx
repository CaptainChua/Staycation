"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setCheckInDate, setCheckOutDate } from "@/redux/slices/bookingSlice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DatePicker } from "@nextui-org/date-picker";
import { TimeInput } from "@nextui-org/date-input";
import { parseDate, parseTime } from "@internationalized/date";
import type { DateValue } from "@react-types/calendar";
import type { TimeValue } from "@react-types/datepicker";
import axios from "axios";
import {
  Calendar,
  Users,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Upload,
  Plus,
  Minus,
  Clock,
  Home,
  CreditCard,
} from "lucide-react";
import Spinner from "./Spinner";

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

const Checkout = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const bookingData = useAppSelector((state) => state.booking);
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Guest Info, 2 = Confirmation & Payment

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    adults: 1,
    children: 0,
    infants: 0,
    checkInTime: "",
    checkOutTime: "",
    facebookLink: "",
    paymentProof: null as File | null,
    paymentProofPreview: "",
    termsAccepted: false,
    paymentMethod: "gcash",
  });

  const [addOns, setAddOns] = useState<AddOns>({
    poolPass: 0,
    towels: 0,
    bathRobe: 0,
    extraComforter: 0,
    guestKit: 0,
    extraSlippers: 0,
  });

  const totalGuests = formData.adults + formData.children + formData.infants;

  // Calculate room rate from selected room or booking data
  const roomRate = bookingData.selectedRoom?.price
    ? parseInt(bookingData.selectedRoom.price.replace(/[₱,]/g, ""))
    : bookingData.stayType?.price
    ? parseInt(bookingData.stayType.price.replace(/[₱,]/g, ""))
    : 1799;

  const securityDeposit = 1000;
  const downPayment = 500;

  // Calculate add-ons total
  const addOnsTotal = Object.entries(addOns).reduce((total, [key, quantity]) => {
    return total + quantity * ADD_ON_PRICES[key as keyof AddOns];
  }, 0);

  const totalAmount = roomRate + securityDeposit + addOnsTotal;
  const remainingBalance = totalAmount - downPayment;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value) || 0
          : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        paymentProof: file,
        paymentProofPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleAddOnChange = (item: keyof AddOns, increment: boolean) => {
    setAddOns((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] + (increment ? 1 : -1)),
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate Step 1
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        alert("Please fill in all required fields");
        return;
      }
      if (totalGuests > 4) {
        alert("Maximum 4 guests allowed");
        return;
      }
      if (!formData.checkInTime || !formData.checkOutTime) {
        alert("Please select check-in and check-out times");
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      router.back();
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate required fields
  if (
    !formData.firstName ||
    !formData.lastName ||
    !formData.email ||
    !formData.phone ||
    !formData.paymentProof ||
    !formData.termsAccepted
  ) {
    alert("Please fill in all required fields, upload proof of payment, and accept terms");
    return;
  }

  try {
    setIsLoading(true);

    // Generate booking ID
    const bookingId = `BK${Date.now()}`;

    // Convert payment proof to base64 if it's a File
    let paymentProofBase64 = '';
    if (formData.paymentProof) {
      const reader = new FileReader();
      paymentProofBase64 = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(formData.paymentProof as File);
      });
    }

    // Prepare booking data for database
    const bookingRequestData = {
      booking_id: bookingId,
      user_id: (session?.user as any)?.id || null, // NULL for guest, UUID for logged-in users
      guest_first_name: formData.firstName,
      guest_last_name: formData.lastName,
      guest_email: formData.email,
      guest_phone: formData.phone,
      room_name: bookingData.selectedRoom?.name || bookingData.location?.name || 'Standard Room',
      check_in_date: bookingData.checkInDate,
      check_out_date: bookingData.checkOutDate,
      check_in_time: formData.checkInTime,
      check_out_time: formData.checkOutTime,
      adults: formData.adults,
      children: formData.children,
      infants: formData.infants,
      facebook_link: formData.facebookLink,
      payment_method: formData.paymentMethod,
      payment_proof: paymentProofBase64,
      room_rate: roomRate,
      security_deposit: securityDeposit,
      add_ons_total: addOnsTotal,
      total_amount: totalAmount,
      down_payment: downPayment,
      remaining_balance: remainingBalance,
      add_ons: addOns,
    };

    // Save booking to database
    const response = await axios.post('/api/bookings', bookingRequestData);

    if (response.data.success) {
      alert(`Booking Submitted Successfully!\n\nYour booking ID is: ${bookingId}\n\nStatus: Pending Admin Approval\n\nYou will receive a confirmation email once the admin approves your booking.`);

      // Clear form and redirect
      router.push('/');
    } else {
      setIsLoading(false);
      alert('Failed to create booking. Please try again or contact support.');
    }

  } catch (error) {
    setIsLoading(false);
    console.error('Booking error:', error);
    alert('An error occurred. Please try again or contact support.');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {currentStep === 1 ? "Guest Information" : "Confirm Your Booking"}
          </h1>
          <p className="text-gray-600">
            {currentStep === 1
              ? "Please fill in your details"
              : "Review your booking and complete payment"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                currentStep === 1 ? "text-orange-600" : "text-green-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 1
                    ? "bg-orange-600 text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {currentStep === 1 ? "1" : "✓"}
              </div>
              <span className="font-medium">Guest Info</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div
              className={`flex items-center gap-2 ${
                currentStep === 2 ? "text-orange-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 2
                    ? "bg-orange-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative overflow-hidden">
          {/* STEP 1: Guest Information */}
          {currentStep === 1 && (
            <div className="space-y-6 slide-in-from-right">
              {/* Guest Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <User className="w-6 h-6 text-orange-500" />
                  Guest Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter firstname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter lastname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Number of Guests */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-orange-500" />
                  Number of Guests (Max 4 guests)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adults
                    </label>
                    <input
                      type="number"
                      name="adults"
                      value={formData.adults}
                      onChange={handleInputChange}
                      min="1"
                      max="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children
                    </label>
                    <input
                      type="number"
                      name="children"
                      value={formData.children}
                      onChange={handleInputChange}
                      min="0"
                      max="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Infants
                    </label>
                    <input
                      type="number"
                      name="infants"
                      value={formData.infants}
                      onChange={handleInputChange}
                      min="0"
                      max="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mt-2">
                  Total Guests: {totalGuests} / 4
                </p>
              </div>

              {/* Booking Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-orange-500" />
                  Booking Details
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Haven
                      </label>
                      <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                        <Home className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">
                          {bookingData.selectedRoom?.name || bookingData.location?.name || "Not selected"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stay Type
                      </label>
                      <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">
                          {bookingData.selectedRoom?.pricePerNight || bookingData.stayType?.duration || "Not selected"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <DatePicker
                        label="Check-in Date *"
                        value={bookingData.checkInDate ? parseDate(bookingData.checkInDate) as any : undefined}
                        onChange={(date: any) => {
                          if (date) {
                            const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                            dispatch(setCheckInDate(dateStr));
                          }
                        }}
                        isRequired
                        classNames={{
                          base: "w-full",
                          label: "text-sm font-medium text-gray-700",
                        }}
                      />
                    </div>

                    <div>
                      <DatePicker
                        label="Check-out Date *"
                        value={bookingData.checkOutDate ? parseDate(bookingData.checkOutDate) as any : undefined}
                        onChange={(date: any) => {
                          if (date) {
                            const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                            dispatch(setCheckOutDate(dateStr));
                          }
                        }}
                        isRequired
                        classNames={{
                          base: "w-full",
                          label: "text-sm font-medium text-gray-700",
                        }}
                      />
                    </div>

                    <div>
                      <TimeInput
                        label="Check-in Time *"
                        value={formData.checkInTime ? parseTime(formData.checkInTime) as any : undefined}
                        onChange={(time: any) => {
                          if (time) {
                            const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                            setFormData({
                              ...formData,
                              checkInTime: timeStr,
                            });
                          }
                        }}
                        isRequired
                        classNames={{
                          base: "w-full",
                          label: "text-sm font-medium text-gray-700",
                        }}
                      />
                    </div>

                    <div>
                      <TimeInput
                        label="Check-out Time *"
                        value={formData.checkOutTime ? parseTime(formData.checkOutTime) as any : undefined}
                        onChange={(time: any) => {
                          if (time) {
                            const timeStr = `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
                            setFormData({
                              ...formData,
                              checkOutTime: timeStr,
                            });
                          }
                        }}
                        isRequired
                        classNames={{
                          base: "w-full",
                          label: "text-sm font-medium text-gray-700",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-orange-500" />
                  Pricing Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Room Rate</span>
                    <span className="font-semibold">₱{roomRate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Security Deposit</span>
                    <span className="font-semibold">₱{securityDeposit.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-gray-800">Total</span>
                      <span className="text-2xl font-bold text-orange-500">
                        ₱{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center text-green-600 mb-2">
                      <span className="font-medium">💳 Down payment (Pay Online)</span>
                      <span className="font-bold">₱{downPayment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span className="font-medium">Remaining Balance (Pay Upon Check-in)</span>
                      <span className="font-bold">₱{remainingBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Security deposit is refundable the next day upon
                    checkout if no missing/broken items.
                  </p>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Next: Confirmation & Payment
              </button>
            </div>
          )}

          {/* STEP 2: Confirmation & Payment */}
          {currentStep === 2 && (
            <div className="space-y-6 slide-in-from-right">
              {/* Confirmation Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Confirm Your Details
                </h2>
                <p className="text-gray-600 mb-6">
                  Please review your information before proceeding to payment. This is the final
                  step.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Guest Name</p>
                    <p className="font-semibold">
                      {formData.firstName} {formData.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-semibold">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-semibold">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Guests</p>
                    <p className="font-semibold">
                      {formData.adults} Adult{formData.adults !== 1 ? "s" : ""}
                      {formData.children > 0 && `, ${formData.children} Child${formData.children !== 1 ? "ren" : ""}`}
                      {formData.infants > 0 && `, ${formData.infants} Infant${formData.infants !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Image & Facebook */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Additional Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Facebook Name or Link *
                    </label>
                    <input
                      type="text"
                      name="facebookLink"
                      value={formData.facebookLink}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="facebook.com/yourname or Your Facebook Name"
                    />
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Add-ons (Optional)</h2>

                <div className="space-y-3">
                  {[
                    { key: "poolPass", label: "Pool Pass", price: ADD_ON_PRICES.poolPass },
                    { key: "towels", label: "Towels", price: ADD_ON_PRICES.towels },
                    { key: "bathRobe", label: "Bath Robe", price: ADD_ON_PRICES.bathRobe },
                    {
                      key: "extraComforter",
                      label: "Extra Comforter",
                      price: ADD_ON_PRICES.extraComforter,
                    },
                    { key: "guestKit", label: "Guest Kit", price: ADD_ON_PRICES.guestKit },
                    {
                      key: "extraSlippers",
                      label: "Extra Slippers",
                      price: ADD_ON_PRICES.extraSlippers,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-600">₱{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAddOnChange(item.key as keyof AddOns, false)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {addOns[item.key as keyof AddOns]}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOnChange(item.key as keyof AddOns, true)}
                          className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {addOnsTotal > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Add-ons Total:</strong> ₱{addOnsTotal.toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> Add-ons will be added to your total bill and reflected
                    in the price breakdown below.
                  </p>
                </div>
              </div>

              {/* Stay Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Stay Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">📥 Check-in:</span>
                    <span className="font-semibold">
                      {bookingData.checkInDate
                        ? new Date(bookingData.checkInDate).toLocaleDateString()
                        : "N/A"}{" "}
                      {formData.checkInTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">📤 Check-out:</span>
                    <span className="font-semibold">
                      {bookingData.checkOutDate
                        ? new Date(bookingData.checkOutDate).toLocaleDateString()
                        : "N/A"}{" "}
                      {formData.checkOutTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Stay Type:</span>
                    <span className="font-semibold">{bookingData.stayType?.duration || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Guests:</span>
                    <span className="font-semibold">
                      {totalGuests} guest{totalGuests !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t pt-4">
                  <h3 className="font-bold text-lg mb-4">Price Breakdown</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Room Rate</span>
                      <span className="font-semibold">₱{roomRate.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Security Deposit</span>
                      <span className="font-semibold">₱{securityDeposit.toLocaleString()}</span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">Add-ons</span>
                        <span className="font-semibold">₱{addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-bold text-lg">
                      <span>Total</span>
                      <span className="text-orange-500">₱{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                    <h4 className="font-bold text-green-800">💳 Payment</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Downpayment (Pay Online to Secure Booking)</span>
                      <span className="font-bold text-green-800">₱{downPayment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700">Remaining Balance (Pay Upon Check-in)</span>
                      <span className="font-bold text-green-800">
                        ₱{(totalAmount - downPayment).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Security deposit is refundable the next day upon
                      checkout if no missing/broken items.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h2>

                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={formData.paymentMethod === "gcash"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="font-medium">GCash</span>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={formData.paymentMethod === "bank"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-500"
                    />
                    <span className="font-medium">Bank Transfer</span>
                  </label>
                </div>

                {/* Payment Instructions */}
                {formData.paymentMethod === "gcash" ? (
                  // GCash Payment - Show QR Code
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">
                      💳 Pay via GCash
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Scan the QR code below to pay your <strong>DOWNPAYMENT of ₱{downPayment}</strong> to
                      secure your booking
                    </p>

                    <div className="bg-white rounded-lg p-8 text-center mb-4">
                      <div className="w-64 h-64 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">GCash QR Code will be loaded here</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="font-semibold">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open your GCash app</li>
                        <li>Tap &quot;Send Money&quot; or &quot;Pay QR&quot;</li>
                        <li>Scan the QR code above</li>
                        <li>Enter amount: ₱{downPayment}</li>
                        <li>Complete the payment</li>
                        <li>Upload screenshot below</li>
                      </ol>
                    </div>

                    {/* Important Note */}
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Note:</p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• Make sure to pay the exact downpayment amount</li>
                        <li>• Screenshot must be clear and show transaction details</li>
                        <li>• Your booking will be confirmed once payment is verified</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Bank Transfer Payment - Show Bank Details
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">
                      🏦 Pay via Bank Transfer
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Transfer your <strong>DOWNPAYMENT of ₱{downPayment}</strong> to the account below
                    </p>

                    {/* Bank Account Details */}
                    <div className="bg-white rounded-lg p-6 mb-4 space-y-3">
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600 font-medium">Bank Name:</span>
                        <span className="font-bold text-gray-800">BDO Unibank</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600 font-medium">Account Name:</span>
                        <span className="font-bold text-gray-800">Staycation Haven Inc.</span>
                      </div>
                      <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-gray-600 font-medium">Account Number:</span>
                        <span className="font-bold text-gray-800">0123-4567-8901</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Amount:</span>
                        <span className="font-bold text-green-600 text-xl">₱{downPayment}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="font-semibold">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open your banking app or visit your bank</li>
                        <li>Select &quot;Transfer to Another Account&quot;</li>
                        <li>Enter the bank details above</li>
                        <li>Transfer exactly ₱{downPayment}</li>
                        <li>Save your transaction receipt</li>
                        <li>Upload proof of payment below</li>
                      </ol>
                    </div>

                    {/* Important Note */}
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Important Note:</p>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• Transfer the exact downpayment amount to avoid delays</li>
                        <li>• Bank transfers may take 1-3 business days to process</li>
                        <li>• Ensure your proof of payment shows complete transaction details</li>
                        <li>• Include reference number in your upload</li>
                        <li>• Your booking will be confirmed after bank verification</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Upload Proof of Payment */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📷 Upload Proof of Payment *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                      id="payment-proof"
                    />
                    <label htmlFor="payment-proof" className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        Click to upload payment screenshot
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                    </label>
                    {formData.paymentProofPreview && (
                      <div className="mt-4">
                        <img
                          src={formData.paymentProofPreview}
                          alt="Payment proof preview"
                          className="max-w-xs mx-auto rounded-lg shadow-md"
                        />
                        <p className="text-sm text-green-600 mt-2">✓ File uploaded</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Important:</strong> Your booking will be pending until the CSR verifies
                    your payment. Please ensure the screenshot clearly shows the transaction amount
                    and details.
                  </p>
                </div>

                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Note:</strong> Down payments are non-refundable if you cancel your
                    bookings.
                  </p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-orange-500 mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{" "}
                    <a href="#" className="text-orange-500 hover:underline">
                      Terms and Conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-orange-500 hover:underline">
                      Cancellation Policy
                    </a>
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 rounded-lg transition-all duration-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Confirm to Stay'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Checkout;