import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { upload_image_from_form } from '@/backend/utils/fileUpload';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const haven_id = formData.get('haven_id') as string;
    const issue_type = formData.get('issue_type') as string;
    const priority_level = formData.get('priority_level') as string;
    const specific_location = formData.get('specific_location') as string;
    const issue_description = formData.get('issue_description') as string;
    
    // Validate required fields
    if (!haven_id || !issue_type || !priority_level || !specific_location || !issue_description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate priority level
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    if (!validPriorities.includes(priority_level)) {
      return NextResponse.json(
        { success: false, message: 'Invalid priority level' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Insert the report
      const reportQuery = `
        INSERT INTO report_issue (haven_id, issue_type, priority_level, specific_location, issue_description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING report_id, haven_id, issue_type, priority_level, specific_location, issue_description, created_at
      `;
      
      const reportResult = await client.query(reportQuery, [
        haven_id,
        issue_type,
        priority_level,
        specific_location,
        issue_description
      ]);
      
      const newReport = reportResult.rows[0];
      
      // Handle image uploads if any
      const imageFiles: File[] = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_') && value instanceof File) {
          imageFiles.push(value);
        }
      }
      
      // Upload images to Cloudinary and store in database
      if (imageFiles.length > 0) {
        console.log(`Uploading ${imageFiles.length} images for report ${newReport.report_id}`);
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          
          try {
            // Upload to Cloudinary using the utility function
            const uploadResult = await upload_image_from_form(
              file,
              `staycation-haven/reports/${newReport.report_id}`
            );
            
            // Store in database
            const imageQuery = `
              INSERT INTO report_issue_image (report_id, image_url, cloudinary_public_id)
              VALUES ($1, $2, $3)
            `;
            
            await client.query(imageQuery, [
              newReport.report_id,
              uploadResult.url,
              uploadResult.public_id
            ]);
            
            console.log(`✅ Uploaded image ${i + 1}: ${uploadResult.public_id}`);
            
          } catch (uploadError) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
            throw new Error(`Failed to upload image ${i + 1}: ${uploadError}`);
          }
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'Report submitted successfully',
        data: newReport
      });
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
