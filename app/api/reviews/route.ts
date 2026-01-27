import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Debug: Log the received data
    console.log('Received review data:', body);
    
    const {
      booking_id,
      haven_id,
      user_id,
      guest_first_name,
      guest_last_name,
      guest_email,
      comment,
      cleanliness_rating,
      communication_rating,
      checkin_rating,
      accuracy_rating,
      location_rating,
      value_rating,
      is_public,
      is_verified
    } = body;

    // Validate required fields
    if (!booking_id || !haven_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: booking_id and haven_id' },
        { status: 400 }
      );
    }

    // Fetch guest information from booking_guests table
    let guestInfo;
    try {
      console.log('Fetching guest info for booking_id:', booking_id);
      const guestQuery = `
        SELECT first_name, last_name, email, phone
        FROM booking_guests
        WHERE booking_id = $1
        LIMIT 1
      `;
      const guestResult = await pool.query(guestQuery, [booking_id]);
      
      console.log('Guest query result:', guestResult.rows);
      
      if (guestResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Guest information not found for this booking' },
          { status: 400 }
        );
      }
      
      guestInfo = guestResult.rows[0];
    } catch (error) {
      console.error('Error fetching guest info:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { success: false, error: `Failed to fetch guest information: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Check if at least one rating is provided
    const ratings = [
      cleanliness_rating,
      communication_rating,
      checkin_rating,
      accuracy_rating,
      location_rating,
      value_rating
    ].filter(rating => rating !== null && rating !== undefined);

    if (ratings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one rating must be provided' },
        { status: 400 }
      );
    }

    // Validate rating values
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Direct SQL insertion instead of using function
    const values = [
      booking_id,
      haven_id,
      user_id || null,
      guestInfo.first_name,
      guestInfo.last_name,
      guestInfo.email,
      comment || null,
      cleanliness_rating || null,
      communication_rating || null,
      checkin_rating || null,
      accuracy_rating || null,
      location_rating || null,
      value_rating || null,
      is_public !== undefined ? is_public : true,
      is_verified !== undefined ? is_verified : false
    ];

    console.log('Inserting review with values:', values);

    const insertQuery = `
      INSERT INTO reviews (
        booking_id,
        haven_id,
        user_id,
        guest_first_name,
        guest_last_name,
        guest_email,
        comment,
        cleanliness_rating,
        communication_rating,
        checkin_rating,
        accuracy_rating,
        location_rating,
        value_rating,
        is_public,
        is_verified,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'published'
      )
      RETURNING id, overall_rating
    `;

    const result = await pool.query(insertQuery, values);
    const insertedReview = result.rows[0];
    
    console.log('Review inserted successfully:', insertedReview);

    return NextResponse.json({
      success: true,
      review_id: insertedReview.id,
      overall_rating: insertedReview.overall_rating,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const haven_id = searchParams.get('haven_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!haven_id) {
      return NextResponse.json(
        { success: false, error: 'haven_id is required' },
        { status: 400 }
      );
    }

    // Get reviews for a specific haven
    const query = `
      SELECT 
        r.id,
        r.booking_id,
        r.guest_first_name,
        r.guest_last_name,
        r.guest_email,
        r.comment,
        r.cleanliness_rating,
        r.communication_rating,
        r.checkin_rating,
        r.accuracy_rating,
        r.location_rating,
        r.value_rating,
        r.overall_rating,
        r.is_verified,
        r.is_featured,
        r.created_at,
        b.check_in_date,
        b.check_out_date
      FROM reviews r
      JOIN booking b ON r.booking_id = b.id
      WHERE r.haven_id = $1::uuid
        AND r.is_public = true
        AND r.status = 'published'
      ORDER BY 
        r.is_featured DESC,
        r.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [haven_id, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      WHERE r.haven_id = $1::uuid
        AND r.is_public = true
        AND r.status = 'published'
    `;

    const countResult = await pool.query(countQuery, [haven_id]);
    const totalReviews = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      reviews: result.rows,
      total: totalReviews,
      hasMore: offset + limit < totalReviews
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
