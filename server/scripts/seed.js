require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../src/db');
const { todayISO } = require('../src/validation');
const { getReportRanges } = require('../src/reportRanges');

const DEMO_USER = { name: 'Demo Patient', email: 'demo@sweety.app', password: 'demo1234' };

// Typical base value per slot; a small deterministic variation is added per day
const SLOT_BASE = { morning_fasting: 95, after_breakfast: 150, after_lunch: 160, after_dinner: 145 };

async function seed() {
  // Start fresh: deleting the user also deletes their readings (ON DELETE CASCADE)
  await pool.query('DELETE FROM users WHERE email = $1', [DEMO_USER.email]);

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [DEMO_USER.name, DEMO_USER.email, passwordHash]
  );
  const userId = rows[0].id;

  // Readings from the 1st of last month up to today
  const today = todayISO();
  const startDate = getReportRanges(today).monthly.from;

  const params = [];
  const placeholders = [];

  for (let d = new Date(`${startDate}T00:00:00Z`); d.toISOString().slice(0, 10) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    const day = d.getUTCDate();

    Object.entries(SLOT_BASE).forEach(([slot, base], i) => {
      if ((day + i) % 6 === 0) return; // skip a few so not every day is complete
      const value = base + ((day * 17 + i * 11) % 50) - 25;
      params.push(userId, date, slot, value);
      const n = params.length;
      placeholders.push(`($${n - 3}, $${n - 2}, $${n - 1}, $${n})`);
    });
  }

  await pool.query(
    `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ${placeholders.join(', ')}`,
    params
  );

  console.log(`Seeded ${placeholders.length} readings.`);
  console.log(`Log in with: ${DEMO_USER.email} / ${DEMO_USER.password}`);
}

seed()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());