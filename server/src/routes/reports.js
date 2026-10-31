const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');
const { isValidISODate, todayISO } = require('../validation');
const { getReportRanges } = require('../reportRanges');

const router = express.Router();
router.use(requireAuth);

async function getStats(userId, { from, to }) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count,
            MAX(value) AS highest,
            MIN(value) AS lowest,
            ROUND(AVG(value)::numeric, 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );
  return { from, to, ...rows[0] }; // highest/lowest/average are null when count is 0
}

// GET /api/reports?date=YYYY-MM-DD  (defaults to today)
router.get('/', async (req, res) => {
  const date = req.query.date || todayISO();
  if (!isValidISODate(date)) return res.status(400).json({ error: 'Please enter a valid date.' });

  const ranges = getReportRanges(date);
  const userId = req.user.id;

  const [daily, monthToDate, monthly, dayReadings] = await Promise.all([
    getStats(userId, ranges.daily),
    getStats(userId, ranges.monthToDate),
    getStats(userId, ranges.monthly),
    pool.query(
      `SELECT id, slot, value FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY array_position(ARRAY['morning_fasting','after_breakfast','after_lunch','after_dinner'], slot)`,
      [userId, date]
    ),
  ]);

  res.json({
    date,
    daily: { ...daily, readings: dayReadings.rows },
    monthToDate,
    monthly,
  });
});

module.exports = router;