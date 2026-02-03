export interface Haven {
  id?: number;
  uuid_id?: string;
  haven_name: string;
  tower: string;
  floor: string;
  view_type: string;
  capacity: number;
  room_size: number;
  beds: string;
  description: string;
  youtube_url?: string;
  six_hour_rate: number;
  ten_hour_rate: number;
  weekday_rate: number;
  weekend_rate: number;
  six_hour_check_in?: string;
  six_hour_check_out?: string;
  ten_hour_check_in?: string;
  ten_hour_check_out?: string;
  twenty_one_hour_check_in?: string;
  twenty_one_hour_check_out?: string;
  amenities?: any;
  created_at?: string;
  updated_at?: string;
}