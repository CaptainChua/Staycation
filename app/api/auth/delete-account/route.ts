import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import pool from '@/backend/config/db';

/**
 * DELETE /api/auth/delete-account
 * Delete the user account completely from the database
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('❌ Delete account: No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    console.log('🔴 Attempting to delete account for user:', userId);

    if (!userId) {
      console.log('❌ Delete account: No user ID found');
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Start transaction to delete all user-related data
    try {
      // Delete user's bookings first (if any foreign keys exist)
      console.log('🔄 Deleting user bookings for user_id:', userId);
      try {
        const bookingResult = await pool.query(
          'DELETE FROM bookings WHERE user_id = $1',
          [userId]
        );
        console.log('✅ Bookings deleted:', bookingResult.rowCount, 'rows');
      } catch (err: unknown) {
        const error = err as { message?: string; code?: string };
        console.log('⚠️ Bookings deletion error (may not exist):', error?.message);
      }

      // Delete user's wishlist items
      console.log('🔄 Deleting wishlist items for user_id:', userId);
      try {
        const wishlistResult = await pool.query(
          'DELETE FROM wishlist WHERE user_id = $1',
          [userId]
        );
        console.log('✅ Wishlist deleted:', wishlistResult.rowCount, 'rows');
      } catch (err: unknown) {
        const error = err as { message?: string; code?: string };
        console.log('⚠️ Wishlist deletion error (may not exist):', error?.message);
      }

      // Delete user's reviews
      console.log('🔄 Deleting reviews for user_id:', userId);
      try {
        const reviewResult = await pool.query(
          'DELETE FROM reviews WHERE user_id = $1',
          [userId]
        );
        console.log('✅ Reviews deleted:', reviewResult.rowCount, 'rows');
      } catch (err: unknown) {
        const error = err as { message?: string; code?: string };
        console.log('⚠️ Reviews deletion error (may not exist):', error?.message);
      }

      // Delete user's messages
      console.log('🔄 Deleting messages for user_id:', userId);
      try {
        const messageResult = await pool.query(
          'DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1',
          [userId, userId]
        );
        console.log('✅ Messages deleted:', messageResult.rowCount, 'rows');
      } catch (err: unknown) {
        const error = err as { message?: string; code?: string };
        console.log('⚠️ Messages deletion error (may not exist):', error?.message);
      }

      // Delete user's activity logs
      console.log('🔄 Deleting activity logs for user_id:', userId);
      try {
        const logResult = await pool.query(
          'DELETE FROM user_activity_logs WHERE user_id = $1',
          [userId]
        );
        console.log('✅ Activity logs deleted:', logResult.rowCount, 'rows');
      } catch (err: unknown) {
        const error = err as { message?: string; code?: string };
        console.log('⚠️ Activity logs deletion error (may not exist):', error?.message);
      }

      // Finally delete the user account
      console.log('🔄 Deleting user account for user_id:', userId);
      const result = await pool.query(
        'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
        [userId]
      );

      if (result.rows.length === 0) {
        console.log('❌ User not found for deletion');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      console.log('✅ User account successfully deleted:', userId);
      console.log('🔴 Account deletion complete - user banished from database');

      return NextResponse.json(
        { success: true, message: 'Account deleted successfully' },
        { status: 200 }
      );
    } catch (dbError: unknown) {
      const error = dbError as { message?: string; code?: string; detail?: string };
      console.error('❌ Database error during account deletion:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        detail: error?.detail
      });
      
      return NextResponse.json(
        { error: 'Failed to delete account', details: error?.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in delete account endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
