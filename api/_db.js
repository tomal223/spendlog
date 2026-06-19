import pkg from 'pg';
const { Pool } = pkg;

let _pool;
function getPool() {
  if (!_pool) {
    // Strip sslmode from URL — pg v8 treats sslmode=require as verify-full,
    // rejecting Supabase's cert. We handle SSL via the ssl option instead.
    const connStr = (process.env.DATABASE_URL || '')
      .replace(/[?&]sslmode=[^&]*/g, '')
      .replace(/[?&]channel_binding=[^&]*/g, '')
      .replace(/\?&/, '?').replace(/&&/g, '&').replace(/[?&]$/, '');
    _pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
  }
  return _pool;
}

export async function query(text, params) {
  const pool = getPool();
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function setupSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id         TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount     NUMERIC(12,2) NOT NULL,
      category   TEXT NOT NULL,
      note       TEXT DEFAULT '',
      date       DATE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS expenses_user_date ON expenses(user_id, date DESC)
  `);
}
