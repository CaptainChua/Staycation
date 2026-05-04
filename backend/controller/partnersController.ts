import { NextRequest, NextResponse } from "next/server";
import pool from "../config/db";
import bcrypt from "bcrypt";
import { sendPartnerWelcomeEmail } from "../utils/mailer";

export interface Partner {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  type: string;
  commission_rate: number;
  total_earnings?: number;
  total_paid?: number;
  status: "active" | "pending" | "suspended";
  created_at: string;
  updated_at: string;
}

/* =========================
   GET ALL PARTNERS
========================= */
export async function getAllPartners(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = `
      SELECT
        pa.id,
        pa.partner_email AS email,
        pi.partner_fullname AS fullname,
        pi.partner_phone AS phone,
        pi.partner_address AS address,
        pi.partner_type AS type,
        pi.commission_rate,
        pi.total_earnings,
        pi.total_paid,
        pa.status,
        pa.created_at,
        pa.updated_at
      FROM partners_account pa
      LEFT JOIN partners_information pi ON pa.id = pi.partner_id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (status && status !== "all") {
      query += ` AND pa.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (search) {
      query += `
        AND (
          pi.partner_fullname ILIKE $${paramCount}
          OR pa.partner_email ILIKE $${paramCount}
          OR pi.partner_phone ILIKE $${paramCount}
        )
      `;
      values.push(`%${search}%`);
      paramCount++;
    }

    query += " ORDER BY pa.created_at DESC";

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows as Partner[],
      count: result.rows.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get partners";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/* =========================
   GET BY ID
========================= */
export async function getPartnerById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await ctx.params;

    const query = `
      SELECT
        pa.id,
        pa.partner_email AS email,
        pi.partner_fullname AS fullname,
        pi.partner_phone AS phone,
        pi.partner_address AS address,
        pi.partner_type AS type,
        pi.commission_rate,
        pi.total_earnings,
        pi.total_paid,
        pa.status,
        pa.created_at,
        pa.updated_at
      FROM partners_account pa
      LEFT JOIN partners_information pi ON pa.id = pi.partner_id
      WHERE pa.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (!result.rows.length) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0] as Partner,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get partner";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/* =========================
   CREATE PARTNER
========================= */
export async function createPartner(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { email, password, fullname, phone, address, type, commission_rate } = body;

    if (!email || !password || !fullname) {
      return NextResponse.json(
        { success: false, error: "Email, password, fullname required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const accountRes = await client.query(
        `INSERT INTO partners_account (partner_email, partner_password, status)
         VALUES ($1, $2, 'pending')
         RETURNING id`,
        [email, hashedPassword]
      );

      const partnerId = accountRes.rows[0].id;

      await client.query(
        `INSERT INTO partners_information (
          partner_id, partner_fullname, partner_phone, partner_address,
          partner_type, commission_rate
        )
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          partnerId,
          fullname,
          phone || null,
          address || null,
          type || "hotel",
          commission_rate || 10,
        ]
      );

      await client.query("COMMIT");

      const result = await pool.query(
        `SELECT
          pa.id,
          pa.partner_email AS email,
          pi.partner_fullname AS fullname,
          pi.partner_phone AS phone,
          pi.partner_address AS address,
          pi.partner_type AS type,
          pi.commission_rate,
          pi.total_earnings,
          pi.total_paid,
          pa.status,
          pa.created_at,
          pa.updated_at
        FROM partners_account pa
        LEFT JOIN partners_information pi ON pa.id = pi.partner_id
        WHERE pa.id = $1`,
        [partnerId]
      );

      await sendPartnerWelcomeEmail(email, fullname, password);

      return NextResponse.json({
        success: true,
        data: result.rows[0] as Partner,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create partner";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}