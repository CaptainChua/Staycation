'use server';

import pool from '@/backend/config/db';

export interface HavenData {
  uuid_id: string;
  haven_name: string;
  tower: string;
  floor: string;
  capacity: number;
}

export interface MappedHaven {
  uuid: string;
  haven: string;
  tower: string;
  floor: number;
  capacity: number;
  displayString: string;
}

export async function getHavensForCleaning(): Promise<MappedHaven[]> {
  try {
    const query = `
      SELECT uuid_id, haven_name, tower, floor, capacity 
      FROM havens
      ORDER BY haven_name ASC
    `;
    
    const result = await pool.query<HavenData>(query);
    
    // Map the results according to the requirements
    const mappedHavens = result.rows.map((item: HavenData) => {
      // Transformation: Replace "Room" with "Haven" in haven_name
      const havenName = item.haven_name.replace(/Room/g, 'Haven');
      
      // Tower transformation logic: tower-a → Tower A
      const towerName = item.tower
        .split('-')
        .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      
      // floor and capacity should be numeric
      const floorNum = parseInt(item.floor, 10);
      
      return {
        uuid: item.uuid_id,
        haven: havenName,
        tower: towerName,
        floor: isNaN(floorNum) ? 0 : floorNum,
        capacity: item.capacity,
        // Pre-formatted string for UI display as requested
        displayString: `${havenName} – ${towerName} – Floor ${item.floor} – Capacity ${item.capacity}`
      };
    });
    
    return mappedHavens;
  } catch (error: unknown) {
    console.error('Error fetching havens for cleaning:', error);
    throw new Error('Failed to fetch havens data');
  }
}