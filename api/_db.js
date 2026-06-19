import pkg from 'pg';
const { Pool } = pkg;

let _pool;
function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1, // keep connections low in serverless
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
