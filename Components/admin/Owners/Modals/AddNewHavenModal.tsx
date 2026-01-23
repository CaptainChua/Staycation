"use client";

import { X, Home, DollarSign, Clock, Calendar, FileText, Star, Image as ImageIcon, Images, Youtube } from "lucide-react";
import { useState, useMemo } from "react";
import { useCreateHavenMutation } from "@/redux/api/roomApi"
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

interface AddNewHavenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BlockedDate {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
}

// Define error type for better type safety
interface ApiError {
  data?: {
    error?: string;
  };
  message?: string;
}

const AddNewHavenModal = ({ isOpen, onClose }: AddNewHavenModalProps) => {
  const [createHaven, { isLoading }] = useCreateHavenMutation();
  const [openModal, setOpenModal] = useState<string | null>(null);
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
  const [blockDateForm, setBlockDateForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [havenImages, setHavenImages] = useState<File[]>([]);

  const [photoTourImages, setPhotoTourImages] = useState<
    Record<string, File[]>
  >({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Convert haven images to base64
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

      // Prepare haven data
      const havenData = {
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

      const result = await createHaven(havenData).unwrap();

      if (result.success) {
        toast.success("Haven created successfully!");
        
        // Reset form
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
        setBlockedDates([]);
        
        onClose();
      }
    } catch (error: unknown) {
      console.error("Error creating haven:", error);
      
      // Type-safe error handling
      let errorMessage = "Failed to create haven";
      if (typeof error === 'object' && error !== null) {
        const apiError = error as ApiError;
        errorMessage = apiError?.data?.error || apiError?.message || "Failed to create haven";
      }
      
      toast.error(errorMessage);
    }
  }

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

  const handlePhotoTourUpload = (
    category: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  // Memoized initial data for sub-modals to prevent unnecessary re-renders and resets
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col">
          {/* Header - Sticky */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Add New Haven
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the haven details below
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
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
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Haven..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      
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
          setOpenModal(null);
        }}
        initialData={checkInInitialData}
      />
      
      <AvailabilityManagementModal
        isOpen={openModal === "availability"}
        onClose={() => setOpenModal(null)}
        onSave={(dates) => {
          setBlockedDates(dates);
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
          setOpenModal(null);
        }}
        initialData={formData.amenities}
      />
      
      <HavenImagesModal
        isOpen={openModal === "images"}
        onClose={() => setOpenModal(null)}
        onSave={(newImages, existingImages) => {
          setHavenImages(newImages);
          setOpenModal(null);
        }}
        initialImages={emptyArray}
      />
      
      <PhotoTourManagementModal
        isOpen={openModal === "phototour"}
        onClose={() => setOpenModal(null)}
        onSave={(photoTours, existingPhotoTours) => {
          setPhotoTourImages(photoTours);
          setOpenModal(null);
        }}
        initialPhotoTours={emptyArray}
      />
      
      <YouTubeVideoModal
        isOpen={openModal === "youtube"}
        onClose={() => setOpenModal(null)}
        onSave={(url) => {
          setFormData({ ...formData, youtubeUrl: url });
          setOpenModal(null);
        }}
        initialUrl={formData.youtubeUrl}
      />
    </>
  );
};

export default AddNewHavenModal;