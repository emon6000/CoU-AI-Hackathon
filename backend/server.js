const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
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
    return res.status(400).json({
      ok: false,
      message: 'Supabase credentials are not configured yet.',
    });
  }

  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1);

    if (error) {
      throw error;
    }

    res.json({ ok: true, data: data || [] });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Unable to load settings',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'AI Hackathon backend is running',
    endpoints: ['/api/health', '/api/db-test', '/api/settings'],
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
