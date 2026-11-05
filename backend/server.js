const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const backendEnvPath = path.resolve(__dirname, '.env');
dotenv.config({ path: backendEnvPath });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  dotenv.config();
}

const app = express();
const PORT = Number(process.env.PORT && process.env.PORT !== '3000' ? process.env.PORT : 4000);

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

const DEFAULT_SETTINGS = {
  event_name: 'AI Hackathon, Engineering Faculty',
  event_venue: 'Comilla University, Kotbari, Cumilla',
  event_start_at: '2026-11-20T09:00:00Z',
  registration_open_at: '2026-11-01T00:00:00Z',
  registration_close_at: '2026-11-15T23:59:59Z',
  registration_fee_bdt: 1000,
  support_email: 'hackathon@cou.ac.bd',
  support_phone: '+880 1712-345678',
};

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const getDbClient = () => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
};

const normalizeSettingsRecord = (rows = []) => {
  const item = { ...DEFAULT_SETTINGS };

  for (const row of rows) {
    if (!row || !row.key) {
      continue;
    }

    item[row.key] = row.value ?? item[row.key];
  }

  return item;
};

const ensureDefaultSettings = async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  const client = getDbClient();
  if (!client) {
    return;
  }

  try {
    await client.connect();
    const existing = await client.query(`SELECT key FROM public.settings`);
    const keys = new Set(existing.rows.map((row) => row.key));

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (!keys.has(key)) {
        await client.query(
          `INSERT INTO public.settings (key, value, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (key) DO NOTHING`,
          [key, JSON.stringify(value)]
        );
      }
    }
  } catch (error) {
    console.warn('Could not ensure default settings:', error.message);
  } finally {
    await client.end();
  }
};

const ensureDefaultSuperAdmin = async () => {
  if (!process.env.DATABASE_URL) {
    return;
  }

  const client = getDbClient();
  if (!client) {
    return;
  }

  try {
    await client.connect();
    const defaultEmail = 'admin@cou.ac.bd';
    const passwordHash = await bcrypt.hash('admin123', 12);
    const existing = await client.query(
      `SELECT id, password_hash FROM public.staff WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [defaultEmail]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO public.staff (id, name, email, password_hash, must_change_password, role, active)
         VALUES ($1, $2, $3, $4, false, 'super_admin', true)`,
        [randomUUID(), 'Super Admin CoU', defaultEmail, passwordHash]
      );
      console.log('Seeded default super admin account: admin@cou.ac.bd / admin123');
      return;
    }

    const currentHash = existing.rows[0].password_hash;
    if (!(await bcrypt.compare('admin123', currentHash))) {
      await client.query(
        `UPDATE public.staff
         SET password_hash = $1,
             name = 'Super Admin CoU',
             role = 'super_admin',
             active = true,
             must_change_password = false
         WHERE id = $2`,
        [passwordHash, existing.rows[0].id]
      );
      console.log('Repaired default super admin account hash for admin@cou.ac.bd');
    }
  } catch (error) {
    console.warn('Could not ensure default super admin:', error.message);
  } finally {
    await client.end();
  }
};

ensureDefaultSettings().catch((error) => {
  console.warn('Default settings bootstrap failed:', error.message);
});

ensureDefaultSuperAdmin().catch((error) => {
  console.warn('Default admin bootstrap failed:', error.message);
});

app.get('/api/health', async (req, res) => {
  const health = {
    ok: true,
    service: 'ai-hackathon-backend',
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(supabase),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  };

  res.json(health);
});

app.get('/api/db-test', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(400).json({
      ok: false,
      message: 'DATABASE_URL is not configured yet. Add it in Render or your local .env file.',
    });
  }

  const client = getDbClient();

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() AS current_time');
    res.json({ ok: true, time: result.rows[0].current_time });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Database connection failed',
      error: error.message,
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.get('/api/settings', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ ok: true, data: [DEFAULT_SETTINGS] });
  }

  const client = getDbClient();

  try {
    await client.connect();
    const result = await client.query(`SELECT key, value FROM public.settings`);
    const settings = normalizeSettingsRecord(result.rows);
    return res.json({ ok: true, data: [settings], settings });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Unable to load settings',
      error: error.message,
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.get('/api/admin/settings', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ success: true, settings: DEFAULT_SETTINGS });
  }

  const client = getDbClient();

  try {
    await client.connect();
    const result = await client.query(`SELECT key, value FROM public.settings`);
    const settings = normalizeSettingsRecord(result.rows);
    return res.json({ success: true, settings, data: settings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load admin settings',
      error: error.message,
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.post('/api/admin/settings', async (req, res) => {
  const incoming = req.body && req.body.settings ? req.body.settings : req.body || {};
  if (!process.env.DATABASE_URL) {
    const merged = { ...DEFAULT_SETTINGS, ...incoming };
    return res.json({ success: true, settings: merged });
  }

  const client = getDbClient();

  try {
    await client.connect();
    const existing = await client.query(`SELECT key, value FROM public.settings`);
    const current = normalizeSettingsRecord(existing.rows);
    const merged = { ...current, ...incoming };

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      if (key in merged) {
        await client.query(
          `INSERT INTO public.settings (key, value, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, JSON.stringify(merged[key])]
        );
      }
    }

    return res.json({ success: true, settings: merged });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to save settings',
      error: error.message,
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.get('/api/documents', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ success: true, documents: [] });
  }

  const client = getDbClient();

  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, title, kind, file_key AS "fileKey", file_name AS "fileName", size_bytes AS "sizeBytes",
              visible, sort_order AS "sortOrder", uploaded_by AS "uploadedBy", created_at AS "createdAt"
       FROM public.documents
       ORDER BY sort_order ASC, created_at DESC`
    );

    return res.json({
      success: true,
      documents: result.rows.map((doc) => ({
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
        fileKey: doc.fileKey,
        fileName: doc.fileName,
        sizeBytes: Number(doc.sizeBytes || 0),
        visible: Boolean(doc.visible),
        sortOrder: Number(doc.sortOrder || 0),
        uploadedBy: doc.uploadedBy || '',
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load documents', error: error.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.post('/api/admin/documents', async (req, res) => {
  const doc = req.body || {};
  const title = String(doc.title || '').trim();
  const kind = String(doc.kind || 'other');
  const fileKey = String(doc.fileKey || '').trim();
  const fileName = String(doc.fileName || '').trim();

  if (!title || !fileKey || !fileName) {
    return res.status(400).json({ success: false, error: 'Title, file key, and file name are required.' });
  }

  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `INSERT INTO public.documents (id, title, kind, file_key, file_name, size_bytes, visible, sort_order, uploaded_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id, title, kind, file_key AS "fileKey", file_name AS "fileName", size_bytes AS "sizeBytes",
                 visible, sort_order AS "sortOrder", uploaded_by AS "uploadedBy", created_at AS "createdAt"`,
      [randomUUID(), title, kind, fileKey, fileName, Number(doc.sizeBytes || 0), Boolean(doc.visible !== false), Number(doc.sortOrder || 0), doc.uploadedBy || null]
    );

    const created = result.rows[0];
    return res.json({
      success: true,
      document: {
        id: created.id,
        title: created.title,
        kind: created.kind,
        fileKey: created.fileKey,
        fileName: created.fileName,
        sizeBytes: Number(created.sizeBytes || 0),
        visible: Boolean(created.visible),
        sortOrder: Number(created.sortOrder || 0),
        uploadedBy: created.uploadedBy || '',
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to save document.', detail: error.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.patch('/api/admin/documents/:id/visibility', async (req, res) => {
  const { id } = req.params;
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `UPDATE public.documents SET visible = NOT visible WHERE id = $1 RETURNING id, visible`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    return res.json({ success: true, visible: result.rows[0].visible });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to update document visibility.', detail: error.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.delete('/api/admin/documents/:id', async (req, res) => {
  const { id } = req.params;
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(`DELETE FROM public.documents WHERE id = $1 RETURNING id`, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Document not found.' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to delete document.', detail: error.message });
  } finally {
    if (client) {
      await client.end();
    }
  }
});

app.post('/api/auth/staff-login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, name, email, password_hash, must_change_password, role, active, failed_logins, locked_until
       FROM public.staff
       WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    const staff = result.rows[0];
    if (!staff) {
      return res.status(400).json({ success: false, error: 'Staff account not found.' });
    }

    if (staff.locked_until && new Date(staff.locked_until) > new Date()) {
      return res.status(423).json({ success: false, error: 'This staff account is temporarily locked.' });
    }

    if (!staff.active) {
      return res.status(403).json({ success: false, error: 'This staff account has been deactivated.' });
    }

    const passwordMatches = await bcrypt.compare(password, staff.password_hash);
    if (!passwordMatches) {
      const failedLogins = Number(staff.failed_logins || 0) + 1;
      const lockUntil = failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

      await client.query(
        `UPDATE public.staff SET failed_logins = $1, locked_until = $2 WHERE id = $3`,
        [failedLogins, lockUntil, staff.id]
      );

      return res.status(401).json({
        success: false,
        error: failedLogins >= 5 ? 'Too many failed attempts. Account locked for 15 minutes.' : 'Invalid staff password.',
      });
    }

    await client.query(
      `UPDATE public.staff SET failed_logins = 0, locked_until = NULL WHERE id = $1`,
      [staff.id]
    );

    const token = jwt.sign(
      { sub: staff.id, role: staff.role, email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      role: staff.role,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        mustChangePassword: Boolean(staff.must_change_password),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Unable to authenticate staff account.',
      detail: error.message,
    });
  } finally {
    await client.end();
  }
});

app.post('/api/auth/team-login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password ?? '');

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `SELECT ta.team_id, ta.login_email, ta.password_hash, ta.must_change_password, ta.failed_logins, ta.locked_until,
              t.team_name, t.status
       FROM public.team_accounts ta
       JOIN public.teams t ON t.id = ta.team_id
       WHERE LOWER(ta.login_email) = $1 LIMIT 1`,
      [email]
    );

    const team = result.rows[0];
    if (!team) {
      return res.status(400).json({ success: false, error: 'Team account not found.' });
    }

    if (team.locked_until && new Date(team.locked_until) > new Date()) {
      return res.status(423).json({ success: false, error: 'This team account is temporarily locked.' });
    }

    if (team.status !== 'approved') {
      return res.status(403).json({ success: false, error: `Team status is currently '${team.status}'.` });
    }

    const passwordMatches = await bcrypt.compare(password, team.password_hash);
    if (!passwordMatches) {
      const failedLogins = Number(team.failed_logins || 0) + 1;
      const lockUntil = failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

      await client.query(
        `UPDATE public.team_accounts SET failed_logins = $1, locked_until = $2 WHERE team_id = $3`,
        [failedLogins, lockUntil, team.team_id]
      );

      return res.status(401).json({
        success: false,
        error: failedLogins >= 5 ? 'Too many failed attempts. Team account locked for 15 minutes.' : 'Invalid password.',
      });
    }

    await client.query(
      `UPDATE public.team_accounts SET failed_logins = 0, locked_until = NULL WHERE team_id = $1`,
      [team.team_id]
    );

    const token = jwt.sign(
      { sub: team.team_id, role: 'team', email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: team.team_id,
        name: team.team_name,
        email: team.login_email,
        teamId: team.team_id,
        mustChangePassword: Boolean(team.must_change_password),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Unable to authenticate team account.',
      detail: error.message,
    });
  } finally {
    await client.end();
  }
});

app.get('/api/admin/teams', async (req, res) => {
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const teamResult = await client.query(`
      SELECT t.*, ta.login_email, ta.must_change_password, ta.credentials_sent, ta.credentials_sent_at
      FROM public.teams t
      LEFT JOIN public.team_accounts ta ON ta.team_id = t.id
      ORDER BY t.created_at DESC
    `);
    const membersResult = await client.query(`
      SELECT id, team_id, is_leader, full_name, student_id, email, phone, department, year, id_card_key
      FROM public.members
      ORDER BY team_id, is_leader DESC, full_name ASC
    `);
    const paymentsResult = await client.query(`
      SELECT team_id, method, sender_no, trx_id, amount, verified_at, verified_by
      FROM public.payments
    `);

    const membersByTeam = new Map();
    for (const row of membersResult.rows) {
      if (!membersByTeam.has(row.team_id)) {
        membersByTeam.set(row.team_id, []);
      }
      membersByTeam.get(row.team_id).push({
        id: row.id,
        isLeader: row.is_leader,
        fullName: row.full_name,
        studentId: row.student_id,
        email: row.email,
        phone: row.phone,
        department: row.department || '',
        year: row.year || '',
        idCardFile: row.id_card_key || undefined,
      });
    }

    const paymentByTeam = new Map();
    for (const row of paymentsResult.rows) {
      paymentByTeam.set(row.team_id, {
        method: row.method,
        senderNo: row.sender_no,
        trxId: row.trx_id,
        amount: Number(row.amount || 0),
        verifiedAt: row.verified_at,
        verifiedBy: row.verified_by,
      });
    }

    const teams = teamResult.rows.map((team) => ({
      id: team.id,
      teamName: team.team_name,
      university: team.university,
      description: team.description,
      status: team.status,
      adminNote: team.admin_note,
      reviewedBy: team.reviewed_by,
      reviewedAt: team.reviewed_at,
      isFinalist: Boolean(team.is_finalist),
      finalistSetAt: team.finalist_set_at,
      createdAt: team.created_at,
      members: membersByTeam.get(team.id) || [],
      payment: paymentByTeam.get(team.id) || { method: 'bkash', senderNo: '', trxId: '', amount: 0 },
      account: team.login_email ? {
        loginEmail: team.login_email,
        mustChangePassword: Boolean(team.must_change_password),
        credentialsSent: Boolean(team.credentials_sent),
        credentialsSentAt: team.credentials_sent_at,
      } : undefined,
    }));

    return res.json({ success: true, teams });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to load teams.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/admin/reset-default-admin', async (req, res) => {
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const hash = await bcrypt.hash('admin123', 12);
    const result = await client.query(
      `UPDATE public.staff
       SET password_hash = $1,
           name = 'Super Admin CoU',
           role = 'super_admin',
           active = true,
           must_change_password = false,
           email = LOWER($2)
       WHERE LOWER(email) = LOWER($2)
       RETURNING id, email, role, active`,
      [hash, 'admin@cou.ac.bd']
    );

    if (result.rowCount === 0) {
      const inserted = await client.query(
        `INSERT INTO public.staff (id, name, email, password_hash, must_change_password, role, active)
         VALUES ($1, $2, $3, $4, false, 'super_admin', true)
         RETURNING id, email, role, active`,
        [randomUUID(), 'Super Admin CoU', 'admin@cou.ac.bd', hash]
      );
      return res.json({ success: true, admin: inserted.rows[0], password: 'admin123' });
    }

    return res.json({ success: true, admin: result.rows[0], password: 'admin123' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to reset admin credentials.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.get('/api/admin/staff', async (req, res) => {
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, name, email, role, active, must_change_password, created_at
       FROM public.staff
       ORDER BY created_at DESC`
    );

    return res.json({ success: true, staff: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to load staff accounts.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/admin/staff', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = normalizeEmail(req.body?.email);
  const role = String(req.body?.role || '').trim();

  if (!name || !email || !['moderator', 'judge'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Name, email, and a valid role are required.' });
  }

  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const existing = await client.query(
      `SELECT id FROM public.staff WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email]
    );

    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, error: 'Staff with this email already exists.' });
    }

    const tempPassword = `${role}_${Math.random().toString(36).slice(2, 8)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const staffId = randomUUID();

    const insertResult = await client.query(
      `INSERT INTO public.staff (id, name, email, password_hash, must_change_password, role, active)
       VALUES ($1, $2, $3, $4, true, $5, true)
       RETURNING id, name, email, role, active, must_change_password, created_at`,
      [staffId, name, email, passwordHash, role]
    );

    return res.json({
      success: true,
      tempPassword,
      staff: insertResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to create staff account.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.patch('/api/admin/staff/:id/toggle-active', async (req, res) => {
  const { id } = req.params;
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `UPDATE public.staff
       SET active = NOT active
       WHERE id = $1
       RETURNING id, active`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff account not found.' });
    }

    return res.json({ success: true, active: result.rows[0].active });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to update staff account.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.delete('/api/admin/staff/:id', async (req, res) => {
  const { id } = req.params;
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const result = await client.query(
      `DELETE FROM public.staff WHERE id = $1 AND role != 'super_admin' RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Staff account not found or cannot be deleted.' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to delete staff account.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/teams/register', async (req, res) => {
  const teamData = req.body || {};
  const teamName = String(teamData.teamName || '').trim();
  const leader = Array.isArray(teamData.members) ? teamData.members.find((member) => member.isLeader) || teamData.members[0] : null;
  const loginEmail = normalizeEmail(leader?.email || teamData.leaderEmail || '');

  if (!teamName) {
    return res.status(400).json({ success: false, error: 'Team name is required.' });
  }

  if (!loginEmail) {
    return res.status(400).json({ success: false, error: 'Team leader email is required.' });
  }

  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();

    const duplicateTeam = await client.query(
      `SELECT id FROM public.teams WHERE LOWER(team_name) = LOWER($1) LIMIT 1`,
      [teamName]
    );
    if (duplicateTeam.rowCount > 0) {
      return res.status(409).json({ success: false, error: `Team name "${teamName}" is already registered.` });
    }

    const teamId = randomUUID();
    const createdAt = new Date().toISOString();
    const temporaryPassword = `cou_${Math.random().toString(36).slice(2, 8)}!`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await client.query(
      `INSERT INTO public.teams (id, team_name, university, description, status, admin_note, reviewed_by, reviewed_at, is_finalist, finalist_set_at, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NULL, NULL, NULL, false, NULL, NOW())`,
      [teamId, teamName, String(teamData.university || '').trim(), String(teamData.description || '').trim()]
    );

    await client.query(
      `INSERT INTO public.team_accounts (team_id, login_email, password_hash, must_change_password, credentials_sent, credentials_sent_at, failed_logins, locked_until, created_at)
       VALUES ($1, $2, $3, true, false, NULL, 0, NULL, NOW())`,
      [teamId, loginEmail, passwordHash]
    );

    if (Array.isArray(teamData.members) && teamData.members.length > 0) {
      for (const member of teamData.members) {
        await client.query(
          `INSERT INTO public.members (id, team_id, is_leader, full_name, student_id, email, phone, department, year, id_card_key)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            randomUUID(),
            teamId,
            Boolean(member.isLeader),
            String(member.fullName || '').trim(),
            String(member.studentId || '').trim(),
            normalizeEmail(member.email || ''),
            String(member.phone || '').trim(),
            String(member.department || '').trim(),
            String(member.year || '').trim(),
            String(member.idCardFile || `${String(member.email || '').trim()}-id`),
          ]
        );
      }
    }

    if (teamData.payment) {
      await client.query(
        `INSERT INTO public.payments (id, team_id, method, sender_no, trx_id, amount, verified_by, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL)`,
        [randomUUID(), teamId, String(teamData.payment.method || 'bkash'), String(teamData.payment.senderNo || ''), String(teamData.payment.trxId || ''), Number(teamData.payment.amount || 0)]
      );
    }

    return res.json({
      success: true,
      teamId,
      message: 'Team registration received. Awaiting admin approval.',
      temporaryPassword,
      email: loginEmail,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to register team.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/admin/teams/approve', async (req, res) => {
  const { teamId } = req.body || {};
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const teamResult = await client.query(`SELECT id, status FROM public.teams WHERE id = $1 LIMIT 1`, [teamId]);
    if (!teamResult.rowCount) {
      return res.status(404).json({ success: false, error: 'Team not found.' });
    }

    const accountResult = await client.query(
      `SELECT login_email FROM public.team_accounts WHERE team_id = $1 LIMIT 1`,
      [teamId]
    );

    const loginEmail = accountResult.rows[0]?.login_email || '';
    const temporaryPassword = `cou_${Math.random().toString(36).substring(2, 8)}!`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await client.query(
      `UPDATE public.teams SET status = 'approved', reviewed_by = NULL, reviewed_at = NOW() WHERE id = $1`,
      [teamId]
    );
    await client.query(
      `UPDATE public.team_accounts SET password_hash = $1, must_change_password = true, credentials_sent = false, credentials_sent_at = NULL WHERE team_id = $2`,
      [passwordHash, teamId]
    );

    return res.json({ success: true, email: loginEmail, temporaryPassword });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to approve team.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/admin/teams/reject', async (req, res) => {
  const { teamId, reason } = req.body || {};
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    await client.query(
      `UPDATE public.teams SET status = 'rejected', admin_note = $1, reviewed_at = NOW() WHERE id = $2`,
      [reason || 'Registration rejected.', teamId]
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to reject team.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.post('/api/admin/teams/correction', async (req, res) => {
  const { teamId, reason } = req.body || {};
  const client = getDbClient();
  if (!client) {
    return res.status(500).json({ success: false, error: 'Database is not configured.' });
  }

  try {
    await client.connect();
    const token = `token-${teamId}-${Date.now()}`;
    await client.query(
      `UPDATE public.teams SET status = 'payment_correction', admin_note = $1, reviewed_at = NOW() WHERE id = $2`,
      [reason || 'Action required for payment correction.', teamId]
    );
    return res.json({ success: true, token });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Unable to request payment correction.', detail: error.message });
  } finally {
    await client.end();
  }
});

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'AI Hackathon backend is running',
    endpoints: ['/api/health', '/api/db-test', '/api/settings', '/api/auth/staff-login', '/api/auth/team-login'],
  });
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
