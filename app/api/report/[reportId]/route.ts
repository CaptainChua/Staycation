import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { delete_file } from '@/backend/utils/cloudinary';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    if (!reportId) {
      return NextResponse.json(
        { success: false, message: 'Report ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Get all images associated with this report before deleting
      const imagesQuery = `
        SELECT cloudinary_public_id FROM report_issue_image 
        WHERE report_id = $1
      `;
      const imagesResult = await client.query(imagesQuery, [reportId]);

      // Delete the report (this will cascade delete related records)
      const deleteQuery = `
        DELETE FROM report_issue WHERE report_id = $1 RETURNING *
      `;
      const deleteResult = await client.query(deleteQuery, [reportId]);

      if (deleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Report not found' },
          { status: 404 }
        );
      }

      // Delete images from Cloudinary
      const deletePromises: Promise<boolean>[] = [];
      for (const img of imagesResult.rows) {
        if (img.cloudinary_public_id) {
          deletePromises.push(delete_file(img.cloudinary_public_id));
        }
      }

      // Wait for all Cloudinary deletions to complete
      await Promise.all(deletePromises);

      // Commit transaction
      await client.query('COMMIT');

      console.log(`✅ Report ${reportId} deleted successfully`);

      return NextResponse.json({
        success: true,
        message: 'Report deleted successfully',
        data: deleteResult.rows[0]
      });

    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
