"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Upload, Trash2, CheckCircle2, Circle, Camera, Info, Plus } from "lucide-react";
import Image from 'next/image';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import { setCookie, getCookie } from "@/lib/cookieUtils";
import SubModalWrapper from "./SubModalWrapper";

interface PhotoTourData {
  category?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface PhotoCategory {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

const PHOTO_CATEGORIES: PhotoCategory[] = [
  { key: "livingArea", label: "Living Area", description: "Sofa, entertainment, and general layout", required: true },
  { key: "bedroom", label: "Bedroom", description: "Bed, linens, and bedroom decor", required: true },
  { key: "kitchenette", label: "Kitchenette", description: "Cooking area, fridge, and appliances", required: true },
  { key: "fullBathroom", label: "Full Bathroom", description: "Shower, toilet, and vanity", required: true },
  { key: "diningArea", label: "Dining Area", description: "Table and seating arrangements", required: false },
  { key: "exterior", label: "Exterior / View", description: "Building outside and window views", required: false },
  { key: "pool", label: "Pool / Amenities", description: "Common areas and pool facilities", required: false },
  { key: "garage", label: "Parking / Garage", description: "Parking slots and access points", required: false },
  { key: "additional", label: "Additional", description: "Any other details you want to show", required: false },
];

interface PhotoTourManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { photoTourImages: Record<string, File[]>, existingPhotoTours: PhotoTourData[] }) => void;
  initialPhotoTours?: PhotoTourData[];
  mode?: 'modal' | 'step';
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

const PhotoTourManagementModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialPhotoTours = [], 
  mode = 'modal',
  onNext,
  onBack,
  isLastStep = false,
  currentPhotoTourImages = {}
}: PhotoTourManagementModalProps & { currentPhotoTourImages?: Record<string, File[]> }) => {
  const [activeCategory, setActiveCategory] = useState<string>("livingArea");

  const handleUpload = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newImages = {
        ...currentPhotoTourImages,
        [category]: [...(currentPhotoTourImages[category] || []), ...filesArray],
      };
      onSave({ photoTourImages: newImages, existingPhotoTours: initialPhotoTours });
      toast.success(`Added to ${category}`);
    }
  };

  const removeNew = (category: string, index: number) => {
    const newImages = {
      ...currentPhotoTourImages,
      [category]: (currentPhotoTourImages[category] || []).filter((_, i) => i !== index),
    };
    onSave({ photoTourImages: newImages, existingPhotoTours: initialPhotoTours });
  };

  const removeExisting = (photoIndex: number) => {
    const newExisting = initialPhotoTours.filter((_, i) => i !== photoIndex);
    setCookie("haven_existing_photo_tours", JSON.stringify(newExisting));
    onSave({ photoTourImages: currentPhotoTourImages, existingPhotoTours: newExisting });
  };

  const getCategoryStatus = (key: string) => {
    const hasExisting = initialPhotoTours.some(p => p.category?.toLowerCase().replace(/\s+/g, '') === key.toLowerCase());
    const hasNew = (currentPhotoTourImages[key]?.length || 0) > 0;
    return hasExisting || hasNew;
  };

  const isAllRequiredFilled = useMemo(() => {
    const mandatoryCategories = ['livingArea', 'bedroom', 'kitchenette', 'fullBathroom'];
    return mandatoryCategories.every(cat => getCategoryStatus(cat));
  }, [currentPhotoTourImages, initialPhotoTours]);

  const handleSave = () => {
    if (!isAllRequiredFilled) {
      toast.error("Please provide at least one photo for all required categories");
      return;
    }
    onSave({ photoTourImages: currentPhotoTourImages, existingPhotoTours: initialPhotoTours });
    if (mode === 'step' && onNext) {
      onNext();
    } else {
      toast.success("Photo tour saved!");
      onClose();
    }
  };

  const content = (
    <div className="flex flex-col md:flex-row gap-8 h-full min-h-[500px]">
      {/* Category Sidebar */}
      <div className="w-full md:w-72 flex flex-col gap-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">
          Room Categories
        </h3>
        {PHOTO_CATEGORIES.map((cat) => {
          const isCompleted = getCategoryStatus(cat.key);
          const isActive = activeCategory === cat.key;
          
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              className={`
                flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] text-left group hover:scale-[1.03] hover:shadow-lg will-change-transform
                ${isActive 
                  ? 'border-brand-primary bg-brand-primary/5 shadow-sm' 
                  : 'border-transparent bg-white hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
                  ${isActive && !isCompleted ? 'bg-brand-primary/10 text-brand-primary' : ''}
                `}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${isActive ? 'text-brand-primary' : 'text-gray-700'}`}>
                    {cat.label}
                  </p>
                  {cat.required && !isCompleted && (
                    <span className="text-[10px] text-red-400 font-bold uppercase">Required</span>
                  )}
                </div>
              </div>
              {isActive && <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />}
            </button>
          );
        })}
      </div>

      {/* Main Upload Content */}
      <div className="flex-1 space-y-6">
        <AnimatePresence mode="wait">
          {PHOTO_CATEGORIES.map((cat) => cat.key === activeCategory && (
            <motion.div 
              key={cat.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform h-full flex flex-col">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{cat.label}</h2>
                    <p className="text-gray-500 mt-1">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-xs font-bold">
                    <Info className="w-4 h-4" />
                    STAGED PHOTOS PREFERRED
                  </div>
                </div>

                <div className="flex-1 relative min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {!getCategoryStatus(cat.key) ? (
                      /* Empty State: Large Upload Box */
                      <motion.label
                        key="empty-upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all cursor-pointer group h-full w-full"
                      >
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleUpload(cat.key, e)} 
                        />
                        <div className="bg-brand-primary/10 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-10 h-10 text-brand-primary" />
                        </div>
                        <p className="font-bold text-gray-700 text-lg">Upload your first photo</p>
                        <p className="text-sm text-gray-400 mt-1">Click or drag images here to begin</p>
                      </motion.label>
                    ) : (
                      /* Post-Upload State: Image Grid + Add More Button */
                      <motion.div
                        key="gallery-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full w-full flex flex-col"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 relative">
                          {/* Existing */}
                          {initialPhotoTours
                            .map((p, i) => ({ ...p, globalIdx: i }))
                            .filter(p => p.category?.toLowerCase().replace(/\s+/g, '') === cat.key.toLowerCase())
                            .map((photo, i) => (
                              <div key={`ex-${i}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-100 group shadow-sm hover:scale-[1.03] hover:shadow-xl transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-transform">
                                <Image src={photo.image_url!} alt="Existing" fill className="object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => removeExisting(photo.globalIdx!)}
                                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          {/* New */}
                          {currentPhotoTourImages[cat.key]?.map((file, i) => (
                            <div key={`new-${i}`} className="relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-brand-primary/20 group shadow-sm hover:scale-[1.03] hover:shadow-xl transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] will-change-transform">
                              <Image src={URL.createObjectURL(file)} alt="New" fill className="object-cover" />
                              <div className="absolute inset-0 bg-brand-primary/10" />
                              <button 
                                type="button"
                                onClick={() => removeNew(cat.key, i)}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {/* Small "+" Add More Button Overlay */}
                          <label className="relative aspect-[4/3] rounded-xl border-2 border-dashed border-brand-primary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-primary/5 transition-all group overflow-hidden bg-gray-50/30">
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleUpload(cat.key, e)} 
                            />
                            <div className="bg-brand-primary text-white p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                              <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-brand-primary mt-2 uppercase tracking-widest">Add More</span>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  if (mode === 'step') return content;

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Room Photo Tour"
      subtitle="Organize photos by room category"
      onSave={handleSave}
      maxWidth="max-w-6xl"
      mode={mode}
      onBack={onBack}
      saveLabel={mode === 'step' ? (isLastStep ? "Finish & Save" : "Next") : "Save Changes"}
      backLabel={mode === 'step' ? "Back" : "Cancel"}
    >
      {content}
    </SubModalWrapper>
  );
};

export default PhotoTourManagementModal;