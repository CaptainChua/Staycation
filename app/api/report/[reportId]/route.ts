import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { delete_file } from '@/backend/utils/cloudinary';
import { upload_image_from_form } from '@/backend/utils/fileUpload';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PATCH(
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

    const formData = await request.formData();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current report to check status
      const currentReportQuery = `SELECT status FROM report_issue WHERE report_id = $1`;
      const currentReportResult = await client.query(currentReportQuery, [reportId]);

      if (currentReportResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Report not found' },
          { status: 404 }
        );
      }

      const currentStatus = currentReportResult.rows[0].status;
      
      // Only allow editing if status is "Open" or "Pending"
      if (currentStatus !== 'Open' && currentStatus !== 'Pending') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'Only reports with Open or Pending status can be edited' },
          { status: 403 }
        );
      }

      // Build update query dynamically based on provided fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (formData.has('haven_id')) {
        updateFields.push(`haven_id = $${paramIndex++}`);
        updateValues.push(formData.get('haven_id'));
      }
      if (formData.has('issue_type')) {
        updateFields.push(`issue_type = $${paramIndex++}`);
        updateValues.push(formData.get('issue_type'));
      }
      if (formData.has('priority_level')) {
        updateFields.push(`priority_level = $${paramIndex++}`);
        updateValues.push(formData.get('priority_level'));
      }
      if (formData.has('specific_location')) {
        updateFields.push(`specific_location = $${paramIndex++}`);
        updateValues.push(formData.get('specific_location'));
      }
      if (formData.has('issue_description')) {
        updateFields.push(`issue_description = $${paramIndex++}`);
        updateValues.push(formData.get('issue_description'));
      }

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, message: 'No fields to update' },
          { status: 400 }
        );
      }

      // Add report_id to values
      updateValues.push(reportId);
      const updateQuery = `
        UPDATE report_issue 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE report_id = $${paramIndex}
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, updateValues);

      // Handle image uploads if any
      const imageFiles: File[] = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
          imageFiles.push(value);
        }
      }

      if (imageFiles.length > 0) {
        // Upload new images to Cloudinary
        for (const imageFile of imageFiles) {
          try {
            const uploadResult = await upload_image_from_form(
              imageFile,
              `staycation-haven/reports/${reportId}`
            );
            
            if (uploadResult.success && uploadResult.public_id && uploadResult.secure_url) {
              // Insert image record
              await client.query(
                `INSERT INTO report_issue_image (report_id, image_url, cloudinary_public_id) 
                 VALUES ($1, $2, $3)`,
                [reportId, uploadResult.secure_url, uploadResult.public_id]
              );
            }
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            // Continue with other images even if one fails
          }
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Report updated successfully',
        data: updateResult.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

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
