-- =========================================================
-- AI Hackathon Portal - Seed Script
-- Populates the single initial Super Admin, settings, and base documents only
-- =========================================================

-- Initial Super Admin (password: admin123)
-- bcrypt hash of 'admin123' at cost 12
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

-- Configuration Settings (Section 9.1 Defaults)
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
('support_phone', '"+880 1712-345678"')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
