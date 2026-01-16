"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Trash2 } from "lucide-react";
import Image from 'next/image';
import toast from 'react-hot-toast';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(photoTourImages, existingPhotoTours);
    toast.success("Photo tour updated successfully!");
    onClose();
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

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Photo Tour Management</h2>
              <p className="text-sm text-gray-600 mt-1">Upload and organize photo tour images by category</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {photoTourCategories.map((category) => {
                const existingCategoryPhotos = existingPhotoTours
                  .map((photo: PhotoTourData, globalIndex: number) => ({ ...photo, globalIndex }))
                  .filter(
                    (photo: PhotoTourData & { globalIndex: number }) => photo.category?.toLowerCase().replace(/\s+/g, '') === category.key.toLowerCase()
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
                        {existingCategoryPhotos.map((photo: PhotoTourData & { globalIndex?: number, url?: string }, index: number) => (
                          <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            {(photo.image_url || photo.url) ? (
                              <Image src={(photo.image_url || photo.url)!} alt="Photo tour" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No img</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingPhotoTour(photo.globalIndex || 0)}
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
                            <Image src={URL.createObjectURL(file)} alt="New photo tour" width={40} height={40} className="w-10 h-10 object-cover rounded" />
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

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default PhotoTourManagementModal;
