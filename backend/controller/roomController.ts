import { NextRequest, NextResponse } from "next/server";
import { upload_file, delete_file } from "../utils/cloudinary";
import pool from "../config/db";

//  /api/addHavenRoom/route.ts

export const createHaven = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();

    const {
      haven_name,
      tower,
      floor,
      view_type,
      capacity,
      room_size,
      beds,
      description,
      youtube_url,
      six_hour_rate,
      ten_hour_rate,
      weekday_rate,
      weekend_rate,
      six_hour_check_in,
      ten_hour_check_in,
      twenty_one_hour_check_in,
      amenities,
      haven_images,
      photo_tour_images,
      blocked_dates,
    } = body;

    let havenImageUrls: any[] = [];
    if (haven_images && haven_images.length > 0) {
      havenImageUrls = await Promise.all(
        haven_images.map(async (image: string, index: number) => {
          const result = await upload_file(image, "staycation-haven/havens");
          return {
            url: result.url,
            public_id: result.public_id,
            display_order: index,
          };
        })
      );
    }

    let photoTourUrls: any = {};
    if (photo_tour_images) {
      for (const [category, images] of Object.entries(photo_tour_images)) {
        if (Array.isArray(images) && images.length > 0) {
          const categoryUrls = await Promise.all(
            images.map(async (image: string, index: number) => {
              const result = await upload_file(
                image,
                `staycation-haven/photo-tours/${category}`
              );
              return {
                category,
                url: result.url,
                public_id: result.public_id,
                display_order: index,
              };
            })
          );
          photoTourUrls[category] = categoryUrls;
        }
      }
    }

    const havenQuery = `
    INSERT INTO havens (
        haven_name, tower, floor, view_type, capacity, room_size, beds,
        description, youtube_url, six_hour_rate, ten_hour_rate, weekday_rate,
        weekend_rate, six_hour_check_in, six_hour_check_out, ten_hour_check_in, ten_hour_check_out, twenty_one_hour_check_in, twenty_one_hour_check_out,
        amenities, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
      RETURNING *
    `;

    const havenValues = [
      haven_name,
      tower,
      floor,
      view_type,
      capacity,
      room_size,
      beds,
      description,
      youtube_url || null,
      six_hour_rate,
      ten_hour_rate,
      weekday_rate,
      weekend_rate,
      six_hour_check_in || "09:00:00",
      six_hour_check_out || "15:00:00",
      ten_hour_check_in || "09:00:00",
      ten_hour_check_out || "19:00:00",
      twenty_one_hour_check_in || "14:00:00",
      twenty_one_hour_check_out || "11:00:00",
      JSON.stringify(amenities || {}),
    ];

    const havenResult = await pool.query(havenQuery, havenValues);
    const havenRow = havenResult.rows[0];
    const havenId = havenRow.id || havenRow.uuid_id;

    console.log("✅ Haven ID:", havenId);
    console.log("✅ Haven Result:", havenRow);
    console.log("✅ All keys in Haven Result:", Object.keys(havenRow));

    if (!havenId) {
      throw new Error("Failed to create haven: No ID returned");
    }

    if (havenImageUrls.length > 0) {
      for (const img of havenImageUrls) {
        await pool.query(
          `
                    INSERT INTO haven_images (haven_id, image_url, cloudinary_public_id, display_order, uploaded_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `,
          [havenId, img.url, img.public_id, img.display_order]
        );
      }
    }

    for (const [category, images] of Object.entries(photoTourUrls)) {
      if (Array.isArray(images)) {
        for (const img of images) {
          await pool.query(
            `INSERT INTO photo_tour_images (haven_id, category, image_url, cloudinary_public_id, display_order, uploaded_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [havenId, img.category, img.url, img.public_id, img.display_order]
          );
        }
      }
    }

    if (blocked_dates && blocked_dates.length > 0) {
      for (const dateRange of blocked_dates) {
        // Ensure from_date is always before or equal to to_date
        const fromDate = new Date(dateRange.from_date);
        const toDate = new Date(dateRange.to_date);

        const actualFromDate =
          fromDate <= toDate ? dateRange.from_date : dateRange.to_date;
        const actualToDate =
          fromDate <= toDate ? dateRange.to_date : dateRange.from_date;

        await pool.query(
          `INSERT INTO blocked_dates (haven_id, from_date, to_date, reason, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [havenId, actualFromDate, actualToDate, dateRange.reason || null]
        );
      }
    }

    console.log("✅ Haven Created:", havenResult.rows[0]);

    return NextResponse.json({
      success: true,
      data: {
        haven: havenResult.rows[0],
        images: havenImageUrls,
        photo_tours: photoTourUrls,
        message: "Haven created successfully",
      },
    });
  } catch (error) {
    console.log("❌ Error Creating haven:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create haven",
      },
      { status: 500 }
    );
  }
};

// /api/api/haven
export const getAllHavens = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const tower = searchParams.get("tower");
    const view_type = searchParams.get("view_type");
    const min_capacity = searchParams.get("min_capacity");

    let query = `
      SELECT h.*,
        json_agg(DISTINCT jsonb_build_object('id', hi.id, 'url', hi.image_url, 'display_order', hi.display_order))
          FILTER (WHERE hi.id IS NOT NULL) as images,
        json_agg(DISTINCT jsonb_build_object('category', pti.category, 'url', pti.image_url, 'display_order', pti.display_order))
          FILTER (WHERE pti.id IS NOT NULL) as photo_tours
      FROM havens h
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      LEFT JOIN photo_tour_images pti ON h.uuid_id = pti.haven_id
    `;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (tower) {
      conditions.push(`h.tower = $${paramCount}`);
      values.push(tower);
      paramCount++;
    }

    if (view_type) {
      conditions.push(`h.view_type = $${paramCount}`);
      values.push(view_type);
      paramCount++;
    }

    if (min_capacity) {
      conditions.push(`h.capacity >= $${paramCount}`);
      values.push(parseInt(min_capacity));
      paramCount++;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY h.uuid_id ORDER BY h.created_at DESC";

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} havens`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.log("❌ Error getting havens:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get havens",
      },
      { status: 500 }
    );
  }
};

export const getHavenById = async (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const params = await ctx.params;
    const { id } = params;

    console.log("🔍 Getting haven by ID:", id);
    console.log("🔍 DATABASE_URL exists:", !!process.env.DATABASE_URL);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Haven ID is required",
        },
        { status: 400 }
      );
    }

    // Test database connection first
    try {
      console.log("📝 Testing database connection...");
      const testResult = await pool.query('SELECT 1 as test');
      console.log("✅ Database connection test:", testResult.rows[0]);
    } catch (dbError: any) {
      console.log("❌ Database connection error:", dbError.message);
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // Start with a simple query to test the connection
    let result;
    try {
      console.log("📝 Testing simple query first...");
      const simpleQuery = `SELECT uuid_id, haven_name FROM havens WHERE uuid_id = $1 LIMIT 1`;
      result = await pool.query(simpleQuery, [id]);
      console.log("📊 Simple query result:", result.rows);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Haven not found",
          },
          { status: 404 }
        );
      }

      // Get full haven data with images (matching getAllHavens pattern)
      console.log("📝 Getting full haven data...");
      const fullQuery = `
        SELECT h.*,
          json_agg(DISTINCT jsonb_build_object('id', hi.id, 'url', hi.image_url, 'display_order', hi.display_order))
            FILTER (WHERE hi.id IS NOT NULL) as images,
          0 as rating,
          0 as review_count
        FROM havens h
        LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
        WHERE h.uuid_id = $1
        GROUP BY h.uuid_id
      `;
      
      console.log("📝 Executing full query:", fullQuery);
      result = await pool.query(fullQuery, [id]);
      console.log("📊 Full query result rows:", result.rows.length);
      console.log("📊 Full query result:", result.rows[0]);
      
    } catch (queryError: any) {
      console.log("❌ Query error:", queryError.message);
      console.log("❌ Query error details:", queryError);
      console.log("❌ Query error stack:", queryError.stack);
      throw queryError;
    }

    console.log("✅ Retrieved haven:", result.rows[0]);
    console.log("🖼️ Images field:", result.rows[0].images);
    console.log("🖼️ Images type:", typeof result.rows[0].images);

    // Handle null images array
    const havenData = result.rows[0];
    if (!havenData.images) {
      havenData.images = [];
    }

    return NextResponse.json({
      success: true,
      data: havenData,
    });
  } catch (error: any) {
    console.log("❌ Error getting haven:", error);
    console.log("❌ Error stack:", error.stack);
    
    // Return detailed error info for debugging
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get haven",
        details: error.stack || "No stack trace available",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
};

export const updateHaven = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const {
      id,
      haven_name,
      tower,
      floor,
      view_type,
      capacity,
      room_size,
      beds,
      description,
      youtube_url,
      six_hour_rate,
      ten_hour_rate,
      weekday_rate,
      weekend_rate,
      six_hour_check_in,
      six_hour_check_out,
      ten_hour_check_in,
      ten_hour_check_out,
      twenty_one_hour_check_in,
      twenty_one_hour_check_out,
      amenities,
      haven_images,
      existing_images,
      photo_tour_images,
      existing_photo_tours,
      blocked_dates
    } = body;

    // Update haven basic info
    const query = `
      UPDATE havens
      SET haven_name = $1,
          tower = $2,
          floor = $3,
          view_type = $4,
          capacity = $5,
          room_size = $6,
          beds = $7,
          description = $8,
          youtube_url = $9,
          six_hour_rate = $10,
          ten_hour_rate = $11,
          weekday_rate = $12,
          weekend_rate = $13,
          six_hour_check_in = $14,
          six_hour_check_out = $15,
          ten_hour_check_in = $16,
          ten_hour_check_out = $17,
          twenty_one_hour_check_in = $18,
          twenty_one_hour_check_out = $19,
          amenities = $20,
          updated_at = NOW()
      WHERE uuid_id = $21
      RETURNING *
    `;

    const values = [
      haven_name,
      tower,
      floor,
      view_type,
      capacity,
      room_size,
      beds,
      description,
      youtube_url || null,
      six_hour_rate,
      ten_hour_rate,
      weekday_rate,
      weekend_rate,
      six_hour_check_in || "09:00:00",
      six_hour_check_out || "15:00:00",
      ten_hour_check_in || "09:00:00",
      ten_hour_check_out || "19:00:00",
      twenty_one_hour_check_in || "14:00:00",
      twenty_one_hour_check_out || "11:00:00",
      JSON.stringify(amenities || {}),
      id
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Haven not found"
      }, { status: 404 });
    }

    // Get all current images and photo tours from database
    const currentImagesResult = await pool.query(
      'SELECT id, image_url, cloudinary_public_id FROM haven_images WHERE haven_id = $1',
      [id]
    );
    const currentPhotoToursResult = await pool.query(
      'SELECT id, image_url, cloudinary_public_id, category FROM photo_tour_images WHERE haven_id = $1',
      [id]
    );

    // Find images that were removed (exist in DB but not in existing_images array)
    const existingImageUrls = (existing_images || []).map((img: any) => img.url);
    const imagesToDelete = currentImagesResult.rows.filter(
      (img: any) => !existingImageUrls.includes(img.image_url)
    );

    // Find photo tours that were removed
    const existingPhotoTourUrls = (existing_photo_tours || []).map((photo: any) => photo.url);
    const photoToursToDelete = currentPhotoToursResult.rows.filter(
      (photo: any) => !existingPhotoTourUrls.includes(photo.image_url)
    );

    // Delete removed images from database and Cloudinary
    for (const img of imagesToDelete) {
      await pool.query('DELETE FROM haven_images WHERE id = $1', [img.id]);
      if (img.cloudinary_public_id) {
        await delete_file(img.cloudinary_public_id);
      }
    }

    // Delete removed photo tours from database and Cloudinary
    for (const photo of photoToursToDelete) {
      await pool.query('DELETE FROM photo_tour_images WHERE id = $1', [photo.id]);
      if (photo.cloudinary_public_id) {
        await delete_file(photo.cloudinary_public_id);
      }
    }

    // Handle new haven images if provided
    if (haven_images && haven_images.length > 0) {
      const havenImageUrls = await Promise.all(
        haven_images.map(async (image: string, index: number) => {
          const result = await upload_file(image, "staycation-haven/havens");
          return {
            url: result.url,
            public_id: result.public_id,
            display_order: index,
          };
        })
      );

      // Insert new images
      for (const img of havenImageUrls) {
        await pool.query(
          `INSERT INTO haven_images (haven_id, image_url, cloudinary_public_id, display_order, uploaded_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [id, img.url, img.public_id, img.display_order]
        );
      }
    }

    // Handle new photo tour images if provided
    if (photo_tour_images) {
      for (const [category, images] of Object.entries(photo_tour_images)) {
        if (Array.isArray(images) && images.length > 0) {
          const categoryUrls = await Promise.all(
            images.map(async (image: string, index: number) => {
              const result = await upload_file(
                image,
                `staycation-haven/photo-tours/${category}`
              );
              return {
                category,
                url: result.url,
                public_id: result.public_id,
                display_order: index,
              };
            })
          );

          // Insert new photo tour images
          for (const img of categoryUrls) {
            await pool.query(
              `INSERT INTO photo_tour_images (haven_id, category, image_url, cloudinary_public_id, display_order, uploaded_at)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [id, img.category, img.url, img.public_id, img.display_order]
            );
          }
        }
      }
    }

    // Handle blocked dates update
    if (blocked_dates) {
      // Delete existing blocked dates
      await pool.query('DELETE FROM blocked_dates WHERE haven_id = $1', [id]);

      // Insert new blocked dates
      if (blocked_dates.length > 0) {
        for (const dateRange of blocked_dates) {
          const fromDate = new Date(dateRange.from_date);
          const toDate = new Date(dateRange.to_date);

          const actualFromDate = fromDate <= toDate ? dateRange.from_date : dateRange.to_date;
          const actualToDate = fromDate <= toDate ? dateRange.to_date : dateRange.from_date;

          await pool.query(
            `INSERT INTO blocked_dates (haven_id, from_date, to_date, reason, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [id, actualFromDate, actualToDate, dateRange.reason || null]
          );
        }
      }
    }

    console.log("✅ Haven updated successfully:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Haven updated successfully"
    });
  } catch (error: any) {
    console.log("❌ Update haven error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to update haven"
    }, { status: 500 });
  }
}

export const deleteHaven = async (
  req: NextRequest,
  ctx?: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    // Try to get ID from route params first, fallback to query params
    let id: string | null = null;

    if (ctx?.params) {
      const params = await ctx.params;
      id = params.id;
    } else {
      const { searchParams } = new URL(req.url);
      id = searchParams.get("id");
    }

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "Haven ID is required"
      }, { status: 400 });
    }

    // Get all images before deleting to clean up from Cloudinary
    const imagesQuery = `
      SELECT cloudinary_public_id FROM haven_images WHERE haven_id = $1
    `;
    const imagesResult = await pool.query(imagesQuery, [id]);

    // Get all photo tour images
    const photoToursQuery = `
      SELECT cloudinary_public_id FROM photo_tour_images WHERE haven_id = $1
    `;
    const photoToursResult = await pool.query(photoToursQuery, [id]);

    // Delete the haven (this will cascade delete related records if ON DELETE CASCADE is set)
    const deleteQuery = `
      DELETE FROM havens WHERE uuid_id = $1 RETURNING *
    `;
    const result = await pool.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Haven not found"
      }, { status: 404 });
    }

    // Delete images from Cloudinary
    const deletePromises: Promise<boolean>[] = [];

    // Delete haven images from Cloudinary
    for (const img of imagesResult.rows) {
      if (img.cloudinary_public_id) {
        deletePromises.push(delete_file(img.cloudinary_public_id));
      }
    }

    // Delete photo tour images from Cloudinary
    for (const img of photoToursResult.rows) {
      if (img.cloudinary_public_id) {
        deletePromises.push(delete_file(img.cloudinary_public_id));
      }
    }

    // Wait for all Cloudinary deletions to complete
    await Promise.all(deletePromises);

    console.log("✅ Haven deleted successfully:", result.rows[0].haven_name);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Haven deleted successfully"
    });
  } catch(error: any) {
    console.log("❌ Delete haven error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to delete haven"
    }, { status: 500 });
  }
}
export const getAllAdminRooms = async (
  req: NextRequest
): Promise<NextResponse> => {
  try {
    const query = `
      SELECT h.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', hi.id,
            'url', hi.image_url,
            'display_order', hi.display_order
          )
        ) FILTER (WHERE hi.id IS NOT NULL) AS images,

        json_agg(
          DISTINCT jsonb_build_object(
            'category', pti.category,
            'url', pti.image_url,
            'display_order', pti.display_order
          )
        ) FILTER (WHERE pti.id IS NOT NULL) AS photo_tours,

        json_agg(
          DISTINCT jsonb_build_object(
            'from_date', bd.from_date,
            'to_date', bd.to_date,
            'reason', bd.reason
          )
        ) FILTER (WHERE bd.id IS NOT NULL) AS blocked_dates

      FROM havens h
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      LEFT JOIN photo_tour_images pti ON h.uuid_id = pti.haven_id
      LEFT JOIN blocked_dates bd ON h.uuid_id = bd.haven_id
      GROUP BY h.uuid_id
      ORDER BY h.created_at DESC
    `;

    const result = await pool.query(query);

    console.log("✅ ADMIN ROOMS COUNT:", result.rows.length);

    return NextResponse.json({
      success: true,
      havens: result.rows,
      count: result.rows.length
    })
  } catch (error) {
        console.error("❌ Admin get rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch admin rooms" },
      { status: 500 }
    );
  }
};
