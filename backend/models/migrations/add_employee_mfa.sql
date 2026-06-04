-- Migration: add email-OTP MFA support for employees (CSR/admin/Owner/Cleaner)
-- Safe to run multiple times (IF NOT EXISTS).
-- Run this against your database before using the MFA toggle in CSR Settings.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;

-- MFA login codes reuse the existing otp_verification table with
-- otp_type = 'MFA_LOGIN' (no schema change needed there).
