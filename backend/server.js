const path = require('node:path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const backendEnvPath = path.resolve(__dirname, '.env');
dotenv.config({ path: backendEnvPath });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  dotenv.config();
}

const app = express();
const PORT = Number(process.env.PORT && process.env.PORT !== '3000' ? process.env.PORT : 4000);

const DEFAULT_STAFF = [
  {
    id: 'staff-admin-1',
    name: 'Super Admin CoU',
    email: 'admin@cou.ac.bd',
    role: 'super_admin',
    active: true,
    temporaryPassword: 'admin123',
    mustChangePassword: false,
    createdAt: new Date().toISOString(),
  },
];

const TEAM_STORE = [];

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
  if (!supabase) {
    return res.json({ ok: true, data: [DEFAULT_SETTINGS] });
  }

  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1);

    if (error) {
      throw error;
    }

    res.json({ ok: true, data: data || [DEFAULT_SETTINGS] });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Unable to load settings',
      error: error.message,
    });
  }
});

app.get('/api/admin/settings', (req, res) => {
  res.json({ success: true, settings: DEFAULT_SETTINGS });
});

app.post('/api/auth/staff-login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const staff = DEFAULT_STAFF.find((member) => member.email.toLowerCase() === cleanEmail);

  if (!staff) {
    return res.status(400).json({ success: false, error: 'Staff account not found.' });
  }

  if (!staff.active) {
    return res.status(403).json({ success: false, error: 'This staff account has been deactivated.' });
  }

  if (staff.temporaryPassword && String(password || '') !== String(staff.temporaryPassword)) {
    return res.status(401).json({ success: false, error: 'Invalid staff password.' });
  }

  const token = jwt.sign(
    { sub: staff.id, role: staff.role, email: cleanEmail },
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
      email: cleanEmail,
      mustChangePassword: Boolean(staff.mustChangePassword),
    },
  });
});

app.post('/api/auth/team-login', (req, res) => {
  const { email, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const team = TEAM_STORE.find((item) => item.account?.loginEmail?.toLowerCase() === cleanEmail);

  if (!team) {
    return res.status(400).json({ success: false, error: 'Team account not found.' });
  }

  if (team.status !== 'approved') {
    return res.status(403).json({ success: false, error: `Team status is currently '${team.status}'.` });
  }

  if (team.account?.temporaryPassword && String(password || '') !== String(team.account.temporaryPassword)) {
    return res.status(401).json({ success: false, error: 'Invalid password.' });
  }

  const leader = team.members.find((member) => member.isLeader) || team.members[0];
  const token = jwt.sign(
    { sub: team.id, role: 'team', email: cleanEmail },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '8h' }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: team.id,
      name: leader ? leader.fullName : team.teamName,
      email: cleanEmail,
      teamId: team.id,
      mustChangePassword: Boolean(team.account?.mustChangePassword),
    },
  });
});

app.get('/api/admin/teams', (req, res) => {
  res.json({ success: true, teams: TEAM_STORE });
});

app.post('/api/teams/register', (req, res) => {
  const teamData = req.body || {};
  const teamName = String(teamData.teamName || '').trim();

  if (!teamName) {
    return res.status(400).json({ success: false, error: 'Team name is required.' });
  }

  const memberList = Array.isArray(teamData.members) ? teamData.members : [];
  const teamExists = TEAM_STORE.some((team) => team.teamName.toLowerCase() === teamName.toLowerCase());

  if (teamExists) {
    return res.status(409).json({ success: false, error: `Team name "${teamName}" is already registered.` });
  }

  const newTeam = {
    ...teamData,
    id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    isFinalist: false,
    createdAt: new Date().toISOString(),
    members: memberList,
  };

  TEAM_STORE.unshift(newTeam);

  return res.json({
    success: true,
    teamId: newTeam.id,
    message: 'Team registration received. Awaiting admin approval.',
  });
});

app.post('/api/admin/teams/approve', (req, res) => {
  const { teamId } = req.body || {};
  const team = TEAM_STORE.find((item) => item.id === teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: 'Team not found.' });
  }

  const leader = team.members.find((member) => member.isLeader) || team.members[0];
  const loginEmail = String(leader?.email || team.account?.loginEmail || '').trim();
  const temporaryPassword = `cou_${Math.random().toString(36).substring(2, 8)}!`;

  team.status = 'approved';
  team.account = {
    loginEmail,
    temporaryPassword,
    mustChangePassword: true,
    credentialsSent: false,
  };
  team.reviewedBy = 'super_admin';
  team.reviewedAt = new Date().toISOString();

  return res.json({
    success: true,
    email: loginEmail,
    temporaryPassword,
  });
});

app.post('/api/admin/teams/reject', (req, res) => {
  const { teamId, reason } = req.body || {};
  const team = TEAM_STORE.find((item) => item.id === teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: 'Team not found.' });
  }

  team.status = 'rejected';
  team.adminNote = reason || 'Registration rejected.';

  return res.json({ success: true });
});

app.post('/api/admin/teams/correction', (req, res) => {
  const { teamId, reason } = req.body || {};
  const team = TEAM_STORE.find((item) => item.id === teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: 'Team not found.' });
  }

  const token = `token-${teamId}-${Date.now()}`;
  team.status = 'payment_correction';
  team.adminNote = reason || 'Action required for payment correction.';

  return res.json({ success: true, token });
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
