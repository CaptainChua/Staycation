import { NextRequest, NextResponse } from "next/server";
import { upload_file } from "../utils/cloudinary";
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
        weekend_rate, six_hour_check_in, ten_hour_check_in, twenty_one_hour_check_in,
        amenities, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
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
      ten_hour_check_in || "09:00:00",
      twenty_one_hour_check_in || "14:00:00",
      JSON.stringify(amenities || {}),
    ];

    const havenResult = await pool.query(havenQuery, havenValues);
    const havenRow = havenResult.rows[0];
    const havenId = havenRow.id || havenRow.uuid_id;

    console.log('✅ Haven ID:', havenId);
    console.log('✅ Haven Result:', havenRow);
    console.log('✅ All keys in Haven Result:', Object.keys(havenRow));

    if (!havenId) {
      throw new Error('Failed to create haven: No ID returned');
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

        const actualFromDate = fromDate <= toDate ? dateRange.from_date : dateRange.to_date;
        const actualToDate = fromDate <= toDate ? dateRange.to_date : dateRange.from_date;

        await pool.query(
          `INSERT INTO blocked_dates (haven_id, from_date, to_date, reason, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [havenId, actualFromDate, actualToDate, dateRange.reason || null]
        );
      }
    }

    console.log('✅ Haven Created:', havenResult.rows[0]);

    return NextResponse.json({
        success: true,
        data: {
            haven: havenResult.rows[0],
            images: havenImageUrls,
            photo_tours: photoTourUrls,
            message: 'Haven created successfully'
        }
    })
  } catch (error) {
  console.log('❌ Error Creating haven:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create haven',
    }, { status: 500 });
  }
};

// /api/api/haven
export const getAllHavens = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const tower = searchParams.get('tower');
    const view_type = searchParams.get('view_type');
    const min_capacity = searchParams.get('min_capacity');

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
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY h.uuid_id ORDER BY h.created_at DESC';

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} havens`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });

  } catch (error: any) {
    console.log('❌ Error getting havens:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get havens',
    }, { status: 500 });
  }
};

export const getHavenById = async (req: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> => {
  try {
    const { id } = ctx.params;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Haven ID is required',
      }, { status: 400 });
    }

    const query = `
      SELECT h.*,
        json_agg(DISTINCT jsonb_build_object('id', hi.id, 'url', hi.image_url, 'display_order', hi.display_order))
          FILTER (WHERE hi.id IS NOT NULL) as images,
        json_agg(DISTINCT jsonb_build_object('category', pti.category, 'url', pti.image_url, 'display_order', pti.display_order))
          FILTER (WHERE pti.id IS NOT NULL) as photo_tours,
        json_agg(DISTINCT jsonb_build_object('from_date', bd.from_date, 'to_date', bd.to_date, 'reason', bd.reason))
          FILTER (WHERE bd.id IS NOT NULL) as blocked_dates
      FROM havens h
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      LEFT JOIN photo_tour_images pti ON h.uuid_id = pti.haven_id
      LEFT JOIN blocked_dates bd ON h.uuid_id = bd.haven_id
      WHERE h.uuid_id = $1
      GROUP BY h.uuid_id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Haven not found',
      }, { status: 404 });
    }

    console.log('✅ Retrieved haven:', result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });

  } catch (error: any) {
    console.log('❌ Error getting haven:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get haven',
    }, { status: 500 });
  }
};