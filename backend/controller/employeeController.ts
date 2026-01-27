import { NextRequest, NextResponse } from 'next/server';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import { upload_file } from '../utils/cloudinary';

export type EmployeeRole = 'Owner' | 'Csr' | 'Cleaner' | 'Partner';

export interface Employee {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_id: string;
  hire_date: string;
  role: EmployeeRole;
  department?: string;
  monthly_salary?: number;
  street_address?: string;
  city?: string;
  zip_code?: string;
  created_at?: string;
  updated_at?: string;
  password: string;
  profile_image_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

// CREATE Employee
export const createEmployee = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      employment_id,
      hire_date,
      role,
      department,
      monthly_salary,
      street_address,
      city,
      zip_code,
      password,
      profile_image,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    let profileImageUrl = null;
    if (profile_image) {
      const uploadResult = await upload_file(profile_image, "staycation-haven/profiles");
      profileImageUrl = uploadResult.url;
    }

    const query = `
      INSERT INTO employees (
        first_name, last_name, email, phone, employment_id,
        hire_date, role, department, monthly_salary,
        street_address, city, zip_code, password, profile_image_url,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      first_name,
      last_name,
      email,
      phone,
      employment_id,
      hire_date,
      role,
      department,
      monthly_salary,
      street_address,
      city,
      zip_code,
      hashedPassword,
      profileImageUrl,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      'active'
    ];

    const result = await pool.query(query, values);
    console.log('✅ Employee Created:', result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Employee created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.log('❌ Error Creating employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create employee',
    }, { status: 500 });
  }
};

// GET Employee by ID
export const getEmployeeById = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || segments.pop(); // handle trailing slash

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Employee ID is required" },
        { status: 400 }
      );
    }

    const query = `SELECT * FROM employees WHERE id = $1 LIMIT 1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.log("❌ Error getting employee:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get employee",
      },
      { status: 500 }
    );
  }
};

// GET All Employees
export const getAllEmployees = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let query = 'SELECT * FROM employees';
    let values: any[] = [];

    if (role) {
      query += ' WHERE role = $1';
      values.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    console.log(`✅ Retrieved ${result.rows.length} employees`);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });

  } catch (error: any) {
    console.log('❌ Error getting employees:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get employees',
    }, { status: 500 });
  }
};

// UPDATE Employee
export const updateEmployee = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const { id, profile_image_url, ...employeeData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID is required',
      }, { status: 400 });
    }

    // Handle profile image upload to Cloudinary if it's a base64 string
    let profileImageUrl = profile_image_url;
    if (profile_image_url && profile_image_url.startsWith('data:image')) {
      const uploadResult = await upload_file(profile_image_url, "staycation-haven/profiles");
      profileImageUrl = uploadResult.url;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Add profile_image_url if it exists
    if (profileImageUrl) {
      fields.push(`profile_image_url = $${paramCount}`);
      values.push(profileImageUrl);
      paramCount++;
    }

    Object.entries(employeeData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No fields to update',
      }, { status: 400 });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE employees
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found',
      }, { status: 404 });
    }

    console.log('✅ Employee updated:', result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Employee updated successfully',
    });

  } catch (error: any) {
    console.log('❌ Error updating employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update employee',
    }, { status: 500 });
  }
};

// DELETE Employee
export const deleteEmployee = async (req: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Employee ID is required',
      }, { status: 400 });
    }

    const query = `DELETE FROM employees WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found',
      }, { status: 404 });
    }

    console.log('✅ Employee deleted:', result.rows[0]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Employee deleted successfully',
    });

  } catch (error: any) {
    console.log('❌ Error deleting employee:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete employee',
    }, { status: 500 });
  }
};

//Login Employee 
export const loginEmployee = async (req: NextRequest):Promise <NextResponse> => {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required"},
        { status: 400 }
      )
    }

    const findQuery = `SELECT id, first_name, last_name, email, phone, employment_id, hire_date, role, department, monthly_salary, street_address, city, zip_code, password, profile_image_url, emergency_contact_name, emergency_contact_phone, emergency_contact_relation FROM employees WHERE email = $1 LIMIT 1`;

    const userResult = await pool.query(findQuery, [email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password"},
        { status: 401}
      )
    }

    const employee = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401}
      )
    }

    const adminRoles = ['Owner', 'Csr', 'Cleaner', 'Partner'];
    
    if (!adminRoles.includes(employee.role)) {
      return NextResponse.json({
        success: false, error: "You do not have admin access"
      },
      { status: 403 }
    )
    }

    console.log("Employee logged in. ", employee.email)
    console.log("Attempting to create activity log for employee ID:", employee.id);

    // Create activity log for login
    try {
      const activityLogResult = await pool.query(
        `INSERT INTO staff_activity_logs (employment_id, action_type, action, details, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [
          employee.id,
          'login',
          'Logged into system',
          `${employee.first_name} ${employee.last_name} logged in successfully`
        ]
      );
      console.log('✅ Activity log created for login:', activityLogResult.rows[0]);
    } catch (logError: any) {
      console.error('❌ Failed to create activity log:', logError);
      console.error('Error details:', {
        message: logError?.message,
        code: logError?.code,
        detail: logError?.detail
      });
      // Don't fail the login if activity log creation fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Login successfully",
        user: {
          id: employee.id,
          email: employee.email,
          name: `${employee.first_name} ${employee.last_name}`,
          phone: employee.phone,
          employment_id: employee.employment_id,
          hire_date: employee.hire_date,
          role: employee.role,
          department: employee.department,
          monthly_salary: employee.monthly_salary,
          street_address: employee.street_address,
          city: employee.city,
          zip_code: employee.zip_code,
          profile_image_url: employee.profile_image_url,
          emergency_contact_name: employee.emergency_contact_name,
          emergency_contact_phone: employee.emergency_contact_phone,
          emergency_contact_relation: employee.emergency_contact_relation
        }
      },
      { status: 200 }
    )
  } catch(error) {
    console.log("Login failed")
    return NextResponse.json({
      success: false, error: "Login Failed"
    })
  }
}