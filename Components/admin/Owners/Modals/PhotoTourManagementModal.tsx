"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import Image from 'next/image';
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

interface PhotoTourData {
  category?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface PhotoTourManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photoTours: Record<string, File[]>, existingPhotoTours: PhotoTourData[]) => void;
  initialPhotoTours?: PhotoTourData[];
}

const PhotoTourManagementModal = ({ isOpen, onClose, onSave, initialPhotoTours }: PhotoTourManagementModalProps) => {
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
    if (initialPhotoTours) {
      setExistingPhotoTours(initialPhotoTours);
    }
  }, [initialPhotoTours, isOpen]);

  const handlePhotoTourUpload = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setPhotoTourImages({
        ...photoTourImages,
        [category]: [...photoTourImages[category], ...filesArray],
      });
      toast.success(`${filesArray.length} image(s) added to ${photoTourCategories.find(c => c.key === category)?.label}`);
    }
  };

  const handleRemovePhotoTourImage = (category: string, index: number) => {
    setPhotoTourImages({
      ...photoTourImages,
      [category]: photoTourImages[category].filter((_, i) => i !== index),
    });
    toast.success("Photo removed");
  };

  const handleRemoveExistingPhotoTour = (photoIndex: number) => {
    setExistingPhotoTours(existingPhotoTours.filter((_, i) => i !== photoIndex));
    toast.success("Photo removed");
  };

  const handleSave = () => {
    onSave(photoTourImages, existingPhotoTours);
    toast.success("Photo tour updated successfully!");
    handleClose();
  };

  const handleClose = () => {
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
    onClose();
  };

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Photo Tour Management"
      subtitle="Upload and organize photo tour images by category"
      onSave={handleSave}
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {photoTourCategories.map((category) => {
          const existingCategoryPhotos = existingPhotoTours
            .map((photo: PhotoTourData, globalIndex: number) => ({ ...photo, globalIndex }))
            .filter(
              (photo: PhotoTourData & { globalIndex: number }) => photo.category?.toLowerCase().replace(/\s+/g, '') === category.key.toLowerCase()
            );

          return (
            <div key={category.key} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
              <p className="text-sm font-semibold text-gray-800 mb-2">{category.label}</p>
              <label htmlFor={`photo-tour-${category.key}`} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm cursor-pointer transition-colors shadow-sm">
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
                  <p className="text-xs text-gray-500 mb-1 font-medium">Existing ({existingCategoryPhotos.length})</p>
                  {existingCategoryPhotos.map((photo: PhotoTourData & { globalIndex?: number, url?: string }, index: number) => (
                    <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                      {(photo.image_url || photo.url) ? (
                        <Image src={(photo.image_url || photo.url)!} alt="Photo tour" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhotoTour(photo.globalIndex || 0)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
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
                  <p className="text-xs text-gray-500 mb-1 font-medium">New ({photoTourImages[category.key].length})</p>
                  {photoTourImages[category.key].map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <Image src={URL.createObjectURL(file)} alt="New photo tour" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhotoTourImage(category.key, index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
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
    </SubModalWrapper>
  );
};

export default PhotoTourManagementModal;