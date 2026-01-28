"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, Home, DollarSign, Clock, Calendar, FileText, Star, 
  Image as ImageIcon, Images, Youtube, CheckCircle2, AlertCircle, Circle 
} from "lucide-react";
import { useCreateHavenMutation, useUpdateHavenMutation } from "@/redux/api/roomApi";
import toast from 'react-hot-toast';
import BasicInformationModal from "./BasicInformationModal";
import PricingManagementModal from "./PricingManagementModal";
import CheckInTimeSettingsModal from "./CheckInTimeSettingsModal";
import AvailabilityManagementModal from "./AvailabilityManagementModal";
import HavenDetailsModal from "./HavenDetailsModal";
import AmenitiesModal from "./AmenitiesModal";
import HavenImagesModal from "./HavenImagesModal";
import PhotoTourManagementModal from "./PhotoTourManagementModal";
import YouTubeVideoModal from "./YouTubeVideoModal";

// --- Types ---

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
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
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

const HavenFormModal = ({ isOpen, onClose, initialData }: HavenFormModalProps) => {
  const isEditMode = !!initialData;
  
  // mutations
  const [createHaven, { isLoading: isCreating }] = useCreateHavenMutation();
  const [updateHaven, { isLoading: isUpdating }] = useUpdateHavenMutation();
  
  const isLoading = isCreating || isUpdating;

  // Local State
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [touchedSections, setTouchedSections] = useState<Record<string, boolean>>({});
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
    tenHourCheckIn: "09:00",
    twentyOneHourCheckIn: "14:00",
    description: "",
    youtubeUrl: "",
    amenities: {
      wifi: false,
      netflix: false,
      ps4: false,
      glowBed: false,
      airConditioning: false,
      kitchen: false,
      balcony: false,
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
      const timer = setTimeout(() => {
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
          tenHourCheckIn: initialData.ten_hour_check_in || "09:00",
          twentyOneHourCheckIn: initialData.twenty_one_hour_check_in || "14:00",
          amenities: {
            wifi: initialData.amenities?.wifi || false,
            netflix: initialData.amenities?.netflix || false,
            ps4: initialData.amenities?.ps4 || false,
            glowBed: initialData.amenities?.glowBed || false,
            airConditioning: initialData.amenities?.airConditioning || false,
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

        // Mark all as touched in edit mode so validation shows immediately
        setTouchedSections({
          basic: true,
          pricing: true,
          checkin: true,
          availability: true,
          details: true,
          amenities: true,
          images: true,
          phototour: true,
          youtube: true
        });

        setIsInitialized(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isEditMode, initialData, isOpen, isInitialized]);

  // Validation Logic
  const isBasicInfoValid = useMemo(() => !!(formData.havenName && formData.tower && formData.floor && formData.view), [formData]);
  const isPricingValid = useMemo(() => !!(formData.sixHourRate && formData.tenHourRate && formData.weekdayRate && formData.weekendRate), [formData]);
  const isDetailsValid = useMemo(() => !!(formData.capacity && formData.roomSize && formData.beds && formData.description), [formData]);
  const isImagesValid = useMemo(() => havenImages.length > 0 || existingImages.length > 0, [havenImages, existingImages]);
  const isCheckInValid = true; 
  const isAvailabilityValid = true; 
  const isAmenitiesValid = true; 
  const isPhotoTourValid = true; 
  const isYoutubeValid = true; 

  const getSectionStatus = (section: string): 'RED' | 'YELLOW' | 'GREEN' => {
    const isTouched = touchedSections[section];
    let isValid = false;

    switch (section) {
      case 'basic': isValid = isBasicInfoValid; break;
      case 'pricing': isValid = isPricingValid; break;
      case 'details': isValid = isDetailsValid; break;
      case 'images': isValid = isImagesValid; break;
      case 'checkin': isValid = isCheckInValid; break;
      case 'availability': isValid = isAvailabilityValid; break;
      case 'amenities': isValid = isAmenitiesValid; break;
      case 'phototour': isValid = isPhotoTourValid; break;
      case 'youtube': isValid = isYoutubeValid; break;
      default: isValid = false;
    }

    if (!isTouched) return 'RED';
    if (isTouched && !isValid) return 'YELLOW';
    return 'GREEN';
  };

  const criticalSections = ['basic', 'pricing', 'details', 'images'];
  const allCriticalGreen = criticalSections.every((section) => getSectionStatus(section) === 'GREEN');

  // Helper Functions
  const markTouched = (section: string) => {
    setTouchedSections(prev => ({ ...prev, [section]: true }));
  };

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
      tenHourCheckIn: "09:00",
      twentyOneHourCheckIn: "14:00",
      description: "",
      youtubeUrl: "",
      amenities: {
        wifi: false,
        netflix: false,
        ps4: false,
        glowBed: false,
        airConditioning: false,
        kitchen: false,
        balcony: false,
        tv: false,
        poolAccess: false,
        parking: false,
        washerDryer: false,
        towels: false,
      },
    });
    setHavenImages([]);
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
    setTouchedSections({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
        ten_hour_check_in: formData.tenHourCheckIn + ":00",
        twenty_one_hour_check_in: formData.twentyOneHourCheckIn + ":00",
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
    ten_hour_check_in: formData.tenHourCheckIn,
    twenty_one_hour_check_in: formData.twentyOneHourCheckIn,
  }), [formData.sixHourCheckIn, formData.tenHourCheckIn, formData.twentyOneHourCheckIn]);

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

  const emptyArray = useMemo(() => [], []);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
        >
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-brand-primary/20 bg-brand-primary text-white rounded-t-2xl flex-shrink-0 shadow-sm">
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'basic', label: 'Basic Info', desc: 'Name, tower, floor, view', icon: Home },
                { id: 'pricing', label: 'Pricing', desc: 'Rates & fees', icon: DollarSign },
                { id: 'checkin', label: 'Check-in', desc: 'Time settings', icon: Clock },
                { id: 'availability', label: 'Availability', desc: 'Blocked dates', icon: Calendar },
                { id: 'details', label: 'Details', desc: 'Capacity, beds, size', icon: FileText },
                { id: 'amenities', label: 'Amenities', desc: 'Features list', icon: Star },
                { id: 'images', label: 'Images', desc: 'Gallery photos', icon: ImageIcon },
                { id: 'phototour', label: 'Photo Tour', desc: 'Categorized photos', icon: Images },
                { id: 'youtube', label: 'Video', desc: 'YouTube URL', icon: Youtube },
              ].map((section) => {
                const status = getSectionStatus(section.id);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setOpenModal(section.id)}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 group text-center h-full
                      ${getStatusStyles(status)}
                    `}
                  >
                    <div className="absolute top-2 right-2 transform scale-75">
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className={`p-2 rounded-full mb-2 ${status === 'GREEN' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors`}>
                      <section.icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-semibold text-sm text-gray-800 mb-0.5 leading-tight">{section.label}</h3>
                    <p className="text-[10px] text-gray-500 leading-tight max-w-[90%] mx-auto">{section.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex justify-between items-center p-6 border-t border-gray-200 bg-white rounded-b-2xl flex-shrink-0">
             <div className="flex gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1"><Circle className="w-3 h-3 text-red-400" /> {isEditMode ? "Invalid" : "Not started"}</div>
                <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-500" /> Incomplete</div>
                <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {isEditMode ? "Valid" : "Completed"}</div>
             </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!allCriticalGreen || isLoading}
                className={`
                  px-6 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2
                  ${!allCriticalGreen || isLoading 
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
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
      </div>
    </>
  );

  return (
    <>
      {typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null}
      
      {/* Individual Modals */}
      <BasicInformationModal
        isOpen={openModal === "basic"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({
            ...formData,
            havenName: data.haven_name || "",
            tower: data.tower || "",
            floor: data.floor || "",
            view: data.view_type || "",
          });
          markTouched('basic');
          setOpenModal(null);
        }}
        initialData={basicInfoInitialData}
      />
      
      <PricingManagementModal
        isOpen={openModal === "pricing"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({
            ...formData,
            sixHourRate: data.six_hour_rate?.toString() || "",
            tenHourRate: data.ten_hour_rate?.toString() || "",
            weekdayRate: data.weekday_rate?.toString() || "",
            weekendRate: data.weekend_rate?.toString() || "",
          });
          markTouched('pricing');
          setOpenModal(null);
        }}
        initialData={pricingInitialData}
      />
      
      <CheckInTimeSettingsModal
        isOpen={openModal === "checkin"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({
            ...formData,
            sixHourCheckIn: data.six_hour_check_in || "09:00",
            tenHourCheckIn: data.ten_hour_check_in || "09:00",
            twentyOneHourCheckIn: data.twenty_one_hour_check_in || "14:00",
          });
          markTouched('checkin');
          setOpenModal(null);
        }}
        initialData={checkInInitialData}
      />
      
      <AvailabilityManagementModal
        isOpen={openModal === "availability"}
        onClose={() => setOpenModal(null)}
        onSave={(dates) => {
          setBlockedDates(dates);
          markTouched('availability');
          setOpenModal(null);
        }}
        initialData={availabilityInitialData}
      />
      
      <HavenDetailsModal
        isOpen={openModal === "details"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({
            ...formData,
            capacity: data.capacity?.toString() || "",
            roomSize: data.room_size?.toString() || "",
            beds: data.beds || "",
            description: data.description || "",
          });
          markTouched('details');
          setOpenModal(null);
        }}
        initialData={detailsInitialData}
      />
      
      <AmenitiesModal
        isOpen={openModal === "amenities"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({ 
            ...formData, 
            amenities: {
              wifi: data.wifi ?? false,
              netflix: data.netflix ?? false,
              ps4: data.ps4 ?? false,
              glowBed: data.glowBed ?? false,
              airConditioning: data.airConditioning ?? false,
              kitchen: data.kitchen ?? false,
              balcony: data.balcony ?? false,
              tv: data.tv ?? false,
              poolAccess: data.poolAccess ?? false,
              parking: data.parking ?? false,
              washerDryer: data.washerDryer ?? false,
              towels: data.towels ?? false,
            }
          });
          markTouched('amenities');
          setOpenModal(null);
        }}
        initialData={formData.amenities}
      />
      
      <HavenImagesModal
        isOpen={openModal === "images"}
        onClose={() => setOpenModal(null)}
        onSave={(newImages, existingImagesData) => {
          setHavenImages(newImages);
          if (isEditMode) {
            setExistingImages(existingImagesData);
          }
          markTouched('images');
          setOpenModal(null);
        }}
        initialImages={isEditMode ? existingImages : emptyArray}
      />
      
      <PhotoTourManagementModal
        isOpen={openModal === "phototour"}
        onClose={() => setOpenModal(null)}
        onSave={(photoTours, existingPhotoToursData) => {
          setPhotoTourImages(photoTours);
          if (isEditMode) {
            setExistingPhotoTours(existingPhotoToursData);
          }
          markTouched('phototour');
          setOpenModal(null);
        }}
        initialPhotoTours={isEditMode ? existingPhotoTours : emptyArray}
      />
      
      <YouTubeVideoModal
        isOpen={openModal === "youtube"}
        onClose={() => setOpenModal(null)}
        onSave={(url) => {
          setFormData({ ...formData, youtubeUrl: url });
          markTouched('youtube');
          setOpenModal(null);
        }}
        initialUrl={formData.youtubeUrl}
      />
    </>
  );
};

export default HavenFormModal;
