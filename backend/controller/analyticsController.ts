import { NextRequest, NextResponse } from 'next/server';
import pool from '../config/db';

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

// Helper function for direct data fetching (non-API)
export async function fetchAnalyticsSummary(period: string = '30'): Promise<AnalyticsSummary> {
  const currentStatsQuery = `
    SELECT
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COUNT(*) as total_bookings,
      COUNT(DISTINCT CASE
        WHEN user_id IS NOT NULL THEN user_id::text
        ELSE guest_email
      END) as new_guests
    FROM booking
    WHERE created_at >= NOW() - INTERVAL '${period} days'
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const previousStatsQuery = `
    SELECT
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COUNT(*) as total_bookings,
      COUNT(DISTINCT CASE
        WHEN user_id IS NOT NULL THEN user_id::text
        ELSE guest_email
      END) as new_guests
    FROM booking
    WHERE created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
      AND created_at < NOW() - INTERVAL '${period} days'
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const occupancyQuery = `
    SELECT
      COUNT(DISTINCT room_name) as total_rooms,
      SUM(
        check_out_date::date - check_in_date::date
      ) as booked_days
    FROM booking
    WHERE created_at >= NOW() - INTERVAL '${period} days'
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const previousOccupancyQuery = `
    SELECT
      SUM(
        check_out_date::date - check_in_date::date
      ) as booked_days
    FROM booking
    WHERE created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
      AND created_at < NOW() - INTERVAL '${period} days'
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
  `;

  const [currentStats, previousStats, occupancyStats, previousOccupancy] = await Promise.all([
    pool.query(currentStatsQuery),
    pool.query(previousStatsQuery),
    pool.query(occupancyQuery),
    pool.query(previousOccupancyQuery)
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

  const guests_change = previous.new_guests > 0
    ? ((current.new_guests - previous.new_guests) / previous.new_guests) * 100
    : 0;

  const total_rooms = parseInt(occupancy.total_rooms) || 4;
  const total_available_days = total_rooms * parseInt(period);
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
    new_guests: parseInt(current.new_guests),
    revenue_change: parseFloat(revenue_change.toFixed(1)),
    bookings_change: parseFloat(bookings_change.toFixed(1)),
    occupancy_change: parseFloat(occupancy_change.toFixed(1)),
    guests_change: parseFloat(guests_change.toFixed(1)),
  };
}

export async function fetchRevenueByRoom(period: string = '30'): Promise<RevenueByRoom[]> {
  const query = `
    SELECT
      room_name,
      COALESCE(SUM(total_amount), 0) as revenue,
      COUNT(*) as bookings
    FROM booking
    WHERE created_at >= NOW() - INTERVAL '${period} days'
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
      AND room_name IS NOT NULL
    GROUP BY room_name
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
      TO_CHAR(created_at, 'Mon') as month,
      EXTRACT(MONTH FROM created_at) as month_num,
      COALESCE(SUM(total_amount), 0) as revenue
    FROM booking
    WHERE created_at >= NOW() - INTERVAL '${months} months'
      AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
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

    // Get current period stats
    const currentStatsQuery = `
      SELECT
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_bookings,
        COUNT(DISTINCT CASE
          WHEN user_id IS NOT NULL THEN user_id::text
          ELSE guest_email
        END) as new_guests
      FROM booking
      WHERE created_at >= NOW() - INTERVAL '${period} days'
        AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
    `;

    // Get previous period stats for comparison
    const previousStatsQuery = `
      SELECT
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_bookings,
        COUNT(DISTINCT CASE
          WHEN user_id IS NOT NULL THEN user_id::text
          ELSE guest_email
        END) as new_guests
      FROM booking
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
        AND created_at < NOW() - INTERVAL '${period} days'
        AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
    `;

    // Get occupancy rate - calculate based on booked days vs total available days
    const occupancyQuery = `
      SELECT
        COUNT(DISTINCT room_name) as total_rooms,
        COUNT(*) as total_bookings,
        SUM(check_out_date::date - check_in_date::date) as booked_days
      FROM booking
      WHERE created_at >= NOW() - INTERVAL '${period} days'
        AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
    `;

    const [currentStats, previousStats, occupancyStats] = await Promise.all([
      pool.query(currentStatsQuery),
      pool.query(previousStatsQuery),
      pool.query(occupancyQuery)
    ]);

    const current = currentStats.rows[0];
    const previous = previousStats.rows[0];
    const occupancy = occupancyStats.rows[0];

    // Calculate percentage changes
    const revenue_change = previous.total_revenue > 0
      ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100
      : 0;

    const bookings_change = previous.total_bookings > 0
      ? ((current.total_bookings - previous.total_bookings) / previous.total_bookings) * 100
      : 0;

    const guests_change = previous.new_guests > 0
      ? ((current.new_guests - previous.new_guests) / previous.new_guests) * 100
      : 0;

    // Calculate occupancy rate
    // Total available room-days = total_rooms * period days
    const total_rooms = parseInt(occupancy.total_rooms) || 4; // Default to 4 rooms if no data
    const total_available_days = total_rooms * parseInt(period);
    const booked_days = parseInt(occupancy.booked_days) || 0;
    const occupancy_rate = total_available_days > 0
      ? (booked_days / total_available_days) * 100
      : 0;

    // For occupancy change, compare with previous period
    const previousOccupancyQuery = `
      SELECT
        SUM(
          check_out_date::date - check_in_date::date
        ) as booked_days
      FROM booking
      WHERE created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
        AND created_at < NOW() - INTERVAL '${period} days'
        AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
    `;

    const previousOccupancy = await pool.query(previousOccupancyQuery);
    const prev_booked_days = parseInt(previousOccupancy.rows[0].booked_days) || 0;
    const prev_occupancy_rate = total_available_days > 0
      ? (prev_booked_days / total_available_days) * 100
      : 0;

    const occupancy_change = prev_occupancy_rate > 0
      ? ((occupancy_rate - prev_occupancy_rate) / prev_occupancy_rate) * 100
      : 0;

    const summary: AnalyticsSummary = {
      total_revenue: parseFloat(current.total_revenue),
      total_bookings: parseInt(current.total_bookings),
      occupancy_rate: parseFloat(occupancy_rate.toFixed(1)),
      new_guests: parseInt(current.new_guests),
      revenue_change: parseFloat(revenue_change.toFixed(1)),
      bookings_change: parseFloat(bookings_change.toFixed(1)),
      occupancy_change: parseFloat(occupancy_change.toFixed(1)),
      guests_change: parseFloat(guests_change.toFixed(1)),
    };

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
        room_name,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as bookings
      FROM booking
      WHERE created_at >= NOW() - INTERVAL '${period} days'
        AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
        AND room_name IS NOT NULL
      GROUP BY room_name
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
        TO_CHAR(created_at, 'Mon') as month,
        EXTRACT(MONTH FROM created_at) as month_num,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM booking
      WHERE created_at >= NOW() - INTERVAL '${months} months'
        AND status IN ('approved', 'confirmed', 'checked-in', 'completed')
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
