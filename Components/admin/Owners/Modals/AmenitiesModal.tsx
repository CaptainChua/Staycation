"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@nextui-org/checkbox";
import toast from 'react-hot-toast';
import SubModalWrapper from "./SubModalWrapper";

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

  const handleSave = () => {
    onSave(amenities);
    toast.success("Amenities updated successfully!");
    handleClose();
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

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title="Amenities"
      subtitle="Select available amenities for this haven"
      onSave={handleSave}
      maxWidth="max-w-3xl"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {amenitiesList.map((amenity) => (
          <Checkbox
            key={amenity.key}
            isSelected={amenities[amenity.key as keyof AmenitiesData] as boolean}
            onValueChange={(checked) => handleAmenityChange(amenity.key, checked)}
            classNames={{
              wrapper: "after:bg-brand-primary",
            }}
          >
            {amenity.label}
          </Checkbox>
        ))}
      </div>
    </SubModalWrapper>
  );
};

export default AmenitiesModal;