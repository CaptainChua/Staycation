"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { setCheckInDate, setCheckOutDate, setSelectedRoom, setGuests as setReduxGuests } from "@/redux/slices/bookingSlice";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SidebarLayout from "./SidebarLayout";
import { useGetRoomBookingsQuery, useCreateBookingMutation } from "@/redux/api/bookingsApi";
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
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Camera,
  Wallet,
  Info,
  ChevronRight,
  Building2,
  Receipt,
  LogIn,
  LogOut,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import Footer from "@/Components/Footer";
import DateRangePicker from "@/Components/HeroSection/DateRangePicker";
import GuestSelector from "@/Components/HeroSection/GuestSelector";
import { formatDateSafe } from "@/lib/dateUtils";

interface AddOns {
  poolPass: number;
  towels: number;
  bathRobe: number;
  extraComforter: number;
  guestKit: number;
  extraSlippers: number;
}

interface Booking {
  status: string;
  check_in_date: string;
  check_out_date: string;
  check_in_time?: string;
  check_out_time?: string;
  stay_type?: string;
}

interface BlockedDate {
  from_date: string;
  to_date: string;
}

interface SessionUser {
  id?: string;
  role?: string;
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
  const [currentStep, setCurrentStep] = useState(1); // 1 = Guest Info, 2 = Booking Details, 3 = Add-ons, 4 = Payment
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [bookingIdState] = useState(() => `BK${Date.now()}`);
  const [isMobileLoading, setIsMobileLoading] = useState(false);
  // Local state for date and guest selection (synced with Redux)
  const [localCheckInDate, setLocalCheckInDate] = useState(bookingData.checkInDate || "");
  const [localCheckOutDate, setLocalCheckOutDate] = useState(bookingData.checkOutDate || "");
  const [localGuests, setLocalGuests] = useState(bookingData.guests || {
    adults: 1,
    children: 0,
    infants: 0,
  });

  // Fetch existing bookings for the selected room
  const { data: roomBookingsData } = useGetRoomBookingsQuery(
    bookingData.selectedRoom?.id || '',
    { skip: !bookingData.selectedRoom?.id }
  );

  // Debug: Log the selected room and bookings data
  useEffect(() => {
    console.log('[Checkout] Selected Room:', bookingData.selectedRoom);
    console.log('[Checkout] Room Bookings Data:', roomBookingsData);
    if (roomBookingsData?.data) {
      console.log('[Checkout] Number of bookings found:', roomBookingsData.data.length);
      console.log('[Checkout] Booking details:', roomBookingsData.data);
    }
  }, [bookingData.selectedRoom, roomBookingsData]);

  // Debug: Log booking data from Redux
  useEffect(() => {
    console.log('[Checkout] Booking Data from Redux:', bookingData);
    console.log('[Checkout] isFromSearch:', bookingData.isFromSearch);
    console.log('[Checkout] Check-in Date:', bookingData.checkInDate);
    console.log('[Checkout] Check-out Date:', bookingData.checkOutDate);
    console.log('[Checkout] Guests from Redux:', bookingData.guests);
  }, [bookingData]);

  // Debug: Log when dates change
  useEffect(() => {
    console.log('[Checkout] Check-in date changed:', bookingData.checkInDate);
    console.log('[Checkout] Check-out date changed:', bookingData.checkOutDate);
  }, [bookingData.checkInDate, bookingData.checkOutDate]);

  // Track if initial sync from Redux is done
  const initialSyncDone = useRef(false);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dateDropdown = document.getElementById('mobile-date-dropdown');
      const guestDropdown = document.getElementById('mobile-guest-dropdown');
      
      // Check if click is outside both dropdowns and not on the trigger buttons
      if (dateDropdown && !dateDropdown.contains(target) && 
          guestDropdown && !guestDropdown.contains(target) &&
          !target.closest('[data-dropdown-trigger]')) {
        dateDropdown.classList.add('hidden');
        guestDropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize local state from Redux ONLY on first mount
  useEffect(() => {
    if (!initialSyncDone.current) {
      if (bookingData.checkInDate) setLocalCheckInDate(bookingData.checkInDate);
      if (bookingData.checkOutDate) setLocalCheckOutDate(bookingData.checkOutDate);
      if (bookingData.guests) setLocalGuests(bookingData.guests);
      initialSyncDone.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local dates to Redux (only when local state changes, not from Redux)
  useEffect(() => {
    if (initialSyncDone.current && localCheckInDate) {
      dispatch(setCheckInDate(localCheckInDate));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCheckInDate]);

  useEffect(() => {
    if (initialSyncDone.current && localCheckOutDate) {
      dispatch(setCheckOutDate(localCheckOutDate));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCheckOutDate]);

  // Sync local guests to Redux and formData
  useEffect(() => {
    if (initialSyncDone.current && localGuests) {
      dispatch(setReduxGuests(localGuests));
      // Also update formData to keep in sync
      setFormData(prev => ({
        ...prev,
        adults: localGuests.adults,
        children: localGuests.children,
        infants: localGuests.infants,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localGuests]);

  // Handler for GuestSelector component
  const handleGuestChange = (type: keyof typeof localGuests, value: number) => {
    // Check if the new total exceeds maximum (4 for adults + children)
    if (type === 'adults' || type === 'children') {
      const newAdults = type === 'adults' ? value : localGuests.adults;
      const newChildren = type === 'children' ? value : localGuests.children;
      const newTotal = newAdults + newChildren;

      if (newTotal > 4) {
        toast.error("Maximum 4 guests allowed (adults + children). Infants are not counted.");
        return;
      }
    }

    setLocalGuests(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  // RTK Query mutation for creating bookings
  const [createBooking] = useCreateBookingMutation();

  interface GuestInfo {
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
    validId: File | null;
    validIdPreview: string;
  }

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
    checkInTime: "",
    checkOutTime: "",
    paymentProof: null as File | null,
    paymentProofPreview: "",
    termsAccepted: false,
    paymentMethod: "gcash",
  });

  const [additionalGuests, setAdditionalGuests] = useState<GuestInfo[]>([]);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);

  interface PaymentMethod {
    id: string;
    payment_name: string;
    payment_method: string;
    provider: string;
    account_details: string;
    payment_qr_link?: string;
    is_active: boolean;
    description?: string;
    created_at: string;
    updated_at: string;
  }

  const [addOns, setAddOns] = useState<AddOns>({
    poolPass: 0,
    towels: 0,
    bathRobe: 0,
    extraComforter: 0,
    guestKit: 0,
    extraSlippers: 0,
  });

  // Auto-adjust dates based on stay type selection
  useEffect(() => {
    if (formData.stayType && localCheckInDate) {
      if (formData.stayType === "10 Hours - ₱1,599") {
        // For 10 hours stay, check-out should be same day as check-in
        if (localCheckOutDate !== localCheckInDate) {
          setLocalCheckOutDate(localCheckInDate);
          toast.success("Check-out date adjusted to same day for 10-hour stay");
        }
      } else if (formData.stayType.includes("21 Hours")) {
        // For 21 hours stay, check-out should be next day
        const checkIn = new Date(localCheckInDate);
        const nextDay = new Date(checkIn);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

        if (localCheckOutDate !== nextDayStr) {
          setLocalCheckOutDate(nextDayStr);
          toast.success("Check-out date adjusted to next day for 21-hour stay");
        }
      }
      // For Multi-Day Stay, user can choose any date range
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.stayType, localCheckInDate]);

  // Fetch payment methods from API
  const fetchPaymentMethods = async () => {
    setIsLoadingPaymentMethods(true);
    try {
      const response = await fetch('/api/payment-methods');
      const data = await response.json();
      
      if (data.success) {
        // Filter out cash payment method and only show active payment methods
        const filteredMethods = data.data.filter((method: PaymentMethod) => 
          method.is_active && method.payment_method.toLowerCase() !== 'cash'
        );
        setPaymentMethods(filteredMethods);
        
        // Set default payment method if available
        if (filteredMethods.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            paymentMethod: filteredMethods[0].payment_method 
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  // Load payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Get selected payment method details
  const getSelectedPaymentMethod = (): PaymentMethod | null => {
    return paymentMethods.find(method => method.payment_method === formData.paymentMethod) || null;
  };

  // Validate date range for selected stay type
  const getDateRangeWarning = useCallback(() => {
    if (!localCheckInDate || !localCheckOutDate || !formData.stayType) return null;

    const checkIn = new Date(localCheckInDate);
    const checkOut = new Date(localCheckOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (formData.stayType === "10 Hours - ₱1,599" && diffDays > 0) {
      return "For 10-hour stays, check-in and check-out should be on the same day. The dates will be auto-adjusted.";
    }

    if (formData.stayType.includes("21 Hours") && diffDays !== 1) {
      return "For 21-hour stays, check-out should be the next day after check-in. The dates will be auto-adjusted.";
    }

    if (formData.stayType === "Multi-Day Stay" && diffDays < 2) {
      return "For multi-day stays, please select at least 2 nights.";
    }

    return null;
  }, [localCheckInDate, localCheckOutDate, formData.stayType]);

  // Persistence Key
  const STORAGE_KEY = 'staycation_checkout_data';

  // Load from storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        // Restore formData (excluding files)
        if (parsed.formData) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
        }
        
        // Restore additionalGuests (excluding files)
        if (parsed.additionalGuests) {
          setAdditionalGuests(parsed.additionalGuests);
        }
        
        // Restore AddOns
        if (parsed.addOns) {
          setAddOns(parsed.addOns);
        }
        
        // Restore Step
        if (parsed.currentStep && typeof parsed.currentStep === 'number' && parsed.currentStep <= 4) {
           setCurrentStep(parsed.currentStep);
           setCompletedSteps(Array.from({length: parsed.currentStep - 1}, (_, i) => i + 1));
        }

        // Restore Booking Data (Redux)
        if (parsed.bookingData) {
            if (parsed.bookingData.checkInDate) dispatch(setCheckInDate(parsed.bookingData.checkInDate));
            if (parsed.bookingData.checkOutDate) dispatch(setCheckOutDate(parsed.bookingData.checkOutDate));
            if (parsed.bookingData.selectedRoom) dispatch(setSelectedRoom(parsed.bookingData.selectedRoom));
        }

      } catch (e) {
        console.error("Failed to restore checkout data", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to storage on change
  useEffect(() => {
    // Filter out File objects and Previews from formData
    const { validId, validIdPreview, paymentProof, paymentProofPreview, ...cleanFormData } = formData;
    
    // Filter out File objects from additionalGuests
    const cleanAdditionalGuests = additionalGuests.map(g => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { validId: _v, validIdPreview: _vp, ...rest } = g;
      return rest;
    });

    const dataToSave = {
      formData: cleanFormData,
      additionalGuests: cleanAdditionalGuests,
      addOns,
      currentStep,
      bookingData // Save Redux state
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, additionalGuests, addOns, currentStep, bookingData]);

  // Calculate number of days for multi-day stay
  const calculateNumberOfDays = (): number => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) return 0;

    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);

    // Calculate difference in milliseconds
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Calculate room rate from selected stay type
  const getRoomRateFromStayType = (): number => {
    if (!formData.stayType) return 0; // Return 0 if no stay type selected

    if (formData.stayType === "10 Hours - ₱1,599") {
      return 1599;
    } else if (formData.stayType.includes("weekday")) {
      return 1799;
    } else if (formData.stayType.includes("Fri-Sat")) {
      return 1999;
    } else if (formData.stayType === "Multi-Day Stay") {
      // For multi-day, calculate: base rate × number of days
      const baseRate = bookingData.selectedRoom?.price
        ? parseInt(bookingData.selectedRoom.price.replace(/[₱,]/g, ""))
        : 1799;

      const numberOfDays = calculateNumberOfDays();
      return baseRate * numberOfDays;
    }
    return 0;
  };

  const roomRate = getRoomRateFromStayType();
  const numberOfDays = calculateNumberOfDays();
  const securityDeposit = formData.stayType ? 1000 : 0; // Only show if stay type selected
  const downPayment = 500;

  // Calculate add-ons total
  const addOnsTotal = Object.entries(addOns).reduce((total, [key, quantity]) => {
    return total + quantity * ADD_ON_PRICES[key as keyof AddOns];
  }, 0);

  // Total amount for payment record (excluding security deposit - it's tracked separately)
  const totalAmount = Math.round((roomRate + addOnsTotal) * 100) / 100;
  const remainingBalance = Math.round((totalAmount - downPayment) * 100) / 100;

  // Display total includes security deposit for UI purposes
  const displayTotal = totalAmount + securityDeposit;

  // Update additional guests array when adults/children count changes
  const updateAdditionalGuests = (adults: number, children: number) => {
    const totalAdditionalGuests = adults + children - 1; // -1 for main guest
    setAdditionalGuests(prev => {
      const currentLength = prev.length;

      if (totalAdditionalGuests > currentLength) {
        // Add new guests
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
        // Remove excess guests
        return prev.slice(0, totalAdditionalGuests);
      }
      return prev;
    });
  };

  // Auto-populate guest counts from Redux when component mounts or when booking data changes
  useEffect(() => {
    if (bookingData.isFromSearch && bookingData.guests) {
      console.log('[Checkout] Auto-populating guest counts from Redux:', bookingData.guests);
      setFormData(prev => ({
        ...prev,
        adults: bookingData.guests.adults || 1,
        children: bookingData.guests.children || 0,
        infants: bookingData.guests.infants || 0,
      }));

      // Update additional guests array based on the guest counts
      const totalAdditionalGuests = (bookingData.guests.adults || 1) + (bookingData.guests.children || 0) - 1;
      if (totalAdditionalGuests > 0) {
        updateAdditionalGuests(bookingData.guests.adults || 1, bookingData.guests.children || 0);
      }
    }
  }, [bookingData.isFromSearch, bookingData.guests]);

  // Helper function to check overlap with existing bookings
  const checkOverlap = useCallback((userStart: Date, userEnd: Date) => {
    return roomBookingsData?.data?.some((booking: Booking) => {
      const approvedStatuses = ['approved', 'confirmed', 'check_in', 'checked-in'];
      if (!approvedStatuses.includes(booking.status)) return false;

      const bStart = new Date(booking.check_in_date);
      if (booking.check_in_time) {
         const [h, m] = booking.check_in_time.split(':');
         bStart.setHours(parseInt(h), parseInt(m), 0, 0);
      } else {
         bStart.setHours(14, 0, 0, 0); 
      }

      const bEnd = new Date(booking.check_out_date);
      if (booking.check_out_time) {
         const [h, m] = booking.check_out_time.split(':');
         bEnd.setHours(parseInt(h), parseInt(m), 0, 0);
      } else {
         if (booking.stay_type === "10 Hours - ₱1,599") {
            bEnd.setHours(24, 0, 0, 0); 
            if (bEnd.getTime() <= bStart.getTime()) bEnd.setDate(bEnd.getDate() + 1);
         } else {
            bEnd.setHours(11, 0, 0, 0); 
         }
      }

      return userStart < bEnd && userEnd > bStart;
    });
  }, [roomBookingsData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    // Handle guest count validation (adults + children only, infants not counted)
    if (name === "adults" || name === "children") {
      if (value === "") {
        setFormData(prev => ({ ...prev, [name]: 0 }));
        const curAdults = name === "adults" ? 0 : formData.adults;
        const curChildren = name === "children" ? 0 : formData.children;
        updateAdditionalGuests(Number(curAdults), Number(curChildren));
        return;
      }

      const newValue = parseInt(value);
      const currentAdults = name === "adults" ? newValue : formData.adults;
      const currentChildren = name === "children" ? newValue : formData.children;
      const newTotal = Number(currentAdults) + Number(currentChildren);

      // Prevent exceeding max 4 guests (excluding infants)
      if (newTotal > 4) {
        toast.error("Maximum 4 guests allowed (adults + children). Infants are not counted.");
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: newValue,
      }));

      updateAdditionalGuests(Number(currentAdults), Number(currentChildren));
    } else if (name === "age") {
      if (value === "") {
        setErrors(prev => ({...prev, age: ''}));
        setFormData((prev) => ({
          ...prev,
          [name]: ""
        }));
      } else {
        const ageValue = parseInt(value);
        
        if (!isNaN(ageValue) && ageValue < 18) {
          setErrors(prev => ({...prev, age: 'Main guest must be at least 18 years old to book'}));
        } else {
          setErrors(prev => ({...prev, age: ''}));
        }

        setFormData((prev) => ({
          ...prev,
          [name]: isNaN(ageValue) ? "" : String(ageValue)
        }));
      }
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setErrors(prev => ({...prev, email: 'Please enter a valid email address'}));
      } else {
        setErrors(prev => ({...prev, email: ''}));
      }
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    } else if (name === "phone") {
      // Allow international formats: +, spaces, dashes, digits, length 7-20
      const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
      if (value && !phoneRegex.test(value)) {
        setErrors(prev => ({...prev, phone: 'Please enter a valid phone number'}));
      } else {
        setErrors(prev => ({...prev, phone: ''}));
      }
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    } else if (name === "infants") {
      if (value === "") {
        setFormData(prev => ({ ...prev, [name]: 0 }));
      } else {
        setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : type === "number"
            ? parseInt(value) || 0
            : value,
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
        // Main guest ID
        setFormData((prev) => ({
          ...prev,
          validId: file,
          validIdPreview: URL.createObjectURL(file),
        }));
      } else {
        // Additional guest ID
        const updatedGuests = [...additionalGuests];
        updatedGuests[guestIndex].validId = file;
        updatedGuests[guestIndex].validIdPreview = URL.createObjectURL(file);
        setAdditionalGuests(updatedGuests);
      }
    }
  };

  // Camera capture function for ID photos
  const captureImage = async (type: 'id', guestIndex?: number) => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera is not available on this device');
        return;
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera for ID capture
        } 
      });

      // Create video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.width = '100%';
      video.style.maxWidth = '400px';

      // Create canvas for capturing the image
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;

      // Create modal for camera interface
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
      modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
          <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Capture ID Photo</h3>
          <div class="mb-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <video id="camera-video" class="w-full"></video>
          </div>
          <div class="flex gap-3 justify-center">
            <button id="capture-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Capture
            </button>
            <button id="cancel-btn" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      const videoElement = modal.querySelector('#camera-video') as HTMLVideoElement;
      const captureBtn = modal.querySelector('#capture-btn') as HTMLButtonElement;
      const cancelBtn = modal.querySelector('#cancel-btn') as HTMLButtonElement;

      videoElement.srcObject = stream;

      // Handle capture
      captureBtn.addEventListener('click', () => {
        const context = canvas.getContext('2d');
        if (context) {
          // Draw video frame to canvas
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'id-photo.jpg', { type: 'image/jpeg' });
              
              // Create a synthetic event to reuse handleFileChange
              const syntheticEvent = {
                target: {
                  files: [file]
                }
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              
              handleFileChange(syntheticEvent, type, guestIndex);
              
              // Clean up
              stream.getTracks().forEach(track => track.stop());
              document.body.removeChild(modal);
              
              toast.success('ID photo captured successfully!');
            }
          }, 'image/jpeg', 0.95);
        }
      });

      // Handle cancel
      cancelBtn.addEventListener('click', () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const handleAdditionalGuestChange = (index: number, field: keyof GuestInfo, value: string) => {
    const updatedGuests = [...additionalGuests];
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value,
    };
    setAdditionalGuests(updatedGuests);
  };

  const handleStayTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStayType = e.target.value;

    // Set default times based on stay type
    let defaultCheckInTime = "";
    let defaultCheckOutTime = "";

    if (selectedStayType === "10 Hours - ₱1,599") {
      defaultCheckInTime = "14:00"; // 2:00 PM
      defaultCheckOutTime = "00:00"; // 12:00 AM (midnight)
    } else if (selectedStayType.includes("21 Hours")) {
      defaultCheckInTime = "14:00"; // 2:00 PM
      defaultCheckOutTime = "11:00"; // 11:00 AM
    } else if (selectedStayType === "Multi-Day Stay") {
      defaultCheckInTime = "14:00"; // 2:00 PM
      defaultCheckOutTime = "11:00"; // 11:00 AM
    }

    setFormData((prev) => ({
      ...prev,
      stayType: selectedStayType,
      checkInTime: defaultCheckInTime,
      checkOutTime: defaultCheckOutTime,
    }));

    // Auto-calculate check-out date if check-in date is already selected
    if (bookingData.checkInDate && selectedStayType) {
      const checkInDate = new Date(bookingData.checkInDate);
      const checkOutDate = new Date(checkInDate);

      if (selectedStayType === "10 Hours - ₱1,599") {
        // 10 hours: check-in 2:00 PM, check-out 12:00 AM next day
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      } else if (selectedStayType.includes("21 Hours")) {
        // 21 hours: check-in 2:00 PM, check-out 11:00 AM next day
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      } else if (selectedStayType === "Multi-Day Stay") {
        // Multi-day: add 1 day by default
        checkOutDate.setDate(checkOutDate.getDate() + 1);
      }

      const checkOutStr = `${checkOutDate.getFullYear()}-${String(checkOutDate.getMonth() + 1).padStart(2, '0')}-${String(checkOutDate.getDate()).padStart(2, '0')}`;
      dispatch(setCheckOutDate(checkOutStr));
    }
  };

  const handleAddOnChange = (item: keyof AddOns, increment: boolean) => {
    setAddOns((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] + (increment ? 1 : -1)),
    }));
  };

  const scrollToError = (fieldName: string) => {
    const element = errorRefs.current[fieldName];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add shake animation
      element.classList.add('animate-shake');
      setTimeout(() => element.classList.remove('animate-shake'), 500);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Step 1 - Main Guest
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.age) {
      newErrors.age = "Age is required";
    } else if (Number(formData.age) < 18) {
      newErrors.age = "Main guest must be at least 18 years old to book";
    }
    if (!formData.gender) newErrors.gender = "Please select a gender";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s-]{7,20}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate ID for main guest if 10+ years old
    if (formData.age && parseInt(formData.age) >= 10 && !formData.validId) {
      newErrors.validId = "Valid ID is required for guests 10+ years old";
    }

    // Validate additional guests
    for (let i = 0; i < additionalGuests.length; i++) {
      const guest = additionalGuests[i];
      const guestNumber = i + 2;

      if (!guest.firstName) newErrors[`guest${i}FirstName`] = `Guest ${guestNumber} first name is required`;
      if (!guest.lastName) newErrors[`guest${i}LastName`] = `Guest ${guestNumber} last name is required`;
      if (!guest.age) newErrors[`guest${i}Age`] = `Guest ${guestNumber} age is required`;
      if (!guest.gender) newErrors[`guest${i}Gender`] = `Guest ${guestNumber} gender is required`;

      // Validate ID for guests 10+ years old
      if (guest.age && parseInt(guest.age) >= 10 && !guest.validId) {
        newErrors[`guest${i}ValidId`] = `Valid ID is required for Guest ${guestNumber} (10+ years old)`;
      }
    }

    // Validate guest count
    if (formData.adults + formData.children > 4) {
      newErrors.guestCount = "Maximum 4 guests allowed (adults + children)";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      toast.error(newErrors[firstErrorKey]);
      scrollToError(firstErrorKey);
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate stay type
    if (!formData.stayType) newErrors.stayType = "Please select a stay type";

    // Validate dates
    if (!bookingData.checkInDate) newErrors.checkInDate = "Check-in date is required";
    if (!bookingData.checkOutDate) newErrors.checkOutDate = "Check-out date is required";

    // Validate check-in/out times
    if (!formData.checkInTime) newErrors.checkInTime = "Check-in time is required";
    if (!formData.checkOutTime) newErrors.checkOutTime = "Check-out time is required";

    // Real-time overlap check
    if (!newErrors.checkInDate && !newErrors.checkOutDate && bookingData.checkInDate && bookingData.checkOutDate) {
       const start = new Date(bookingData.checkInDate);
       if (formData.checkInTime) {
          const [h, m] = formData.checkInTime.split(':');
          start.setHours(parseInt(h), parseInt(m), 0, 0);
       } else {
          start.setHours(14, 0, 0, 0);
       }

       const end = new Date(bookingData.checkOutDate);
       if (formData.checkOutTime) {
          const [h, m] = formData.checkOutTime.split(':');
          end.setHours(parseInt(h), parseInt(m), 0, 0);
       } else {
          end.setHours(11, 0, 0, 0);
       }

       if (checkOverlap(start, end)) {
          newErrors.checkInDate = "Selected time overlaps with an existing booking.";
       }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      toast.error(newErrors[firstErrorKey]);
      scrollToError(firstErrorKey);
      return false;
    }

    return true;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.paymentProof) {
      newErrors.paymentProof = "Proof of payment is required";
    }
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = "You must accept the terms and conditions";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      toast.error(newErrors[firstErrorKey]);
      scrollToError(firstErrorKey);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    // Set loading state for mobile
    if (window.innerWidth < 1024) { // lg breakpoint
      setIsMobileLoading(true);
    }

    // Your existing validation logic...
    if (currentStep === 1) {
      if (validateStep1()) {
        setCompletedSteps(prev => [...prev, 1]);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsMobileLoading(false);
      } else {
        setIsMobileLoading(false);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCompletedSteps(prev => [...prev, 2]);
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsMobileLoading(false);
      } else {
        setIsMobileLoading(false);
      }
    } else if (currentStep === 3) {
      // No validation needed for add-ons step
      setCompletedSteps(prev => [...prev, 3]);
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileLoading(false);
    }
  };

  const handleBack = () => {
    // Set loading state for mobile
    if (window.innerWidth < 1024) {
      setIsMobileLoading(true);
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setIsMobileLoading(false), 300);
    } else {
      router.back();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate booking dates from Redux store
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      toast.error("Missing booking dates. Please return to Step 2 and select your dates.");
      return;
    }

    if (!validateStep4()) {
      return;
    }

    try {
      setIsLoading(true);

      // Use the booking ID generated at component mount
      const bookingId = bookingIdState;

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

      // Convert valid ID to base64 if it's a File
      let validIdBase64 = '';
      if (formData.validId) {
        const reader = new FileReader();
        validIdBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.validId as File);
        });
      }

      // Convert additional guests' IDs to base64
      const additionalGuestsData = await Promise.all(
        additionalGuests.map(async (guest) => {
          let guestIdBase64 = '';
          if (guest.validId) {
            const reader = new FileReader();
            guestIdBase64 = await new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(guest.validId as File);
            });
          }
          return {
            firstName: guest.firstName,
            lastName: guest.lastName,
            age: guest.age,
            gender: guest.gender,
            validId: guestIdBase64,
          };
        })
      );

      // Prepare booking data for database
      const sessionUser = session?.user as SessionUser | undefined;
      const bookingRequestData = {
        booking_id: bookingId,
        user_id: sessionUser?.id || null, // NULL for guest, UUID for logged-in users
        guest_first_name: formData.firstName,
        guest_last_name: formData.lastName,
        guest_age: formData.age,
        guest_gender: formData.gender,
        guest_email: formData.email,
        guest_phone: formData.phone,
        facebook_link: formData.facebookLink,
        valid_id: validIdBase64,
        additional_guests: additionalGuestsData,
        room_name: bookingData.selectedRoom?.name || bookingData.location?.name || 'Standard Room',
        stay_type: formData.stayType,
        check_in_date: bookingData.checkInDate,
        check_out_date: bookingData.checkOutDate,
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
        remaining_balance: remainingBalance,
        add_ons: addOns,
      };

      // Save booking to database using RTK Query mutation
      try {
        const result = await createBooking(bookingRequestData).unwrap();

        if (result.success) {
          toast.success(`Booking Submitted Successfully!\n\nYour booking ID is: ${bookingId}\n\nStatus: Pending Admin Approval\n\nYou will receive a confirmation email once the admin approves your booking.`);

          // Clear form and redirect based on user role
          const userRole = sessionUser?.role;
          if (userRole === 'Owner') {
            router.push('/admin/owners');
          } else {
            router.push('/');
          }
        } else {
          setIsLoading(false);
          toast.error('Failed to create booking. Please try again or contact support.');
        }
      } catch (mutationError: unknown) {
        setIsLoading(false);
        console.error('RTK Query mutation error:', mutationError);
        const errorMessage = mutationError && typeof mutationError === 'object' && 'data' in mutationError
          ? (mutationError.data as { error?: string })?.error
          : undefined;
        toast.error(errorMessage || 'An error occurred. Please try again or contact support.');
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Booking error:', error);
      toast.error('An error occurred. Please try again or contact support.');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Guest Information";
      case 2:
        return "Booking Details";
      case 3:
        return "Optional Add-ons";
      case 4:
        return "Payment & Review";
      default:
        return "Checkout";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Please fill in your details and guest information";
      case 2:
        return "Select your stay type and booking dates";
      case 3:
        return "Enhance your stay with optional amenities";
      case 4:
        return "Review your booking and complete payment";
      default:
        return "";
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Mobile specific styles */
        @media (max-width: 1023px) {
          .mobile-bottom-bar {
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }
          
          .form-content {
            scroll-margin-bottom: 120px; /* Account for sticky bottom bar */
          }
        }
      `}</style>
      <SidebarLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section - Matching My Wishlist Style */}
        <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-4 border border-brand-primary/20 dark:border-brand-primary/30">
                {currentStep === 1 && <User className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" />}
                {currentStep === 2 && <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" />}
                {currentStep === 3 && <Package className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" />}
                {currentStep === 4 && <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary" />}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
                {getStepTitle()}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {getStepDescription()}
              </p>
            </div>

            {/* Progress Steps Indicator */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <button
                  onClick={() => currentStep > 1 && setCurrentStep(1)}
                  className={`flex flex-col items-center flex-1 ${currentStep > 1 ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={currentStep === 1}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                      completedSteps.includes(1)
                        ? "bg-green-500 text-white"
                        : currentStep === 1
                        ? "bg-brand-primary text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {completedSteps.includes(1) ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      completedSteps.includes(1) || currentStep === 1
                        ? "text-brand-primary dark:text-brand-primary"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Guest Info
                  </span>
                </button>

                {/* Connector */}
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded ${completedSteps.includes(1) ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}></div>

                {/* Step 2 */}
                <button
                  onClick={() => (completedSteps.includes(1) || currentStep > 2) && setCurrentStep(2)}
                  className={`flex flex-col items-center flex-1 ${completedSteps.includes(1) || currentStep > 2 ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={!completedSteps.includes(1) && currentStep < 2}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                      completedSteps.includes(2)
                        ? "bg-green-500 text-white"
                        : currentStep === 2
                        ? "bg-brand-primary text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {completedSteps.includes(2) ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      completedSteps.includes(2) || currentStep === 2
                        ? "text-brand-primary dark:text-brand-primary"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Booking
                  </span>
                </button>

                {/* Connector */}
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded ${completedSteps.includes(2) ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}></div>

                {/* Step 3 */}
                <button
                  onClick={() => (completedSteps.includes(2) || currentStep > 3) && setCurrentStep(3)}
                  className={`flex flex-col items-center flex-1 ${completedSteps.includes(2) || currentStep > 3 ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={!completedSteps.includes(2) && currentStep < 3}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                      completedSteps.includes(3)
                        ? "bg-green-500 text-white"
                        : currentStep === 3
                        ? "bg-brand-primary text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {completedSteps.includes(3) ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      completedSteps.includes(3) || currentStep === 3
                        ? "text-brand-primary dark:text-brand-primary"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Add-ons
                  </span>
                </button>

                {/* Connector */}
                <div className={`flex-1 h-0.5 mx-1 sm:mx-2 rounded ${completedSteps.includes(3) ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"}`}></div>

                {/* Step 4 */}
                <button
                  onClick={() => completedSteps.includes(3) && setCurrentStep(4)}
                  className={`flex flex-col items-center flex-1 ${completedSteps.includes(3) ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={!completedSteps.includes(3) && currentStep < 4}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                      completedSteps.includes(4)
                        ? "bg-green-500 text-white"
                        : currentStep === 4
                        ? "bg-brand-primary text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {completedSteps.includes(4) ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      completedSteps.includes(4) || currentStep === 4
                        ? "text-brand-primary dark:text-brand-primary"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Payment
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-12 lg:pb-8">
          {/* Main Content Grid */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="relative overflow-hidden">
                {/* STEP 1: Guest Information */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6 slide-in-from-right">
                    {/* Guest Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Guest Information
                      </h2>

                      {/* Main Guest Header */}
                      <div className="flex items-center gap-2 mb-4 text-brand-primary dark:text-brand-primary">
                        <h3 className="font-semibold text-sm sm:text-base">Adult 1 (Main Guest)</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div ref={(el) => { errorRefs.current.firstName = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={(e) => {
                              handleInputChange(e);
                              setErrors(prev => ({...prev, firstName: ''}));
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                              errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="Enter first name"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.firstName}
                            </p>
                          )}
                        </div>

                        <div ref={(el) => { errorRefs.current.lastName = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={(e) => {
                              handleInputChange(e);
                              setErrors(prev => ({...prev, lastName: ''}));
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                              errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="Enter last name"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.lastName}
                            </p>
                          )}
                        </div>

                        <div ref={(el) => { errorRefs.current.age = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Age *
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={(e) => handleInputChange(e)}
                            required
                            min="1"
                            max="120"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 ${
                              errors.age ? 'border-red-500 focus:ring-red-500 text-red-600 dark:text-red-500' : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                            }`}
                            placeholder="Enter age"
                          />
                          {errors.age && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.age}
                            </p>
                          )}
                        </div>

                        <div ref={(el) => { errorRefs.current.gender = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gender *
                          </label>
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={(e) => {
                              handleInputChange(e);
                              setErrors(prev => ({...prev, gender: ''}));
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                              errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          {errors.gender && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.gender}
                            </p>
                          )}
                        </div>

                        <div ref={(el) => { errorRefs.current.email = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange(e)}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 ${
                              errors.email ? 'border-red-500 focus:ring-red-500 text-red-600 dark:text-red-500' : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                            }`}
                            placeholder="Enter email"
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div ref={(el) => { errorRefs.current.phone = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange(e)}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 ${
                              errors.phone ? 'border-red-500 focus:ring-red-500 text-red-600 dark:text-red-500' : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                            }`}
                            placeholder="e.g., +63 912 345 6789 or 09123456789"
                          />
                          {errors.phone && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.phone}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Facebook Name or Link
                          </label>
                          <input
                            type="text"
                            name="facebookLink"
                            value={formData.facebookLink}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="e.g., Juan Dela Cruz or facebook.com/juandelacruz"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Alternative contact in case email is incorrect
                          </p>
                        </div>
                      </div>

                      {/* Valid ID Upload Section */}
                      <div ref={(el) => { errorRefs.current.validId = el; }} className={`mt-6 p-4 border-2 border-dashed rounded-lg ${
                        errors.validId ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-500' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className={`w-5 h-5 ${errors.validId ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                          <h3 className={`font-semibold text-sm sm:text-base ${errors.validId ? 'text-red-800 dark:text-red-300' : 'text-blue-800 dark:text-blue-300'}`}>
                            Valid ID (Required for guests 10+ years old)
                          </h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          Accepted: Driver&apos;s License, Passport, National ID, School ID
                        </p>

                        <div className="text-center">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleFileChange(e, 'id')}
                            className="hidden"
                            id="valid-id"
                          />
                          {!formData.validIdPreview && (
                            <div className="space-y-3">
                              <label
                                htmlFor="valid-id"
                                className="cursor-pointer inline-flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-2 border-gray-200 dark:border-gray-600"
                              >
                                <Upload className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-3" />
                                <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">
                                  Click to upload ID photo
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                              </label>
                              
                              <div className="flex items-center justify-center">
                                <div className="relative">
                                  <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                  </div>
                                  <span className="relative bg-white dark:bg-gray-800 px-3 text-xs text-gray-500 dark:text-gray-400">OR</span>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => captureImage('id')}
                                className="cursor-pointer inline-flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border-2 border-green-300 dark:border-green-500"
                              >
                                <Camera className="w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
                                <p className="text-green-700 dark:text-green-300 font-medium mb-1">
                                  Take photo with camera
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Use device camera to capture ID</p>
                              </button>
                            </div>
                          )}

                          {formData.validIdPreview && (
                            <div className="mt-4 flex flex-col items-center w-full">
                              <div className="relative w-full max-w-sm">
                                <Image
                                  src={formData.validIdPreview}
                                  alt="Valid ID preview"
                                  width={300}
                                  height={200}
                                  className="w-full h-auto max-h-48 object-contain rounded-lg shadow-md border-2 border-green-500"
                                />
                              </div>
                              
                              <div className="mt-3 flex flex-col items-center gap-2 w-full max-w-sm">
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1 text-center">
                                      <Info className="w-3 h-3 flex-shrink-0" />
                                      Photo should not be blurred and always clear
                                  </p>
                                  
                                  <div className="flex gap-2 flex-wrap justify-center">
                                      <label
                                        htmlFor="valid-id"
                                        className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                                      >
                                        Change
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => captureImage('id')}
                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                                      >
                                        <Camera className="w-4 h-4 inline mr-1" />
                                        Camera
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, validId: null, validIdPreview: '' }))}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                                      >
                                        Remove
                                      </button>
                                  </div>
                              </div>

                              <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                ID uploaded successfully
                              </p>
                            </div>
                          )}
                          {errors.validId && (
                            <p className="mt-3 text-sm text-red-600 flex items-center gap-1 justify-center">
                              <AlertCircle className="w-4 h-4" />
                              {errors.validId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Additional Guests */}
                    {additionalGuests.map((guest, index) => {
                      const guestNumber = index + 2;
                      const isAdult = index < formData.adults - 1;
                      const guestType = isAdult ? `Adult ${guestNumber}` : `Child ${guestNumber - (formData.adults - 1)}`;

                      return (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                          <div className="flex items-center gap-2 mb-4 text-brand-primary dark:text-brand-primary">
                            <User className="w-5 h-5" />
                            <h3 className="font-semibold text-sm sm:text-base">{guestType}</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div ref={(el) => { errorRefs.current[`guest${index}FirstName`] = el; }}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name *
                              </label>
                              <input
                                type="text"
                                value={guest.firstName}
                                onChange={(e) => {
                                  handleAdditionalGuestChange(index, 'firstName', e.target.value);
                                  setErrors(prev => ({...prev, [`guest${index}FirstName`]: ''}));
                                }}
                                required
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                                  errors[`guest${index}FirstName`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="Enter first name"
                              />
                              {errors[`guest${index}FirstName`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors[`guest${index}FirstName`]}
                                </p>
                              )}
                            </div>

                            <div ref={(el) => { errorRefs.current[`guest${index}LastName`] = el; }}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name *
                              </label>
                              <input
                                type="text"
                                value={guest.lastName}
                                onChange={(e) => {
                                  handleAdditionalGuestChange(index, 'lastName', e.target.value);
                                  setErrors(prev => ({...prev, [`guest${index}LastName`]: ''}));
                                }}
                                required
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                                  errors[`guest${index}LastName`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="Enter last name"
                              />
                              {errors[`guest${index}LastName`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors[`guest${index}LastName`]}
                                </p>
                              )}
                            </div>

                            <div ref={(el) => { errorRefs.current[`guest${index}Age`] = el; }}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Age *
                              </label>
                              <input
                                type="number"
                                value={guest.age}
                                onChange={(e) => {
                                  handleAdditionalGuestChange(index, 'age', e.target.value);
                                  setErrors(prev => ({...prev, [`guest${index}Age`]: ''}));
                                }}
                                required
                                min="1"
                                max="120"
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                  errors[`guest${index}Age`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                                placeholder="Enter age"
                              />
                              {errors[`guest${index}Age`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors[`guest${index}Age`]}
                                </p>
                              )}
                            </div>

                            <div ref={(el) => { errorRefs.current[`guest${index}Gender`] = el; }}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Gender *
                              </label>
                              <select
                                value={guest.gender}
                                onChange={(e) => {
                                  handleAdditionalGuestChange(index, 'gender', e.target.value);
                                  setErrors(prev => ({...prev, [`guest${index}Gender`]: ''}));
                                }}
                                required
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                                  errors[`guest${index}Gender`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                                }`}
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                              {errors[`guest${index}Gender`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors[`guest${index}Gender`]}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Valid ID Upload for Additional Guest */}
                          <div ref={(el) => { errorRefs.current[`guest${index}ValidId`] = el; }} className={`mt-6 p-4 border-2 border-dashed rounded-lg ${
                            errors[`guest${index}ValidId`] ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-500' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500'
                          }`}>
                            <div className="flex items-center gap-2 mb-3">
                              <CreditCard className={`w-5 h-5 ${errors[`guest${index}ValidId`] ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                              <h3 className={`font-semibold text-sm sm:text-base ${errors[`guest${index}ValidId`] ? 'text-red-800 dark:text-red-300' : 'text-blue-800 dark:text-blue-300'}`}>
                                Valid ID (Required for guests 10+ years old)
                              </h3>
                            </div>

                            <div className="text-center">
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                onChange={(e) => handleFileChange(e, 'id', index)}
                                className="hidden"
                                id={`valid-id-${index}`}
                              />
                              {!guest.validIdPreview && (
                                <div className="space-y-3">
                                  <label
                                    htmlFor={`valid-id-${index}`}
                                    className="cursor-pointer inline-flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-2 border-gray-200 dark:border-gray-600"
                                  >
                                    <Upload className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-3" />
                                    <p className="text-blue-600 dark:text-blue-400 font-medium mb-1">
                                      Click to upload ID photo
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                                  </label>
                                  <div className="flex items-center justify-center">
                                    <div className="relative">
                                      <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                      </div>
                                      <span className="relative bg-white dark:bg-gray-800 px-3 text-xs text-gray-500 dark:text-gray-400">OR</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => captureImage('id', index)}
                                    className="cursor-pointer inline-flex flex-col items-center justify-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border-2 border-green-300 dark:border-green-500"
                                  >
                                    <Camera className="w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
                                    <p className="text-green-700 dark:text-green-300 font-medium mb-1">
                                      Take photo with camera
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Use device camera to capture ID</p>
                                  </button>
                                </div>
                              )}
                              {guest.validIdPreview && (
                                <div className="mt-4 flex flex-col items-center w-full">
                                  <div className="relative w-full max-w-sm">
                                    <Image
                                      src={guest.validIdPreview}
                                      alt={`Guest ${guestNumber} Valid ID preview`}
                                      width={300}
                                      height={200}
                                      className="w-full h-auto max-h-48 object-contain rounded-lg shadow-md border-2 border-green-500"
                                    />
                                  </div>
                                  
                                  <div className="mt-3 flex flex-col items-center gap-2 w-full max-w-sm">
                                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1 text-center">
                                          <Info className="w-3 h-3 flex-shrink-0" />
                                          Photo should not be blurred and always clear
                                      </p>
                                      
                                      <div className="flex gap-2 flex-wrap justify-center">
                                          <label
                                            htmlFor={`valid-id-${index}`}
                                            className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                                          >
                                            Change
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => captureImage('id', index)}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                                          >
                                            <Camera className="w-4 h-4 inline mr-1" />
                                            Camera
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                                const updated = [...additionalGuests];
                                                updated[index].validId = null;
                                                updated[index].validIdPreview = '';
                                                setAdditionalGuests(updated);
                                            }}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                                          >
                                            Remove
                                          </button>
                                      </div>
                                  </div>

                                  <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium flex items-center justify-center gap-1">
                                    <CheckCircle className="w-4 h-4" />
                                    ID uploaded successfully
                                  </p>
                                </div>
                              )}
                              {errors[`guest${index}ValidId`] && (
                                <p className="mt-3 text-sm text-red-600 flex items-center gap-1 justify-center">
                                  <AlertCircle className="w-4 h-4" />
                                  {errors[`guest${index}ValidId`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STEP 2: Booking Details */}
                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6 slide-in-from-right">
                    {/* Stay Type Selection */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Booking Details
                      </h2>

                      <div ref={(el) => { errorRefs.current.stayType = el; }}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Stay Type *
                        </label>
                        <select
                          name="stayType"
                          value={formData.stayType}
                          onChange={(e) => {
                            handleStayTypeChange(e);
                            setErrors(prev => ({...prev, stayType: ''}));
                          }}
                          required
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                            errors.stayType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <option value="">Select Stay Type</option>
                          <option value="10 Hours - ₱1,599">10 Hours - ₱1,599 (2:00 PM - 12:00 AM)</option>
                          <option value="21 Hours (Sun-Thu weekday) - ₱1,799">
                            21 Hours (Sun-Thu weekday) - ₱1,799 (2:00 PM - 11:00 AM)
                          </option>
                          <option value="21 Hours (Fri-Sat) - ₱1,999">
                            21 Hours (Fri-Sat) - ₱1,999 (2:00 PM - 11:00 AM)
                          </option>
                          <option value="Multi-Day Stay">Multi-Day Stay (Custom dates)</option>
                        </select>
                        {errors.stayType && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.stayType}
                          </p>
                        )}
                        {/* Date range warning based on stay type */}
                        {getDateRangeWarning() && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                              <Info className="w-4 h-4 flex-shrink-0" />
                              {getDateRangeWarning()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date and Guest Selection (Mobile only - sidebar handles desktop) */}
                    <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Dates & Guests
                      </h2>

                      {/* Date Selection */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Dates
                        </label>
                        <DateRangePicker
                          checkInDate={localCheckInDate}
                          checkOutDate={localCheckOutDate}
                          onCheckInChange={setLocalCheckInDate}
                          onCheckOutChange={setLocalCheckOutDate}
                        />
                      </div>

                      {/* Guest Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Number of Guests
                        </label>
                        <GuestSelector
                          guests={localGuests}
                          onGuestChange={handleGuestChange}
                        />
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <Info className="w-4 h-4 flex-shrink-0" />
                          <span>
                            <strong>Maximum 4 guests allowed</strong> (adults + children). Infants are not counted.
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Selected Dates Display (Desktop only - shows selected dates from sidebar) */}
                    <div className="hidden lg:block">
                      {(localCheckInDate || localCheckOutDate) && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                            Selected Dates
                          </h2>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-in</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {localCheckInDate ? formatDateSafe(localCheckInDate, { month: 'long', day: 'numeric', year: 'numeric' }) : "Not selected"}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-out</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {localCheckOutDate ? formatDateSafe(localCheckOutDate, { month: 'long', day: 'numeric', year: 'numeric' }) : "Not selected"}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                            Change dates using the date picker in the sidebar
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Check-in/out Times */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Check-in / Check-out Times
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div ref={(el) => { errorRefs.current.checkInTime = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Check-in Time *
                            {bookingData.checkInDate && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">({bookingData.checkInDate})</span>}
                          </label>
                          <input
                            type="time"
                            name="checkInTime"
                            value={formData.checkInTime}
                            onChange={(e) => {
                              handleInputChange(e);
                              setErrors(prev => ({...prev, checkInTime: ''}));
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                              errors.checkInTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                          />
                          {errors.checkInTime && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.checkInTime}
                            </p>
                          )}
                        </div>

                        <div ref={(el) => { errorRefs.current.checkOutTime = el; }}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Check-out Time *
                            {bookingData.checkOutDate && <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">({bookingData.checkOutDate})</span>}
                          </label>
                          <input
                            type="time"
                            name="checkOutTime"
                            value={formData.checkOutTime}
                            onChange={(e) => {
                              handleInputChange(e);
                              setErrors(prev => ({...prev, checkOutTime: ''}));
                            }}
                            required
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                              errors.checkOutTime ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
                          />
                          {errors.checkOutTime && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.checkOutTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Add-ons */}
                {currentStep === 3 && (
                  <div className="space-y-4 sm:space-y-6 slide-in-from-right">
                    {/* Add-ons */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Add-ons (Optional)
                      </h2>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Enhance your stay with these optional amenities. You can skip this step if you don&apos;t need any add-ons.
                      </p>

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
                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-primary dark:hover:border-brand-primary transition-colors"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">₱{item.price} each</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleAddOnChange(item.key as keyof AddOns, false)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
                              >
                                <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                                {addOns[item.key as keyof AddOns]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddOnChange(item.key as keyof AddOns, true)}
                                className="w-8 h-8 flex items-center justify-center bg-brand-primary hover:bg-brand-primaryDark text-white rounded-full transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {addOnsTotal > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Add-ons Total:</strong> ₱{addOnsTotal.toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          <span>
                            Add-ons will be added to your total bill and reflected in the price breakdown.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Payment & Review */}
                {currentStep === 4 && (
                  <div className="space-y-4 sm:space-y-6 slide-in-from-right">
                    {/* Booking Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Booking Summary
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Guest Name</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formData.firstName} {formData.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formData.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formData.phone}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Guests</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formData.adults} Adult{formData.adults !== 1 ? "s" : ""}
                            {formData.children > 0 && `, ${formData.children} Child${formData.children !== 1 ? "ren" : ""}`}
                            {formData.infants > 0 && `, ${formData.infants} Infant${formData.infants !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <LogIn className="w-4 h-4" />
                            Check-in
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {bookingData.checkInDate
                              ? new Date(bookingData.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : "N/A"}{" "}
                            at {formData.checkInTime ? (() => {
                              const [hours, minutes] = formData.checkInTime.split(':');
                              const hour = parseInt(hours, 10);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const hour12 = hour % 12 || 12;
                              return `${hour12}:${minutes} ${ampm}`;
                            })() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <LogOut className="w-4 h-4" />
                            Check-out
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {bookingData.checkOutDate
                              ? new Date(bookingData.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : "N/A"}{" "}
                            at {formData.checkOutTime ? (() => {
                              const [hours, minutes] = formData.checkOutTime.split(':');
                              const hour = parseInt(hours, 10);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const hour12 = hour % 12 || 12;
                              return `${hour12}:${minutes} ${ampm}`;
                            })() : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Stay Type</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formData.stayType || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Room</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {bookingData.selectedRoom?.name || bookingData.location?.name || 'Standard Room'}
                          </p>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="border-t pt-4 dark:border-gray-700">
                        <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Price Breakdown</h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>
                              Room Rate
                              {formData.stayType === "Multi-Day Stay" && numberOfDays > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                  ({numberOfDays} {numberOfDays === 1 ? 'day' : 'days'})
                                </span>
                              )}
                            </span>
                            <span className="font-semibold">₱{roomRate.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Security Deposit</span>
                            <span className="font-semibold">₱{securityDeposit.toLocaleString()}</span>
                          </div>
                          {addOnsTotal > 0 && (
                            <div className="flex justify-between text-gray-700 dark:text-gray-300">
                              <span>Add-ons</span>
                              <span className="font-semibold">₱{addOnsTotal.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t dark:border-gray-700 font-bold text-lg text-gray-800 dark:text-white">
                            <span>Total</span>
                            <span className="text-orange-500">₱{displayTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 space-y-2">
                          <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                            <Wallet className="w-5 h-5" />
                            Payment
                          </h4>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700 dark:text-green-300">Downpayment (Pay Online to Secure Booking)</span>
                            <span className="font-bold text-green-800 dark:text-green-200">₱{downPayment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700 dark:text-green-300">Remaining Balance (Pay Upon Check-in)</span>
                            <span className="font-bold text-green-800 dark:text-green-200">
                              ₱{(displayTotal - downPayment).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            <span>
                              <strong>Note:</strong> Security deposit is refundable the next day upon
                              checkout if no missing/broken items.
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary dark:text-brand-primary" />
                        Payment Method
                      </h2>

                      <div className="mb-6">
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Payment Method *
                        </label>
                        {isLoadingPaymentMethods ? (
                          <div className="flex items-center justify-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary mr-2"></div>
                            <span className="text-gray-600 dark:text-gray-400">Loading payment methods...</span>
                          </div>
                        ) : paymentMethods.length === 0 ? (
                          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                            <p className="text-gray-600 dark:text-gray-400 text-center">No payment methods available</p>
                          </div>
                        ) : (
                          <select
                            id="paymentMethod"
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                          >
                            <option value="">Select a payment method</option>
                            {paymentMethods.map((method) => (
                              <option key={method.id} value={method.payment_method}>
                                {method.payment_name} - {method.provider}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Payment Instructions */}
                      {(() => {
                        const selectedMethod = getSelectedPaymentMethod();
                        if (!selectedMethod) return null;

                        return (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                              <Wallet className="w-5 h-5 text-brand-primary" />
                              Pay via {selectedMethod.payment_name}
                            </h3>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                              {selectedMethod.description || (
                                <>Pay your <strong>DOWNPAYMENT of ₱{downPayment}</strong> to secure your booking</>
                              )}
                            </p>

                            <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-4 space-y-3">
                              <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Method:</span>
                                <span className="font-bold text-gray-800 dark:text-white">{selectedMethod.payment_name}</span>
                              </div>
                              <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Provider:</span>
                                <span className="font-bold text-gray-800 dark:text-white">{selectedMethod.provider}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">Amount:</span>
                                <span className="font-bold text-green-600 dark:text-green-400 text-xl">₱{downPayment}</span>
                              </div>
                            </div>

                            {/* Account Details */}
                            {selectedMethod.account_details && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-4">
                                <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Account Details:</h4>
                                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {selectedMethod.account_details}
                                </div>
                              </div>
                            )}

                            {/* QR Code */}
                            {selectedMethod.payment_qr_link && (
                              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 sm:p-6 text-center mb-4">
                                <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Scan QR Code</h4>
                                <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-4 max-w-full">
                                  <Image
                                    src={selectedMethod.payment_qr_link}
                                    alt={`${selectedMethod.payment_name} QR Code`}
                                    width={256}
                                    height={256}
                                    className="w-full h-full object-contain rounded-lg shadow-md"
                                  />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Scan this QR code to pay ₱{downPayment}
                                </p>
                              </div>
                            )}

                            {/* Instructions */}
                            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                              <p className="font-semibold">Instructions:</p>
                              <ol className="list-decimal list-inside space-y-1 ml-2">
                                {selectedMethod.payment_qr_link ? (
                                  <>
                                    <li>Open your {selectedMethod.provider.toLowerCase()} app</li>
                                    <li>Tap "Send Money" or "Pay QR"</li>
                                    <li>Scan the QR code above</li>
                                    <li>Enter amount: ₱{downPayment}</li>
                                    <li>Complete the payment</li>
                                    <li>Upload screenshot below</li>
                                  </>
                                ) : (
                                  <>
                                    <li>Open your {selectedMethod.provider.toLowerCase()} app or visit their website</li>
                                    <li>Select "Send Money" or "Transfer"</li>
                                    <li>Use the account details provided above</li>
                                    <li>Enter amount: ₱{downPayment}</li>
                                    <li>Complete the payment</li>
                                    <li>Upload proof of payment below</li>
                                  </>
                                )}
                              </ol>
                            </div>

                            {/* Important Note */}
                            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Important Note:
                              </p>
                              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                                <li>• Make sure to pay the exact downpayment amount</li>
                                <li>• Screenshot must be clear and show transaction details</li>
                                <li>• Your booking will be confirmed once payment is verified</li>
                                {selectedMethod.payment_qr_link && (
                                  <li>• QR code payments are usually processed faster</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Upload Proof of Payment */}
                      <div className="mt-4">
                        <label
                          htmlFor="payment-proof"
                          className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${
                            errors.paymentProof ? 'text-red-700 dark:text-red-400' : ''
                          }`}
                        >
                          Upload Proof of Payment *
                        </label>
                        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          errors.paymentProof ? 'border-red-500 bg-red-50 dark:bg-red-900/20 hover:border-red-600' : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary dark:hover:border-brand-primary'
                        }`}>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => {
                              handleFileChange(e, 'payment');
                              setErrors(prev => ({...prev, paymentProof: ''}));
                            }}
                            className="hidden"
                            id="payment-proof"
                          />
                          {!formData.paymentProofPreview && (
                            <label htmlFor="payment-proof" className="cursor-pointer">
                              <Upload className={`w-12 h-12 mx-auto mb-4 ${errors.paymentProof ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
                              <p className={`font-medium mb-2 ${errors.paymentProof ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                                Click to upload payment screenshot
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                            </label>
                          )}

                          {formData.paymentProofPreview && (
                            <div className="mt-4 flex flex-col items-center">
                              <Image
                                src={formData.paymentProofPreview}
                                alt="Payment proof preview"
                                width={300}
                                height={200}
                                className="max-w-xs mx-auto rounded-lg shadow-md"
                              />
                              
                              <div className="mt-3 flex flex-col items-center gap-2">
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1">
                                      <Info className="w-3 h-3" />
                                      Photo should not be blurred and always clear
                                  </p>
                                  
                                  <div className="flex gap-2">
                                      <label
                                        htmlFor="payment-proof"
                                        className="cursor-pointer px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                                      >
                                        Change
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, paymentProof: null, paymentProofPreview: '' }))}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200 transition-colors"
                                      >
                                        Remove
                                      </button>
                                  </div>
                              </div>

                              <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                File uploaded
                              </p>
                            </div>
                          )}
                        </div>
                        {errors.paymentProof && (
                          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.paymentProof}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                        <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          <span>
                            <strong>Important:</strong> Your booking will be pending until the CSR verifies
                            your payment. Please ensure the screenshot clearly shows the transaction amount
                            and details.
                          </span>
                        </p>
                      </div>

                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>
                            <strong>Note:</strong> Down payments are non-refundable if you cancel your
                            bookings.
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6" ref={(el) => { errorRefs.current.termsAccepted = el; }}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={(e) => {
                            handleInputChange(e);
                            setErrors(prev => ({...prev, termsAccepted: ''}));
                          }}
                          className={`w-5 h-5 mt-1 ${errors.termsAccepted ? 'accent-red-500' : 'accent-blue-600'}`}
                        />
                        <span className={`text-sm ${errors.termsAccepted ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          I agree to the{" "}
                          <a 
                            href="/terms-of-service" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Terms and Conditions
                          </a>{" "}
                          and{" "}
                          <a 
                            href="/cancellation-policy" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Cancellation Policy
                          </a>
                        </span>
                      </label>
                      {errors.termsAccepted && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.termsAccepted}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-sm"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-2 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                          "Complete Booking"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column - Sidebar (Desktop only) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-primary" />
                    {bookingData.selectedRoom?.name || "Your Room"}
                  </h3>
                  {bookingData.selectedRoom?.tower && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {bookingData.selectedRoom.tower}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {bookingData.selectedRoom?.price || "₱1,799"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">/ night</span>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Dates
                  </label>
                  <DateRangePicker
                    checkInDate={localCheckInDate}
                    checkOutDate={localCheckOutDate}
                    onCheckInChange={setLocalCheckInDate}
                    onCheckOutChange={setLocalCheckOutDate}
                  />
                </div>

                {/* Guest Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Guests
                  </label>
                  <GuestSelector
                    guests={localGuests}
                    onGuestChange={handleGuestChange}
                  />
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="font-bold text-base mb-3 text-gray-800 dark:text-white">
                    Price Breakdown
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Room Rate
                        {formData.stayType === "Multi-Day Stay" && numberOfDays > 0 && (
                          <span className="text-xs ml-1">({numberOfDays} {numberOfDays === 1 ? 'night' : 'nights'})</span>
                        )}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {roomRate > 0 ? `₱${roomRate.toLocaleString()}` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Security Deposit</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {securityDeposit > 0 ? `₱${securityDeposit.toLocaleString()}` : "—"}
                      </span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Add-ons</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          ₱{addOnsTotal.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-bold text-gray-800 dark:text-white">Total</span>
                      <span className="font-bold text-brand-primary">
                        {displayTotal > 0 ? `₱${displayTotal.toLocaleString()}` : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Down Payment Info */}
                <div className="mt-4 p-3 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-lg border border-brand-primary/20">
                  <p className="text-center text-sm font-medium text-brand-primary dark:text-brand-primary">
                    Down payment: ₱{downPayment.toLocaleString()}
                  </p>
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Pay the remaining balance upon check-in
                  </p>
                </div>

                {/* Booking Info from Search */}
                {bookingData.isFromSearch && (localCheckInDate || localCheckOutDate) && (
                  <div className="mt-4 text-xs text-blue-600 dark:text-blue-400 text-center flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Previously selected from search
                  </div>
                )}

                {/* Desktop Action Buttons */}
                <div className="hidden lg:block mt-6 space-y-2">
                  {/* Back Button - Show on all steps except first step */}
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 text-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  
                  {/* Next/Submit Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep < 4) {
                        handleNext();
                      } else {
                        // For step 4, submit the form
                        const form = document.querySelector('form');
                        form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }
                    }}
                    disabled={isLoading}
                    className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-2 px-3 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {currentStep < 4 ? 'Loading...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        {currentStep < 4 ? 'Continue' : 'Complete Booking'}
                        {currentStep < 4 && <ChevronRight className="w-4 h-4" />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Dropdown Container - Appears at Top */}
          <div className="lg:hidden fixed top-20 left-0 right-0 z-50 px-4 py-2">
            {/* Date Dropdown */}
            <div id="mobile-date-dropdown" className="hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Dates</h3>
                <button 
                  onClick={() => {
                    const dropdown = document.getElementById('mobile-date-dropdown');
                    dropdown?.classList.add('hidden');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <DateRangePicker
                checkInDate={localCheckInDate}
                checkOutDate={localCheckOutDate}
                onCheckInChange={setLocalCheckInDate}
                onCheckOutChange={setLocalCheckOutDate}
              />
            </div>

            {/* Guest Dropdown */}
            <div id="mobile-guest-dropdown" className="hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Number of Guests</h3>
                <button 
                  onClick={() => {
                    const dropdown = document.getElementById('mobile-guest-dropdown');
                    dropdown?.classList.add('hidden');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <GuestSelector
                guests={localGuests}
                onGuestChange={handleGuestChange}
              />
            </div>
          </div>

          {/* Mobile Fixed Bottom Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 z-40">
            <div className="flex flex-col gap-3 max-w-7xl mx-auto">
              {/* Price and Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {displayTotal > 0 ? `₱${displayTotal.toLocaleString()}` : "Select dates"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">total</span>
                  </div>
                </div>
                <span className="text-xs text-brand-primary font-medium">₱{downPayment.toLocaleString()} down payment</span>
              </div>
              
              {/* Date and Guest Selection Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* Date Button */}
                <button
                  data-dropdown-trigger="date"
                  onClick={() => {
                    // Close guest dropdown if open
                    const guestDropdown = document.getElementById('mobile-guest-dropdown');
                    guestDropdown?.classList.add('hidden');
                    
                    // Toggle date dropdown
                    const dateDropdown = document.getElementById('mobile-date-dropdown');
                    dateDropdown?.classList.toggle('hidden');
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-brand-primary transition-colors"
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dates</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {localCheckInDate && localCheckOutDate 
                        ? `${formatDateSafe(localCheckInDate, { month: 'short', day: 'numeric' })} - ${formatDateSafe(localCheckOutDate, { month: 'short', day: 'numeric' })}`
                        : localCheckInDate 
                        ? formatDateSafe(localCheckInDate, { month: 'short', day: 'numeric' })
                        : 'Add dates'
                      }
                    </p>
                  </div>
                </button>
                
                {/* Guest Button */}
                <button
                  data-dropdown-trigger="guest"
                  onClick={() => {
                    // Close date dropdown if open
                    const dateDropdown = document.getElementById('mobile-date-dropdown');
                    dateDropdown?.classList.add('hidden');
                    
                    // Toggle guest dropdown
                    const guestDropdown = document.getElementById('mobile-guest-dropdown');
                    guestDropdown?.classList.toggle('hidden');
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-brand-primary transition-colors"
                >
                  <Users className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guests</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {localGuests.adults + localGuests.children + localGuests.infants} guests
                    </p>
                  </div>
                </button>
              </div>
              
              {/* Booking Info from Search */}
              {bookingData.isFromSearch && (localCheckInDate || localCheckOutDate) && (
                <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
                  📅 Previously selected from search
                </div>
              )}
              
              {/* Mobile Action Buttons */}
              <div className="grid gap-2" style={{
                gridTemplateColumns: currentStep > 1 ? '1fr 1fr' : '1fr'
              }}>
                {/* Back Button - Show on all steps except first step */}
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-300"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                )}
                
                {/* Next/Submit Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep < 4) {
                      handleNext();
                    } else {
                      // For step 4, submit the form
                      const form = document.querySelector('form');
                      form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                  }}
                  disabled={isLoading || isMobileLoading}
                  className={`${currentStep > 1 ? '' : 'col-span-2'} bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold py-2.5 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isLoading || isMobileLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {currentStep < 4 ? 'Loading...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      {currentStep < 4 ? 'Continue' : 'Complete Booking'}
                      {currentStep < 4 && <ChevronRight className="w-5 h-5" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </SidebarLayout>
    </>
  );
};

export default Checkout;