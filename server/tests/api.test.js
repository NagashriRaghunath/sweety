const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

const stamp = Date.now();
const userA = { name: 'Test A', email: `jest-a-${stamp}@example.com`, password: 'secret123' };
const userB = { name: 'Test B', email: `jest-b-${stamp}@example.com`, password: 'secret123' };
let tokenA;
let tokenB;

const addReading = (token, body) =>
  request(app).post('/api/readings').set('Authorization', `Bearer ${token}`).send(body);

beforeAll(async () => {
  tokenA = (await request(app).post('/api/auth/register').send(userA)).body.token;
  tokenB = (await request(app).post('/api/auth/register').send(userB)).body.token;
});

afterAll(async () => {
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [[userA.email, userB.email]]);
  await pool.end();
});

describe('auth', () => {
  test('stores a bcrypt hash, never the plain password', async () => {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [userA.email]);
    expect(rows[0].password_hash).not.toBe(userA.password);
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  test('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: userA.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('readings require login', async () => {
    const res = await request(app).get('/api/readings');
    expect(res.status).toBe(401);
  });
});

describe('readings', () => {
  const date = '2026-01-15';

  test('adds a reading', async () => {
    const res = await addReading(tokenA, { reading_date: date, slot: 'after_lunch', value: 140 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ reading_date: date, slot: 'after_lunch', value: 140 });
  });

  test('rejects a second reading in the same slot on the same day', async () => {
    const res = await addReading(tokenA, { reading_date: date, slot: 'after_lunch', value: 150 });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('allows only 4 readings per day', async () => {
    await addReading(tokenA, { reading_date: date, slot: 'morning_fasting', value: 90 });
    await addReading(tokenA, { reading_date: date, slot: 'after_breakfast', value: 130 });
    await addReading(tokenA, { reading_date: date, slot: 'after_dinner', value: 160 });

    const res = await addReading(tokenA, { reading_date: date, slot: 'morning_fasting', value: 95 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });

  test('a user cannot see or delete another user\'s readings', async () => {
    const list = await request(app).get('/api/readings').set('Authorization', `Bearer ${tokenB}`);
    expect(list.body.readings).toHaveLength(0);

    const mine = await request(app).get('/api/readings').set('Authorization', `Bearer ${tokenA}`);
    const res = await request(app)
      .delete(`/api/readings/${mine.body.readings[0].id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(404);
  });
});

describe('reports', () => {
  test('calculates highest, lowest, count and average rounded to 1 decimal', async () => {
    const date = '2026-02-10';
    await addReading(tokenB, { reading_date: date, slot: 'morning_fasting', value: 100 });
    await addReading(tokenB, { reading_date: date, slot: 'after_lunch', value: 100 });
    await addReading(tokenB, { reading_date: date, slot: 'after_dinner', value: 101 });

    const res = await request(app).get(`/api/reports?date=${date}`).set('Authorization', `Bearer ${tokenB}`);
    expect(res.body.daily).toMatchObject({ count: 3, highest: 101, lowest: 100, average: 100.3 });
    expect(res.body.daily.readings).toHaveLength(3);
    // Previous month (January) has no readings for this user: empty state
    expect(res.body.monthly).toMatchObject({ count: 0, average: null });
  });
});