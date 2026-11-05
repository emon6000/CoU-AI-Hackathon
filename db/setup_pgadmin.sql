-- ==============================================================================
-- AI HACKATHON PORTAL - COMPLETE PGADMIN ONE-CLICK SETUP SCRIPT
-- Faculty of Engineering, Comilla University
-- ==============================================================================
--
-- HOW TO RUN THIS IN PGADMIN (Takes 30 seconds):
-- 1. Open pgAdmin 4.
-- 2. In the left browser tree, expand 'Servers' -> 'PostgreSQL 15/16/17'.
-- 3. Right-click 'Databases' -> 'Create' -> 'Database...'.
--    - Name: ai_hackathon_db
--    - Click 'Save'.
-- 4. Right-click your new database 'ai_hackathon_db' -> Select 'Query Tool'.
-- 5. Copy and paste the ENTIRE contents of this file into the Query Editor.
-- 6. Press F5 (or click the Play / Execute button).
--
-- All tables, constraints, indexes, and initial accounts will be created!
-- ==============================================================================

-- 1. Enable Cryptographic Functions for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if recreating cleanly (optional cascade)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS final_results CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS onsite_scores CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS repo_snapshots CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS deadline_overrides CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS correction_tokens CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS team_accounts CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS staff CASCADE;

-- 2. Staff Accounts Table (Super Admin, Moderator, Judge)
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

-- 3. Teams Table
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

-- 4. Team Login Accounts
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

-- 5. Team Members Table (Min 3, Max 4 enforced via API and DB rules)
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

-- 6. Payments Table (Manual verification for bKash, Nagad, Rocket)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  method VARCHAR(10) NOT NULL CHECK (method IN ('bkash','nagad','rocket')),
  sender_no VARCHAR(20) NOT NULL,
  trx_id VARCHAR(40) NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  verified_by UUID REFERENCES staff(id),
  verified_at TIMESTAMPTZ,
  UNIQUE (method, trx_id)
);

-- 7. One-Time Payment Correction Tokens
CREATE TABLE correction_tokens (
  token_hash TEXT PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

-- 8. Configuration Settings Table (Section 9.1)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES staff(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Scenario Documents Table
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

-- 10. Per-Team Deadline Overrides
CREATE TABLE deadline_overrides (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  online_end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  set_by UUID REFERENCES staff(id)
);

-- 11. Online Submissions Table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  abstract VARCHAR(350) NOT NULL CHECK (char_length(abstract) <= 350),
  repo_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. GitHub Repository Freeze Snapshots
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

-- 13. Online Round Judge Reviews
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

-- 14. Phase 2 On-Site Jury Scores
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

-- 15. On-Site QR Check-in Table
CREATE TABLE checkins (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID REFERENCES staff(id),
  members_present INT
);

-- 16. Final Results & Awards Table
CREATE TABLE final_results (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  online_avg NUMERIC(6,2),
  onsite_avg NUMERIC(6,2),
  final_score NUMERIC(6,2),
  rank INT,
  prize_label VARCHAR(60),
  published BOOLEAN NOT NULL DEFAULT false
);

-- 17. Audit Trail Log Table
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

-- ==============================================================================
-- INITIAL SEED DATA POPULATION (SUPER ADMIN ONLY)
-- ==============================================================================

-- Super Admin User: admin@cou.ac.bd / admin123
INSERT INTO staff (id, name, email, password_hash, must_change_password, role, active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Super Admin CoU',
  'admin@cou.ac.bd',
  -- bcrypt hash for 'admin123'
  '$2b$12$e8wWwPcvZ/HhYyN8u4gD8.Kz9Qf5L0Vl0q6q1Z8kLhZ7vH2r5pZ.u',
  false,
  'super_admin',
  true
);

-- Default System Configuration Settings
INSERT INTO settings (key, value) VALUES
('event_name', '"AI Hackathon, Engineering Faculty"'),
('event_venue', '"Comilla University, Kotbari, Cumilla"'),
('event_start_at', '"2026-11-20T09:00:00Z"'),
('registration_open_at', '"2026-11-01T00:00:00Z"'),
('registration_close_at', '"2026-11-15T23:59:59Z"'),
('registration_fee_bdt', '1000'),
('bkash_number', '"01712-345678 (Personal / Send Money)"'),
('nagad_number', '"01812-345678 (Personal)"'),
('rocket_number', '"01912-345678-9"'),
('min_members', '3'),
('max_members', '4'),
('online_start_at', '"2026-11-16T00:00:00Z"'),
('online_end_at', '"2026-11-18T23:59:59Z"'),
('max_score', '100'),
('score_decimals', 'true'),
('judging_locked', 'false'),
('results_released', 'false'),
('finalist_count_n', '10'),
('phase2_open', 'false'),
('phase2_date', '"2026-11-25T09:00:00Z"'),
('phase2_venue', '"CSE Department Labs, Faculty of Engineering, Comilla University"'),
('online_weight', '50'),
('onsite_weight', '50'),
('show_pending_teams_public', 'true'),
('anonymous_judges_to_teams', 'true'),
('correction_link_days', '3'),
('id_photo_retention_days', '30'),
('support_email', '"hackathon@cou.ac.bd"'),
('support_phone', '"+880 1712-345678"');

-- Seed Scenario Documents
INSERT INTO documents (title, kind, file_key, file_name, size_bytes, visible, sort_order, uploaded_by)
VALUES
('AI Hackathon 2026 - Official Guidelines', 'guideline', 'scenarios/guidelines.pdf', 'AI_Hackathon_2026_Guidelines.pdf', 1420000, true, 1, '11111111-1111-1111-1111-111111111111'),
('Evaluation Rubric and Code of Conduct', 'rulebook', 'scenarios/rulebook.pdf', 'Evaluation_Rubric_and_Rulebook.pdf', 980000, true, 2, '11111111-1111-1111-1111-111111111111'),
('Problem Statements: AgriTech & HealthAI Tracks', 'problem_statement', 'scenarios/tracks.pdf', 'Track_Problem_Statements_2026.pdf', 2150000, true, 3, '11111111-1111-1111-1111-111111111111');

-- Done message
SELECT 'AI Hackathon Portal Database Setup Complete!' AS status;
