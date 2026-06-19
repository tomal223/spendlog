import bcrypt from 'bcryptjs';
import { query, setupSchema } from '../_db.js';
import { signToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return json(res, 400, { error: 'Email and password required' });

  try {
    await setupSchema();
    const rows = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user) return json(res, 401, { error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return json(res, 401, { error: 'Invalid email or password' });

    json(res, 200, { token: signToken(user.id), email: user.email });
  } catch (err) {
    console.error(err);
    json(res, 500, { error: 'Server error' });
  }
}
