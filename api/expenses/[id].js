import { query } from '../_db.js';
import { verifyToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = verifyToken(req);
  if (!userId) return json(res, 401, { error: 'Unauthorized' });

  const { id } = req.query;

  if (req.method === 'DELETE') {
    await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'PUT') {
    const { amount, category, note, date } = req.body || {};
    if (!amount || !category || !date) return json(res, 400, { error: 'Missing fields' });
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return json(res, 400, { error: 'Invalid amount' });

    await query(
      `UPDATE expenses SET amount = $1, category = $2, note = $3, date = $4
       WHERE id = $5 AND user_id = $6`,
      [parseFloat(amount), category, note || '', date, id, userId]
    );
    return json(res, 200, { ok: true });
  }

  json(res, 405, { error: 'Method not allowed' });
}
