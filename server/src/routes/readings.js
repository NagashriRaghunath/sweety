const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { SLOTS, MAX_READINGS_PER_DAY, validateReading, isValidISODate } = require('../validation');

const router = express.Router();
router.use(requireAuth); // every route below needs a logged-in user

const SLOT_ORDER = "array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner'], slot)";

// Checks the per-day rules against other readings on that date.
// excludeId lets an edited reading ignore itself.
async function checkDayRules(userId, readingDate, slot, excludeId = null) {
  const { rows } = await pool.query(
    'SELECT slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND id <> COALESCE($3, -1)',
    [userId, readingDate, excludeId]
  );
  // Check the daily limit first: with 4 slots, a 5th reading would always also be a duplicate slot
  if (rows.length >= MAX_READINGS_PER_DAY) {
    return { status: 400, error: 'You can add only 4 readings per day.' };
  }
  if (rows.some((r) => r.slot === slot)) {
    return { status: 409, error: `You already have an ${SLOTS[slot]} reading for this date.` };
  }
  return null;
}

// GET /api/readings?date=YYYY-MM-DD&page=1&limit=20
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const params = [req.user.id];
  let where = 'user_id = $1';
  if (req.query.date) {
    if (!isValidISODate(req.query.date)) return res.status(400).json({ error: 'Please enter a valid date.' });
    params.push(req.query.date);
    where += ` AND reading_date = $${params.length}`;
  }

  const total = await pool.query(`SELECT COUNT(*)::int AS count FROM readings WHERE ${where}`, params);
  const { rows } = await pool.query(
    `SELECT id, reading_date, slot, value FROM readings WHERE ${where}
     ORDER BY reading_date DESC, ${SLOT_ORDER}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({ readings: rows, page, limit, total: total.rows[0].count });
});

// POST /api/readings
router.post('/', async (req, res) => {
  const { reading_date, slot, value } = req.body;

  const error = validateReading({ reading_date, slot, value });
  if (error) return res.status(400).json({ error });

  const dayError = await checkDayRules(req.user.id, reading_date, slot);
  if (dayError) return res.status(dayError.status).json({ error: dayError.error });

  const { rows } = await pool.query(
    `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)
     RETURNING id, reading_date, slot, value`,
    [req.user.id, reading_date, slot, Number(value)]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/readings/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const existing = await pool.query('SELECT * FROM readings WHERE id = $1 AND user_id = $2', [id, req.user.id]);
  if (existing.rowCount === 0) return res.status(404).json({ error: 'Reading not found.' });

  // Fields not sent keep their current value
  const current = existing.rows[0];
  const reading_date = req.body.reading_date ?? current.reading_date;
  const slot = req.body.slot ?? current.slot;
  const value = req.body.value ?? current.value;

  const error = validateReading({ reading_date, slot, value });
  if (error) return res.status(400).json({ error });

  const dayError = await checkDayRules(req.user.id, reading_date, slot, id);
  if (dayError) return res.status(dayError.status).json({ error: dayError.error });

  const { rows } = await pool.query(
    `UPDATE readings SET reading_date = $1, slot = $2, value = $3, updated_at = now()
     WHERE id = $4 AND user_id = $5 RETURNING id, reading_date, slot, value`,
    [reading_date, slot, Number(value), id, req.user.id]
  );
  res.json(rows[0]);
});

// DELETE /api/readings/:id
router.delete('/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [
    Number(req.params.id),
    req.user.id,
  ]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Reading not found.' });
  res.status(204).end();
});

module.exports = router;