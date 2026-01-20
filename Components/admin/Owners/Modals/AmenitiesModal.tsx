"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Checkbox } from "@nextui-org/checkbox";
import toast from 'react-hot-toast';

interface AmenitiesData {
  wifi?: boolean;
  netflix?: boolean;
  ps4?: boolean;
  glowBed?: boolean;
  airConditioning?: boolean;
  kitchen?: boolean;
  balcony?: boolean;
  tv?: boolean;
  poolAccess?: boolean;
  parking?: boolean;
  washerDryer?: boolean;
  towels?: boolean;
}

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AmenitiesData) => void;
  initialData?: AmenitiesData;
}

const AmenitiesModal = ({ isOpen, onClose, onSave, initialData }: AmenitiesModalProps) => {
  const [amenities, setAmenities] = useState<AmenitiesData>({
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
  });

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

  useEffect(() => {
    if (initialData) {
      setAmenities({
        wifi: initialData.wifi || false,
        netflix: initialData.netflix || false,
        ps4: initialData.ps4 || false,
        glowBed: initialData.glowBed || false,
        airConditioning: initialData.airConditioning || false,
        kitchen: initialData.kitchen || false,
        balcony: initialData.balcony || false,
        tv: initialData.tv || false,
        poolAccess: initialData.poolAccess || false,
        parking: initialData.parking || false,
        washerDryer: initialData.washerDryer || false,
        towels: initialData.towels || false,
      });
    }
  }, [initialData, isOpen]);

  const handleAmenityChange = (key: string, checked: boolean) => {
    setAmenities({
      ...amenities,
      [key]: checked,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(amenities);
    toast.success("Amenities updated successfully!");
    onClose();
  };

  const handleClose = () => {
    setAmenities({
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
    });
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleClose}></div>
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Amenities</h2>
              <p className="text-sm text-gray-600 mt-1">Select available amenities for this haven</p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {amenitiesList.map((amenity) => (
                <Checkbox
                  key={amenity.key}
                  isSelected={amenities[amenity.key as keyof AmenitiesData] as boolean}
                  onValueChange={(checked) => handleAmenityChange(amenity.key, checked)}
                >
                  {amenity.label}
                </Checkbox>
              ))}
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

export default AmenitiesModal;
