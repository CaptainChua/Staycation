// components/EditHavenModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUpdateHavenMutation } from "@/redux/api/roomApi";
import { X, Upload, Trash2, Calendar } from "lucide-react";
import { Input } from "@nextui-org/input";
import { Select, SelectItem } from "@nextui-org/select";
import { Checkbox } from "@nextui-org/checkbox";
import toast from 'react-hot-toast';

interface EditHavenModalProps {
  isOpen: boolean;
  onClose: () => void;
  havenData: any;
}

interface BlockedDate {
  id: number;
  fromDate: string;
  toDate: string;
  reason: string;
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
  const [existingImages, setExistingImages] = useState<any[]>([]);

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

  const [existingPhotoTours, setExistingPhotoTours] = useState<any[]>([]);

  const [updateHaven, { isLoading }] = useUpdateHavenMutation();

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

  useEffect(() => {
    if (havenData) {
      setFormData({
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
        six_hour_check_in: havenData.six_hour_check_in?.slice(0, 5) || "09:00",
        ten_hour_check_in: havenData.ten_hour_check_in?.slice(0, 5) || "09:00",
        twenty_one_hour_check_in: havenData.twenty_one_hour_check_in?.slice(0, 5) || "14:00",
        amenities: havenData.amenities || {
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

      setExistingImages(havenData.images || []);
      setExistingPhotoTours(havenData.photo_tours || []);

      if (havenData.blocked_dates) {
        setBlockedDates(
          havenData.blocked_dates.map((date: any, index: number) => ({
            id: index,
            fromDate: date.from_date,
            toDate: date.to_date,
            reason: date.reason || "",
          }))
        );
      }
    }
  }, [havenData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        id: havenData.uuid_id,
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
      onClose();
    } catch (err: any) {
      console.error("Failed to update haven", err);
      toast.error(err?.data?.error || "Failed to update haven");
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Haven</h2>
              <p className="text-sm text-gray-600 mt-1">Update haven information</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Haven Name"
                    labelPlacement="outside"
                    value={formData.haven_name}
                    onChange={(e) => setFormData({ ...formData, haven_name: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Select
                    label="Tower"
                    labelPlacement="outside"
                    selectedKeys={formData.tower ? [formData.tower] : []}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      setFormData({ ...formData, tower: value });
                    }}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  >
                    {towers.map((tower) => (
                      <SelectItem key={tower.value}>{tower.label}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Floor"
                    labelPlacement="outside"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Select
                    label="View Type"
                    labelPlacement="outside"
                    selectedKeys={formData.view_type ? [formData.view_type] : []}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      setFormData({ ...formData, view_type: value });
                    }}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  >
                    {views.map((view) => (
                      <SelectItem key={view.value}>{view.label}</SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Haven Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Haven Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    type="number"
                    label="Maximum Guests"
                    labelPlacement="outside"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="number"
                    label="Room Size (sq.m)"
                    labelPlacement="outside"
                    value={formData.room_size}
                    onChange={(e) => setFormData({ ...formData, room_size: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                </div>
                <div className="mb-4">
                  <Input
                    label="Beds Configuration"
                    labelPlacement="outside"
                    placeholder="e.g., 1 King + 1 Queen Bed"
                    value={formData.beds}
                    onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="6-Hour Rate (₱)"
                    labelPlacement="outside"
                    value={formData.six_hour_rate}
                    onChange={(e) => setFormData({ ...formData, six_hour_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="number"
                    label="10-Hour Rate (₱)"
                    labelPlacement="outside"
                    value={formData.ten_hour_rate}
                    onChange={(e) => setFormData({ ...formData, ten_hour_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="number"
                    label="Weekday Rate (₱)"
                    labelPlacement="outside"
                    value={formData.weekday_rate}
                    onChange={(e) => setFormData({ ...formData, weekday_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="number"
                    label="Weekend Rate (₱)"
                    labelPlacement="outside"
                    value={formData.weekend_rate}
                    onChange={(e) => setFormData({ ...formData, weekend_rate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                </div>
              </div>

              {/* Check-in Times */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Check-in Times
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="time"
                    label="6-Hour Check-in"
                    labelPlacement="outside"
                    value={formData.six_hour_check_in}
                    onChange={(e) => setFormData({ ...formData, six_hour_check_in: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="time"
                    label="10-Hour Check-in"
                    labelPlacement="outside"
                    value={formData.ten_hour_check_in}
                    onChange={(e) => setFormData({ ...formData, ten_hour_check_in: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="time"
                    label="21-Hour Check-in"
                    labelPlacement="outside"
                    value={formData.twenty_one_hour_check_in}
                    onChange={(e) => setFormData({ ...formData, twenty_one_hour_check_in: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {amenitiesList.map((amenity) => (
                    <Checkbox
                      key={amenity.key}
                      isSelected={formData.amenities[amenity.key as keyof typeof formData.amenities]}
                      onValueChange={(checked) => handleAmenityChange(amenity.key, checked)}
                    >
                      {amenity.label}
                    </Checkbox>
                  ))}
                </div>
              </div>

              {/* Haven Images */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Haven Images
                </h3>
                <div className="mb-4">
                  <label htmlFor="haven-images" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg font-medium cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Add Images
                  </label>
                  <input
                    id="haven-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                {(existingImages.length > 0 || havenImages.length > 0) && (
                  <div className="grid grid-cols-4 gap-4">
                    {existingImages.map((img, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img src={img.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {havenImages.map((file, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photo Tour */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Photo Tour
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {photoTourCategories.map((category) => {
                    // Get existing photos for this category with their global indices
                    const existingCategoryPhotos = existingPhotoTours
                      .map((photo: any, globalIndex: number) => ({ ...photo, globalIndex }))
                      .filter(
                        (photo: any) => photo.category?.toLowerCase().replace(/\s+/g, '') === category.key.toLowerCase()
                      );

                    return (
                      <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-800 mb-2">{category.label}</p>
                        <label htmlFor={`photo-tour-${category.key}`} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Upload
                        </label>
                        <input
                          id={`photo-tour-${category.key}`}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handlePhotoTourUpload(category.key, e)}
                          className="hidden"
                        />

                        {/* Display existing photos */}
                        {existingCategoryPhotos.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-gray-500 mb-1">Existing ({existingCategoryPhotos.length})</p>
                            {existingCategoryPhotos.map((photo: any, index: number) => (
                              <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                <img src={photo.url} alt="" className="w-10 h-10 object-cover rounded" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExistingPhotoTour(photo.globalIndex)}
                                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  title="Delete photo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Display newly uploaded photos */}
                        {photoTourImages[category.key]?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-gray-500 mb-1">New ({photoTourImages[category.key].length})</p>
                            {photoTourImages[category.key].map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 object-cover rounded" />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhotoTourImage(category.key, index)}
                                  className="p-1 text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* YouTube URL */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  YouTube Video
                </h3>
                <Input
                  type="url"
                  label="YouTube URL (optional)"
                  labelPlacement="outside"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  classNames={{ label: "text-sm font-medium text-gray-700" }}
                />
              </div>

              {/* Blocked Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  Blocked Dates
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Input
                    type="date"
                    label="From Date"
                    labelPlacement="outside"
                    value={blockDateForm.fromDate}
                    onChange={(e) => setBlockDateForm({ ...blockDateForm, fromDate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    type="date"
                    label="To Date"
                    labelPlacement="outside"
                    value={blockDateForm.toDate}
                    onChange={(e) => setBlockDateForm({ ...blockDateForm, toDate: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                  <Input
                    label="Reason"
                    labelPlacement="outside"
                    value={blockDateForm.reason}
                    onChange={(e) => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                    classNames={{ label: "text-sm font-medium text-gray-700" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBlockedDate}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg mb-4"
                >
                  Add Blocked Date
                </button>
                {blockedDates.length > 0 && (
                  <div className="space-y-2">
                    {blockedDates.map((date) => (
                      <div key={date.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {date.fromDate} to {date.toDate}
                            </p>
                            {date.reason && <p className="text-xs text-gray-500">{date.reason}</p>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(date.id)}
                          className="p-1 text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
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

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default EditHavenModal;
