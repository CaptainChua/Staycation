CREATE TYPE employee_role AS ENUM ('Owner','CSR','Cleaner','Partner');

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    employment_id VARCHAR(50) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    role employee_role NOT NULL,
    department VARCHAR(100),
    monthly_salary NUMERIC(10,2),
    street_address TEXT,
    city VARCHAR(100),
    zip_code VARCHAR(20),
    password TEXT,
    profile_image_url TEXT,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    login_attempts INT DEFAULT 0,
    last_login TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
