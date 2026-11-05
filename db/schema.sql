-- =========================================================
-- AI Hackathon Portal - Complete PostgreSQL Database Schema
-- Matches Section 10 Specification
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Staff Accounts (Super Admin, Moderator, Judge)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  role VARCHAR(12) NOT NULL CHECK (role IN ('super_admin','moderator','judge')),
  active BOOLEAN NOT NULL DEFAULT true,
  failed_logins INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name VARCHAR(60) NOT NULL,
  university VARCHAR(120) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','payment_correction','approved','rejected')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMPTZ,
  is_finalist BOOLEAN NOT NULL DEFAULT false,
  finalist_set_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_team_name ON teams (lower(team_name));
CREATE INDEX idx_team_status ON teams (status);

-- Team Accounts
CREATE TABLE team_accounts (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  login_email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  credentials_sent BOOLEAN NOT NULL DEFAULT false,
  credentials_sent_at TIMESTAMPTZ,
  failed_logins INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_leader BOOLEAN NOT NULL DEFAULT false,
  full_name VARCHAR(100) NOT NULL,
  student_id VARCHAR(40) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  department VARCHAR(80),
  year VARCHAR(20),
  id_card_key TEXT NOT NULL,
  UNIQUE (team_id, student_id)
);
CREATE UNIQUE INDEX uq_one_leader ON members (team_id) WHERE is_leader;

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL CHECK (method IN ('bkash','nagad','rocket')),
  sender_no VARCHAR(20) NOT NULL,
  trx_id VARCHAR(40) NOT NULL,
  amount NUMERIC(10,2),
  verified_by UUID REFERENCES staff(id),
  verified_at TIMESTAMPTZ,
  UNIQUE (method, trx_id)
);

-- One-Time Payment Correction Tokens
CREATE TABLE correction_tokens (
  token_hash TEXT PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- Configuration Settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES staff(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scenario Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(120) NOT NULL,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('guideline','rulebook','problem_statement','other')),
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes BIGINT,
  visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deadline Overrides per Team
CREATE TABLE deadline_overrides (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  online_end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  set_by UUID REFERENCES staff(id)
);

-- Online Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  abstract VARCHAR(350) NOT NULL CHECK (char_length(abstract) <= 350),
  repo_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GitHub Repository Snapshots
CREATE TABLE repo_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  commit_sha CHAR(40),
  branch TEXT,
  captured_at TIMESTAMPTZ,
  zip_key TEXT,
  zip_size_bytes BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','ok','failed','repo_not_public','too_large')),
  error TEXT,
  attempts INT NOT NULL DEFAULT 0
);

-- Reviews (Online Round, one per judge per submission)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES staff(id),
  score NUMERIC(6,2) NOT NULL CHECK (score >= 0),
  comment TEXT NOT NULL,
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, judge_id)
);

-- On-Site Scores (Phase 2)
CREATE TABLE onsite_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES staff(id),
  score NUMERIC(6,2) NOT NULL CHECK (score >= 0),
  comment TEXT,
  is_final BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, judge_id)
);

-- Check-ins (Event Day Reception)
CREATE TABLE checkins (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES staff(id),
  members_present INT
);

-- Final Published Results
CREATE TABLE final_results (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  online_avg NUMERIC(6,2),
  onsite_avg NUMERIC(6,2),
  final_score NUMERIC(6,2),
  rank INT,
  prize_label VARCHAR(60),
  published BOOLEAN NOT NULL DEFAULT false
);

-- Audit Trail
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_type VARCHAR(10),
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO staff (id, name, email, password_hash, must_change_password, role, active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Super Admin CoU',
  'admin@cou.ac.bd',
  '$2b$12$e8wWwPcvZ/HhYyN8u4gD8.Kz9Qf5L0Vl0q6q1Z8kLhZ7vH2r5pZ.u',
  false,
  'super_admin',
  true
) ON CONFLICT (email) DO NOTHING;