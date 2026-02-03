"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  X, Home, DollarSign, Clock, Calendar, FileText, Star, 
  Image as ImageIcon, Images, Youtube, CheckCircle2, AlertCircle, Circle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateHavenMutation, useUpdateHavenMutation } from "@/redux/api/roomApi";
import toast from 'react-hot-toast';
import { setCookie } from "@/lib/cookieUtils";
import BasicInformationModal from "./BasicInformationModal";
import PricingManagementModal from "./PricingManagementModal";
import CheckInTimeSettingsModal from "./CheckInTimeSettingsModal";
import AvailabilityManagementModal from "./AvailabilityManagementModal";
import HavenDetailsModal from "./HavenDetailsModal";
import AmenitiesModal from "./AmenitiesModal";
import HavenImagesModal from "./HavenImagesModal";
import PhotoTourManagementModal from "./PhotoTourManagementModal";
import YouTubeVideoModal from "./YouTubeVideoModal";

import { z } from 'zod';

enum StepStatus {
  NotStarted = "NotStarted",
  Incomplete = "Incomplete",
  Completed = "Completed",
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  component: React.ElementType;
  validationSchema?: z.ZodSchema<any>; // Optional Zod schema for validation
}

interface HavenData {
  uuid_id?: string;
  haven_name?: string;
  tower?: string;
  floor?: string;
  view_type?: string;
  capacity?: number;
  room_size?: number;
  beds?: string;
  description?: string;
  youtube_url?: string;
  six_hour_rate?: number;
  ten_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  six_hour_check_in?: string;
  six_hour_check_out?: string;
  ten_hour_check_in?: string;
  ten_hour_check_out?: string;
  twenty_one_hour_check_in?: string;
  twenty_one_hour_check_out?: string;
  amenities?: Record<string, boolean>;
  images?: ImageData[];
  photo_tours?: PhotoTourData[];
  blocked_dates?: BlockedDateData[];
  [key: string]: unknown;
}

interface ImageData {
  id?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface PhotoTourData {
  category?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface BlockedDateData {
  from_date: string;
  to_date: string;
  reason?: string;
}

interface BlockedDate {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
}

interface ApiError {
  data?: {
    error?: string;
  };
  message?: string;
}

interface HavenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: HavenData | null; // If provided, Edit Mode. If null/undefined, Add Mode.
}

// Define Zod Schemas for each step's validation
const basicInfoSchema = z.object({
  havenName: z.string().min(1, "Haven Name is required"),
  tower: z.string().min(1, "Tower is required"),
  floor: z.string().min(1, "Floor is required"),
  view: z.string().min(1, "View Type is required"),
});

const pricingSchema = z.object({
  sixHourRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "6-hour rate must be a positive number"),
  tenHourRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "10-hour rate must be a positive number"),
  weekdayRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weekday rate must be a positive number"),
  weekendRate: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Weekend rate must be a positive number"),
});

const checkInSchema = z.object({
  sixHourCheckIn: z.string().min(1, "6-hour check-in time is required"),
  tenHourCheckIn: z.string().min(1, "10-hour check-in time is required"),
  twentyOneHourCheckIn: z.string().min(1, "21-hour check-in time is required"),
});

const detailsSchema = z.object({
  capacity: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, "Capacity must be a positive number"),
  roomSize: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Room size must be a positive number"),
  beds: z.string().min(1, "Number of beds is required"),
  description: z.string().min(1, "Description is required"),
});

const imagesSchema = z.object({
  havenImages: z.array(z.any()), // This will be refined to check file length
  existingImages: z.array(z.any()),
}).refine(data => data.havenImages.length > 0 || data.existingImages.length > 0, {
  message: "At least one image is required",
  path: ["havenImages"],
});

// The STEPS array
const STEPS: Step[] = [
  { id: 'basic', label: 'Basic Info', description: 'Name, tower, floor, view', icon: Home, component: BasicInformationModal, validationSchema: basicInfoSchema },
  { id: 'pricing', label: 'Pricing', description: 'Rates & fees', icon: DollarSign, component: PricingManagementModal, validationSchema: pricingSchema },
  { id: 'checkin', label: 'Check-in', description: 'Time settings', icon: Clock, component: CheckInTimeSettingsModal, validationSchema: checkInSchema },
  { id: 'availability', label: 'Availability', description: 'Blocked dates', icon: Calendar, component: AvailabilityManagementModal }, // Validation handled internally or separately
  { id: 'details', label: 'Details', description: 'Capacity, beds, size', icon: FileText, component: HavenDetailsModal, validationSchema: detailsSchema },
  { id: 'amenities', label: 'Amenities', description: 'Features list', icon: Star, component: AmenitiesModal }, // Validation handled internally
  { id: 'images', label: 'Images', description: 'Gallery photos', icon: ImageIcon, component: HavenImagesModal, validationSchema: imagesSchema },
  { id: 'phototour', label: 'Photo Tour', description: 'Categorized photos', icon: Images, component: PhotoTourManagementModal }, // Validation handled internally
  { id: 'youtube', label: 'Video', description: 'YouTube URL', icon: Youtube, component: YouTubeVideoModal }, // Validation handled internally
];

const HavenFormModal = ({ isOpen, onClose, initialData }: HavenFormModalProps) => {
  const isEditMode = !!initialData;
  
  // mutations
  const [createHaven, { isLoading: isCreating }] = useCreateHavenMutation();
  const [updateHaven, { isLoading: isUpdating }] = useUpdateHavenMutation();
  
  const isLoading = isCreating || isUpdating;

  // Local State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(Array(STEPS.length).fill(StepStatus.NotStarted));
  const [isInitialized, setIsInitialized] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    havenName: "",
    tower: "",
    floor: "",
    view: "",
    capacity: "",
    roomSize: "",
    beds: "",
    sixHourRate: "",
    tenHourRate: "",
    weekdayRate: "",
    weekendRate: "",
    sixHourCheckIn: "09:00",
    sixHourCheckOut: "15:00",
    tenHourCheckIn: "09:00",
    tenHourCheckOut: "19:00",
    twentyOneHourCheckIn: "14:00",
    twentyOneHourCheckOut: "11:00",
    description: "",
    youtubeUrl: "",
    amenities: {
      wifi: true,
      netflix: true,
      airConditioning: true,
      fridge: true,
      inductionCooker: true,
      riceCooker: true,
      cookingSet: true,
      diningSet: true,
      hotColdShower: true,
      doubleBeds: true,
      pillowsComforters: true,
      clothesRack: true,
      humidifier: true,
      glowBed: true,
      ledLights: true,
      soundbar: true,
      boardGames: true,
      ps4: false,
      tv: false,
      poolAccess: false,
      parking: false,
      washerDryer: false,
      towels: false,
    },
  });

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [havenImages, setHavenImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ImageData[]>([]);
  
  const [photoTourImages, setPhotoTourImages] = useState<Record<string, File[]>>({
    livingArea: [],
    kitchenette: [],
    diningArea: [],
    fullBathroom: [],
    garage: [],
    exterior: [],
    pool: [],
    bedroom: [],
    additional: [],
  });
  const [existingPhotoTours, setExistingPhotoTours] = useState<PhotoTourData[]>([]);

  // Initialization Effect (Edit Mode)
  useEffect(() => {
    if (isEditMode && initialData && isOpen && !isInitialized) {
      setFormData({
        havenName: initialData.haven_name || "",
        tower: initialData.tower || "",
        floor: initialData.floor || "",
        view: initialData.view_type || "",
        capacity: initialData.capacity?.toString() || "",
        roomSize: initialData.room_size?.toString() || "",
        beds: initialData.beds || "",
        description: initialData.description || "",
        youtubeUrl: initialData.youtube_url || "",
        sixHourRate: initialData.six_hour_rate?.toString() || "",
        tenHourRate: initialData.ten_hour_rate?.toString() || "",
        weekdayRate: initialData.weekday_rate?.toString() || "",
        weekendRate: initialData.weekend_rate?.toString() || "",
        sixHourCheckIn: initialData.six_hour_check_in || "09:00",
        sixHourCheckOut: initialData.six_hour_check_out || "15:00",
        tenHourCheckIn: initialData.ten_hour_check_in || "09:00",
        tenHourCheckOut: initialData.ten_hour_check_out || "19:00",
        twentyOneHourCheckIn: initialData.twenty_one_hour_check_in || "14:00",
        twentyOneHourCheckOut: initialData.twenty_one_hour_check_out || "11:00",
        amenities: {
          wifi: initialData.amenities?.wifi || false,
          netflix: initialData.amenities?.netflix || false,
          ps4: initialData.amenities?.ps4 || false,
          glowBed: initialData.amenities?.glowBed || false,
          airConditioning: initialData.amenities?.airConditioning || false,
          fridge: initialData.amenities?.fridge || false,
          inductionCooker: initialData.amenities?.inductionCooker || false,
          riceCooker: initialData.amenities?.riceCooker || false,
          cookingSet: initialData.amenities?.cookingSet || false,
          diningSet: initialData.amenities?.diningSet || false,
          hotColdShower: initialData.amenities?.hotColdShower || false,
          doubleBeds: initialData.amenities?.doubleBeds || false,
          pillowsComforters: initialData.amenities?.pillowsComforters || false,
          clothesRack: initialData.amenities?.clothesRack || false,
          humidifier: initialData.amenities?.humidifier || false,
          ledLights: initialData.amenities?.ledLights || false,
          soundbar: initialData.amenities?.soundbar || false,
          boardGames: initialData.amenities?.boardGames || false,
          kitchen: initialData.amenities?.kitchen || false,
          balcony: initialData.amenities?.balcony || false,
          tv: initialData.amenities?.tv || false,
          poolAccess: initialData.amenities?.poolAccess || false,
          parking: initialData.amenities?.parking || false,
          washerDryer: initialData.amenities?.washerDryer || false,
          towels: initialData.amenities?.towels || false,
        },
      });

      setExistingImages(initialData.images || []);
      setExistingPhotoTours(initialData.photo_tours || []);

      if (initialData.blocked_dates) {
        setBlockedDates(
          initialData.blocked_dates.map((date, index) => ({
            id: index,
            fromDate: date.from_date,
            toDate: date.to_date,
            reason: date.reason || "",
          }))
        );
      }

      // In edit mode, mark all steps as completed for initial load
      setStepStatuses(Array(STEPS.length).fill(StepStatus.Completed));
      setIsInitialized(true);
    }
  }, [isEditMode, initialData, isOpen, isInitialized]);

  // Helper function to update form data based on step - moved to component level for stability
  const updateFormData = useCallback((stepId: string, data: any) => {
    if (stepId === 'basic') {
      setFormData(prev => ({
        ...prev,
        havenName: data.haven_name || "",
        tower: data.tower || "",
        floor: data.floor || "",
        view: data.view_type || "",
      }));
    } else if (stepId === 'pricing') {
      setFormData(prev => ({
        ...prev,
        sixHourRate: data.six_hour_rate?.toString() || "",
        tenHourRate: data.ten_hour_rate?.toString() || "",
        weekdayRate: data.weekday_rate?.toString() || "",
        weekendRate: data.weekend_rate?.toString() || "",
      }));
    } else if (stepId === 'checkin') {
      setFormData(prev => ({
        ...prev,
        sixHourCheckIn: data.six_hour_check_in || "09:00",
        sixHourCheckOut: data.six_hour_check_out || "15:00",
        tenHourCheckIn: data.ten_hour_check_in || "09:00",
        tenHourCheckOut: data.ten_hour_check_out || "19:00",
        twentyOneHourCheckIn: data.twenty_one_hour_check_in || "14:00",
        twentyOneHourCheckOut: data.twenty_one_hour_check_out || "11:00",
      }));
    } else if (stepId === 'availability') {
      setBlockedDates(data);
    } else if (stepId === 'details') {
      setFormData(prev => ({
        ...prev,
        capacity: data.capacity?.toString() || "",
        roomSize: data.room_size?.toString() || "",
        beds: data.beds || "",
        description: data.description || "",
      }));
    } else if (stepId === 'amenities') {
      setFormData(prev => ({ ...prev, amenities: { ...data } }));
      setCookie("haven_amenities", JSON.stringify(data));
    } else if (stepId === 'images') {
      const newImages = data.newImages || data.havenImages || [];
      const newExisting = data.existingImagesData || data.existingImages || [];
      setHavenImages(newImages);
      setExistingImages(newExisting);
    } else if (stepId === 'phototour') {
      const newPhotoTourImages = data.photoTourImages || data.photoTours || {};
      const newExistingPhotoTours = data.existingPhotoTours || data.existingPhotoToursData || [];
      setPhotoTourImages(newPhotoTourImages);
      setExistingPhotoTours(newExistingPhotoTours);
      setCookie("haven_existing_photo_tours", JSON.stringify(newExistingPhotoTours));
    } else if (stepId === 'youtube') {
      setFormData(prev => ({ ...prev, youtubeUrl: data }));
    }
  }, []);

  // Validation Logic
  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = STEPS[stepIndex];
    if (!step || !step.validationSchema) {
      return true;
    }
    
    let dataToValidate: any = {};
    switch (step.id) {
      case 'basic': dataToValidate = formData; break;
      case 'pricing': dataToValidate = formData; break;
      case 'checkin': dataToValidate = formData; break;
      case 'details': dataToValidate = formData; break;
      case 'amenities': dataToValidate = formData.amenities; break;
      case 'images': dataToValidate = { havenImages, existingImages }; break;
      case 'phototour': dataToValidate = { photoTourImages, existingPhotoTours }; break;
      case 'youtube': dataToValidate = formData.youtubeUrl; break;
      default: dataToValidate = formData;
    }

    try {
      step.validationSchema.parse(dataToValidate);
      return true;
    } catch (error) {
      return false;
    }
  }, [formData, havenImages, existingImages, photoTourImages, existingPhotoTours]);

  const isCurrentStepValid = useMemo(() => validateStep(currentStepIndex), [validateStep, currentStepIndex]);
  
  const getStepStatus = (index: number): StepStatus => {
    // If step was explicitly marked as completed or incomplete
    if (stepStatuses[index] === StepStatus.Completed) return StepStatus.Completed;
    if (stepStatuses[index] === StepStatus.Incomplete) return StepStatus.Incomplete;

    // For current or future steps
    if (index === currentStepIndex) {
      return isCurrentStepValid ? StepStatus.NotStarted : StepStatus.Incomplete;
    } else if (index < currentStepIndex) {
      // For past steps not explicitly marked (e.g., initial load in edit mode)
      return validateStep(index) ? StepStatus.Completed : StepStatus.Incomplete;
    } else {
      return StepStatus.NotStarted; // Future steps
    }
  };



  // Helper Functions
  const resetForm = () => {
    setIsInitialized(false);
    setFormData({
      havenName: "",
      tower: "",
      floor: "",
      view: "",
      capacity: "",
      roomSize: "",
      beds: "",
      sixHourRate: "",
      tenHourRate: "",
      weekdayRate: "",
      weekendRate: "",
      sixHourCheckIn: "09:00",
      sixHourCheckOut: "15:00",
      tenHourCheckIn: "09:00",
      tenHourCheckOut: "19:00",
      twentyOneHourCheckIn: "14:00",
      twentyOneHourCheckOut: "11:00",
      description: "",
      youtubeUrl: "",
          amenities: {
            wifi: true,
            netflix: true,
            airConditioning: true,
            fridge: true,
            inductionCooker: true,
            riceCooker: true,
            cookingSet: true,
            diningSet: true,
            hotColdShower: true,
            doubleBeds: true,
            pillowsComforters: true,
            clothesRack: true,
            humidifier: true,
            glowBed: true,
            ledLights: true,
            soundbar: true,
            boardGames: true,
            ps4: false,
            tv: false,
            poolAccess: false,
            parking: false,
            washerDryer: false,
            towels: false,
          },
        });    setHavenImages([]);
    setExistingImages([]);
    setPhotoTourImages({
      livingArea: [],
      kitchenette: [],
      diningArea: [],
      fullBathroom: [],
      garage: [],
      exterior: [],
      pool: [],
      bedroom: [],
      additional: [],
    });
    setExistingPhotoTours([]);
    setBlockedDates([]);
    setStepStatuses(Array(STEPS.length).fill(StepStatus.NotStarted));
    setCurrentStepIndex(0); // Reset current step index
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    // Manually set current step status to incomplete before validation
    setStepStatuses(prev => {
      const newStatuses = [...prev];
      newStatuses[currentStepIndex] = StepStatus.Incomplete;
      return newStatuses;
    });

    if (isCurrentStepValid) {
      // Mark current step as completed
      setStepStatuses(prev => {
        const newStatuses = [...prev];
        newStatuses[currentStepIndex] = StepStatus.Completed;
        return newStatuses;
      });
      
      // Move to next step
      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // Last step, trigger submit
        handleSubmit();
      }
    } else {
      toast.error("Please complete the current step before proceeding.");
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleStepClick = (targetIndex: number) => {
    if (!isEditMode) return; // clickable stepper only in Edit Haven
    if (isLoading) return;
    if (targetIndex === currentStepIndex) return;

    // Preserve status of the step we're leaving
    setStepStatuses(prev => {
      const next = [...prev];
      next[currentStepIndex] = isCurrentStepValid ? StepStatus.Completed : StepStatus.Incomplete;
      return next;
    });

    setCurrentStepIndex(targetIndex);
  };

  const handleSubmit = async () => {
    try {
      // 1. Process Images
      const havenImagesBase64 = await Promise.all(
        havenImages.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const photoTourBase64: Record<string, string[]> = {};
      for (const [category, files] of Object.entries(photoTourImages)) {
        if (files.length > 0) {
          photoTourBase64[category] = await Promise.all(
            files.map((file) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            })
          );
        }
      }

      // 2. Prepare Payload
      const payload = {
        haven_name: formData.havenName,
        tower: formData.tower,
        floor: formData.floor,
        view_type: formData.view,
        capacity: parseInt(formData.capacity),
        room_size: parseFloat(formData.roomSize),
        beds: formData.beds,
        description: formData.description,
        youtube_url: formData.youtubeUrl,
        six_hour_rate: parseFloat(formData.sixHourRate),
        ten_hour_rate: parseFloat(formData.tenHourRate),
        weekday_rate: parseFloat(formData.weekdayRate),
        weekend_rate: parseFloat(formData.weekendRate),
        six_hour_check_in: formData.sixHourCheckIn + ":00",
        six_hour_check_out: formData.sixHourCheckOut + ":00",
        ten_hour_check_in: formData.tenHourCheckIn + ":00",
        ten_hour_check_out: formData.tenHourCheckOut + ":00",
        twenty_one_hour_check_in: formData.twentyOneHourCheckIn + ":00",
        twenty_one_hour_check_out: formData.twentyOneHourCheckOut + ":00",
        amenities: formData.amenities,
        haven_images: havenImagesBase64,
        photo_tour_images: photoTourBase64,
        blocked_dates: blockedDates.map(date => ({
          from_date: date.fromDate,
          to_date: date.toDate,
          reason: date.reason
        }))
      };

      let result;
      if (isEditMode) {
        // Edit Mode
        const updatePayload = {
          ...payload,
          id: initialData?.uuid_id,
          existing_images: existingImages,
          existing_photo_tours: existingPhotoTours,
        };
        result = await updateHaven(updatePayload).unwrap();
      } else {
        // Add Mode
        result = await createHaven(payload).unwrap();
      }

      if (result.success || (isEditMode && !result.error)) {
        toast.success(isEditMode ? "Haven updated successfully!" : "Haven created successfully!");
        handleClose();
      }
    } catch (error: unknown) {
      console.error(isEditMode ? "Error updating haven:" : "Error creating haven:", error);
      let errorMessage = isEditMode ? "Failed to update haven" : "Failed to create haven";
      if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        errorMessage = apiError?.data?.error || apiError?.message || errorMessage;
      }
      toast.error(errorMessage);
    }
  };

  // Styling Helpers
  const getStatusStyles = (status: 'RED' | 'YELLOW' | 'GREEN') => {
    switch (status) {
      case 'RED':
        return 'border-red-200 bg-white hover:border-red-400 hover:bg-red-50/30';
      case 'YELLOW':
        return 'border-yellow-200 bg-yellow-50/30 hover:border-yellow-400 hover:bg-yellow-50/50';
      case 'GREEN':
        return 'border-green-200 bg-green-50/30 hover:border-green-400 hover:bg-green-50/50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusIcon = (status: 'RED' | 'YELLOW' | 'GREEN') => {
    switch (status) {
      case 'RED': return <Circle className="w-5 h-5 text-red-400" />;
      case 'YELLOW': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'GREEN': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  // Data Memos
  const basicInfoInitialData = useMemo(() => ({
    haven_name: formData.havenName,
    tower: formData.tower,
    floor: formData.floor,
    view_type: formData.view,
  }), [formData.havenName, formData.tower, formData.floor, formData.view]);

  const pricingInitialData = useMemo(() => ({
    six_hour_rate: formData.sixHourRate ? parseFloat(formData.sixHourRate) : undefined,
    ten_hour_rate: formData.tenHourRate ? parseFloat(formData.tenHourRate) : undefined,
    weekday_rate: formData.weekdayRate ? parseFloat(formData.weekdayRate) : undefined,
    weekend_rate: formData.weekendRate ? parseFloat(formData.weekendRate) : undefined,
  }), [formData.sixHourRate, formData.tenHourRate, formData.weekdayRate, formData.weekendRate]);

  const checkInInitialData = useMemo(() => ({
    six_hour_check_in: formData.sixHourCheckIn,
    six_hour_check_out: formData.sixHourCheckOut,
    ten_hour_check_in: formData.tenHourCheckIn,
    ten_hour_check_out: formData.tenHourCheckOut,
    twenty_one_hour_check_in: formData.twentyOneHourCheckIn,
    twenty_one_hour_check_out: formData.twentyOneHourCheckOut,
  }), [formData.sixHourCheckIn, formData.sixHourCheckOut, formData.tenHourCheckIn, formData.tenHourCheckOut, formData.twentyOneHourCheckIn, formData.twentyOneHourCheckOut]);

  const availabilityInitialData = useMemo(() => blockedDates.map(date => ({
    from_date: date.fromDate,
    to_date: date.toDate,
    reason: date.reason,
  })), [blockedDates]);

  const detailsInitialData = useMemo(() => ({
    capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
    room_size: formData.roomSize ? parseFloat(formData.roomSize) : undefined,
    beds: formData.beds,
    description: formData.description,
  }), [formData.capacity, formData.roomSize, formData.beds, formData.description]);

  const amenitiesInitialData = useMemo(() => formData.amenities, [formData.amenities]);
  const imagesInitialData = useMemo(() => existingImages, [existingImages]);
  const photoTourInitialData = useMemo(() => existingPhotoTours, [existingPhotoTours]);


    if (!isOpen) return null;
  
    return (typeof window !== 'undefined' ? createPortal(
      <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" onClick={handleClose}>
        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              // Submitting is now handled by the last step's "Finish & Save" button,
              // which internally calls handleSubmit.
            }}
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside form
          >
            
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-brand-primary/20 dark:border-brand-primary/40 bg-brand-primary text-white rounded-t-2xl flex-shrink-0 shadow-sm relative transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:brightness-110 hover:scale-[1.01] hover:shadow-lg will-change-transform cursor-default">
              <div>
                <h2 className="text-2xl font-bold">{isEditMode ? "Edit Haven" : "Add New Haven"}</h2>
                <p className="text-sm opacity-90 mt-1">
                  {isEditMode ? "Update haven information and settings" : "Complete all sections to publish your property"}
                </p>
              </div>
              <button type="button" onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
  
            {/* Stepper Header */}
            <div className="p-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
              <div className="flex justify-between items-center">
                {STEPS.map((step, index) => {
                  const status = getStepStatus(index);
                  const isActive = index === currentStepIndex;
  
                  let iconColorClass = 'text-gray-400 dark:text-gray-600';
                  let textColorClass = 'text-gray-500 dark:text-gray-400';
                  let borderColorClass = 'border-gray-300 dark:border-gray-700';
                  let backgroundColorClass = 'bg-gray-50 dark:bg-gray-800/50';
  
                  if (status === StepStatus.Completed) {
                    iconColorClass = 'text-green-500 dark:text-green-400';
                    textColorClass = 'text-green-600 dark:text-green-400';
                    borderColorClass = 'border-green-500 dark:border-green-400';
                    backgroundColorClass = 'bg-green-50 dark:bg-green-900/20';
                  } else if (status === StepStatus.Incomplete) {
                    iconColorClass = 'text-yellow-500 dark:text-yellow-400';
                    textColorClass = 'text-yellow-600 dark:text-yellow-400';
                    borderColorClass = 'border-yellow-500 dark:border-yellow-400';
                    backgroundColorClass = 'bg-yellow-50 dark:bg-yellow-900/20';
                  } else if (isActive) {
                    iconColorClass = 'text-brand-primary';
                    textColorClass = 'text-brand-primary';
                    borderColorClass = 'border-brand-primary';
                    backgroundColorClass = 'bg-brand-primary/10 dark:bg-brand-primary/20';
                  }
  
                  const isClickable = isEditMode && !isLoading;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => handleStepClick(index)}
                      disabled={!isClickable}
                      className={`flex-1 flex flex-col items-center relative ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={isClickable ? `Go to ${step.label}` : step.label}
                    >
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 ${borderColorClass} ${backgroundColorClass}`}>
                        <step.icon className={`w-5 h-5 ${iconColorClass}`} />
                        {status === StepStatus.Completed && (
                          <CheckCircle2 className="absolute -top-1 -right-1 w-5 h-5 text-green-500 dark:text-green-400 bg-white dark:bg-gray-900 rounded-full" />
                        )}
                        {status === StepStatus.Incomplete && (
                          <AlertCircle className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 dark:text-yellow-400 bg-white dark:bg-gray-900 rounded-full" />
                        )}
                      </div>
                      <p className={`text-xs mt-2 text-center font-medium ${textColorClass}`}>{step.label}</p>
                      {index < STEPS.length - 1 && (
                        <div className={`absolute left-[calc(50%+20px)] top-5 h-0.5 w-[calc(100%-40px)] transform -translate-y-1/2 
                        ${index < currentStepIndex || status === StepStatus.Completed ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
  
            {/* Body - Current Step Component */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950/30 relative overflow-x-hidden">
              <AnimatePresence mode="wait">
                {STEPS.map((step, index) => {
                  if (index === currentStepIndex) {
                    const CurrentStepComponent = step.component;
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="w-full"
                      >
                        <CurrentStepComponent
                          key={step.id}
                          onSave={(data: any) => updateFormData(step.id, data)}
                          onChange={(data: any) => updateFormData(step.id, data)}
                          // Pass initial data to step components. This will need adjustment per component.
                          initialData={
                            step.id === 'basic' ? basicInfoInitialData :
                            step.id === 'pricing' ? pricingInitialData :
                            step.id === 'checkin' ? checkInInitialData :
                            step.id === 'availability' ? availabilityInitialData :
                            step.id === 'details' ? detailsInitialData :
                            step.id === 'amenities' ? amenitiesInitialData :
                            step.id === 'images' ? imagesInitialData :
                            step.id === 'phototour' ? photoTourInitialData :
                            step.id === 'youtube' ? formData.youtubeUrl :
                            null
                          }
                          {...(step.id === 'images' ? { initialImages: imagesInitialData } : {})}
                          {...(step.id === 'phototour' ? { initialPhotoTours: photoTourInitialData } : {})}
                          {...(step.id === 'youtube' ? { initialUrl: formData.youtubeUrl } : {})}
                          isAddMode={!isEditMode}
                          mode="step"
                          isOpen={isOpen}
                          onClose={handleClose}
                          onBack={handleBack}
                          onNext={handleNext}
                          isLastStep={currentStepIndex === STEPS.length - 1}
                          // Additional props
                          currentHavenImages={havenImages} // For Images step
                          currentPhotoTourImages={photoTourImages} // For PhotoTour step
                        />
                      </motion.div>
                    );
                  }
                  return null;
                })}
              </AnimatePresence>
            </div>
  
            {/* Sticky Footer */}
            <div className="sticky bottom-0 z-10 flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl flex-shrink-0">
               <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1"><Circle className="w-3 h-3 text-gray-400 dark:text-gray-600" /> Not Started</div>
                  <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-500 dark:text-yellow-400" /> Incomplete</div>
                  <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500 dark:text-green-400" /> Completed</div>
               </div>
  
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
  
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                )}
  
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid || isLoading}
                  className={`
                    px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2
                    ${(!isCurrentStepValid || isLoading) 
                      ? 'bg-brand-primary/50 cursor-not-allowed shadow-none' 
                      : 'bg-brand-primary hover:bg-[#b57603] hover:shadow-lg transform active:scale-95'}
                  `}
                >
                  {isLoading && (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {currentStepIndex === STEPS.length - 1 ? (isLoading ? "Saving..." : "Finish & Save") : "Next"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>, document.body) : null
    );
};

export default HavenFormModal;
