"use client";

import { useState, useEffect } from "react";
import { Input, Textarea } from "@nextui-org/input";
import { z } from "zod";

const detailsSchema = z.object({
  capacity: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, "Capacity must be a positive number"),
  room_size: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Room size must be a positive number"),
  beds: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().refine(val => !val || (parseInt(val) >= 0), "Bathrooms must be 0 or more").optional(),
  description: z.string().min(1, "Description is required"),
  property_type: z.string().optional(),
  // Optional finance + policies — empty strings allowed
  cleaning_fee: z.string().optional(),
  security_deposit: z.string().optional(),
  extra_pax_fee: z.string().optional(),
  house_rules: z.string().optional(),
  smoking_policy: z.string().optional(),
  pet_policy: z.string().optional(),
  cancellation_policy: z.string().optional(),
  google_map_address: z.string().optional(),
  virtual_tour_url: z.string().optional(),
});

interface HavenDetailsData {
  capacity?: number | string;
  room_size?: number | string;
  beds?: string;
  bathrooms?: number | string;
  description?: string;
  property_type?: string;
  cleaning_fee?: number | string;
  security_deposit?: number | string;
  extra_pax_fee?: number | string;
  house_rules?: string;
  smoking_policy?: string;
  pet_policy?: string;
  cancellation_policy?: string;
  google_map_address?: string;
  virtual_tour_url?: string;
}

interface HavenDetailsModalProps {
  onSave: (data: HavenDetailsData) => void;
  initialData?: HavenDetailsData;
  isAddMode?: boolean;
}

const HavenDetailsModal = ({ 
  onSave, 
  initialData, 
  isAddMode = false,
}: HavenDetailsModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    capacity: "",
    room_size: "",
    beds: "",
    bathrooms: "",
    description: "",
    property_type: "",
    cleaning_fee: "",
    security_deposit: "",
    extra_pax_fee: "",
    house_rules: "",
    smoking_policy: "",
    pet_policy: "",
    cancellation_policy: "",
    google_map_address: "",
    virtual_tour_url: "",
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        capacity: initialData.capacity?.toString() || "",
        room_size: initialData.room_size?.toString() || "",
        beds: initialData.beds || "",
        bathrooms: initialData.bathrooms?.toString() || "",
        description: initialData.description || "",
        property_type: initialData.property_type || "",
        cleaning_fee: initialData.cleaning_fee?.toString() || "",
        security_deposit: initialData.security_deposit?.toString() || "",
        extra_pax_fee: initialData.extra_pax_fee?.toString() || "",
        house_rules: initialData.house_rules || "",
        smoking_policy: initialData.smoking_policy || "",
        pet_policy: initialData.pet_policy || "",
        cancellation_policy: initialData.cancellation_policy || "",
        google_map_address: initialData.google_map_address || "",
        virtual_tour_url: initialData.virtual_tour_url || "",
      });
    }
  }, [initialData]);

  const validation = detailsSchema.safeParse(formData);
  const errors = !validation.success ? validation.error.format() : null;

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    onSave(newData);
  };

  const getInputClasses = (field: string) => {
    const isFieldTouched = touched[field];
    const isFieldInvalid = isFieldTouched && errors?.[field as keyof typeof errors];
    const isFieldValid = isFieldTouched && !errors?.[field as keyof typeof errors];

    let borderClass = "border-gray-200 dark:border-gray-700";
    if (isFieldInvalid) borderClass = "border-red-500 bg-red-50/10 dark:bg-red-900/10";
    if (isFieldValid) borderClass = "border-green-500 bg-green-50/10 dark:bg-green-900/10";

    return {
      label: "text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-wider",
      inputWrapper: [
        "bg-white dark:bg-gray-700",
        `border-2 ${borderClass}`,
        "hover:border-brand-primary/40",
        "focus-within:!border-brand-primary",
        "focus-within:ring-4",
        "focus-within:ring-brand-primary/10",
        "shadow-sm",
        "transition-all",
        "duration-300",
        "rounded-2xl",
        "h-14",
        "px-4"
      ].join(" "),
      input: "text-base font-semibold text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500",
      errorMessage: "text-xs font-bold text-red-500 dark:text-red-400 mt-1.5 ml-1 animate-in slide-in-from-top-1"
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.01] hover:shadow-md will-change-transform">
      <div className="space-y-6">
        {/* Guide Box */}
        <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
          <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">?</span>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">What is this step?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Describe the physical details of your haven — how many guests it can hold, the room size in square meters, the bed setup, and a description that will appear on the listing. A clear and inviting description helps guests decide faster.</p>
          </div>
        </div>
        {/* Property type */}
        <div>
          <label htmlFor="property-type" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1 uppercase tracking-wider">
            Property Type
          </label>
          <select
            id="property-type"
            value={formData.property_type}
            onChange={(e) => handleChange('property_type', e.target.value)}
            aria-label="Property Type"
            title="Property Type"
            className="w-full px-4 h-14 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-base font-semibold text-gray-900 dark:text-gray-100 rounded-2xl outline-none focus:border-brand-primary"
          >
            <option value="">Select a property type…</option>
            <option value="condo">Condominium</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="apartment">Apartment</option>
            <option value="loft">Loft / Studio</option>
            <option value="cabin">Cabin / Cottage</option>
            <option value="resort">Resort</option>
            <option value="hotel">Hotel</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="number"
            label="Capacity (max pax)"
            labelPlacement="outside"
            placeholder="e.g., 4"
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            classNames={getInputClasses('capacity')}
            isInvalid={touched.capacity && !!errors?.capacity}
            errorMessage={touched.capacity && (errors?.capacity as any)?._errors[0]}
            isRequired
          />
          <Input
            type="number"
            label="Room Size (sqm)"
            labelPlacement="outside"
            placeholder="e.g., 35"
            value={formData.room_size}
            onChange={(e) => handleChange('room_size', e.target.value)}
            classNames={getInputClasses('room_size')}
            isInvalid={touched.room_size && !!errors?.room_size}
            errorMessage={touched.room_size && (errors?.room_size as any)?._errors[0]}
            isRequired
          />
          <Input
            type="number"
            label="Bathrooms"
            labelPlacement="outside"
            placeholder="e.g., 2"
            min={0}
            value={formData.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            classNames={getInputClasses('bathrooms')}
            isInvalid={touched.bathrooms && !!errors?.bathrooms}
            errorMessage={touched.bathrooms && (errors?.bathrooms as any)?._errors[0]}
          />
        </div>
        <Input
          label="Bedrooms"
          labelPlacement="outside"
          placeholder="e.g., 2 Queen Beds"
          value={formData.beds}
          onChange={(e) => handleChange('beds', e.target.value)}
          classNames={getInputClasses('beds')}
          isInvalid={touched.beds && !!errors?.beds}
          errorMessage={touched.beds && (errors?.beds as any)?._errors[0]}
          isRequired
        />
        <Textarea
          label="Description"
          labelPlacement="outside"
          placeholder="Describe the haven..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          classNames={{
            ...getInputClasses('description'),
            inputWrapper: `${getInputClasses('description').inputWrapper} h-auto min-h-[120px] py-2`
          }}
          isInvalid={touched.description && !!errors?.description}
          errorMessage={touched.description && (errors?.description as any)?._errors[0]}
          isRequired
        />

        {/* ── Location pin (optional) ──────────────────────────────────── */}
        <Input
          label="Google Maps address / link (optional)"
          labelPlacement="outside"
          placeholder="e.g., M Place South Triangle, Quezon City"
          value={formData.google_map_address}
          onChange={(e) => handleChange('google_map_address', e.target.value)}
          classNames={getInputClasses('google_map_address')}
        />

        {/* ── Finance: cleaning fee + security deposit + extra pax fee ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            type="number"
            label="Cleaning fee (₱, per booking)"
            labelPlacement="outside"
            placeholder="0"
            value={formData.cleaning_fee}
            onChange={(e) => handleChange('cleaning_fee', e.target.value)}
            classNames={getInputClasses('cleaning_fee')}
            startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
          />
          <Input
            type="number"
            label="Security deposit (₱)"
            labelPlacement="outside"
            placeholder="0"
            value={formData.security_deposit}
            onChange={(e) => handleChange('security_deposit', e.target.value)}
            classNames={getInputClasses('security_deposit')}
            startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
          />
          <Input
            type="number"
            label="Extra pax fee (₱/night)"
            labelPlacement="outside"
            placeholder="0"
            value={formData.extra_pax_fee}
            onChange={(e) => handleChange('extra_pax_fee', e.target.value)}
            classNames={getInputClasses('extra_pax_fee')}
            startContent={<span className="text-gray-500 dark:text-gray-400 font-medium">₱</span>}
          />
        </div>

        {/* ── Policies (optional) ──────────────────────────────────────── */}
        <Textarea
          label="House rules (optional)"
          labelPlacement="outside"
          placeholder="e.g., No loud parties after 10 PM. No outside food in pool area."
          value={formData.house_rules}
          onChange={(e) => handleChange('house_rules', e.target.value)}
          classNames={{
            ...getInputClasses('house_rules'),
            inputWrapper: `${getInputClasses('house_rules').inputWrapper} h-auto min-h-[80px] py-2`,
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Smoking policy"
            labelPlacement="outside"
            placeholder="e.g., No smoking indoors"
            value={formData.smoking_policy}
            onChange={(e) => handleChange('smoking_policy', e.target.value)}
            classNames={getInputClasses('smoking_policy')}
          />
          <Input
            label="Pet policy"
            labelPlacement="outside"
            placeholder="e.g., No pets allowed"
            value={formData.pet_policy}
            onChange={(e) => handleChange('pet_policy', e.target.value)}
            classNames={getInputClasses('pet_policy')}
          />
          <Input
            label="Cancellation"
            labelPlacement="outside"
            placeholder="e.g., Free up to 48h before"
            value={formData.cancellation_policy}
            onChange={(e) => handleChange('cancellation_policy', e.target.value)}
            classNames={getInputClasses('cancellation_policy')}
          />
        </div>

        <Input
          label="Virtual tour URL (optional)"
          labelPlacement="outside"
          placeholder="e.g., https://my.matterport.com/show/?m=..."
          value={formData.virtual_tour_url}
          onChange={(e) => handleChange('virtual_tour_url', e.target.value)}
          classNames={getInputClasses('virtual_tour_url')}
        />
      </div>
    </div>
  );
};

export default HavenDetailsModal;
