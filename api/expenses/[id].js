import { getDb } from '../_db.js';
import { verifyToken, cors, json } from '../_auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });

  const userId = verifyToken(req);
  if (!userId) return json(res, 401, { error: 'Unauthorized' });

  const { id } = req.query;
  const sql = getDb();
  await sql`DELETE FROM expenses WHERE id = ${id} AND user_id = ${userId}`;
  json(res, 200, { ok: true });
}
