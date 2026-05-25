import { NextRequest, NextResponse } from 'next/server';
import { createEmployee, getAllEmployees } from '@/backend/controller/employeeController';
import { requireAdmin } from '@/backend/utils/requireAdmin';
import pool from '@/backend/config/db';

// GET /api/admin/employees
//   ?role=CSR   → PUBLIC. Used by the chat widget (Components/MessageButton.tsx)
//                 to list CSR contacts for guest support. Returns ONLY a minimal
//                 public projection (id, first_name, last_name, profile_image_url).
//   no role     → ADMIN ONLY. Returns the full record via the existing controller.
//   ?role=...other → ADMIN ONLY. Same as above.
//
// The public role=CSR carve-out exists because the chat widget renders on the
// public marketplace and needs to show staff contacts to guests. It deliberately
// projects away PII (email, phone, salary, address, hashed password).
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  if (role === 'CSR') {
    try {
      const result = await pool.query(
        `SELECT id::text, first_name, last_name, profile_image_url, role
           FROM employees
          WHERE role = 'CSR'
          ORDER BY first_name, last_name`
      );
      return NextResponse.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load CSR list';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return getAllEmployees(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return createEmployee(request);
}
