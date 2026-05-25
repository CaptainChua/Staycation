import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireAdmin } from '@/backend/utils/requireAdmin';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_CATEGORIES = [
  { name: '6-Hour Booking',          duration_hours: 6,  price: 999,  first_check_in: '08:00', last_check_in: '17:00', sort_order: 1, available_days: '[0,1,2,3,4,5]' },
  { name: '10-Hour Booking',         duration_hours: 10, price: 1599, first_check_in: '08:00', last_check_in: '14:00', sort_order: 2, available_days: '[0,1,2,3,4,5]' },
  { name: '21-Hour Booking (Weekday)', duration_hours: 21, price: 1799, first_check_in: '08:00', last_check_in: '08:00', sort_order: 3, available_days: '[0,1,2,3,4]' },
  { name: '21-Hour Booking (Weekend)', duration_hours: 21, price: 2099, first_check_in: '00:00', last_check_in: '18:00', sort_order: 4, available_days: '[5,6]' },
];

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS booking_time_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      duration_hours INTEGER NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      first_check_in TIME NOT NULL DEFAULT '08:00',
      last_check_in  TIME NOT NULL DEFAULT '18:00',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE booking_time_categories ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE booking_time_categories ADD COLUMN IF NOT EXISTS available_days TEXT DEFAULT NULL`);

  // Backfill prices for rows that still have price = 0
  await pool.query(`
    UPDATE booking_time_categories SET price = CASE
      WHEN duration_hours = 6  THEN 999
      WHEN duration_hours = 10 THEN 1599
      WHEN duration_hours = 21 AND (name ILIKE '%weekday%') THEN 1799
      WHEN duration_hours = 21 THEN 2099
      ELSE price
    END
    WHERE price = 0
  `);

  // Rename bare "21-Hour Booking" → "(Weekday)" and fix its price
  await pool.query(`
    UPDATE booking_time_categories
    SET name = '21-Hour Booking (Weekday)', price = 1799, available_days = '[0,1,2,3,4]'
    WHERE duration_hours = 21 AND name = '21-Hour Booking'
  `);

  // Fix any remaining weekday 21-hour that still has the wrong price
  await pool.query(`
    UPDATE booking_time_categories
    SET price = 1799
    WHERE duration_hours = 21 AND name ILIKE '%weekday%' AND price = 2099
  `);

  // Insert the weekend 21-hour category if it doesn't exist yet
  await pool.query(`
    INSERT INTO booking_time_categories (name, duration_hours, price, first_check_in, last_check_in, available_days, sort_order)
    SELECT '21-Hour Booking (Weekend)', 21, 2099, '00:00', '18:00', '[5,6]',
           COALESCE((SELECT MAX(sort_order) FROM booking_time_categories), 0) + 1
    WHERE NOT EXISTS (
      SELECT 1 FROM booking_time_categories WHERE duration_hours = 21 AND name ILIKE '%weekend%'
    )
  `);

  // Backfill available_days for any rows still missing them
  await pool.query(`
    UPDATE booking_time_categories SET available_days = CASE
      WHEN duration_hours = 6  THEN '[0,1,2,3,4,5]'
      WHEN duration_hours = 10 THEN '[0,1,2,3,4,5]'
      WHEN duration_hours = 21 AND name ILIKE '%weekday%' THEN '[0,1,2,3,4]'
      WHEN duration_hours = 21 AND name ILIKE '%weekend%' THEN '[5,6]'
      ELSE NULL
    END
    WHERE available_days IS NULL
  `);
}

function formatRow(row: any) {
  let availableDays: number[] | null = null;
  if (row.available_days) {
    try { availableDays = JSON.parse(row.available_days); } catch { availableDays = null; }
  }
  return {
    id: row.id,
    name: row.name,
    duration_hours: row.duration_hours,
    price: row.price ?? 0,
    first_check_in: (row.first_check_in as string)?.slice(0, 5) ?? '08:00',
    last_check_in:  (row.last_check_in  as string)?.slice(0, 5) ?? '18:00',
    available_days: availableDays,
    sort_order: row.sort_order,
  };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    await ensureTable();

    let result = await pool.query(
      'SELECT * FROM booking_time_categories ORDER BY sort_order, id'
    );

    if (result.rows.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await pool.query(
          `INSERT INTO booking_time_categories (name, duration_hours, price, first_check_in, last_check_in, available_days, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [cat.name, cat.duration_hours, cat.price, cat.first_check_in, cat.last_check_in, cat.available_days, cat.sort_order]
        );
      }
      result = await pool.query(
        'SELECT * FROM booking_time_categories ORDER BY sort_order, id'
      );
    }

    return NextResponse.json({ success: true, data: result.rows.map(formatRow) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const client = await pool.connect();
  try {
    await ensureTable();

    const body = await request.json();
    const { categories } = body as { categories: Array<{
      name: string; duration_hours: number; price: number;
      first_check_in: string; last_check_in: string; available_days?: number[] | null;
    }> };

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one category is required' }, { status: 400 });
    }

    await client.query('BEGIN');
    await client.query('DELETE FROM booking_time_categories');

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const daysJson = cat.available_days != null ? JSON.stringify(cat.available_days) : null;
      await client.query(
        `INSERT INTO booking_time_categories (name, duration_hours, price, first_check_in, last_check_in, available_days, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cat.name, cat.duration_hours, cat.price ?? 0, cat.first_check_in, cat.last_check_in, daysJson, i + 1]
      );
    }

    // Keep havens columns in sync for backward compat
    const sixHour       = categories.find(c => c.duration_hours === 6);
    const tenHour       = categories.find(c => c.duration_hours === 10);
    const twentyOneHour = categories.find(c => c.duration_hours === 21);

    await client.query(`
      UPDATE havens SET
        six_hour_check_in         = COALESCE($1, six_hour_check_in),
        six_hour_check_out        = COALESCE($2, six_hour_check_out),
        ten_hour_check_in         = COALESCE($3, ten_hour_check_in),
        ten_hour_check_out        = COALESCE($4, ten_hour_check_out),
        twenty_one_hour_check_in  = COALESCE($5, twenty_one_hour_check_in),
        twenty_one_hour_check_out = COALESCE($6, twenty_one_hour_check_out),
        updated_at = NOW()
    `, [
      sixHour?.first_check_in       ?? null,
      sixHour?.last_check_in        ?? null,
      tenHour?.first_check_in       ?? null,
      tenHour?.last_check_in        ?? null,
      twentyOneHour?.first_check_in ?? null,
      twentyOneHour?.last_check_in  ?? null,
    ]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Booking settings saved' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
