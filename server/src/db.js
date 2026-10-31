const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings.
// Without this, pg converts them to JS Date objects in local time,
// which can shift the date by a day when sent as JSON.
types.setTypeParser(1082, (value) => value);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;