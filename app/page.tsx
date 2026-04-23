import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import pool from '../backend/config/db';

export const metadata: Metadata = {
  title: "Staycation Haven PH | Premium Staycation Experiences",
  description: "Staycation Haven PH - Find your perfect premium rooms and havens for an unforgettable stay",
};

export default async function Home() {
  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected! Current time:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }

  return redirect('/rooms');
}