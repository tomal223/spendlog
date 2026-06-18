import bcrypt from 'bcryptjs';
import { getDb, setupSchema } from '../_db.js';
import { signToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return json(res, 400, { error: 'Email and password required' });
  if (password.length < 6) return json(res, 400, { error: 'Password must be at least 6 characters' });

  try {
    await setupSchema();
    const sql = getDb();
    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (email, password_hash) VALUES (${email.toLowerCase().trim()}, ${hash})
      RETURNING id, email
    `;
    const user = rows[0];
    json(res, 201, { token: signToken(user.id), email: user.email });
  } catch (err) {
    if (err.message?.includes('unique')) return json(res, 409, { error: 'Email already registered' });
    console.error(err);
    json(res, 500, { error: 'Server error' });
  }
}
