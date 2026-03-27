import { NextRequest, NextResponse } from 'next/server';
import pool from '../config/db';

const BOOKING_TABLE = (() => {
  const raw = (process.env.BOOKING_TABLE_NAME || "booking").trim();
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(raw)) return raw;
  console.warn("Invalid BOOKING_TABLE_NAME, defaulting to 'booking'");
  return "booking";
})();

export interface AnalyticsSummary {
  total_revenue: number;
  total_bookings: number;
  occupancy_rate: number;
  new_guests: number;
  revenue_change: number;
  bookings_change: number;
  occupancy_change: number;
  guests_change: number;
}

export interface RevenueByRoom {
  room_name: string;
  revenue: number;
  bookings: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

function parseWindow(value: string, fallback: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = $1
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ) AS exists
    `,
    [tableName]
  );

  return Boolean(result.rows[0]?.exists);
}

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1
          AND column_name = $2
          AND table_schema NOT IN ('pg_catalog', 'information_schema')
      ) AS exists
    `,
    [tableName, columnName]
  );

  return Boolean(result.rows[0]?.exists);
}

async function fetchGuestCount(periodDays: number, offsetDays = 0): Promise<number> {
  const hasUserId = await columnExists(BOOKING_TABLE, 'user_id');

  if (hasUserId) {
    const result = await pool.query(
      `
        SELECT COUNT(DISTINCT b.user_id) AS new_guests
        FROM ${BOOKING_TABLE} b
        WHERE b.created_at >= NOW() - ($1 || ' days')::interval
          AND b.created_at < NOW() - ($2 || ' days')::interval
          AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
          AND b.user_id IS NOT NULL
      `,
      [periodDays + offsetDays, offsetDays]
    );

    return Number.parseInt(result.rows[0]?.new_guests ?? '0', 10) || 0;
  }

  const hasBookingGuests = await tableExists('booking_guests');

  if (hasBookingGuests) {
    const result = await pool.query(
      `
        SELECT COUNT(DISTINCT bg.email) AS new_guests
        FROM ${BOOKING_TABLE} b
        INNER JOIN booking_guests bg ON bg.booking_id = b.id
        WHERE b.created_at >= NOW() - ($1 || ' days')::interval
          AND b.created_at < NOW() - ($2 || ' days')::interval
          AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
          AND bg.email IS NOT NULL
          AND bg.email <> ''
      `,
      [periodDays + offsetDays, offsetDays]
    );

    return Number.parseInt(result.rows[0]?.new_guests ?? '0', 10) || 0;
  }

  const result = await pool.query(
    `
      SELECT COUNT(DISTINCT b.id) AS new_guests
      FROM ${BOOKING_TABLE} b
      WHERE b.created_at >= NOW() - ($1 || ' days')::interval
        AND b.created_at < NOW() - ($2 || ' days')::interval
        AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
    `,
    [periodDays + offsetDays, offsetDays]
  );

  return Number.parseInt(result.rows[0]?.new_guests ?? '0', 10) || 0;
}

// Helper function for direct data fetching (non-API)
export async function fetchAnalyticsSummary(period: string = '30'): Promise<AnalyticsSummary> {
  const safePeriod = parseWindow(period, 30, 365);

  const currentStatsQuery = `
    SELECT
      COALESCE(SUM(CASE
        WHEN bp.payment_status IN ('approved_down_payment', 'pending_down_payment') THEN bp.down_payment
        WHEN bp.payment_status = 'approved_full_payment' THEN bp.total_amount
        WHEN bp.payment_status IS NULL THEN bp.down_payment
        ELSE 0
      END), 0) as total_revenue,
      COUNT(DISTINCT b.id) as total_bookings
    FROM ${BOOKING_TABLE} b
    LEFT JOIN booking_payments bp ON b.id = bp.booking_id
    WHERE b.created_at >= NOW() - ($1 || ' days')::interval
      AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const previousStatsQuery = `
    SELECT
      COALESCE(SUM(CASE
        WHEN bp.payment_status IN ('approved_down_payment', 'pending_down_payment') THEN bp.down_payment
        WHEN bp.payment_status = 'approved_full_payment' THEN bp.total_amount
        WHEN bp.payment_status IS NULL THEN bp.down_payment
        ELSE 0
      END), 0) as total_revenue,
      COUNT(DISTINCT b.id) as total_bookings
    FROM ${BOOKING_TABLE} b
    LEFT JOIN booking_payments bp ON b.id = bp.booking_id
    WHERE b.created_at >= NOW() - ($1 || ' days')::interval
      AND b.created_at < NOW() - ($2 || ' days')::interval
      AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const occupancyQuery = `
    SELECT
      COUNT(DISTINCT room_name) as total_rooms,
      SUM(
        check_out_date::date - check_in_date::date
      ) as booked_days
    FROM ${BOOKING_TABLE}
    WHERE created_at >= NOW() - ($1 || ' days')::interval
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const previousOccupancyQuery = `
    SELECT
      SUM(
        check_out_date::date - check_in_date::date
      ) as booked_days
    FROM ${BOOKING_TABLE}
    WHERE created_at >= NOW() - ($1 || ' days')::interval
      AND created_at < NOW() - ($2 || ' days')::interval
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const [currentStats, previousStats, occupancyStats, previousOccupancy, currentGuests, previousGuests] = await Promise.all([
    pool.query(currentStatsQuery, [safePeriod]),
    pool.query(previousStatsQuery, [safePeriod * 2, safePeriod]),
    pool.query(occupancyQuery, [safePeriod]),
    pool.query(previousOccupancyQuery, [safePeriod * 2, safePeriod]),
    fetchGuestCount(safePeriod),
    fetchGuestCount(safePeriod, safePeriod)
  ]);

  const current = currentStats.rows[0];
  const previous = previousStats.rows[0];
  const occupancy = occupancyStats.rows[0];

  const revenue_change = previous.total_revenue > 0
    ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100
    : 0;

  const bookings_change = previous.total_bookings > 0
    ? ((current.total_bookings - previous.total_bookings) / previous.total_bookings) * 100
    : 0;

  const guests_change = previousGuests > 0
    ? ((currentGuests - previousGuests) / previousGuests) * 100
    : 0;

  const total_rooms = parseInt(occupancy.total_rooms) || 4;
  const total_available_days = total_rooms * safePeriod;
  const booked_days = parseInt(occupancy.booked_days) || 0;
  const occupancy_rate = total_available_days > 0
    ? (booked_days / total_available_days) * 100
    : 0;

  const prev_booked_days = parseInt(previousOccupancy.rows[0].booked_days) || 0;
  const prev_occupancy_rate = total_available_days > 0
    ? (prev_booked_days / total_available_days) * 100
    : 0;

  const occupancy_change = prev_occupancy_rate > 0
    ? ((occupancy_rate - prev_occupancy_rate) / prev_occupancy_rate) * 100
    : 0;

  return {
    total_revenue: parseFloat(current.total_revenue),
    total_bookings: parseInt(current.total_bookings),
    occupancy_rate: parseFloat(occupancy_rate.toFixed(1)),
    new_guests: currentGuests,
    revenue_change: parseFloat(revenue_change.toFixed(1)),
    bookings_change: parseFloat(bookings_change.toFixed(1)),
    occupancy_change: parseFloat(occupancy_change.toFixed(1)),
    guests_change: parseFloat(guests_change.toFixed(1)),
  };
}

export async function fetchRevenueByRoom(period: string = '30'): Promise<RevenueByRoom[]> {
  const query = `
    SELECT
      b.room_name,
      COALESCE(SUM(CASE
        WHEN bp.payment_status = 'approved_down_payment' THEN bp.down_payment
        WHEN bp.payment_status = 'approved_full_payment' THEN bp.total_amount
        ELSE 0
      END), 0) as revenue,
      COUNT(DISTINCT b.id) as bookings
    FROM ${BOOKING_TABLE} b
    LEFT JOIN booking_payments bp ON b.id = bp.booking_id
    WHERE b.created_at >= NOW() - INTERVAL '${period} days'
      AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
      AND b.room_name IS NOT NULL
    GROUP BY b.room_name
    ORDER BY revenue DESC
  `;

  const result = await pool.query(query);

  return result.rows.map((row: any) => ({
    room_name: row.room_name,
    revenue: parseFloat(row.revenue),
    bookings: parseInt(row.bookings),
  }));
}

export async function fetchMonthlyRevenue(months: string = '6'): Promise<MonthlyRevenue[]> {
  const query = `
    SELECT
      TO_CHAR(b.check_in_date, 'Mon') as month,
      EXTRACT(MONTH FROM b.check_in_date) as month_num,
      COALESCE(SUM(CASE
        WHEN bp.payment_status = 'approved_down_payment' THEN bp.down_payment
        WHEN bp.payment_status = 'approved_full_payment' THEN bp.total_amount
        ELSE 0
      END), 0) as revenue
    FROM ${BOOKING_TABLE} b
    LEFT JOIN booking_payments bp ON b.id = bp.booking_id
    WHERE b.check_in_date >= NOW() - INTERVAL '${months} months'
      AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
    GROUP BY month, month_num
    ORDER BY month_num ASC
  `;

  const result = await pool.query(query);

  return result.rows.map((row: any) => ({
    month: row.month,
    revenue: parseFloat(row.revenue),
  }));
}

// GET Analytics Summary Stats
export const getAnalyticsSummary = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const summary = await fetchAnalyticsSummary(period);

    console.log('✅ Analytics Summary:', summary);

    return NextResponse.json({
      success: true,
      data: summary,
    });

  } catch (error: any) {
    console.log('❌ Error getting analytics summary:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get analytics summary',
    }, { status: 500 });
  }
};

// GET Revenue by Room/Haven
export const getRevenueByRoom = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days

    const query = `
      SELECT
        b.room_name,
        COALESCE(SUM(CASE
          WHEN bp.payment_status IN ('approved_down_payment', 'pending_down_payment') THEN bp.down_payment
          WHEN bp.payment_status = 'approved_full_payment' THEN bp.total_amount
          WHEN bp.payment_status IS NULL THEN bp.down_payment
          ELSE 0
        END), 0) as revenue,
        COUNT(DISTINCT b.id) as bookings
      FROM ${BOOKING_TABLE} b
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      WHERE b.created_at >= NOW() - INTERVAL '${period} days'
        AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
        AND b.room_name IS NOT NULL
      GROUP BY b.room_name
      ORDER BY revenue DESC
    `;

    const result = await pool.query(query);

    const revenueByRoom: RevenueByRoom[] = result.rows.map((row: any) => ({
      room_name: row.room_name,
      revenue: parseFloat(row.revenue),
      bookings: parseInt(row.bookings),
    }));

    console.log(`✅ Retrieved revenue by room: ${revenueByRoom.length} rooms`);

    return NextResponse.json({
      success: true,
      data: revenueByRoom,
    });

  } catch (error: any) {
    console.log('❌ Error getting revenue by room:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get revenue by room',
    }, { status: 500 });
  }
};

// GET Monthly Revenue Trend
export const getMonthlyRevenue = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const months = searchParams.get('months') || '6'; // number of months

    const query = `
      SELECT
        TO_CHAR(b.check_in_date, 'Mon') as month,
        EXTRACT(MONTH FROM b.check_in_date) as month_num,
        COALESCE(SUM(CASE
          WHEN bp.payment_status IN ('approved_down_payment', 'pending_down_payment') THEN bp.down_payment
          WHEN bp.payment_status = 'approved_full_payment' THEN bp.total_amount
          WHEN bp.payment_status IS NULL THEN bp.down_payment
          ELSE 0
        END), 0) as revenue
      FROM ${BOOKING_TABLE} b
      LEFT JOIN booking_payments bp ON b.id = bp.booking_id
      WHERE b.check_in_date >= NOW() - INTERVAL '${months} months'
        AND b.status IN ('approved', 'confirmed', 'checked-in', 'completed')
      GROUP BY month, month_num
      ORDER BY month_num ASC
    `;

    const result = await pool.query(query);

    const monthlyRevenue: MonthlyRevenue[] = result.rows.map((row: any) => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
    }));

    console.log(`✅ Retrieved monthly revenue: ${monthlyRevenue.length} months`);

    return NextResponse.json({
      success: true,
      data: monthlyRevenue,
    });

  } catch (error: any) {
    console.log('❌ Error getting monthly revenue:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get monthly revenue',
    }, { status: 500 });
  }
};
