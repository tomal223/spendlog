import { query } from '../_db.js';
import { verifyToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });

  const userId = verifyToken(req);
  if (!userId) return json(res, 401, { error: 'Unauthorized' });

  const { id } = req.query;
  await query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
  json(res, 200, { ok: true });
}
