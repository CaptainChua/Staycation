"use client";

import HavenFormModal from "./HavenFormModal";

interface HavenData {
  uuid_id?: string;
  haven_name?: string;
  tower?: string;
  floor?: string;
  view_type?: string;
  capacity?: number;
  room_size?: number;
  beds?: string;
  description?: string;
  youtube_url?: string;
  six_hour_rate?: number;
  ten_hour_rate?: number;
  weekday_rate?: number;
  weekend_rate?: number;
  six_hour_check_in?: string;
  ten_hour_check_in?: string;
  twenty_one_hour_check_in?: string;
  amenities?: Record<string, boolean>;
  images?: ImageData[];
  photo_tours?: PhotoTourData[];
  blocked_dates?: BlockedDateData[];
  [key: string]: unknown;
}

interface ImageData {
  id?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface PhotoTourData {
  category?: string;
  image_url?: string;
  [key: string]: unknown;
}

interface BlockedDateData {
  from_date: string;
  to_date: string;
  reason?: string;
}

interface EditHavenModalProps {
  isOpen: boolean;
  onClose: () => void;
  havenData: HavenData | null;
}

const EditHavenModal = ({ isOpen, onClose, havenData }: EditHavenModalProps) => {
  if (!isOpen || !havenData) return null;

  return (
    <HavenFormModal 
      isOpen={isOpen} 
      onClose={onClose} 
      initialData={havenData}
    />
  );
};

export default EditHavenModal;