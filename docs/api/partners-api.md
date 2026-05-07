# Partners API

## Overview

Base URL: `/api/admin/partners`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/partners` | Get all partners (optional `?status=` and `?search=` filters) |
| GET | `/api/admin/partners/:id` | Get partner by ID |
| POST | `/api/admin/partners` | Create new partner |
| PUT | `/api/admin/partners/:id` | Update partner |
| DELETE | `/api/admin/partners?id=` | Delete partner |
| PUT | `/api/admin/partners/status` | Update partner status |

---

## Files

```
app/api/admin/partners/route.ts             ← GET all, POST create
app/api/admin/partners/[id]/route.ts        ← GET by ID, PUT update, DELETE
backend/controller/partnersController.ts    ← All controller logic
redux/api/partnersApi.ts                    ← RTK Query API slice
```

---

## Route Handlers

### `app/api/admin/partners/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAllPartners, createPartner } from "@/backend/controller/partnersController";

export async function GET(req: NextRequest) {
  return await getAllPartners(req);
}

export async function POST(req: NextRequest) {
  return await createPartner(req);
}
```

### `app/api/admin/partners/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { getPartnerById, updatePartner, deletePartner } from "@/backend/controller/partnersController";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return await getPartnerById(req, ctx);
}

export async function PUT(req: NextRequest) {
  return await updatePartner(req);
}

export async function DELETE(req: NextRequest) {
  return await deletePartner(req);
}
```

---

## Controller

### `backend/controller/partnersController.ts`

```ts
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
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
}

// Get all partners with optional filtering
export async function getAllPartners(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = `
      SELECT
        pa.id,
        pa.partner_email as email,
        pi.partner_fullname as fullname,
        pi.partner_phone as phone,
        pi.partner_address as address,
        pi.partner_type as type,
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
      query += ` AND (pi.partner_fullname ILIKE $${paramCount} OR pa.partner_email ILIKE $${paramCount} OR pi.partner_phone ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      values.push(`%${search}%`);
      paramCount += 3;
    }

    query += " ORDER BY pa.created_at DESC";

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error: unknown) {
    console.error("Error getting partners:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get partners";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Get partner by ID
export async function getPartnerById(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const params = await ctx.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Partner ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT
        pa.id,
        pa.partner_email as email,
        pi.partner_fullname as fullname,
        pi.partner_phone as phone,
        pi.partner_address as address,
        pi.partner_type as type,
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

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Error getting partner:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get partner";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Create new partner
export async function createPartner(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullname,
      phone,
      address,
      type,
      commission_rate,
      payment_method,
      bank_name,
      account_number,
    } = body;

    // Validate required fields
    if (!email || !password || !fullname) {
      return NextResponse.json(
        { success: false, error: "Email, password, and fullname are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert into partners_account
      const accountQuery = `
        INSERT INTO partners_account (partner_email, partner_password, status)
        VALUES ($1, $2, 'pending')
        RETURNING id, partner_email, status, created_at, updated_at
      `;

      const accountResult = await client.query(accountQuery, [email, hashedPassword]);
      const partnerId = accountResult.rows[0].id;

      // Insert into partners_information
      const infoQuery = `
        INSERT INTO partners_information (
          partner_id, partner_fullname, partner_phone, partner_address,
          partner_type, commission_rate
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      await client.query(infoQuery, [
        partnerId,
        fullname,
        phone || null,
        address || null,
        type || 'hotel',
        commission_rate || 10.00,
      ]);

      await client.query("COMMIT");

      // Fetch complete partner data
      const getQuery = `
        SELECT
          pa.id,
          pa.partner_email as email,
          pi.partner_fullname as fullname,
          pi.partner_phone as phone,
          pi.partner_address as address,
          pi.partner_type as type,
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

      const result = await pool.query(getQuery, [partnerId]);

      console.log("Partner created:", result.rows[0]);

      // Send welcome email with credentials
      try {
        const emailSent = await sendPartnerWelcomeEmail(
          email,
          fullname,
          password
        );
        if (emailSent) {
          console.log(`Welcome email sent to ${email}`);
        } else {
          console.warn(`Failed to send welcome email to ${email}`);
        }
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // Don't fail the request if email sending fails, just log it
      }

      return NextResponse.json({
        success: true,
        data: result.rows[0],
        message: "Partner created successfully. Welcome email sent to " + email,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: unknown) {
    console.error("Error creating partner:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create partner";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Update partner
export async function updatePartner(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const {
      id,
      fullname,
      phone,
      address,
      type,
      commission_rate,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Partner ID is required" },
        { status: 400 }
      );
    }

    // Update partners_information
    const infoQuery = `
      UPDATE partners_information
      SET
        partner_fullname = COALESCE($2, partner_fullname),
        partner_phone = COALESCE($3, partner_phone),
        partner_address = COALESCE($4, partner_address),
        partner_type = COALESCE($5, partner_type),
        commission_rate = COALESCE($6, commission_rate),
        updated_at = CURRENT_TIMESTAMP
      WHERE partner_id = $1
    `;

    await pool.query(infoQuery, [
      id,
      fullname || null,
      phone || null,
      address || null,
      type || null,
      commission_rate || null,
    ]);

    // Update partners_account timestamp
    await pool.query(
      "UPDATE partners_account SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    // Fetch updated partner
    const getQuery = `
      SELECT
        pa.id,
        pa.partner_email as email,
        pi.partner_fullname as fullname,
        pi.partner_phone as phone,
        pi.partner_address as address,
        pi.partner_type as type,
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

    const result = await pool.query(getQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }

    console.log("Partner updated:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Partner updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating partner:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update partner";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Delete partner
export async function deletePartner(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Partner ID is required" },
        { status: 400 }
      );
    }

    const query = `
      DELETE FROM partners_account
      WHERE id = $1
      RETURNING id, partner_email as email
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }

    console.log("Partner deleted:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Partner deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting partner:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete partner";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Update partner status
export async function updatePartnerStatus(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Partner ID and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'pending', 'suspended'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE partners_account
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, partner_email as email, status
    `;

    const result = await pool.query(query, [id, status]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }

    console.log("Partner status updated:", result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: "Partner status updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating partner status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update partner status";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
```

---

## RTK Query API Slice

### `redux/api/partnersApi.ts`

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Partner {
  id: string;
  email: string;
  fullname: string;
  phone?: string;
  address?: string;
  type: string;
  commission_rate: number;
  commission_total: number;
  payment_method?: string;
  bank_name?: string;
  account_number?: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface PartnersResponse {
  success: boolean;
  data: Partner[];
  count: number;
}

export interface PartnerResponse {
  success: boolean;
  data: Partner;
  message?: string;
}

export interface CreatePartnerData {
  email: string;
  password: string;
  fullname: string;
  phone?: string;
  address?: string;
  type?: string;
  commission_rate?: number;
  payment_method?: string;
  bank_name?: string;
  account_number?: string;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  id: string;
}

export const partnersApi = createApi({
  reducerPath: "partnersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ['Partner'],
  endpoints: (builder) => ({
    // Get all partners
    getPartners: builder.query<PartnersResponse, { status?: string; search?: string } | void>({
      query: (params) => ({
        url: "/admin/partners",
        params: params || {},
      }),
      providesTags: ['Partner'],
    }),

    // Get partner by ID
    getPartnerById: builder.query<PartnerResponse, string>({
      query: (id) => ({
        url: `/admin/partners/${id}`,
      }),
      providesTags: ['Partner'],
    }),

    // Create partner
    createPartner: builder.mutation<PartnerResponse, CreatePartnerData>({
      query: (body) => ({
        url: "/admin/partners",
        method: "POST",
        body,
      }),
      invalidatesTags: ['Partner'],
    }),

    // Update partner
    updatePartner: builder.mutation<PartnerResponse, UpdatePartnerData>({
      query: (body) => ({
        url: `/admin/partners/${body.id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ['Partner'],
    }),

    // Delete partner
    deletePartner: builder.mutation<PartnerResponse, string>({
      query: (id) => ({
        url: "/admin/partners",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ['Partner'],
    }),

    // Update partner status
    updatePartnerStatus: builder.mutation<PartnerResponse, { id: string; status: string }>({
      query: (body) => ({
        url: "/admin/partners/status",
        method: "PUT",
        body,
      }),
      invalidatesTags: ['Partner'],
    }),
  }),
});

export const {
  useGetPartnersQuery,
  useGetPartnerByIdQuery,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useDeletePartnerMutation,
  useUpdatePartnerStatusMutation,
} = partnersApi;
```

---

## Hooks Reference

| Hook | Method | Endpoint |
|------|--------|----------|
| `useGetPartnersQuery(params?)` | GET | `/api/admin/partners` |
| `useGetPartnerByIdQuery(id)` | GET | `/api/admin/partners/:id` |
| `useCreatePartnerMutation()` | POST | `/api/admin/partners` |
| `useUpdatePartnerMutation()` | PUT | `/api/admin/partners/:id` |
| `useDeletePartnerMutation()` | DELETE | `/api/admin/partners?id=` |
| `useUpdatePartnerStatusMutation()` | PUT | `/api/admin/partners/status` |

---

## Notes

- Partners use two tables: `partners_account` (credentials + status) and `partners_information` (profile details), joined on `partner_id`.
- `createPartner` wraps both inserts in a **transaction** — rolls back if either insert fails.
- New partners default to `status: 'pending'` and `type: 'hotel'` with `commission_rate: 10.00`.
- A welcome email is sent via `sendPartnerWelcomeEmail` after creation; email failure does not fail the request.
- Valid statuses for `updatePartnerStatus`: `active`, `pending`, `suspended`.
- `getAllPartners` supports `?status=active|pending|suspended` and `?search=` (searches name, email, phone via `ILIKE`).
