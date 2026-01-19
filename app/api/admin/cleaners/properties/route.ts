import { NextResponse } from 'next/server';
import pool from '@/backend/config/db';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT id, name, total_units, available_units, latitude, longitude, updated_at
        FROM properties
        ORDER BY name ASC
      `;
      const result = await client.query(query);
      return NextResponse.json(result.rows);
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
