"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Trash2 } from "lucide-react";
import Image from 'next/image';
import toast from 'react-hot-toast';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(havenImages, existingImages);
    toast.success("Haven images updated successfully!");
    onClose();
  };

  const handleClose = () => {
    setHavenImages([]);
    setExistingImages([]);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Haven Images</h2>
              <p className="text-sm text-gray-600 mt-1">Upload and manage haven images</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="haven-images" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium cursor-pointer">
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
                          <Image src={img.image_url} alt="Haven image" width={96} height={96} className="w-full h-24 object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {havenImages.map((file, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <Image src={URL.createObjectURL(file)} alt="New haven image" width={96} height={96} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default HavenImagesModal;
