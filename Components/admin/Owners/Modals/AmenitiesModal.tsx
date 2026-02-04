"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@nextui-org/input";
import { 
  Wifi, Tv, Coffee, Wind, Car, Waves, Utensils, 
  Dumbbell, Shield, Search, Check, Info, Flame,
  Waves as Pool, Bath, Snowflake, Monitor, Smartphone,
  Speaker, Key, Zap, Refrigerator, CookingPot, UtensilsCrossed,
  Bed, BedDouble, Shirt, Lightbulb, Dices
} from "lucide-react";
import toast from 'react-hot-toast';
import { setCookie, getCookie } from "@/lib/cookieUtils";
import SubModalWrapper from "./SubModalWrapper";

interface AmenityItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: "Essential" | "Comfort" | "Luxury" | "Safety";
}

const AMENITIES_LIST: AmenityItem[] = [
  { id: "wifi", label: "WiFi", icon: Wifi, category: "Essential" },
  { id: "airConditioning", label: "Air conditioning", icon: Snowflake, category: "Essential" },
  { id: "poolAccess", label: "Pool access", icon: Pool, category: "Luxury" },
  { id: "netflix", label: "Netflix", icon: Monitor, category: "Essential" },
  { id: "kitchen", label: "Kitchen", icon: Utensils, category: "Essential" },
  { id: "parking", label: "Parking", icon: Car, category: "Essential" },
  { id: "ps4", label: "PS4", icon: Smartphone, category: "Luxury" },
  { id: "balcony", label: "Balcony", icon: Wind, category: "Comfort" },
  { id: "washerDryer", label: "Washer/Dryer", icon: Zap, category: "Comfort" },
  { id: "glowBed", label: "Glow Bed", icon: Zap, category: "Luxury" },
  { id: "tv", label: "TV", icon: Tv, category: "Essential" },
  { id: "towels", label: "Towels", icon: Bath, category: "Essential" },
];

interface AmenitiesData {
  [key: string]: boolean;
}

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AmenitiesData) => void;
  initialData?: AmenitiesData;
  mode?: 'modal' | 'step';
  onNext?: () => void;
  onBack?: () => void;
  isLastStep?: boolean;
}

const AmenitiesModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'modal',
  onNext,
  onBack,
  isLastStep = false
}: AmenitiesModalProps) => {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenitiesData>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialData) {
      setSelectedAmenities(initialData);
    }
  }, [initialData, isOpen]);

  const filteredAmenities = useMemo(() => {
    return AMENITIES_LIST.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleAmenity = (id: string) => {
    const newData = {
      ...selectedAmenities,
      [id]: !selectedAmenities[id],
    };
    setSelectedAmenities(newData);
    setCookie("haven_amenities", JSON.stringify(newData));
    onSave(newData); // Update parent in real-time
  };

  const isAnySelected = useMemo(() => Object.values(selectedAmenities).some(val => val === true), [selectedAmenities]);

  const handleSave = () => {
    if (!isAnySelected) {
      toast.error("Please select at least one amenity");
      return;
    }
    onSave(selectedAmenities);
    if (mode === 'step' && onNext) {
      onNext();
    } else {
      toast.success("Amenities updated successfully!");
      onClose();
    }
  };
  const gridContent = (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-gray-50/50 dark:bg-gray-900/50 pb-4 backdrop-blur-sm">
        <Input
          placeholder="Search amenities (e.g. WiFi, Pool, Safety...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />}
          classNames={{
            inputWrapper: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:!border-brand-primary shadow-sm rounded-xl h-12",
            input: "dark:text-gray-100"
          }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
        {filteredAmenities.map((item) => {
          const isSelected = !!selectedAmenities[item.id];
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleAmenity(item.id)}
              className={`
                relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] group
                hover:scale-[1.03] hover:shadow-xl will-change-transform
                ${isSelected 
                  ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-md' 
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-brand-primary/30'}
              `}
            >
              <div className={`
                p-3 rounded-full mb-3 transition-colors duration-300
                ${isSelected ? 'bg-brand-primary text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 group-hover:text-brand-primary'}
              `}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-brand-primary' : 'text-gray-600 dark:text-gray-300'}`}>
                {item.label}
              </span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter font-medium">
                {item.category}
              </span>

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-brand-primary text-white rounded-full p-0.5">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {filteredAmenities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 italic">No amenities found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  );

  if (mode === 'step') return gridContent;

  return (
    <SubModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Amenities"
      subtitle="Select available amenities for this haven"
      onSave={handleSave}
      maxWidth="max-w-4xl"
      mode={mode}
      onBack={onBack}
      saveLabel={mode === 'step' ? (isLastStep ? "Finish & Save" : "Next") : "Save Changes"}
      backLabel={mode === 'step' ? "Back" : "Cancel"}
    >
      {gridContent}
    </SubModalWrapper>
  );
};

export default AmenitiesModal;
