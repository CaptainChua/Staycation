"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Upload, Trash2, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";
import Image from 'next/image';
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

interface ImageData {
  id?: string;
  image_url?: string;
  is_main?: boolean;
  progress?: number;
  [key: string]: unknown;
}

interface HavenImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { havenImages: File[], existingImages: ImageData[] }) => void;
  initialImages?: ImageData[];
  mode?: 'modal' | 'step';
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

const HavenImagesModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialImages, 
  mode = 'modal',
  onNext,
  onBack,
  isLastStep = false
}: HavenImagesModalProps) => {
  const [havenImages, setHavenImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ImageData[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (initialImages) {
      setExistingImages(initialImages);
    }
  }, [initialImages, isOpen]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    // Simulate upload progress
    const newImages = [...havenImages, ...filesArray];
    setHavenImages(newImages);
    onSave({ havenImages: newImages, existingImages });
    toast.success(`${filesArray.length} image(s) added`);
  }, [havenImages, existingImages, onSave]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = havenImages.filter((_, i) => i !== index);
    setHavenImages(newImages);
    onSave({ havenImages: newImages, existingImages });
    toast.success("Image removed");
  };

  const handleRemoveExistingImage = (index: number) => {
    const newExisting = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExisting);
    onSave({ havenImages, existingImages: newExisting });
    toast.success("Image removed");
  };

  const hasImages = useMemo(() => (existingImages.length + havenImages.length) > 0, [existingImages, havenImages]);

  const handleSave = () => {
    if (!hasImages) {
      toast.error("Please upload at least one image");
      return;
    }
    onSave({ havenImages, existingImages });
    if (mode === 'step' && onNext) {
      onNext();
    } else {
      toast.success("Haven images updated successfully!");
      onClose();
    }
  };

  const galleryContent = (
    <div className="space-y-8">
      {/* Uploader Zone */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300
          ${isDragging 
            ? 'border-brand-primary bg-brand-primary/5 scale-[1.01] shadow-lg' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-primary/40'}
        `}
      >
        <input
          id="haven-images"
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <div className="bg-brand-primary/10 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Drag & Drop Images</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
            Support for JPG, PNG and WEBP. First image will be your <span className="text-brand-primary font-bold">Cover Photo</span>.
          </p>
          <label 
            htmlFor="haven-images"
            className="px-8 py-3 bg-brand-primary hover:bg-[#b57603] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Browse Files
          </label>
        </div>
      </div>

      {/* Preview Grid */}
      {(existingImages.length > 0 || havenImages.length > 0) && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Gallery Preview ({existingImages.length + havenImages.length})
            </h3>
            <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-bold">
              READY TO UPLOAD
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Existing Images */}
            {existingImages.map((img, index) => (
              <div key={`existing-${index}`} className="relative group aspect-square">
                {img.image_url ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 group-hover:border-brand-primary/50 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] shadow-sm hover:scale-[1.03] hover:shadow-xl will-change-transform">
                    <Image src={img.image_url} alt="Gallery" fill className="object-cover" />
                    {index === 0 && (
                      <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10">
                        MAIN COVER
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute -top-2 -right-2 p-2 bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/30 z-20 border border-gray-100 dark:border-gray-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* New Uploads */}
            {havenImages.map((file, index) => {
              const overallIndex = existingImages.length + index;
              return (
                <div key={`new-${index}`} className="relative group aspect-square">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-brand-primary/20 group-hover:border-brand-primary/50 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] shadow-sm hover:scale-[1.03] hover:shadow-xl will-change-transform">
                    <Image src={URL.createObjectURL(file)} alt="New upload" fill className="object-cover" />
                    {overallIndex === 0 && (
                      <div className="absolute top-3 left-3 bg-brand-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10">
                        MAIN COVER
                      </div>
                    )}
                    
                    {/* Simulated Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-700">
                      <div className="h-full bg-brand-primary animate-progress-flow" style={{ width: '100%' }} />
                    </div>
                    
                    <div className="absolute inset-0 bg-brand-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 p-2 bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/30 z-20 border border-gray-100 dark:border-gray-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'step') return galleryContent;

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Haven Gallery"
      subtitle="Upload and arrange your haven images"
      onSave={handleSave}
      maxWidth="max-w-5xl"
      mode={mode}
      onBack={onBack}
      saveLabel={mode === 'step' ? (isLastStep ? "Finish & Save" : "Next") : "Save Changes"}
      backLabel={mode === 'step' ? "Back" : "Cancel"}
    >
      {galleryContent}
    </SubModalWrapper>
  );
};

export default HavenImagesModal;