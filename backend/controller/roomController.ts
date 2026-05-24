import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upload_file, delete_file } from "../utils/cloudinary";
import pool from "../config/db";
import { syncAmenityVerifications } from "../utils/amenityVerifySync";

// Only Owner / admin sessions are allowed to set per-room commission overrides.
// Partner-side callers (MyListingsPage, AddRoomPage) hit the same haven create/
// update endpoints, so we strip the field server-side rather than trusting the UI.
const isOwnerSession = async (): Promise<boolean> => {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    return role === "Owner";
  } catch {
    return false;
  }
};

//  /api/addHavenRoom/route.ts

export const createHaven = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Test database connection
    try {
      const testResult = await pool.query('SELECT 1 as test');
      if (!testResult.rows.length) throw new Error("Database connection check failed");
    } catch (dbError: any) {
      console.error("❌ Database connection error in createHaven:", dbError.message);
      return NextResponse.json({ success: false, message: "Haven can't save: Database connection error" }, { status: 500 });
    }

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
      six_hour_check_out,
      ten_hour_check_in,
      ten_hour_check_out,
      twenty_one_hour_check_in,
      twenty_one_hour_check_out,
      amenities,
      haven_images,
      photo_tour_images,
      blocked_dates,
      partner_id,
      rates,
      bathrooms,
      property_type,
      cleaning_fee,
      security_deposit,
      extra_pax_fee,
      commission_rate,
      house_rules,
      smoking_policy,
      pet_policy,
      cancellation_policy,
      google_map_address,
      google_map_lat,
      google_map_lng,
      virtual_tour_url,
    } = body;

    // Per-room commission override: Owner only. Partner self-service create
    // forces it to null so the partner default rate applies.
    const effectiveCommissionRate = (await isOwnerSession()) ? commission_rate : null;

    // Partner-status gate: only approved partners can submit havens
    if (partner_id) {
      const partnerCheck = await pool.query<{ status: string }>(
        `SELECT status FROM partners_account WHERE id = $1`,
        [partner_id]
      );
      if (partnerCheck.rowCount === 0) {
        return NextResponse.json(
          { success: false, error: "Partner not found", message: "Haven can't save: Partner account not found" },
          { status: 404 }
        );
      }
      const partnerStatus = partnerCheck.rows[0].status;
      if (partnerStatus !== "active") {
        const reason =
          partnerStatus === "pending"
            ? "Your account is still pending approval. Please finish uploading your ID, signed contract, and payout details, then wait for admin review before listing properties."
            : partnerStatus === "suspended"
            ? "Your partner account is suspended. Please contact support."
            : partnerStatus === "rejected"
            ? "Your partner application was rejected. Please contact support."
            : "Your partner account is not active.";
        return NextResponse.json(
          { success: false, error: "Account not approved", message: reason },
          { status: 403 }
        );
      }
    }

    // Required fields validation
    if (!haven_name || !tower || !floor || !view_type || !capacity || !room_size || !beds || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "Haven can't save: Missing required information"
        },
        { status: 400 }
      );
    }

    // Pricing validation: accept either the new rates array OR at least one legacy column
    const hasRates = Array.isArray(rates) && rates.length > 0;
    const hasLegacyRate = !!(six_hour_rate || ten_hour_rate || weekday_rate || weekend_rate);
    if (!hasRates && !hasLegacyRate) {
      return NextResponse.json(
        {
          success: false,
          error: "Pricing information is required",
          message: "Haven can't save: Please add at least one rate",
        },
        { status: 400 }
      );
    }

    let havenImageUrls: any[] = [];
    if (haven_images && haven_images.length > 0) {
      havenImageUrls = await Promise.all(
        haven_images.map(async (image: string, index: number) => {
          const result = await upload_file(image, "staycation-haven/havens");
          return {
            image_url: result.url,
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
                image_url: result.url,
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
        amenities, partner_id, rates,
        security_deposit, extra_pax_fee,
        house_rules, smoking_policy, pet_policy, cancellation_policy,
        google_map_address, google_map_lat, google_map_lng, virtual_tour_url,
        bathrooms, property_type, cleaning_fee,
        commission_rate,
        created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb,
                $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
                $33, $34, $35,
                $36,
                NOW(), NOW())
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
      six_hour_rate || 0,
      ten_hour_rate || 0,
      weekday_rate || 0,
      weekend_rate || 0,
      six_hour_check_in || "09:00",
      six_hour_check_out || "15:00",
      ten_hour_check_in || "09:00",
      ten_hour_check_out || "19:00",
      twenty_one_hour_check_in || "14:00",
      twenty_one_hour_check_out || "11:00",
      JSON.stringify(amenities || {}),
      partner_id || null,
      JSON.stringify(Array.isArray(rates) ? rates : []),
      security_deposit ? parseFloat(security_deposit) : 0,
      extra_pax_fee ? parseFloat(extra_pax_fee) : 0,
      house_rules || null,
      smoking_policy || null,
      pet_policy || null,
      cancellation_policy || null,
      google_map_address || null,
      google_map_lat || null,
      google_map_lng || null,
      virtual_tour_url || null,
      bathrooms ? parseInt(bathrooms) : null,
      property_type || null,
      cleaning_fee ? parseFloat(cleaning_fee) : 0,
      effectiveCommissionRate === "" ||
      effectiveCommissionRate === null ||
      effectiveCommissionRate === undefined
        ? null
        : parseFloat(String(effectiveCommissionRate)),
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
          [havenId, img.image_url, img.public_id, img.display_order]
        );
      }
    }

    for (const [category, images] of Object.entries(photoTourUrls)) {
      if (Array.isArray(images)) {
        for (const img of images) {
          await pool.query(
            `INSERT INTO photo_tour_images (haven_id, category, image_url, cloudinary_public_id, display_order, uploaded_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [havenId, img.category, img.image_url, img.public_id, img.display_order]
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

    // Seed amenity verification rows (status='pending') for every toggled amenity
    try {
      await syncAmenityVerifications(havenId, amenities, { pruneToggledOff: false });
    } catch (syncErr) {
      console.error("⚠️ amenity verification sync (create) failed:", syncErr);
      // Non-fatal: haven is created, partner can re-save to re-seed if this fails.
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
  } catch (error: any) {
    console.log("❌ Error Creating haven:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create haven",
        message: `Haven can't save: ${error.message || "An unexpected error occurred"}`
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
    // Phase 5 — public marketplace filters
    const min_price = searchParams.get("min_price");      // any rate >= min_price
    const max_price = searchParams.get("max_price");      // any rate <= max_price
    const amenities = searchParams.getAll("amenity");     // ?amenity=wifi&amenity=parking — require ALL to be VERIFIED
    const location = searchParams.get("location");        // matches haven_name, tower, floor, view_type

    let query = `
      SELECT h.*,
        json_agg(DISTINCT jsonb_build_object('id', hi.id, 'image_url', hi.image_url, 'display_order', hi.display_order))
          FILTER (WHERE hi.id IS NOT NULL) as images,
        json_agg(DISTINCT jsonb_build_object('category', pti.category, 'image_url', pti.image_url, 'display_order', pti.display_order))
          FILTER (WHERE pti.id IS NOT NULL) as photo_tours,
        -- Only VERIFIED amenities are exposed publicly. Pending/rejected/revision are hidden.
        COALESCE(
          (
            SELECT jsonb_agg(jsonb_build_object(
              'key', av.amenity_key,
              'label', av.amenity_label,
              'iconKey', av.amenity_icon_key,
              'iconUrl', av.amenity_icon_url,
              'category', av.category
            ))
            FROM haven_amenity_verifications av
            WHERE av.haven_id = h.uuid_id AND av.status = 'verified'
          ),
          '[]'::jsonb
        ) AS verified_amenities
      FROM havens h
      LEFT JOIN haven_images hi ON h.uuid_id = hi.haven_id
      LEFT JOIN photo_tour_images pti ON h.uuid_id = pti.haven_id
      LEFT JOIN property_approval pa ON pa.haven_id = h.uuid_id
    `;

    // Hide partner havens that haven't been approved yet (owner havens have NULL partner_id and are always visible)
    // Also hide havens that admin has disabled or suspended.
    const conditions: string[] = [
      "(h.partner_id IS NULL OR COALESCE(pa.status, 'pending') = 'approved')",
      "COALESCE(h.listing_status, 'active') = 'active'",
    ];
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

    // Free-text location search across haven_name / tower / floor / view_type / google_map_address
    if (location) {
      conditions.push(
        `(h.haven_name ILIKE $${paramCount} OR h.tower ILIKE $${paramCount} OR h.floor ILIKE $${paramCount} OR h.view_type ILIKE $${paramCount} OR COALESCE(h.google_map_address, '') ILIKE $${paramCount})`
      );
      values.push(`%${location}%`);
      paramCount++;
    }

    // Price range — match if ANY of the haven's rates fall in the range
    if (min_price) {
      conditions.push(`
        (
          (h.six_hour_rate >= $${paramCount}) OR
          (h.ten_hour_rate >= $${paramCount}) OR
          (h.weekday_rate >= $${paramCount}) OR
          (h.weekend_rate >= $${paramCount}) OR
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(COALESCE(h.rates, '[]'::jsonb)) AS r
            WHERE (r->>'price')::numeric >= $${paramCount}
          )
        )
      `);
      values.push(parseFloat(min_price));
      paramCount++;
    }
    if (max_price) {
      conditions.push(`
        (
          (h.six_hour_rate > 0 AND h.six_hour_rate <= $${paramCount}) OR
          (h.ten_hour_rate > 0 AND h.ten_hour_rate <= $${paramCount}) OR
          (h.weekday_rate > 0 AND h.weekday_rate <= $${paramCount}) OR
          (h.weekend_rate > 0 AND h.weekend_rate <= $${paramCount}) OR
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(COALESCE(h.rates, '[]'::jsonb)) AS r
            WHERE (r->>'price')::numeric <= $${paramCount} AND (r->>'price')::numeric > 0
          )
        )
      `);
      values.push(parseFloat(max_price));
      paramCount++;
    }

    // Amenity filter — every requested amenity must have a VERIFIED row for this haven
    if (amenities.length > 0) {
      conditions.push(`
        NOT EXISTS (
          SELECT 1 FROM unnest($${paramCount}::text[]) AS req(amenity)
          WHERE NOT EXISTS (
            SELECT 1 FROM haven_amenity_verifications av
            WHERE av.haven_id = h.uuid_id
              AND av.status = 'verified'
              AND av.amenity_key = req.amenity
          )
        )
      `);
      values.push(amenities);
      paramCount++;
    }

    query += " WHERE " + conditions.join(" AND ");

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
        message: "Unable to load havens at this time"
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
          json_agg(DISTINCT jsonb_build_object('id', hi.id, 'image_url', hi.image_url, 'display_order', hi.display_order))
            FILTER (WHERE hi.id IS NOT NULL) as images,
          COALESCE(
            (
              SELECT jsonb_agg(jsonb_build_object(
                'key', av.amenity_key,
                'label', av.amenity_label,
                'iconKey', av.amenity_icon_key,
                'iconUrl', av.amenity_icon_url,
                'category', av.category
              ))
              FROM haven_amenity_verifications av
              WHERE av.haven_id = h.uuid_id AND av.status = 'verified'
            ),
            '[]'::jsonb
          ) AS verified_amenities,
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
    // Test database connection
    try {
      const testResult = await pool.query('SELECT 1 as test');
      if (!testResult.rows.length) throw new Error("Database connection check failed");
    } catch (dbError: any) {
      console.error("❌ Database connection error in updateHaven:", dbError.message);
      return NextResponse.json({ success: false, message: "Haven can't save: Database connection error" }, { status: 500 });
    }

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
      blocked_dates,
      rates,
      bathrooms,
      property_type,
      cleaning_fee,
      security_deposit,
      extra_pax_fee,
      commission_rate,
      house_rules,
      smoking_policy,
      pet_policy,
      cancellation_policy,
      google_map_address,
      google_map_lat,
      google_map_lng,
      virtual_tour_url,
    } = body;

    // Owner-only per-room commission override. Non-Owner callers (partners
    // editing their own listing) cannot change it — we keep whatever's in
    // the DB so a crafted request can't override it.
    const ownerCanEditCommission = await isOwnerSession();
    let effectiveCommissionRate: unknown = commission_rate;
    if (!ownerCanEditCommission) {
      const existing = await pool.query<{ commission_rate: number | null }>(
        `SELECT commission_rate FROM havens WHERE uuid_id = $1`,
        [id]
      );
      effectiveCommissionRate = existing.rows[0]?.commission_rate ?? null;
    }

    // Required fields validation
    if (!id || !haven_name || !tower || !floor || !view_type || !capacity || !room_size || !beds || !description) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          message: "Haven can't save: Missing required information"
        },
        { status: 400 }
      );
    }

    // Update haven basic info + rates JSONB + Phase-5 fields
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
          rates = $21::jsonb,
          security_deposit = $23,
          extra_pax_fee = $24,
          house_rules = $25,
          smoking_policy = $26,
          pet_policy = $27,
          cancellation_policy = $28,
          google_map_address = $29,
          google_map_lat = $30,
          google_map_lng = $31,
          virtual_tour_url = $32,
          bathrooms = $33,
          property_type = $34,
          cleaning_fee = $35,
          commission_rate = $36,
          updated_at = NOW()
      WHERE uuid_id = $22
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
      six_hour_rate || 0,
      ten_hour_rate || 0,
      weekday_rate || 0,
      weekend_rate || 0,
      six_hour_check_in || "09:00",
      six_hour_check_out || "15:00",
      ten_hour_check_in || "09:00",
      ten_hour_check_out || "19:00",
      twenty_one_hour_check_in || "14:00",
      twenty_one_hour_check_out || "11:00",
      JSON.stringify(amenities || {}),
      JSON.stringify(Array.isArray(rates) ? rates : []),
      id,
      security_deposit ? parseFloat(security_deposit) : 0,
      extra_pax_fee ? parseFloat(extra_pax_fee) : 0,
      house_rules || null,
      smoking_policy || null,
      pet_policy || null,
      cancellation_policy || null,
      google_map_address || null,
      google_map_lat || null,
      google_map_lng || null,
      virtual_tour_url || null,
      bathrooms ? parseInt(bathrooms) : null,
      property_type || null,
      cleaning_fee ? parseFloat(cleaning_fee) : 0,
      effectiveCommissionRate === "" ||
      effectiveCommissionRate === null ||
      effectiveCommissionRate === undefined
        ? null
        : parseFloat(String(effectiveCommissionRate)),
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
    const existingImageUrls = (existing_images || []).map((img: any) => img.image_url);
    const imagesToDelete = currentImagesResult.rows.filter(
      (img: any) => !existingImageUrls.includes(img.image_url)
    );

    // Find photo tours that were removed
    const existingPhotoTourUrls = (existing_photo_tours || []).map((photo: any) => photo.image_url);
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
            image_url: result.url,
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
          [id, img.image_url, img.public_id, img.display_order]
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
                image_url: result.url,
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
              [id, img.category, img.image_url, img.public_id, img.display_order]
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

    // Reconcile amenity verification rows against the latest amenities JSONB
    try {
      // pruneToggledOff: true → if partner removed an amenity that wasn't yet verified, drop its pending row
      await syncAmenityVerifications(id, amenities, { pruneToggledOff: true });
    } catch (syncErr) {
      console.error("⚠️ amenity verification sync (update) failed:", syncErr);
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
      error: error.message || "Failed to update haven",
      message: `Haven can't save: ${error.message || "An unexpected error occurred"}`
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
      error: error.message || "Failed to delete haven",
      message: "Unable to delete haven at this time"
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
            'image_url', hi.image_url,
            'display_order', hi.display_order
          )
        ) FILTER (WHERE hi.id IS NOT NULL) AS images,

        json_agg(
          DISTINCT jsonb_build_object(
            'category', pti.category,
            'image_url', pti.image_url,
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
      { 
        success: false, 
        message: "Failed to fetch admin rooms: An unexpected error occurred",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
};
