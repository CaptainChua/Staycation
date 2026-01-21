"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUpdateHavenMutation } from "@/redux/api/roomApi";
import { X, Home, DollarSign, Clock, Calendar, FileText, Star, Image as ImageIcon, Images, Youtube } from "lucide-react";
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

interface EditHavenModalProps {
  isOpen: boolean;
  onClose: () => void;
  havenData: HavenData | null;
}

interface BlockedDate {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
}

interface FormErrors {
  [key: string]: string;
}

const EditHavenModal = ({ isOpen, onClose, havenData }: EditHavenModalProps) => {
  const [formData, setFormData] = useState({
    haven_name: "",
    tower: "",
    floor: "",
    view_type: "",
    capacity: "",
    room_size: "",
    beds: "",
    description: "",
    youtube_url: "",
    six_hour_rate: "",
    ten_hour_rate: "",
    weekday_rate: "",
    weekend_rate: "",
    six_hour_check_in: "09:00",
    ten_hour_check_in: "09:00",
    twenty_one_hour_check_in: "14:00",
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
  const [blockDateForm, setBlockDateForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

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

  const [updateHaven, { isLoading }] = useUpdateHavenMutation();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Modal states
  const [openModal, setOpenModal] = useState<string | null>(null);

  const towers = [
    { value: "tower-a", label: "Tower A" },
    { value: "tower-b", label: "Tower B" },
    { value: "tower-c", label: "Tower C" },
    { value: "tower-d", label: "Tower D" },
  ];

  const views = [
    { value: "city", label: "City View" },
    { value: "pool", label: "Pool View" },
    { value: "ocean", label: "Ocean View" },
    { value: "garden", label: "Garden View" },
    { value: "mountain", label: "Mountain View" },
  ];

  const amenitiesList = [
    { key: "wifi", label: "WiFi" },
    { key: "netflix", label: "Netflix" },
    { key: "ps4", label: "PS4" },
    { key: "glowBed", label: "Glow Bed" },
    { key: "airConditioning", label: "Air Conditioning" },
    { key: "kitchen", label: "Kitchen" },
    { key: "balcony", label: "Balcony" },
    { key: "tv", label: "TV" },
    { key: "poolAccess", label: "Pool Access" },
    { key: "parking", label: "Parking" },
    { key: "washerDryer", label: "Washer/Dryer" },
    { key: "towels", label: "Towels" },
  ];

  const photoTourCategories = [
    { key: "livingArea", label: "Living Area" },
    { key: "kitchenette", label: "Kitchenette" },
    { key: "diningArea", label: "Dining Area" },
    { key: "fullBathroom", label: "Full Bathroom" },
    { key: "garage", label: "Garage" },
    { key: "exterior", label: "Exterior" },
    { key: "pool", label: "Pool" },
    { key: "bedroom", label: "Bedroom" },
    { key: "additional", label: "Additional Photos" },
  ];

  // Initialize form data when havenData changes
  useEffect(() => {
    if (havenData && isOpen && !isInitialized) {
      const timer = setTimeout(() => {
        const formattedData = {
          haven_name: havenData.haven_name || "",
          tower: havenData.tower || "",
          floor: havenData.floor || "",
          view_type: havenData.view_type || "",
          capacity: havenData.capacity?.toString() || "",
          room_size: havenData.room_size?.toString() || "",
          beds: havenData.beds || "",
          description: havenData.description || "",
          youtube_url: havenData.youtube_url || "",
          six_hour_rate: havenData.six_hour_rate?.toString() || "",
          ten_hour_rate: havenData.ten_hour_rate?.toString() || "",
          weekday_rate: havenData.weekday_rate?.toString() || "",
          weekend_rate: havenData.weekend_rate?.toString() || "",
          six_hour_check_in: havenData.six_hour_check_in || "09:00",
          ten_hour_check_in: havenData.ten_hour_check_in || "09:00",
          twenty_one_hour_check_in: havenData.twenty_one_hour_check_in || "14:00",
          amenities: {
            wifi: havenData.amenities?.wifi || false,
            netflix: havenData.amenities?.netflix || false,
            ps4: havenData.amenities?.ps4 || false,
            glowBed: havenData.amenities?.glowBed || false,
            airConditioning: havenData.amenities?.airConditioning || false,
            kitchen: havenData.amenities?.kitchen || false,
            balcony: havenData.amenities?.balcony || false,
            tv: havenData.amenities?.tv || false,
            poolAccess: havenData.amenities?.poolAccess || false,
            parking: havenData.amenities?.parking || false,
            washerDryer: havenData.amenities?.washerDryer || false,
            towels: havenData.amenities?.towels || false,
          },
        };

        setFormData(formattedData);
        setExistingImages(havenData.images || []);
        setExistingPhotoTours(havenData.photo_tours || []);

        if (havenData.blocked_dates) {
          setBlockedDates(
            havenData.blocked_dates.map((date, index) => ({
              id: index,
              fromDate: date.from_date,
              toDate: date.to_date,
              reason: date.reason || "",
            }))
          );
        }
        setIsInitialized(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [havenData, isOpen, isInitialized]);

  // Handle modal close
  const handleClose = () => {
    setIsInitialized(false);
    setFormData({
      haven_name: "",
      tower: "",
      floor: "",
      view_type: "",
      capacity: "",
      room_size: "",
      beds: "",
      description: "",
      youtube_url: "",
      six_hour_rate: "",
      ten_hour_rate: "",
      weekday_rate: "",
      weekend_rate: "",
      six_hour_check_in: "09:00",
      ten_hour_check_in: "09:00",
      twenty_one_hour_check_in: "14:00",
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
    setBlockDateForm({
      fromDate: "",
      toDate: "",
      reason: "",
    });
    onClose();
  };

  const handleAmenityChange = (key: string, checked: boolean) => {
    setFormData({
      ...formData,
      amenities: {
        ...formData.amenities,
        [key]: checked,
      },
    });
  };

  const handleAddBlockedDate = () => {
    if (blockDateForm.fromDate && blockDateForm.toDate) {
      setBlockedDates([
        ...blockedDates,
        {
          id: Date.now(),
          ...blockDateForm,
        },
      ]);
      setBlockDateForm({ fromDate: "", toDate: "", reason: "" });
    }
  };

  const handleRemoveBlockedDate = (id: number) => {
    setBlockedDates(blockedDates.filter((date) => date.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setHavenImages([...havenImages, ...filesArray]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setHavenImages(havenImages.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handlePhotoTourUpload = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setPhotoTourImages({
        ...photoTourImages,
        [category]: [...photoTourImages[category], ...filesArray],
      });
    }
  };

  const handleRemovePhotoTourImage = (category: string, index: number) => {
    setPhotoTourImages({
      ...photoTourImages,
      [category]: photoTourImages[category].filter((_, i) => i !== index),
    });
  };

  const handleRemoveExistingPhotoTour = (photoIndex: number) => {
    setExistingPhotoTours(existingPhotoTours.filter((_, i) => i !== photoIndex));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.haven_name.trim()) {
      newErrors.haven_name = "Haven name is required";
    }

    if (!formData.capacity.trim()) {
      newErrors.capacity = "Capacity is required";
    } else if (isNaN(parseInt(formData.capacity))) {
      newErrors.capacity = "Capacity must be a number";
    }

    if (!formData.room_size.trim()) {
      newErrors.room_size = "Room size is required";
    } else if (isNaN(parseFloat(formData.room_size))) {
      newErrors.room_size = "Room size must be a number";
    }

    if (!formData.six_hour_rate.trim()) {
      newErrors.six_hour_rate = "6-hour rate is required";
    } else if (isNaN(parseFloat(formData.six_hour_rate))) {
      newErrors.six_hour_rate = "6-hour rate must be a number";
    }

    if (!formData.ten_hour_rate.trim()) {
      newErrors.ten_hour_rate = "10-hour rate is required";
    } else if (isNaN(parseFloat(formData.ten_hour_rate))) {
      newErrors.ten_hour_rate = "10-hour rate must be a number";
    }

    if (!formData.weekday_rate.trim()) {
      newErrors.weekday_rate = "Weekday rate is required";
    } else if (isNaN(parseFloat(formData.weekday_rate))) {
      newErrors.weekday_rate = "Weekday rate must be a number";
    }

    if (!formData.weekend_rate.trim()) {
      newErrors.weekend_rate = "Weekend rate is required";
    } else if (isNaN(parseFloat(formData.weekend_rate))) {
      newErrors.weekend_rate = "Weekend rate must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      // Convert new haven images to base64
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

      // Convert photo tour images to base64
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

      const updateData = {
        id: havenData?.uuid_id || "",
        ...formData,
        capacity: parseInt(formData.capacity),
        room_size: parseFloat(formData.room_size),
        six_hour_rate: parseFloat(formData.six_hour_rate),
        ten_hour_rate: parseFloat(formData.ten_hour_rate),
        weekday_rate: parseFloat(formData.weekday_rate),
        weekend_rate: parseFloat(formData.weekend_rate),
        six_hour_check_in: formData.six_hour_check_in + ":00",
        ten_hour_check_in: formData.ten_hour_check_in + ":00",
        twenty_one_hour_check_in: formData.twenty_one_hour_check_in + ":00",
        haven_images: havenImagesBase64,
        existing_images: existingImages,
        photo_tour_images: photoTourBase64,
        existing_photo_tours: existingPhotoTours,
        blocked_dates: blockedDates.map(date => ({
          from_date: date.fromDate,
          to_date: date.toDate,
          reason: date.reason
        }))
      };

      await updateHaven(updateData).unwrap();
      toast.success(`${formData.haven_name} updated successfully!`);
      handleClose();
    } catch (err: unknown) {
      console.error("Failed to update haven", err);
      const errorMessage = err && typeof err === 'object' && 'data' in err &&
        err.data && typeof err.data === 'object' && 'error' in err.data &&
        typeof err.data.error === 'string' ? err.data.error : "Failed to update haven";
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Haven</h2>
              <p className="text-sm text-gray-600 mt-1">Update haven information</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Modules List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {/* Basic Information */}
              <button
                type="button"
                onClick={() => setOpenModal("basic")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
              >
                <Home className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Basic Information</h3>
                <p className="text-xs text-gray-500 leading-tight">Haven name, tower, floor, view</p>
              </button>

              {/* Pricing Management */}
              <button
                type="button"
                onClick={() => setOpenModal("pricing")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
              >
                <DollarSign className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Pricing</h3>
                <p className="text-xs text-gray-500 leading-tight">Weekday and weekend rates</p>
              </button>

              {/* Check-in Time Settings */}
              <button
                type="button"
                onClick={() => setOpenModal("checkin")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
              >
                <Clock className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Check-in Time</h3>
                <p className="text-xs text-gray-500 leading-tight">Set default check-in times</p>
              </button>

              {/* Availability Management */}
                        <button
                          type="button"
                onClick={() => setOpenModal("availability")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
                        >
                <Calendar className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Availability</h3>
                <p className="text-xs text-gray-500 leading-tight">Manage blocked dates</p>
                        </button>

              {/* Haven Details */}
                        <button
                          type="button"
                onClick={() => setOpenModal("details")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
                        >
                <FileText className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Haven Details</h3>
                <p className="text-xs text-gray-500 leading-tight">Capacity, size, beds, description</p>
                        </button>

              {/* Amenities */}
                                <button
                                  type="button"
                onClick={() => setOpenModal("amenities")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
                                >
                <Star className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Amenities</h3>
                <p className="text-xs text-gray-500 leading-tight">Select available amenities</p>
                                </button>

              {/* Haven Images */}
                                <button
                                  type="button"
                onClick={() => setOpenModal("images")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
                                >
                <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Haven Images</h3>
                <p className="text-xs text-gray-500 leading-tight">Upload and manage images</p>
                                </button>

              {/* Photo Tour Management */}
                <button
                  type="button"
                onClick={() => setOpenModal("phototour")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
                >
                <Images className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">Photo Tour</h3>
                <p className="text-xs text-gray-500 leading-tight">Organize photos by category</p>
                </button>

              {/* YouTube Video */}
                        <button
                          type="button"
                onClick={() => setOpenModal("youtube")}
                className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-amber-600 hover:bg-amber-50 transition-all group text-center"
                        >
                <Youtube className="w-6 h-6 text-gray-500 group-hover:text-amber-600 mb-2" />
                <h3 className="font-semibold text-sm text-gray-800 mb-1">YouTube Video</h3>
                <p className="text-xs text-gray-500 leading-tight">Add YouTube video URL</p>
                        </button>
                      </div>
                  </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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
        </div>
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
          setFormData({ ...formData, ...data });
          setOpenModal(null);
        }}
        initialData={{
          haven_name: formData.haven_name,
          tower: formData.tower,
          floor: formData.floor,
          view_type: formData.view_type,
        }}
      />
      
      <PricingManagementModal
        isOpen={openModal === "pricing"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({
            ...formData,
            six_hour_rate: data.six_hour_rate?.toString() || "",
            ten_hour_rate: data.ten_hour_rate?.toString() || "",
            weekday_rate: data.weekday_rate?.toString() || "",
            weekend_rate: data.weekend_rate?.toString() || "",
          });
          setOpenModal(null);
        }}
        initialData={{
          six_hour_rate: formData.six_hour_rate ? parseFloat(formData.six_hour_rate) : undefined,
          ten_hour_rate: formData.ten_hour_rate ? parseFloat(formData.ten_hour_rate) : undefined,
          weekday_rate: formData.weekday_rate ? parseFloat(formData.weekday_rate) : undefined,
          weekend_rate: formData.weekend_rate ? parseFloat(formData.weekend_rate) : undefined,
        }}
      />
      
      <CheckInTimeSettingsModal
        isOpen={openModal === "checkin"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({ ...formData, ...data });
          setOpenModal(null);
        }}
        initialData={{
          six_hour_check_in: formData.six_hour_check_in,
          ten_hour_check_in: formData.ten_hour_check_in,
          twenty_one_hour_check_in: formData.twenty_one_hour_check_in,
        }}
      />
      
      <AvailabilityManagementModal
        isOpen={openModal === "availability"}
        onClose={() => setOpenModal(null)}
        onSave={(dates) => {
          setBlockedDates(dates);
          setOpenModal(null);
        }}
        initialData={blockedDates.map(date => ({
          from_date: date.fromDate,
          to_date: date.toDate,
          reason: date.reason,
        }))}
      />
      
      <HavenDetailsModal
        isOpen={openModal === "details"}
        onClose={() => setOpenModal(null)}
        onSave={(data) => {
          setFormData({
            ...formData,
            capacity: data.capacity?.toString() || "",
            room_size: data.room_size?.toString() || "",
            beds: data.beds || "",
            description: data.description || "",
          });
          setOpenModal(null);
        }}
        initialData={{
          capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
          room_size: formData.room_size ? parseFloat(formData.room_size) : undefined,
          beds: formData.beds,
          description: formData.description,
        }}
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
          setOpenModal(null);
        }}
        initialData={formData.amenities}
      />
      
      <HavenImagesModal
        isOpen={openModal === "images"}
        onClose={() => setOpenModal(null)}
        onSave={(newImages, existingImagesData) => {
          setHavenImages(newImages);
          setExistingImages(existingImagesData);
          setOpenModal(null);
        }}
        initialImages={existingImages}
      />
      
      <PhotoTourManagementModal
        isOpen={openModal === "phototour"}
        onClose={() => setOpenModal(null)}
        onSave={(photoTours, existingPhotoToursData) => {
          setPhotoTourImages(photoTours);
          setExistingPhotoTours(existingPhotoToursData);
          setOpenModal(null);
        }}
        initialPhotoTours={existingPhotoTours}
      />
      
      <YouTubeVideoModal
        isOpen={openModal === "youtube"}
        onClose={() => setOpenModal(null)}
        onSave={(url) => {
          setFormData({ ...formData, youtube_url: url });
          setOpenModal(null);
        }}
        initialUrl={formData.youtube_url}
      />
    </>
  );
};

export default EditHavenModal;