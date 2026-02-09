"use client";

// This file has been replaced with Checkout form structure
// The content is too large to display here, but it includes:
// - Multi-step form (Guest Info, Booking Details, Add-ons, Payment)
// - All form fields from Checkout.tsx
// - Adapted for modal context without Redux dependencies

import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar,
  Mail,
  Phone,
  User,
  X,
  Users,
  Clock,
  ArrowLeft,
  Upload,
  Plus,
  Minus,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Package,
  Camera,
  Wallet,
  Info,
  ChevronRight,
  Building2,
  Receipt,
  LogIn,
  LogOut,
} from "lucide-react";
import { useCreateBookingMutation, useGetRoomBookingsQuery, useUpdateBookingStatusMutation } from "@/redux/api/bookingsApi";
import { useGetHavensQuery } from "@/redux/api/roomApi";
import toast from "react-hot-toast";
import Image from "next/image";

interface NewBookingModalProps {
  onClose: () => void;
  initialBooking?: {
    id: string;
    booking_id: string;
    guest_first_name: string;
    guest_last_name: string;
    guest_email: string;
    guest_phone: string;
    guest_gender?: string;
    room_name: string;
    check_in_date: string;
    check_out_date: string;
    check_in_time: string;
    check_out_time: string;
    adults: number;
    children: number;
    infants: number;
    facebook_link?: string;
    payment_method: string;
    payment_proof_url?: string;
    valid_id_url?: string;
    room_rate: number;
    security_deposit: number;
    add_ons_total: number;
    total_amount: number;
    down_payment: number;
    remaining_balance: number;
    status: string;
    add_ons?: unknown;
    additional_guests?: unknown;
    stay_type?: string;
    guests?: unknown;
  };
  onSuccess?: (result?: { mode: "create" | "update"; id?: string; booking_id: string }) => void;
}

interface Haven {
  uuid_id: string;
  haven_name: string;
  tower: string;
  floor: string;
  view_type: string;
  capacity: number;
  room_size: string;
  beds: string;
  description: string;
  youtube_url?: string;
  six_hour_rate: number;
  ten_hour_rate: number;
  weekday_rate: number;
  weekend_rate: number;
}

interface AddOns {
  poolPass: number;
  towels: number;
  bathRobe: number;
  extraComforter: number;
  guestKit: number;
  extraSlippers: number;
}

interface GuestInfo {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  validId: File | null;
  validIdPreview: string;
}

type AnyRecord = Record<string, any>;

interface Booking {
  status: string;
  check_in_date: string;
  check_out_date: string;
}

const ADD_ON_PRICES = {
  poolPass: 100,
  towels: 50,
  bathRobe: 150,
  extraComforter: 100,
  guestKit: 75,
  extraSlippers: 30,
};

const statusOptions = ["pending", "approved", "declined", "checked-in", "checked-out", "cancelled", "completed"];
const paymentMethods = ["cash", "gcash", "bank-transfer", "credit-card"];

export default function NewBookingModal({ onClose, initialBooking, onSuccess }: NewBookingModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();
  const [updateBooking, { isLoading: isUpdating }] = useUpdateBookingStatusMutation();
  const { data: havensData, isLoading: isLoadingHavens } = useGetHavensQuery({}) as { data: Haven[]; isLoading: boolean };
  const isEditMode = Boolean(initialBooking?.id);
  const isLoading = isCreating || isUpdating;

  const [fullBooking, setFullBooking] = useState<AnyRecord | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [bookingIdState] = useState(() => initialBooking?.booking_id || `BK${Date.now()}`);

  const [selectedHaven, setSelectedHaven] = useState<Haven | null>(null);
  const [checkInDate, setCheckInDate] = useState(initialBooking?.check_in_date || "");
  const [checkOutDate, setCheckOutDate] = useState(initialBooking?.check_out_date || "");

  const [formData, setFormData] = useState({
    firstName: initialBooking?.guest_first_name || "",
    lastName: initialBooking?.guest_last_name || "",
    age: "",
    gender: initialBooking?.guest_gender || "",
    email: initialBooking?.guest_email || "",
    phone: initialBooking?.guest_phone || "",
    facebookLink: initialBooking?.facebook_link || "",
    validId: null as File | null,
    validIdPreview: initialBooking?.valid_id_url || "",
    adults: initialBooking?.adults ?? 1,
    children: initialBooking?.children ?? 0,
    infants: initialBooking?.infants ?? 0,
    stayType: initialBooking?.stay_type || "",
    checkInTime: initialBooking?.check_in_time || "14:00",
    checkOutTime: initialBooking?.check_out_time || "12:00",
    paymentProof: null as File | null,
    paymentProofPreview: initialBooking?.payment_proof_url || "",
    termsAccepted: false,
    paymentMethod: initialBooking?.payment_method || "gcash",
    status: initialBooking?.status || "pending",
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

  // If editing, fetch full booking details to ensure we can prefill everything
  useEffect(() => {
    if (!initialBooking?.id) {
      setFullBooking(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/bookings/${initialBooking.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data;
        if (!cancelled && data) setFullBooking(data);
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [initialBooking?.id]);

  // Apply full booking to form when loaded
  useEffect(() => {
    if (!isEditMode) return;
    if (!fullBooking) return;

    // stay_type -> stayType
    setFormData((prev) => ({
      ...prev,
      firstName: fullBooking.guest_first_name ?? prev.firstName,
      lastName: fullBooking.guest_last_name ?? prev.lastName,
      email: fullBooking.guest_email ?? prev.email,
      phone: fullBooking.guest_phone ?? prev.phone,
      facebookLink: fullBooking.facebook_link ?? prev.facebookLink,
      gender: fullBooking.guest_gender ?? prev.gender,
      stayType: fullBooking.stay_type ?? prev.stayType,
      checkInTime: fullBooking.check_in_time ?? prev.checkInTime,
      checkOutTime: fullBooking.check_out_time ?? prev.checkOutTime,
      paymentMethod: fullBooking.payment_method ?? prev.paymentMethod,
      status: fullBooking.status ?? prev.status,
      validIdPreview: fullBooking.valid_id_url ?? prev.validIdPreview,
      paymentProofPreview: fullBooking.payment_proof_url ?? prev.paymentProofPreview,
    }));

    if (fullBooking.check_in_date) setCheckInDate(String(fullBooking.check_in_date));
    if (fullBooking.check_out_date) setCheckOutDate(String(fullBooking.check_out_date));

    // Prefill add-ons quantities
    const ao: AddOns = {
      poolPass: 0,
      towels: 0,
      bathRobe: 0,
      extraComforter: 0,
      guestKit: 0,
      extraSlippers: 0,
    };

    const list = Array.isArray(fullBooking.add_ons) ? fullBooking.add_ons : [];
    for (const item of list) {
      const name = String((item as any)?.name || "");
      const qty = Number((item as any)?.quantity || 0);
      if (name in ao) {
        (ao as any)[name] = qty;
      }
    }
    setAddOns(ao);

    // Prefill additional guests (exclude the main guest)
    const guestsList = Array.isArray(fullBooking.guests) ? fullBooking.guests : [];
    const additional = guestsList.slice(1).map((g: any) => ({
      firstName: String(g?.firstName || ""),
      lastName: String(g?.lastName || ""),
      age: String(g?.age || ""),
      gender: String(g?.gender || ""),
      validId: null,
      validIdPreview: String(g?.valid_id_url || ""),
    }));
    if (additional.length) setAdditionalGuests(additional);
  }, [isEditMode, fullBooking]);

  // Fetch room bookings for date availability
  const { data: roomBookingsData } = useGetRoomBookingsQuery(
    selectedHaven?.uuid_id || '',
    { skip: !selectedHaven?.uuid_id }
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => {
      cancelAnimationFrame(rafId);
      setIsMounted(false);
    };
  }, []);

  const havens: Haven[] = Array.isArray(havensData) ? havensData : [];

  // Prefill selected haven in edit mode once havens load
  useEffect(() => {
    if (!initialBooking?.room_name) return;
    if (!havens.length) return;
    const found = havens.find((h) => h.haven_name === initialBooking.room_name) || null;
    setSelectedHaven(found);
  }, [initialBooking?.room_name, havens]);

  // Ensure additional guests array length matches adults+children in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    updateAdditionalGuests(formData.adults, formData.children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // Check date availability - MUST be before early return
  const isDateUnavailable = useMemo(() => {
    return (date: Date) => {
      if (!roomBookingsData?.data) return false;
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return roomBookingsData.data.some((booking: Booking) => {
        const approvedStatuses = ['approved', 'confirmed', 'check_in', 'checked-in'];
        if (!approvedStatuses.includes(booking.status)) return false;
        const bookingCheckIn = new Date(booking.check_in_date);
        bookingCheckIn.setHours(0, 0, 0, 0);
        const bookingCheckOut = new Date(booking.check_out_date);
        bookingCheckOut.setHours(0, 0, 0, 0);
        return checkDate >= bookingCheckIn && checkDate <= bookingCheckOut;
      });
    };
  }, [roomBookingsData]);

  if (!isMounted) return null;

  // Calculate number of days
  const calculateNumberOfDays = (): number => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate room rate
  const getRoomRateFromStayType = (): number => {
    if (!formData.stayType || !selectedHaven) return 0;
    if (formData.stayType === "10 Hours - ₱1,599") {
      return selectedHaven.six_hour_rate || 1599;
    } else if (formData.stayType.includes("weekday")) {
      return selectedHaven.weekday_rate || 1799;
    } else if (formData.stayType.includes("Fri-Sat")) {
      return selectedHaven.weekend_rate || 1999;
    } else if (formData.stayType === "Multi-Day Stay") {
      const baseRate = selectedHaven.weekday_rate || 1799;
      return baseRate * calculateNumberOfDays();
    }
    return selectedHaven.ten_hour_rate || 0;
  };

  const roomRate = getRoomRateFromStayType();
  const numberOfDays = calculateNumberOfDays();
  const securityDeposit = formData.stayType ? 1000 : 0;
  const downPayment = 500;
  const addOnsTotal = Object.entries(addOns).reduce((total, [key, quantity]) => {
    return total + quantity * ADD_ON_PRICES[key as keyof AddOns];
  }, 0);
  const totalAmount = roomRate + securityDeposit + addOnsTotal;
  const remainingBalance = totalAmount - downPayment;

  // Update additional guests
  function updateAdditionalGuests(adults: number, children: number) {
    const totalAdditionalGuests = adults + children - 1;
    setAdditionalGuests(prev => {
      if (totalAdditionalGuests > prev.length) {
        const newGuests = Array(totalAdditionalGuests - prev.length).fill(null).map(() => ({
          firstName: "",
          lastName: "",
          age: "",
          gender: "",
          validId: null,
          validIdPreview: "",
        }));
        return [...prev, ...newGuests];
      } else if (totalAdditionalGuests < prev.length) {
        return prev.slice(0, totalAdditionalGuests);
      }
      return prev;
    });
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === "adults" || name === "children") {
      const newValue = parseInt(value) || 0;
      const currentAdults = name === "adults" ? newValue : formData.adults;
      const currentChildren = name === "children" ? newValue : formData.children;
      const newTotal = currentAdults + currentChildren;

      if (newTotal > 4) {
        toast.error("Maximum 4 guests allowed (adults + children). Infants are not counted.");
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: newValue,
      }));
      updateAdditionalGuests(currentAdults, currentChildren);
    } else if (name === "roomName") {
      const haven = havens.find(h => h.haven_name === value);
      setSelectedHaven(haven || null);
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'payment' | 'id', guestIndex?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'payment') {
        setFormData(prev => ({
          ...prev,
          paymentProof: file,
          paymentProofPreview: URL.createObjectURL(file),
        }));
      } else if (guestIndex === undefined) {
        setFormData(prev => ({
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
    updatedGuests[index] = {
      ...updatedGuests[index],
      [field]: value,
    };
    setAdditionalGuests(updatedGuests);
  };

  const handleStayTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStayType = e.target.value;
    let defaultCheckInTime = "14:00";
    let defaultCheckOutTime = "12:00";

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

    setFormData(prev => ({
      ...prev,
      stayType: selectedStayType,
      checkInTime: defaultCheckInTime,
      checkOutTime: defaultCheckOutTime,
    }));
  };

  const validateTimes = (checkIn: string, checkOut: string, isSameDay: boolean) => {
    if (!checkIn || !checkOut) return true;
    if (!isSameDay) return true; // Different days, any time is technically valid for check-out

    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    
    const inTotal = inH * 60 + inM;
    const outTotal = outH * 60 + outM;

    // For same day, check-out must be after check-in
    // Exception: 00:00 (midnight) is often considered next day in UI but 0 in value
    if (outTotal === 0 && inTotal > 0) return true; 
    
    return outTotal > inTotal;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isSameDay = checkInDate === checkOutDate;

    setFormData(prev => {
      const newFormData = { ...prev, [name]: value };
      
      // Auto-adjust if invalid
      if (name === "checkInTime" && isSameDay) {
        if (!validateTimes(value, prev.checkOutTime, true)) {
          // If check-in is moved after check-out, push check-out forward or to next day
          const [h, m] = value.split(':').map(Number);
          const newOutH = (h + 2) % 24;
          newFormData.checkOutTime = `${String(newOutH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          
          if (newOutH < h) {
            // Moved to next day, update checkOutDate if possible
            const d = new Date(checkInDate);
            d.setDate(d.getDate() + 1);
            setCheckOutDate(d.toISOString().split('T')[0]);
          }
        }
      }

      return newFormData;
    });
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
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!isEditMode && !formData.age) newErrors.age = "Age is required";
    if (!isEditMode && !formData.gender) newErrors.gender = "Please select a gender";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (formData.age && parseInt(formData.age) >= 10 && !formData.validId && !formData.validIdPreview) {
      newErrors.validId = "Valid ID is required for guests 10+ years old";
    }
    for (let i = 0; i < additionalGuests.length; i++) {
      const guest = additionalGuests[i];
      const guestNumber = i + 2;
      if (!guest.firstName) newErrors[`guest${i}FirstName`] = `Guest ${guestNumber} first name is required`;
      if (!guest.lastName) newErrors[`guest${i}LastName`] = `Guest ${guestNumber} last name is required`;
      if (!isEditMode) {
        if (!guest.age) newErrors[`guest${i}Age`] = `Guest ${guestNumber} age is required`;
        if (!guest.gender) newErrors[`guest${i}Gender`] = `Guest ${guestNumber} gender is required`;
        if (guest.age && parseInt(guest.age) >= 10 && !guest.validId) {
          newErrors[`guest${i}ValidId`] = `Valid ID is required for Guest ${guestNumber} (10+ years old)`;
        }
      } else {
        if (guest.age && parseInt(guest.age) >= 10 && !guest.validId && !guest.validIdPreview) {
          newErrors[`guest${i}ValidId`] = `Valid ID is required for Guest ${guestNumber} (10+ years old)`;
        }
      }
    }
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
    if (!formData.stayType) newErrors.stayType = "Please select a stay type";
    if (!checkInDate) newErrors.checkInDate = "Check-in date is required";
    if (!checkOutDate) newErrors.checkOutDate = "Check-out date is required";
    if (!formData.checkInTime) newErrors.checkInTime = "Check-in time is required";
    if (!formData.checkOutTime) newErrors.checkOutTime = "Check-out time is required";
    if (!selectedHaven) newErrors.roomName = "Please select a room/haven";
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
    if (!formData.paymentProof && !formData.paymentProofPreview) {
      newErrors.paymentProof = "Proof of payment is required";
    }
    if (!isEditMode && !formData.termsAccepted) {
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
    if (currentStep === 1) {
      if (validateStep1()) {
        setCompletedSteps(prev => [...prev, 1]);
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCompletedSteps(prev => [...prev, 2]);
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      setCompletedSteps(prev => [...prev, 3]);
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    const getApiErrorMessage = (err: unknown) => {
      if (!err || typeof err !== "object") return null;
      const anyErr = err as any;
      const data = anyErr?.data;
      if (data && typeof data === "object") {
        const msg = (data.error || data.message) as unknown;
        if (typeof msg === "string" && msg.trim()) return msg;
      }
      const msg = anyErr?.error as unknown;
      if (typeof msg === "string" && msg.trim()) return msg;
      return null;
    };

    try {

      // Convert files to base64
      let paymentProofBase64 = '';
      if (formData.paymentProof) {
        const reader = new FileReader();
        paymentProofBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.paymentProof as File);
        });
      }

      let validIdBase64 = '';
      if (formData.validId) {
        const reader = new FileReader();
        validIdBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.validId as File);
        });
      }

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
            valid_id_url: guest.validIdPreview,
          };
        })
      );

      const bookingData = {
        booking_id: bookingIdState,
        user_id: null,
        guest_first_name: formData.firstName,
        guest_last_name: formData.lastName,
        guest_age: Number(formData.age),
        guest_gender: formData.gender,
        guest_email: formData.email,
        guest_phone: formData.phone,
        facebook_link: formData.facebookLink || undefined,
        valid_id: validIdBase64,
        valid_id_url: formData.validIdPreview || undefined,
        additional_guests: additionalGuestsData,
        room_name: selectedHaven?.haven_name || 'Standard Room',
        stay_type: formData.stayType,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        check_in_time: formData.checkInTime,
        check_out_time: formData.checkOutTime,
        adults: formData.adults,
        children: formData.children,
        infants: formData.infants,
        payment_method: formData.paymentMethod,
        payment_proof: paymentProofBase64,
        payment_proof_url: formData.paymentProofPreview || undefined,
        room_rate: roomRate,
        security_deposit: securityDeposit,
        add_ons_total: addOnsTotal,
        total_amount: totalAmount,
        down_payment: downPayment,
        remaining_balance: remainingBalance,
        add_ons: addOns,
        status: formData.status,
      };

      if (isEditMode && initialBooking?.id) {
        await updateBooking({
          id: initialBooking.id,
          ...bookingData,
        }).unwrap();
        toast.success("Booking updated successfully!");
        onSuccess?.({ mode: "update", id: initialBooking.id, booking_id: bookingIdState });
      } else {
        const created = await createBooking(bookingData).unwrap();
        const createdId = (created as any)?.data?.id as string | undefined;
        toast.success("You've successfully added booking!");
        onSuccess?.({ mode: "create", id: createdId, booking_id: bookingIdState });
      }
      onClose();
    } catch (error) {
      const message = getApiErrorMessage(error);
      toast.error(message || (isEditMode ? "Failed to update booking" : "Failed to create booking"));
      console.error(error);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center px-4 py-4 z-[9999]">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-[0.2em]">
                Booking manager
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {isEditMode ? "Edit Booking" : "Create New Booking"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentStep === 1 && "Please fill in guest information"}
                {currentStep === 2 && "Select stay type and booking dates"}
                {currentStep === 3 && "Enhance your stay with optional amenities"}
                {currentStep === 4 && "Review your booking and complete payment"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 rounded-full hover:bg-white/70 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                        completedSteps.includes(step)
                          ? "bg-green-600 text-white"
                          : currentStep === step
                          ? "bg-brand-primary text-white"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {completedSteps.includes(step) ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : step === 1 ? (
                        <User className="w-5 h-5" />
                      ) : step === 2 ? (
                        <Calendar className="w-5 h-5" />
                      ) : step === 3 ? (
                        <Package className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        completedSteps.includes(step) || currentStep === step
                          ? "text-brand-primary"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step === 1 ? "Guest Info" : step === 2 ? "Booking" : step === 3 ? "Add-ons" : "Payment"}
                    </span>
                  </div>
                  {index < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${completedSteps.includes(step) ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* STEP 1: Guest Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Main Guest */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <User className="w-6 h-6 text-brand-primary" />
                    Guest Information
                  </h2>

                  <div className="flex items-center gap-2 mb-4 text-brand-primary">
                    <User className="w-5 h-5" />
                    <h3 className="font-semibold">Adult 1 (Main Guest)</h3>
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
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
                        onChange={(e) => {
                          handleInputChange(e);
                          setErrors(prev => ({...prev, age: ''}));
                        }}
                        min="1"
                        max="120"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.age ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
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
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.gender ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                        onChange={(e) => {
                          handleInputChange(e);
                          setErrors(prev => ({...prev, email: ''}));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
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
                        onChange={(e) => {
                          handleInputChange(e);
                          setErrors(prev => ({...prev, phone: ''}));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Valid ID Upload */}
                  <div ref={(el) => { errorRefs.current.validId = el; }} className={`mt-6 p-4 border-2 border-dashed rounded-lg ${
                    errors.validId ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className={`w-5 h-5 ${errors.validId ? 'text-red-600' : 'text-blue-600'}`} />
                      <h3 className={`font-semibold ${errors.validId ? 'text-red-800' : 'text-blue-800'}`}>
                        Valid ID (Required for guests 10+ years old)
                      </h3>
                    </div>
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => handleFileChange(e, 'id')}
                        className="hidden"
                        id="valid-id"
                      />
                      <label htmlFor="valid-id" className="cursor-pointer inline-flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                        <Upload className="w-12 h-12 text-blue-500 mb-3" />
                        <p className="text-blue-600 font-medium mb-1">Click to upload ID photo</p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                      </label>
                      {formData.validIdPreview && (
                        <div className="mt-4">
                          <Image
                            src={formData.validIdPreview}
                            alt="Valid ID preview"
                            width={300}
                            height={200}
                            className="max-w-xs mx-auto rounded-lg shadow-md border-2 border-green-500"
                          />
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

                {/* Guest Count */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6 text-brand-primary" />
                    Number of Guests
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Adults (10+ years) *
                      </label>
                      <input
                        type="number"
                        name="adults"
                        value={formData.adults}
                        onChange={handleInputChange}
                        min="1"
                        max="4"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Children (4-9 years)
                      </label>
                      <input
                        type="number"
                        name="children"
                        value={formData.children}
                        onChange={handleInputChange}
                        min="0"
                        max="4"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Infants (0-3 years)
                      </label>
                      <input
                        type="number"
                        name="infants"
                        value={formData.infants}
                        onChange={handleInputChange}
                        min="0"
                        max="2"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Guests */}
                {additionalGuests.map((guest, index) => {
                  const guestNumber = index + 2;
                  const isAdult = index < formData.adults - 1;
                  const guestType = isAdult ? `Adult ${guestNumber}` : `Child ${guestNumber - (formData.adults - 1)}`;

                  return (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                      <div className="flex items-center gap-2 mb-4 text-brand-primary">
                        <User className="w-5 h-5" />
                        <h3 className="font-semibold">{guestType}</h3>
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors[`guest${index}FirstName`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors[`guest${index}LastName`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
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
                            min="1"
                            max="120"
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors[`guest${index}Age`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors[`guest${index}Gender`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                      {/* Valid ID for Additional Guest */}
                      <div ref={(el) => { errorRefs.current[`guest${index}ValidId`] = el; }} className={`mt-6 p-4 border-2 border-dashed rounded-lg ${
                        errors[`guest${index}ValidId`] ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300'
                      }`}>
                        <div className="text-center">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleFileChange(e, 'id', index)}
                            className="hidden"
                            id={`valid-id-${index}`}
                          />
                          <label htmlFor={`valid-id-${index}`} className="cursor-pointer inline-flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                            <Upload className="w-12 h-12 text-blue-500 mb-3" />
                            <p className="text-blue-600 font-medium mb-1">Click to upload ID photo</p>
                          </label>
                          {guest.validIdPreview && (
                            <div className="mt-4">
                              <Image
                                src={guest.validIdPreview}
                                alt={`Guest ${guestNumber} Valid ID preview`}
                                width={300}
                                height={200}
                                className="max-w-xs mx-auto rounded-lg shadow-md border-2 border-green-500"
                              />
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

                {/* Next Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold py-3 px-8 rounded-lg shadow-lg"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Booking Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Room Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-brand-primary" />
                    Booking Details
                  </h2>

                  <div ref={(el) => { errorRefs.current.roomName = el; }} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Haven/Room *
                    </label>
                    <select
                      name="roomName"
                      value={selectedHaven?.haven_name || ""}
                      onChange={handleInputChange}
                      disabled={isLoadingHavens}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.roomName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">{isLoadingHavens ? "Loading havens..." : "Select a haven/room"}</option>
                      {havens.map((haven) => (
                        <option key={haven.uuid_id} value={haven.haven_name}>
                          {haven.haven_name} - {haven.tower} (Weekday ₱{haven.weekday_rate.toLocaleString()} / Weekend ₱{haven.weekend_rate.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    {errors.roomName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.roomName}
                      </p>
                    )}
                  </div>

                  <div ref={(el) => { errorRefs.current.stayType = el; }} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Stay Type *
                    </label>
                    <select
                      name="stayType"
                      value={formData.stayType}
                      onChange={handleStayTypeChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        errors.stayType ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select Stay Type</option>
                      <option value="10 Hours - ₱1,599">10 Hours - ₱1,599 (2:00 PM - 12:00 AM)</option>
                      <option value="21 Hours (Sun-Thu weekday) - ₱1,799">21 Hours (Sun-Thu weekday) - ₱1,799 (2:00 PM - 11:00 AM)</option>
                      <option value="21 Hours (Fri-Sat) - ₱1,999">21 Hours (Fri-Sat) - ₱1,999 (2:00 PM - 11:00 AM)</option>
                      <option value="Multi-Day Stay">Multi-Day Stay (Custom dates)</option>
                    </select>
                    {errors.stayType && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.stayType}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div ref={(el) => { errorRefs.current.checkInDate = el; }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-in Date *
                      </label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => {
                          setCheckInDate(e.target.value);
                          setErrors(prev => ({...prev, checkInDate: ''}));
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.checkInDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.checkInDate && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.checkInDate}
                        </p>
                      )}
                    </div>

                    <div ref={(el) => { errorRefs.current.checkOutDate = el; }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-out Date *
                      </label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => {
                          setCheckOutDate(e.target.value);
                          setErrors(prev => ({...prev, checkOutDate: ''}));
                        }}
                        min={checkInDate || new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.checkOutDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                      {errors.checkOutDate && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.checkOutDate}
                        </p>
                      )}
                    </div>

                    <div ref={(el) => { errorRefs.current.checkInTime = el; }}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Check-in Time *
                      </label>
                      <input
                        type="time"
                        name="checkInTime"
                        value={formData.checkInTime}
                        onChange={(e) => {
                          handleTimeChange(e);
                          setErrors(prev => ({...prev, checkInTime: ''}));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.checkInTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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
                      </label>
                      <input
                        type="time"
                        name="checkOutTime"
                        value={formData.checkOutTime}
                        onChange={(e) => {
                          handleTimeChange(e);
                          setErrors(prev => ({...prev, checkOutTime: ''}));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          errors.checkOutTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold py-3 rounded-lg shadow-lg"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Add-ons */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Package className="w-6 h-6 text-brand-primary" />
                    Add-ons (Optional)
                  </h2>

                  <div className="space-y-3">
                    {[
                      { key: "poolPass", label: "Pool Pass", price: ADD_ON_PRICES.poolPass },
                      { key: "towels", label: "Towels", price: ADD_ON_PRICES.towels },
                      { key: "bathRobe", label: "Bath Robe", price: ADD_ON_PRICES.bathRobe },
                      { key: "extraComforter", label: "Extra Comforter", price: ADD_ON_PRICES.extraComforter },
                      { key: "guestKit", label: "Guest Kit", price: ADD_ON_PRICES.guestKit },
                      { key: "extraSlippers", label: "Extra Slippers", price: ADD_ON_PRICES.extraSlippers },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-primary transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">₱{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleAddOnChange(item.key as keyof AddOns, false)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                            {addOns[item.key as keyof AddOns]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddOnChange(item.key as keyof AddOns, true)}
                            className="w-8 h-8 flex items-center justify-center bg-brand-primary hover:bg-brand-primaryDark text-white rounded-full"
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
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold py-3 rounded-lg shadow-lg"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Payment & Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Booking Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-brand-primary" />
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
                        {checkInDate ? new Date(checkInDate).toLocaleDateString() : "N/A"} at {formData.checkInTime || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <LogOut className="w-4 h-4" />
                        Check-out
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {checkOutDate ? new Date(checkOutDate).toLocaleDateString() : "N/A"} at {formData.checkOutTime || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Stay Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formData.stayType || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Room</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedHaven?.haven_name || 'Standard Room'}
                      </p>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t pt-4 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Price Breakdown</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-700 dark:text-gray-300">
                        <span>Room Rate{formData.stayType === "Multi-Day Stay" && numberOfDays > 0 && ` (${numberOfDays} ${numberOfDays === 1 ? 'day' : 'days'})`}</span>
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
                        <span className="text-orange-500">₱{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 space-y-2">
                      <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Payment
                      </h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700 dark:text-green-300">Downpayment</span>
                        <span className="font-bold text-green-800 dark:text-green-200">₱{downPayment.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700 dark:text-green-300">Remaining Balance</span>
                        <span className="font-bold text-green-800 dark:text-green-200">₱{remainingBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-brand-primary" />
                    Payment Method
                  </h2>

                  <div className="space-y-3 mb-6">
                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-brand-primary transition-colors bg-white dark:bg-gray-700">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="gcash"
                        checked={formData.paymentMethod === "gcash"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-brand-primary accent-brand-primary"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">GCash</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-brand-primary transition-colors bg-white dark:bg-gray-700">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank-transfer"
                        checked={formData.paymentMethod === "bank-transfer"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-brand-primary accent-brand-primary"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">Bank Transfer</span>
                    </label>
                  </div>

                  {/* Payment Instructions */}
                  {formData.paymentMethod === "gcash" ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-brand-primary" />
                        Pay via GCash
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                        Scan the QR code below to pay your <strong>DOWNPAYMENT of ₱{downPayment}</strong>
                      </p>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-8 text-center mb-4">
                        <div className="w-64 h-64 mx-auto bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500 dark:text-gray-400">GCash QR Code</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-brand-primary" />
                        Pay via Bank Transfer
                      </h3>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 mb-4 space-y-3">
                        <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Bank Name:</span>
                          <span className="font-bold text-gray-800 dark:text-white">BDO Unibank</span>
                        </div>
                        <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Account Name:</span>
                          <span className="font-bold text-gray-800 dark:text-white">Staycation Haven Inc.</span>
                        </div>
                        <div className="flex justify-between items-center border-b dark:border-gray-600 pb-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Account Number:</span>
                          <span className="font-bold text-gray-800 dark:text-white">0123-4567-8901</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Amount:</span>
                          <span className="font-bold text-green-600 dark:text-green-400 text-xl">₱{downPayment}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Proof of Payment */}
                  <div className="mt-6" ref={(el) => { errorRefs.current.paymentProof = el; }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-brand-primary" />
                      Upload Proof of Payment *
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      errors.paymentProof ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-brand-primary'
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
                      <label htmlFor="payment-proof" className="cursor-pointer">
                        <Upload className={`w-12 h-12 mx-auto mb-4 ${errors.paymentProof ? 'text-red-400' : 'text-gray-400'}`} />
                        <p className={`font-medium mb-2 ${errors.paymentProof ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                          Click to upload payment screenshot
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, JPEG up to 5MB</p>
                      </label>
                      {formData.paymentProofPreview && (
                        <div className="mt-4">
                          <Image
                            src={formData.paymentProofPreview}
                            alt="Payment proof preview"
                            width={300}
                            height={200}
                            className="max-w-xs mx-auto rounded-lg shadow-md"
                          />
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
                </div>

                {/* Terms and Conditions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6" ref={(el) => { errorRefs.current.termsAccepted = el; }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={(e) => {
                        handleInputChange(e);
                        setErrors(prev => ({...prev, termsAccepted: ''}));
                      }}
                      className={`w-5 h-5 mt-1 ${errors.termsAccepted ? 'accent-red-500' : 'accent-brand-primary'}`}
                    />
                    <span className={`text-sm ${errors.termsAccepted ? 'text-red-700' : 'text-gray-700 dark:text-gray-300'}`}>
                      I agree to the Terms and Conditions and Cancellation Policy
                    </span>
                  </label>
                  {errors.termsAccepted && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.termsAccepted}
                    </p>
                  )}
                </div>

                {/* Status Selection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Booking Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-brand-primary hover:bg-brand-primaryDark text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Save Booking"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
