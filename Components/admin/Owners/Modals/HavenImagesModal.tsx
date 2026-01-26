"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import Image from 'next/image';
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

interface ImageData {
  id?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface HavenImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newImages: File[], existingImages: ImageData[]) => void;
  initialImages?: ImageData[];
}

const HavenImagesModal = ({ isOpen, onClose, onSave, initialImages }: HavenImagesModalProps) => {
  const [havenImages, setHavenImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ImageData[]>([]);

  useEffect(() => {
    if (initialImages) {
      setExistingImages(initialImages);
    }
  }, [initialImages, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setHavenImages([...havenImages, ...filesArray]);
      toast.success(`${filesArray.length} image(s) added`);
    }
  };

  const handleRemoveImage = (index: number) => {
    setHavenImages(havenImages.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleSave = () => {
    onSave(havenImages, existingImages);
    toast.success("Haven images updated successfully!");
    handleClose();
  };

  const handleClose = () => {
    setHavenImages([]);
    setExistingImages([]);
    onClose();
  };

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Haven Images"
      subtitle="Upload and manage haven images"
      onSave={handleSave}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="haven-images" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium cursor-pointer transition-colors shadow-sm">
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
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Uploaded Images</h3>
            <div className="grid grid-cols-4 gap-4">
              {existingImages.map((img, index) => (
                <div key={`existing-${index}`} className="relative group">
                  {img.image_url ? (
                    <Image src={img.image_url} alt="Haven image" width={96} height={96} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {havenImages.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  <Image src={URL.createObjectURL(file)} alt="New haven image" width={96} height={96} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SubModalWrapper>
  );
};

export default HavenImagesModal;