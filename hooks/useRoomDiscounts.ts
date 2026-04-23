import { useState, useEffect } from "react";
import { RoomDiscount } from "@/app/api/discounts/room-discounts/route";

export interface RoomDiscountsResponse {
  success: boolean;
  data: RoomDiscount[];
  count: number;
}

export const useRoomDiscounts = (havenId: string, userId?: string) => {
  const [data, setData] = useState<RoomDiscountsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!havenId) return;


    const fetchDiscounts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.set('havenId', havenId);
        if (userId) params.set('userId', userId);
        
        const response = await fetch(`/api/discounts/room-discounts?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch room discounts');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch discounts';
        setError(errorMessage);
        console.error('Error fetching room discounts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscounts();
  }, [havenId, userId]);

  return { data, isLoading, error };
};
