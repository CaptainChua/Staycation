'use server';

import pool from '@/backend/config/db';

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
    
    const result = await pool.query(query);
    
    // Map the results according to the requirements
    const mappedHavens = result.rows.map((item: any) => {
      // Transformation: Replace "Room" with "Haven" in haven_name
      const havenName = item.haven_name.replace(/Room/g, 'Haven');
      
      // floor and capacity should be numeric (though floor is VARCHAR(10) in DB, we cast to Number for consistency or keep as string if it contains letters? 
      // The requirement says "Numeric display only". 
      // If floor is "9" or "9th", we should handle it. 
      // Assuming straightforward numeric strings based on example "Floor 9".
      const floorNum = parseInt(item.floor, 10);
      
      return {
        uuid: item.uuid_id,
        haven: havenName,
        tower: item.tower, // Display exactly as stored
        floor: isNaN(floorNum) ? item.floor : floorNum, // Fallback to original string if NaN
        capacity: item.capacity,
        // Pre-formatted string for UI display as requested
        displayString: `${havenName} – ${item.tower} – Floor ${item.floor} – Capacity ${item.capacity}`
      };
    });
    
    return mappedHavens;
  } catch (error) {
    console.error('Error fetching havens for cleaning:', error);
    throw new Error('Failed to fetch havens data');
  }
}
