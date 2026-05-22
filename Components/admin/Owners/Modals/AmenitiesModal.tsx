"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@nextui-org/input";
import {
  Wifi, Tv, Coffee, Wind, Car, Waves, Utensils,
  Dumbbell, Shield, Search, Check, Plus, X, Sparkles,
  Bath, Snowflake, Monitor, Smartphone,
  Speaker, Key, Zap, Refrigerator,
  BedDouble, Shirt, Lightbulb, Gamepad2, Flame,
  Upload, Loader2
} from "lucide-react";
// Brand-accurate icons from Simple Icons (via react-icons)
import {
  SiPlaystation, SiNetflix, SiYoutube, SiSpotify, SiAppletv, SiHbo,
  SiTwitch, SiSteam, SiInstagram, SiTiktok, SiFacebook,
  SiEpicgames,
} from "react-icons/si";
import { MdOutlineHotTub, MdOutlinePets, MdOutlineLocalLaundryService, MdOutlineYard, MdOutlineBalcony, MdOutlineMicrowave, MdOutlineIron, MdOutlineBlender, MdOutlineRoomService } from "react-icons/md";
import toast from 'react-hot-toast';
import { setCookie } from "@/lib/cookieUtils";
import SubModalWrapper from "./SubModalWrapper";

// Inline SVG icons for trademarked brands not in Simple Icons (Xbox, Nintendo Switch).
// Designed to match the size/color contract of other icon components.
const XboxIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.61 4.262c1.36-.21 2.75-.21 4.11.005 1.97.31 3.45 1.06 3.97 1.55-2.18.13-4.92 1.91-6.47 3.16-1.55-1.25-4.29-3.03-6.47-3.16.52-.49 2-1.24 3.97-1.55a8.07 8.07 0 011.89-.005zM3.34 7.81a17.13 17.13 0 015.93 4.6c-2.04 2.25-3.74 5.06-4.27 7.13-2.21-2.45-3.07-5.62-2.83-8.85.08-1.07.46-2.06 1.17-2.88zm17.32 0c.71.82 1.09 1.81 1.17 2.88.24 3.23-.62 6.4-2.83 8.85-.53-2.07-2.23-4.88-4.27-7.13a17.13 17.13 0 015.93-4.6zM12 11.79c1.69 1.59 5.51 6.36 5.74 8.94-1.71 1.16-3.7 1.78-5.74 1.78s-4.03-.62-5.74-1.78c.23-2.58 4.05-7.35 5.74-8.94z"/>
  </svg>
);

const NintendoSwitchIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M10.04 21H6.36c-1.85 0-3.36-1.51-3.36-3.36V6.36C3 4.51 4.51 3 6.36 3h3.68v18zM8.66 7.39H6.36a.97.97 0 00-.97.97v8.28c0 .54.43.97.97.97h2.3V7.39zM7.51 9.85a1.16 1.16 0 110 2.32 1.16 1.16 0 010-2.32zM17.64 3c1.85 0 3.36 1.51 3.36 3.36v11.28c0 1.85-1.51 3.36-3.36 3.36h-4.04V3h4.04zm-.96 11.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
  </svg>
);

interface AmenityItem {
  id: string;
  label: string;
  icon: React.ElementType;
  category: "Essential" | "Comfort" | "Luxury" | "Safety" | "Rentable" | "Custom";
  custom?: boolean;
  iconKey?: string;
  iconUrl?: string; // when present, render <img> instead of the icon component
}

const AMENITIES_LIST: AmenityItem[] = [
  { id: "wifi", label: "WiFi", icon: Wifi, category: "Essential" },
  { id: "airConditioning", label: "Air conditioning", icon: Snowflake, category: "Essential" },
  { id: "poolAccess", label: "Pool access", icon: Waves, category: "Luxury" },
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

// Auto-detect icon based on amenity name keywords.
// Brand-specific keywords are matched FIRST (more specific than generic ones).
export const ICON_KEYWORDS: Array<{ keys: string[]; iconKey: string; icon: React.ElementType }> = [
  // ---- Brand-specific ----
  // Inline SVGs for Microsoft/Nintendo (not in Simple Icons due to trademark)
  { keys: ["xbox"], iconKey: "xbox", icon: XboxIcon },
  { keys: ["nintendo switch", "switch console", "nintendo"], iconKey: "switch", icon: NintendoSwitchIcon },
  // Simple Icons (verified available)
  { keys: ["playstation", "ps5", "ps4", "ps3", "ps2"], iconKey: "playstation", icon: SiPlaystation },
  { keys: ["steam deck", "steam"], iconKey: "steam", icon: SiSteam },
  { keys: ["epic games", "epic"], iconKey: "epic", icon: SiEpicgames },
  { keys: ["netflix"], iconKey: "netflix", icon: SiNetflix },
  { keys: ["youtube"], iconKey: "youtube", icon: SiYoutube },
  { keys: ["spotify"], iconKey: "spotify", icon: SiSpotify },
  { keys: ["apple tv", "appletv"], iconKey: "appletv", icon: SiAppletv },
  { keys: ["hbo", "hbo max"], iconKey: "hbo", icon: SiHbo },
  { keys: ["twitch"], iconKey: "twitch", icon: SiTwitch },
  { keys: ["instagram"], iconKey: "instagram", icon: SiInstagram },
  { keys: ["tiktok"], iconKey: "tiktok", icon: SiTiktok },
  { keys: ["facebook"], iconKey: "facebook", icon: SiFacebook },

  // ---- Generic gaming fallback (after brand-specific) ----
  { keys: ["game", "console", "controller", "board game"], iconKey: "game", icon: Gamepad2 },

  // ---- Service / pet / outdoor ----
  { keys: ["pet", "dog", "cat", "animal"], iconKey: "pet", icon: MdOutlinePets },
  { keys: ["garden", "yard", "lawn", "grass"], iconKey: "yard", icon: MdOutlineYard },
  { keys: ["jacuzzi", "hot tub"], iconKey: "hottub", icon: MdOutlineHotTub },
  { keys: ["microwave"], iconKey: "microwave", icon: MdOutlineMicrowave },
  { keys: ["blender", "mixer"], iconKey: "blender", icon: MdOutlineBlender },
  { keys: ["iron"], iconKey: "iron", icon: MdOutlineIron },
  { keys: ["room service", "concierge", "butler"], iconKey: "service", icon: MdOutlineRoomService },

  // ---- Generic Lucide (last resort) ----
  { keys: ["wifi", "wi-fi", "internet"], iconKey: "wifi", icon: Wifi },
  { keys: ["pool", "swim"], iconKey: "pool", icon: Waves },
  { keys: ["tv", "television", "smart tv"], iconKey: "tv", icon: Tv },
  { keys: ["monitor", "screen", "projector", "streaming"], iconKey: "monitor", icon: Monitor },
  { keys: ["ac", "aircon", "air condition", "cool"], iconKey: "ac", icon: Snowflake },
  { keys: ["heater", "heating", "fireplace", "warm"], iconKey: "heater", icon: Flame },
  { keys: ["parking", "garage", "car"], iconKey: "parking", icon: Car },
  { keys: ["coffee", "espresso", "cafe"], iconKey: "coffee", icon: Coffee },
  { keys: ["kitchen", "stove", "cookware"], iconKey: "kitchen", icon: Utensils },
  { keys: ["fridge", "refrigerator", "freezer"], iconKey: "fridge", icon: Refrigerator },
  { keys: ["bath", "shower", "tub", "towel"], iconKey: "bath", icon: Bath },
  { keys: ["bed", "linen", "pillow"], iconKey: "bed", icon: BedDouble },
  { keys: ["washer", "dryer", "laundry", "wash"], iconKey: "washer", icon: MdOutlineLocalLaundryService },
  { keys: ["clothes", "shirt"], iconKey: "clothes", icon: Shirt },
  { keys: ["gym", "fitness", "exercise", "weight"], iconKey: "gym", icon: Dumbbell },
  { keys: ["security", "safe", "lock", "guard", "alarm"], iconKey: "security", icon: Shield },
  { keys: ["balcony", "patio", "terrace", "deck"], iconKey: "balcony", icon: MdOutlineBalcony },
  { keys: ["fan", "ventilation"], iconKey: "fan", icon: Wind },
  { keys: ["light", "lamp", "led"], iconKey: "light", icon: Lightbulb },
  { keys: ["speaker", "audio", "sound", "music", "stereo"], iconKey: "speaker", icon: Speaker },
  { keys: ["key", "access", "lockbox", "smartlock"], iconKey: "key", icon: Key },
  { keys: ["smart", "iot", "automation"], iconKey: "smart", icon: Smartphone },
  { keys: ["power", "charger", "outlet"], iconKey: "power", icon: Zap },
];

export const ICON_BY_KEY: Record<string, React.ElementType> = ICON_KEYWORDS.reduce(
  (acc, entry) => ({ ...acc, [entry.iconKey]: entry.icon }),
  { default: Sparkles } as Record<string, React.ElementType>
);

// Curated list of all icons the partner can pick manually (in addition to keyword auto-detect).
// Ordered roughly by category for the picker UI.
export const ICON_OPTIONS: Array<{ key: string; label: string; icon: React.ElementType; group: string }> = [
  // Brand — Gaming
  { key: "xbox", label: "Xbox", icon: XboxIcon, group: "Gaming" },
  { key: "switch", label: "Nintendo Switch", icon: NintendoSwitchIcon, group: "Gaming" },
  { key: "playstation", label: "PlayStation", icon: SiPlaystation, group: "Gaming" },
  { key: "steam", label: "Steam", icon: SiSteam, group: "Gaming" },
  { key: "epic", label: "Epic Games", icon: SiEpicgames, group: "Gaming" },
  { key: "game", label: "Game controller", icon: Gamepad2, group: "Gaming" },
  // Brand — Streaming
  { key: "netflix", label: "Netflix", icon: SiNetflix, group: "Streaming" },
  { key: "youtube", label: "YouTube", icon: SiYoutube, group: "Streaming" },
  { key: "spotify", label: "Spotify", icon: SiSpotify, group: "Streaming" },
  { key: "appletv", label: "Apple TV", icon: SiAppletv, group: "Streaming" },
  { key: "hbo", label: "HBO", icon: SiHbo, group: "Streaming" },
  { key: "twitch", label: "Twitch", icon: SiTwitch, group: "Streaming" },
  // Brand — Social
  { key: "instagram", label: "Instagram", icon: SiInstagram, group: "Social" },
  { key: "tiktok", label: "TikTok", icon: SiTiktok, group: "Social" },
  { key: "facebook", label: "Facebook", icon: SiFacebook, group: "Social" },
  // Connectivity
  { key: "wifi", label: "WiFi", icon: Wifi, group: "Connectivity" },
  { key: "tv", label: "TV", icon: Tv, group: "Connectivity" },
  { key: "monitor", label: "Monitor", icon: Monitor, group: "Connectivity" },
  { key: "speaker", label: "Speaker", icon: Speaker, group: "Connectivity" },
  { key: "smart", label: "Smart device", icon: Smartphone, group: "Connectivity" },
  // Kitchen
  { key: "kitchen", label: "Kitchen", icon: Utensils, group: "Kitchen" },
  { key: "coffee", label: "Coffee", icon: Coffee, group: "Kitchen" },
  { key: "fridge", label: "Fridge", icon: Refrigerator, group: "Kitchen" },
  { key: "microwave", label: "Microwave", icon: MdOutlineMicrowave, group: "Kitchen" },
  { key: "blender", label: "Blender", icon: MdOutlineBlender, group: "Kitchen" },
  // Bath & Bedroom
  { key: "bath", label: "Bath / Shower", icon: Bath, group: "Bath & Bedroom" },
  { key: "bed", label: "Bed", icon: BedDouble, group: "Bath & Bedroom" },
  { key: "hottub", label: "Hot tub", icon: MdOutlineHotTub, group: "Bath & Bedroom" },
  { key: "clothes", label: "Clothes / Iron", icon: Shirt, group: "Bath & Bedroom" },
  { key: "iron", label: "Iron", icon: MdOutlineIron, group: "Bath & Bedroom" },
  { key: "washer", label: "Laundry", icon: MdOutlineLocalLaundryService, group: "Bath & Bedroom" },
  // Climate & Power
  { key: "ac", label: "Air conditioning", icon: Snowflake, group: "Climate" },
  { key: "heater", label: "Heater / Fire", icon: Flame, group: "Climate" },
  { key: "fan", label: "Fan", icon: Wind, group: "Climate" },
  { key: "light", label: "Light", icon: Lightbulb, group: "Climate" },
  { key: "power", label: "Power", icon: Zap, group: "Climate" },
  // Outdoor & Property
  { key: "pool", label: "Pool", icon: Waves, group: "Outdoor" },
  { key: "balcony", label: "Balcony", icon: MdOutlineBalcony, group: "Outdoor" },
  { key: "yard", label: "Garden / Yard", icon: MdOutlineYard, group: "Outdoor" },
  { key: "parking", label: "Parking", icon: Car, group: "Outdoor" },
  // Service & Safety
  { key: "service", label: "Room service", icon: MdOutlineRoomService, group: "Service" },
  { key: "security", label: "Security", icon: Shield, group: "Service" },
  { key: "key", label: "Smart lock / Key", icon: Key, group: "Service" },
  { key: "pet", label: "Pet friendly", icon: MdOutlinePets, group: "Service" },
  { key: "gym", label: "Gym / Fitness", icon: Dumbbell, group: "Service" },
  // Fallback
  { key: "default", label: "Generic", icon: Sparkles, group: "Other" },
];

export const pickIconForLabel = (label: string): { icon: React.ElementType; iconKey: string } => {
  const lower = label.toLowerCase();
  for (const entry of ICON_KEYWORDS) {
    if (entry.keys.some((k) => lower.includes(k))) {
      return { icon: entry.icon, iconKey: entry.iconKey };
    }
  }
  return { icon: Sparkles, iconKey: "default" };
};

type AmenityCategory = "Essential" | "Comfort" | "Luxury" | "Safety" | "Rentable";

const CATEGORY_OPTIONS: { value: AmenityCategory; label: string; helper: string }[] = [
  { value: "Essential", label: "Essential", helper: "Things every guest expects" },
  { value: "Comfort", label: "Comfort", helper: "Quality-of-life extras" },
  { value: "Luxury", label: "Luxury", helper: "Premium upgrades" },
  { value: "Safety", label: "Safety", helper: "Security & emergency features" },
  { value: "Rentable", label: "Rentable", helper: "Available for an extra fee" },
];

// Custom amenity stored alongside boolean flags under a reserved key in the JSONB.
// iconUrl wins over iconKey when present (uploaded image overrides preset icon).
interface CustomAmenityMeta {
  id: string;            // e.g. "custom_pet_friendly"
  label: string;         // user-typed
  iconKey: string;       // preset icon key (auto-detected or manually picked)
  iconUrl?: string;      // optional uploaded image (data URL, resized to 96x96)
  category?: AmenityCategory; // partner-chosen category; defaults to "Comfort"
}

// Resize an uploaded image to a square dataURL (default 96x96, PNG).
// Keeps the result tiny enough to safely store in JSONB.
export const fileToResizedDataUrl = (file: File, size = 96): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Image must be smaller than 2MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        // Cover-fit the image into the square canvas
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

// AmenitiesData stores boolean toggles for each amenity id PLUS a reserved
// `_custom` array containing metadata for user-defined amenities.
interface AmenitiesData {
  [key: string]: boolean | CustomAmenityMeta[] | undefined;
  _custom?: CustomAmenityMeta[];
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
}: AmenitiesModalProps) => {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenitiesData>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [newAmenityLabel, setNewAmenityLabel] = useState("");
  // Icon currently chosen for the new amenity (manual override of auto-detect)
  const [pickedIconKey, setPickedIconKey] = useState<string>("default");
  // Whether the icon-picker grid is expanded under the input
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  // When the user types, auto-suggest an icon — but DON'T overwrite a manually picked one
  // (manual = user picked from grid OR uploaded an image)
  const [userPickedManually, setUserPickedManually] = useState(false);
  // Uploaded icon (data URL). When set, this wins over pickedIconKey.
  const [uploadedIconUrl, setUploadedIconUrl] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  // Partner-chosen category for the new amenity
  const [pickedCategory, setPickedCategory] = useState<AmenityCategory>("Comfort");
  useEffect(() => {
    if (!showAddInput) return;
    if (userPickedManually) return;
    const { iconKey } = pickIconForLabel(newAmenityLabel);
    setPickedIconKey(iconKey);
  }, [newAmenityLabel, showAddInput, userPickedManually]);

  const handleIconUpload = async (file: File) => {
    setUploadingIcon(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 96);
      setUploadedIconUrl(dataUrl);
      setUserPickedManually(true);
      setShowIconPicker(false);
      toast.success("Icon uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload icon");
    } finally {
      setUploadingIcon(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setSelectedAmenities(initialData);
    }
  }, [initialData, isOpen]);

  // Build the full amenity list (static + custom from selectedAmenities._custom)
  const customAmenities: AmenityItem[] = useMemo(() => {
    const custom = (selectedAmenities._custom as CustomAmenityMeta[] | undefined) || [];
    return custom.map((c) => ({
      id: c.id,
      label: c.label,
      icon: ICON_BY_KEY[c.iconKey] || Sparkles,
      // Show the partner-chosen category; default to "Comfort" for backward-compat
      category: (c.category || "Comfort") as AmenityItem["category"],
      custom: true,
      iconKey: c.iconKey,
      iconUrl: c.iconUrl,
    }));
  }, [selectedAmenities._custom]);

  const allAmenities = useMemo(() => [...AMENITIES_LIST, ...customAmenities], [customAmenities]);

  const filteredAmenities = useMemo(() => {
    return allAmenities.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allAmenities]);

  const toggleAmenity = (id: string) => {
    const newData: AmenitiesData = {
      ...selectedAmenities,
      [id]: !(selectedAmenities[id] as boolean),
    };
    setSelectedAmenities(newData);
    setCookie("haven_amenities", JSON.stringify(newData));
    onSave(newData);
  };

  const resetAddPanel = () => {
    setNewAmenityLabel("");
    setShowAddInput(false);
    setPickedIconKey("default");
    setUserPickedManually(false);
    setShowIconPicker(false);
    setIconSearch("");
    setUploadedIconUrl(null);
    setUploadingIcon(false);
    setPickedCategory("Comfort");
  };

  const addCustomAmenity = () => {
    const label = newAmenityLabel.trim();
    if (!label) {
      toast.error("Please type an amenity name");
      return;
    }
    if (label.length > 40) {
      toast.error("Keep the name under 40 characters");
      return;
    }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const id = `custom_${slug || Math.random().toString(36).slice(2, 6)}`;
    if (selectedAmenities[id] !== undefined || AMENITIES_LIST.some((a) => a.id === id)) {
      toast.error("That amenity is already added");
      return;
    }
    // Resolve icon: uploaded image > manually picked preset > auto-detected from label
    const iconKey = userPickedManually
      ? pickedIconKey
      : pickIconForLabel(label).iconKey;
    const meta: CustomAmenityMeta = { id, label, iconKey, category: pickedCategory };
    if (uploadedIconUrl) meta.iconUrl = uploadedIconUrl;
    const customList = (selectedAmenities._custom as CustomAmenityMeta[] | undefined) || [];
    const newData: AmenitiesData = {
      ...selectedAmenities,
      [id]: true,
      _custom: [...customList, meta],
    };
    setSelectedAmenities(newData);
    setCookie("haven_amenities", JSON.stringify(newData));
    onSave(newData);
    resetAddPanel();
    toast.success(`Added "${label}"`);
  };

  // Filtered icon options for the picker grid
  const filteredIconOptions = useMemo(() => {
    if (!iconSearch.trim()) return ICON_OPTIONS;
    const q = iconSearch.toLowerCase();
    return ICON_OPTIONS.filter(
      (o) => o.label.toLowerCase().includes(q) || o.group.toLowerCase().includes(q)
    );
  }, [iconSearch]);

  const removeCustomAmenity = (id: string) => {
    const customList = (selectedAmenities._custom as CustomAmenityMeta[] | undefined) || [];
    const newData: AmenitiesData = { ...selectedAmenities };
    delete newData[id];
    newData._custom = customList.filter((c) => c.id !== id);
    setSelectedAmenities(newData);
    setCookie("haven_amenities", JSON.stringify(newData));
    onSave(newData);
  };

  const isAnySelected = useMemo(
    () => Object.entries(selectedAmenities).some(([k, v]) => k !== "_custom" && v === true),
    [selectedAmenities]
  );

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
      {/* Guide Box */}
      <div className="flex items-start gap-3 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 rounded-2xl">
        <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/15 text-brand-primary text-xs font-bold flex-shrink-0">?</span>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-0.5">What is this step?</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Select everything that's included in your haven — from WiFi and air conditioning to Netflix, pool access, and parking. Only check what guests can actually use during their stay. These amenities are shown on your listing.</p>
        </div>
      </div>

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
            <div key={item.id} className="relative group">
              <button
                type="button"
                onClick={() => toggleAmenity(item.id)}
                className={`
                  w-full relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]
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
                  {item.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.iconUrl} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`text-xs font-bold text-center leading-tight ${isSelected ? 'text-brand-primary' : 'text-gray-600 dark:text-gray-300'}`}>
                  {item.label}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter font-medium">
                  {item.category}
                </span>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-brand-primary text-white rounded-full p-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>

              {/* Remove button for custom amenities (hover-revealed) */}
              {item.custom && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomAmenity(item.id);
                  }}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                  aria-label={`Remove ${item.label}`}
                  title={`Remove ${item.label}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add custom amenity card */}
        {!showAddInput && (
          <button
            type="button"
            onClick={() => setShowAddInput(true)}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-brand-primary/40 bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary transition-all duration-200 hover:scale-[1.03] will-change-transform min-h-[140px]"
          >
            <div className="p-3 rounded-full mb-3 bg-brand-primary/15">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-center leading-tight">Add amenity</span>
            <span className="text-[9px] text-brand-primary/70 mt-1 uppercase tracking-tighter font-medium">
              Custom
            </span>
          </button>
        )}
      </div>

      {/* Inline add input */}
      {showAddInput && (() => {
        const PickedIcon = ICON_BY_KEY[pickedIconKey] || Sparkles;
        return (
        <div className="p-4 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/30 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider">
            New custom amenity
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Icon preview button — click to expand picker */}
            <button
              type="button"
              onClick={() => setShowIconPicker((v) => !v)}
              className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border-2 border-brand-primary/40 hover:border-brand-primary text-brand-primary grid place-items-center flex-shrink-0 transition overflow-hidden"
              aria-label="Change icon"
              title="Change icon"
            >
              {uploadedIconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={uploadedIconUrl} alt="" className="w-7 h-7 object-contain" />
              ) : (
                <PickedIcon className="w-6 h-6" />
              )}
            </button>
            <Input
              placeholder="e.g. Pet friendly, Outdoor grill, Sauna…"
              value={newAmenityLabel}
              onChange={(e) => setNewAmenityLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
              autoFocus
              maxLength={40}
              classNames={{
                inputWrapper:
                  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:!border-brand-primary rounded-xl h-12",
                input: "dark:text-gray-100",
              }}
            />
            <button
              type="button"
              onClick={addCustomAmenity}
              className="px-4 h-12 rounded-xl bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
            <button
              type="button"
              onClick={resetAddPanel}
              className="px-4 h-12 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition"
            >
              Cancel
            </button>
          </div>

          {/* Category picker */}
          <div>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Category
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = pickedCategory === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPickedCategory(opt.value)}
                    title={opt.helper}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                      isActive
                        ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-primary/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-1.5 italic">
              {CATEGORY_OPTIONS.find((o) => o.value === pickedCategory)?.helper}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              An icon is auto-picked from the name. Tap the icon on the left to choose a different one.
            </p>
            <button
              type="button"
              onClick={() => setShowIconPicker((v) => !v)}
              className="text-[11px] font-semibold text-brand-primary hover:underline whitespace-nowrap"
            >
              {showIconPicker ? "Hide icons" : "Choose icon"}
            </button>
          </div>

          {/* Icon picker grid */}
          {showIconPicker && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 max-h-[340px] overflow-y-auto">
              {/* Upload your own icon row */}
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-brand-primary/5 dark:bg-brand-primary/10 border border-dashed border-brand-primary/40">
                <label
                  className={`flex-1 cursor-pointer flex items-center gap-2 px-3 h-9 rounded-md bg-white dark:bg-gray-800 border border-brand-primary/50 text-brand-primary hover:bg-brand-primary hover:text-white font-semibold text-xs transition ${
                    uploadingIcon ? "opacity-60 cursor-wait" : ""
                  }`}
                >
                  {uploadingIcon ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      {uploadedIconUrl ? "Replace uploaded icon" : "Upload your own icon"}
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    disabled={uploadingIcon}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconUpload(file);
                      e.target.value = ""; // allow re-uploading the same file
                    }}
                  />
                </label>
                {uploadedIconUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedIconUrl(null);
                      // fall back to keyword auto-detect again
                      const { iconKey } = pickIconForLabel(newAmenityLabel);
                      setPickedIconKey(iconKey);
                      setUserPickedManually(false);
                    }}
                    className="px-2 h-9 rounded-md border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold"
                    title="Remove uploaded icon"
                    aria-label="Remove uploaded icon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Input
                placeholder="Or search built-in icons (gaming, pool, light, smart…)"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                startContent={<Search className="w-3.5 h-3.5 text-gray-400" />}
                classNames={{
                  inputWrapper: "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg h-9 mb-3",
                  input: "text-xs dark:text-gray-100",
                }}
              />
              {filteredIconOptions.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">
                  No icons match &ldquo;{iconSearch}&rdquo;
                </p>
              ) : (
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filteredIconOptions.map((opt) => {
                    const OptIcon = opt.icon;
                    const isPicked = pickedIconKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setPickedIconKey(opt.key);
                          setUserPickedManually(true);
                          setUploadedIconUrl(null); // built-in pick overrides upload
                          setShowIconPicker(false);
                        }}
                        title={`${opt.label} · ${opt.group}`}
                        aria-label={opt.label}
                        className={`aspect-square rounded-lg grid place-items-center transition border-2 ${
                          isPicked
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                            : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:border-brand-primary/30 hover:text-brand-primary"
                        }`}
                      >
                        <OptIcon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        );
      })()}

      {filteredAmenities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500 italic">
            No amenities found matching &ldquo;{searchQuery}&rdquo;
          </p>
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
      saveLabel="Save Changes"
      backLabel="Cancel"
    >
      {gridContent}
    </SubModalWrapper>
  );
};

export default AmenitiesModal;
