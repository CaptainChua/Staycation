import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const haven_id = searchParams.get('haven_id');
    
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          ri.report_id,
          ri.haven_id,
          ri.issue_type,
          ri.priority_level,
          ri.specific_location,
          ri.issue_description,
          ri.created_at,
          ri.user_id,
          h.haven_name,
          ARRAY_AGG(
            JSON_BUILD_OBJECT(
              'image_url', rii.image_url,
              'cloudinary_public_id', rii.cloudinary_public_id
            )
          ) as images
        FROM report_issue ri
        LEFT JOIN havens h ON ri.haven_id = h.uuid_id
        LEFT JOIN report_issue_image rii ON ri.report_id = rii.report_id
      `;
      
      const params: (string | number)[] = [];
      
      if (haven_id) {
        query += ' WHERE ri.haven_id = $1';
        params.push(haven_id);
      }
      
      query += ' GROUP BY ri.report_id, ri.haven_id, ri.issue_type, ri.priority_level, ri.specific_location, ri.issue_description, ri.created_at, ri.user_id, h.haven_name';
      query += ' ORDER BY ri.created_at DESC';
      
      const result = await client.query(query, params);
      
      return NextResponse.json({
        success: true,
        data: result.rows
      });
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
