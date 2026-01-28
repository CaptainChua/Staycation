import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { upload_image_from_form } from '@/backend/utils/fileUpload';
import { createNotificationsForRoles } from '@/backend/utils/notificationHelper';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  console.log('🚀 Report submission API called');
  
  try {
    const formData = await request.formData();
    console.log('📝 Form data received:', formData);
    
    // Extract form fields
    const haven_id = formData.get('haven_id') as string;
    const issue_type = formData.get('issue_type') as string;
    const priority_level = formData.get('priority_level') as string;
    const specific_location = formData.get('specific_location') as string;
    const issue_description = formData.get('issue_description') as string;
    const user_id = formData.get('user_id') as string;
    
    console.log('📋 Extracted fields:', { haven_id, issue_type, priority_level, specific_location, issue_description: issue_description?.substring(0, 50) + '...', user_id });
    
    // Validate required fields
    if (!haven_id || !issue_type || !priority_level || !specific_location || !issue_description || !user_id) {
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
      
      // Insert report
      console.log('🔍 Inserting report with data:', { haven_id, issue_type, priority_level, specific_location, issue_description: issue_description?.substring(0, 50) + '...', user_id });
      
      const reportQuery = `
        INSERT INTO report_issue (haven_id, issue_type, priority_level, specific_location, issue_description, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING report_id, haven_id, issue_type, priority_level, specific_location, issue_description, created_at, user_id
      `;
      
      const reportResult = await client.query(reportQuery, [
        haven_id,
        issue_type,
        priority_level,
        specific_location,
        issue_description,
        user_id
      ]);
      
      const newReport = reportResult.rows[0];
      console.log('✅ Report inserted successfully:', newReport);
      
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
      
      // Create notifications for all Owner and CSR role employees
      await createNotificationsForRoles(['Owner', 'CSR'], {
        title: `New Issue Report: ${issue_type}`,
        message: `A new ${priority_level.toLowerCase()} priority issue has been reported for ${specific_location}: ${issue_description.substring(0, 100)}${issue_description.length > 100 ? '...' : ''}`,
        notificationType: 'ReportIssue'
      });
      
      console.log(`✅ Notifications created for Owner and CSR roles`);
      
      // Commit transaction
      console.log('🔄 Committing transaction...');
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      return NextResponse.json({
        success: true,
        message: 'Report submitted successfully with notifications',
        data: newReport
      });
      
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      
      // Log the detailed error
      console.error('❌ Report submission error:', error);
      
      // Return detailed error for debugging
      return NextResponse.json(
        { 
          success: false, 
          message: error instanceof Error ? error.message : 'Internal server error',
          details: error instanceof Error ? error.stack : 'No stack trace available'
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  
} catch (error) {
  console.error('❌ Outer error:', error);
  return NextResponse.json(
    { 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? error.stack : 'No stack trace available'
    },
    { status: 500 }
  );
}
}
