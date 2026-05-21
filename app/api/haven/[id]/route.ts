import { getHavenById, updateHaven } from "@/backend/controller/roomController";
import pool from "@/backend/config/db";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
  }>
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  return getHavenById(request, { params });
}

export async function PUT(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    // NEW pricing-only update via rates JSONB array
    const isRatesOnlyUpdate =
      Array.isArray(body?.rates) &&
      Object.keys(body).every((key) => key === "rates");

    if (isRatesOnlyUpdate) {
      try {
        const rates = (body.rates as Array<{ label: string; hours: number; price: number }>).map(
          (r) => ({
            label: String(r.label || "").trim(),
            hours: Number(r.hours) || 0,
            price: Number(r.price) || 0,
          })
        );

        // Best-effort backfill of legacy columns
        const legacy = { six: 0, ten: 0, weekday: 0, weekend: 0 };
        rates.forEach((r) => {
          if (r.hours === 6) legacy.six = r.price;
          else if (r.hours === 10) legacy.ten = r.price;
          else if (r.hours === 21 && /weekend/i.test(r.label)) legacy.weekend = r.price;
          else if (r.hours === 21) legacy.weekday = r.price;
        });

        const result = await pool.query(
          `UPDATE havens
             SET rates = $1::jsonb,
                 six_hour_rate = $2,
                 ten_hour_rate = $3,
                 weekday_rate = $4,
                 weekend_rate = $5,
                 updated_at = NOW()
           WHERE uuid_id = $6
           RETURNING uuid_id, haven_name, rates, six_hour_rate, ten_hour_rate, weekday_rate, weekend_rate`,
          [JSON.stringify(rates), legacy.six, legacy.ten, legacy.weekday, legacy.weekend, id]
        );

        if (result.rows.length === 0) {
          return NextResponse.json(
            { success: false, message: "Haven not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Rates updated successfully",
          data: result.rows[0],
        });
      } catch (dbError: unknown) {
        const msg = dbError instanceof Error ? dbError.message : "Database error";
        console.error("[haven/[id] PUT] Rates update error:", dbError);
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
      }
    }

    // LEGACY pricing-only update via 4 fixed price fields
    const isPricingOnlyUpdate = Object.keys(body).every(key =>
      ['six_hour_price', 'ten_hour_price', 'weekday_price', 'weekend_price'].includes(key)
    );

    if (isPricingOnlyUpdate) {
      try {
        // Simple pricing-only update - bypass the complex updateHaven logic
        const updateQuery = `
          UPDATE havens
          SET six_hour_rate = $1,
              ten_hour_rate = $2,
              weekday_rate = $3,
              weekend_rate = $4,
              updated_at = NOW()
          WHERE uuid_id = $5
          RETURNING uuid_id, haven_name, six_hour_rate, ten_hour_rate, weekday_rate, weekend_rate
        `;

        const values = [
          parseFloat(body.six_hour_price) || 0,
          parseFloat(body.ten_hour_price) || 0,
          parseFloat(body.weekday_price) || 0,
          parseFloat(body.weekend_price) || 0,
          id
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
          console.error(`[haven/[id] PUT] Haven not found with id: ${id}`);
          return NextResponse.json(
            { success: false, message: "Haven not found" },
            { status: 404 }
          );
        }

        const updated = result.rows[0];
        console.log(`[haven/[id] PUT] Pricing updated successfully for ${updated.haven_name}:`, {
          six_hour: updated.six_hour_rate,
          ten_hour: updated.ten_hour_rate,
          weekday: updated.weekday_rate,
          weekend: updated.weekend_rate
        });

        return NextResponse.json({
          success: true,
          message: "Pricing updated successfully",
          data: updated
        });
      } catch (dbError: any) {
        console.error("[haven/[id] PUT] Database error during pricing update:", dbError);
        return NextResponse.json(
          { success: false, message: "Database error: " + dbError.message },
          { status: 500 }
        );
      }
    }
    
    // For non-pricing-only updates, use the complex updateHaven function
    const updatedRequest = new NextRequest(request, {
      body: JSON.stringify({
        ...body,
        id,
        haven_images: body.haven_images || [],
        existing_images: body.existing_images || [],
        photo_tour_images: body.photo_tour_images || [],
        existing_photo_tours: body.existing_photo_tours || [],
        blocked_dates: body.blocked_dates || [],
      }),
    });
    
    return updateHaven(updatedRequest);
  } catch (error) {
    console.error("[haven/[id] PUT] Error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to update haven" },
      { status: 500 }
    );
  }
}