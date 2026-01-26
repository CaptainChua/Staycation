import { NextResponse } from 'next/server';
import pool from '@/backend/config/db';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          uuid_id, 
          haven_name, 
          tower, 
          floor, 
          updated_at
        FROM havens
        ORDER BY haven_name ASC
      `;
      
      const result = await client.query(query);
      
      const havens = result.rows.map((row) => {
        // Format: "Haven 3"
        const name = row.haven_name.replace(/Room/i, 'Haven');
        
        // Format: "Tower A"
        const towerName = row.tower
          .split('-')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
          
        return {
          id: row.uuid_id,
          name: name,
          address: `${towerName}, Floor ${row.floor}`,
          status: 'Available', // Default for now
          lastCleaned: new Date(row.updated_at).toLocaleDateString(),
          nextScheduled: 'Tomorrow' // Mock for now
        };
      });

      return NextResponse.json(havens);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch havens' }, 
      { status: 500 }
    );
  }
}
