import { NextResponse } from 'next/server';
import pool from '@/backend/config/db';

interface TowerData {
  id: string;
  name: string;
  total_units: number;
  available_units: number;
  latitude: number;
  longitude: number;
  updated_at: Date;
}

// Mock coordinates for known towers
const TOWER_COORDS: Record<string, { lat: number; lng: number }> = {
  'tower-a': { lat: 14.6760, lng: 121.0437 },
  'tower-b': { lat: 14.6762, lng: 121.0440 },
  'tower-c': { lat: 14.6758, lng: 121.0442 },
  'tower-d': { lat: 14.6755, lng: 121.0435 },
};

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          tower,
          COUNT(*) as total_units,
          MAX(updated_at) as last_updated
        FROM havens
        GROUP BY tower
        ORDER BY tower ASC
      `;
      
      const result = await client.query(query);
      
      const towers: TowerData[] = result.rows.map((row) => {
        const towerKey = row.tower.toLowerCase();
        const coords = TOWER_COORDS[towerKey] || { lat: 14.6760, lng: 121.0437 }; // Default coord
        
        // Format tower name "tower-a" -> "Tower A"
        const name = row.tower
          .split('-')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        return {
          id: row.tower,
          name: name,
          total_units: parseInt(row.total_units),
          available_units: parseInt(row.total_units), // Assuming all available for now
          latitude: coords.lat,
          longitude: coords.lng,
          updated_at: row.last_updated
        };
      });

      return NextResponse.json(towers);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' }, 
      { status: 500 }
    );
  }
}