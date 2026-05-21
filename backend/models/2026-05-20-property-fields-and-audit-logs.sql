-- 2026-05-20 — Phase 5: Property fields completeness + system-wide audit logs.
--
-- Adds the property fields the spec listed but were not yet captured (policies,
-- security deposit, extra pax fee, video, virtual tour, Google Map pin), and
-- creates `audit_logs` — a single append-only table that records every important
-- state change so admins can answer "who did what, when, to which entity, why".

BEGIN;

-- =========================================================================
-- 1) Property fields on havens
-- =========================================================================
ALTER TABLE havens
  -- Map / location
  ADD COLUMN IF NOT EXISTS google_map_lat       NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS google_map_lng       NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS google_map_address   TEXT,
  -- Policies (free text so partners can write what they want)
  ADD COLUMN IF NOT EXISTS house_rules          TEXT,
  ADD COLUMN IF NOT EXISTS smoking_policy       TEXT,
  ADD COLUMN IF NOT EXISTS pet_policy           TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy  TEXT,
  -- Financial
  ADD COLUMN IF NOT EXISTS security_deposit     NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_pax_fee        NUMERIC(10,2) DEFAULT 0,
  -- Media
  ADD COLUMN IF NOT EXISTS video_url            TEXT,
  ADD COLUMN IF NOT EXISTS video_public_id      TEXT,
  ADD COLUMN IF NOT EXISTS virtual_tour_url     TEXT;

-- =========================================================================
-- 2) Audit logs — single append-only table for system-wide state changes
-- =========================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  action        TEXT NOT NULL,             -- e.g. 'haven.approved', 'payout.marked_paid', 'partner.suspended'
  entity_type   TEXT NOT NULL,             -- 'haven' | 'partner' | 'payout' | 'amenity_verification' | 'booking'
  entity_id     TEXT NOT NULL,             -- string so it can hold UUIDs or human IDs (BK-XXXX)
  actor_type    TEXT NOT NULL,             -- 'admin' | 'partner' | 'cron' | 'system'
  actor_id      TEXT,                      -- employee id, partner id, etc.
  actor_email   TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {before, after, reason, ip, ...}
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;

-- Verify:
--   \d havens
--   \d audit_logs
--   SELECT COUNT(*) FROM audit_logs;
