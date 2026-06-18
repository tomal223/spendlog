import { getDb, setupSchema } from '../_db.js';
import { verifyToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = verifyToken(req);
  if (!userId) return json(res, 401, { error: 'Unauthorized' });

  await setupSchema();
  const sql = getDb();

  // GET /api/expenses?month=2026-06
  if (req.method === 'GET') {
    const { month } = req.query; // "YYYY-MM"
    let rows;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-');
      rows = await sql`
        SELECT id, amount, category, note, date::text
        FROM expenses
        WHERE user_id = ${userId}
          AND date_trunc('month', date) = make_date(${parseInt(y)}, ${parseInt(m)}, 1)
        ORDER BY date DESC, created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT id, amount, category, note, date::text
        FROM expenses
        WHERE user_id = ${userId}
        ORDER BY date DESC, created_at DESC
        LIMIT 500
      `;
    }
    return json(res, 200, { expenses: rows.map(r => ({ ...r, amount: parseFloat(r.amount) })) });
  }

  // POST /api/expenses
  if (req.method === 'POST') {
    const { id, amount, category, note, date } = req.body || {};
    if (!id || !amount || !category || !date) return json(res, 400, { error: 'Missing fields' });
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return json(res, 400, { error: 'Invalid amount' });

    await sql`
      INSERT INTO expenses (id, user_id, amount, category, note, date)
      VALUES (${id}, ${userId}, ${parseFloat(amount)}, ${category}, ${note || ''}, ${date})
      ON CONFLICT (id) DO NOTHING
    `;
    return json(res, 201, { ok: true });
  }

  json(res, 405, { error: 'Method not allowed' });
}
