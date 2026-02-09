import { NextRequest, NextResponse } from 'next/server';
import pool from '@/backend/config/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = await pool.connect();

  try {
    console.log('📊 Fetching inventory usage data...');

    // Get Philippine timezone current time
    const nowQuery = await client.query(`SELECT NOW() AT TIME ZONE 'Asia/Manila' as now`);
    const now = nowQuery.rows[0].now;

    console.log('🕐 Philippine time now:', now);

    // First, check if there are any delivered items
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM booking_add_ons
      WHERE status = 'delivered' AND delivered_at IS NOT NULL
    `;
    const checkResult = await client.query(checkQuery);
    console.log('🔍 Total delivered items in database:', checkResult.rows[0].count);

    // Calculate date ranges for today and this week
    const query = `
      WITH date_ranges AS (
        SELECT
          DATE_TRUNC('day', $1::timestamptz) as today_start,
          DATE_TRUNC('day', $1::timestamptz) + INTERVAL '1 day' as today_end,
          DATE_TRUNC('week', $1::timestamptz) as week_start,
          DATE_TRUNC('week', $1::timestamptz) + INTERVAL '1 week' as week_end,
          DATE_TRUNC('week', $1::timestamptz) - INTERVAL '1 week' as last_week_start,
          DATE_TRUNC('week', $1::timestamptz) as last_week_end
      ),
      usage_data AS (
        SELECT
          ba.name,
          -- Used today (in Philippine timezone)
          SUM(CASE
            WHEN ba.delivered_at >= (SELECT today_start FROM date_ranges)
              AND ba.delivered_at < (SELECT today_end FROM date_ranges)
            THEN ba.quantity
            ELSE 0
          END) as used_today,

          -- Used this week (in Philippine timezone)
          SUM(CASE
            WHEN ba.delivered_at >= (SELECT week_start FROM date_ranges)
              AND ba.delivered_at < (SELECT week_end FROM date_ranges)
            THEN ba.quantity
            ELSE 0
          END) as used_week,

          -- Used last week (in Philippine timezone) for trend calculation
          SUM(CASE
            WHEN ba.delivered_at >= (SELECT last_week_start FROM date_ranges)
              AND ba.delivered_at < (SELECT last_week_end FROM date_ranges)
            THEN ba.quantity
            ELSE 0
          END) as used_last_week
        FROM booking_add_ons ba
        WHERE ba.status = 'delivered'
          AND ba.delivered_at IS NOT NULL
        GROUP BY ba.name
        HAVING SUM(ba.quantity) > 0
      )
      SELECT
        COALESCE(inv.item_id::text, CONCAT('addon-', ROW_NUMBER() OVER ())) as item_id,
        COALESCE(inv.item_name, ud.name) as name,
        COALESCE(ud.used_today, 0)::integer as used_today,
        COALESCE(ud.used_week, 0)::integer as used_week,
        COALESCE(ud.used_last_week, 0)::integer as used_last_week,
        -- Determine trend: if this week's usage is greater than last week's, trend is "up", otherwise "down"
        CASE
          WHEN COALESCE(ud.used_week, 0) > COALESCE(ud.used_last_week, 0) THEN 'up'
          ELSE 'down'
        END as trend
      FROM usage_data ud
      LEFT JOIN inventory inv ON LOWER(TRIM(inv.item_name)) = LOWER(TRIM(ud.name))
      WHERE COALESCE(ud.used_today, 0) + COALESCE(ud.used_week, 0) > 0
      ORDER BY ud.used_week DESC NULLS LAST, ud.used_today DESC NULLS LAST
      LIMIT 10
    `;

    const result = await client.query(query, [now]);

    console.log('📈 Usage data fetched:', result.rows.length, 'items');
    if (result.rows.length > 0) {
      console.log('Sample usage data:', result.rows[0]);
    }

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching inventory usage:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
