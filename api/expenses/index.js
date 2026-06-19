import { query, setupSchema } from '../_db.js';
import { verifyToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = verifyToken(req);
  if (!userId) return json(res, 401, { error: 'Unauthorized' });

  await setupSchema();

  // GET /api/expenses?month=2026-06
  if (req.method === 'GET') {
    const { month } = req.query;
    let rows;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      rows = await query(
        `SELECT id, amount, category, note, date::text
         FROM expenses
         WHERE user_id = $1
           AND date_trunc('month', date) = date_trunc('month', $2::date)
         ORDER BY date DESC, created_at DESC`,
        [userId, month + '-01']
      );
    } else {
      rows = await query(
        `SELECT id, amount, category, note, date::text
         FROM expenses
         WHERE user_id = $1
         ORDER BY date DESC, created_at DESC
         LIMIT 500`,
        [userId]
      );
    }
    return json(res, 200, { expenses: rows.map(r => ({ ...r, amount: parseFloat(r.amount) })) });
  }

  // POST /api/expenses
  if (req.method === 'POST') {
    const { id, amount, category, note, date } = req.body || {};
    if (!id || !amount || !category || !date) return json(res, 400, { error: 'Missing fields' });
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return json(res, 400, { error: 'Invalid amount' });

    await query(
      `INSERT INTO expenses (id, user_id, amount, category, note, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [id, userId, parseFloat(amount), category, note || '', date]
    );
    return json(res, 201, { ok: true });
  }

  json(res, 405, { error: 'Method not allowed' });
}
