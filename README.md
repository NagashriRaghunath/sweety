# Sweety – Blood Glucose Tracker

A small web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and monthly reports.

**Stack:** Node.js + Express · PostgreSQL · React (Vite) · JWT auth with bcrypt · Jest + Supertest

## Features
- Sign up / log in (passwords hashed with bcrypt; JWT sessions)
- Add, view, edit and delete readings (Morning fasting, After breakfast, After lunch, After dinner)
- Validation with clear messages: required value, whole number 40–600 mg/dl, one reading per slot per day, max 4 per day, no future dates
- Reports: Daily (with each reading listed), Month-to-date, and Previous month: highest, lowest, average (1 decimal), count, and a friendly empty state
- Each user only ever sees their own data

## Prerequisites
- Node.js 18+ (developed on Node 24)
- PostgreSQL 14+ (developed on PostgreSQL 18)

## 1. Install
```bash
git clone https://github.com/NagashriRaghunath/sweety.git
cd sweety
cd server && npm install
cd ../client && npm install
```

## 2. Set up the database
```bash
createdb -U postgres sweety
psql -U postgres -d sweety -f server/db/schema.sql
```

## 3. Environment variables
```bash
cp server/.env.example server/.env   # then set DB_PASSWORD and JWT_SECRET
cp client/.env.example client/.env   # optional, the default points to localhost:5000
```

| Variable | Where | Description |
|---|---|---|
| `PORT` | server | API port (default 5000) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | server | PostgreSQL connection |
| `JWT_SECRET` | server | Secret used to sign login tokens |
| `CLIENT_URL` | server | Frontend URL allowed by CORS |
| `VITE_API_URL` | client | API base URL |

## 4. Seed demo data
```bash
cd server
npm run seed
```
Creates **demo@sweety.app / demo1234** with readings from the start of last month until today.

## 5. Run
```bash
# terminal 1
cd server
npm run dev        # http://localhost:5000

# terminal 2
cd client
npm run dev        # http://localhost:5173
```

## 6. Tests
```bash
cd server
npm test
```
- `validation.test.js`: every validation rule, including boundaries (40, 600, decimals, future dates)
- `reportRanges.test.js`: date ranges, including January → previous December and leap-year February
- `api.test.js`: register/login, bcrypt hashing, auth protection, duplicate slot, 4-per-day limit, users can't see each other's data, report maths

The API tests use the database in `.env` and delete the users they create when finished.

## API
All `/readings` and `/reports` routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |
| GET | `/api/readings?date=&page=&limit=` | List readings (optional date filter, paginated) |
| POST | `/api/readings` | `{ reading_date, slot, value }` |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |
| GET | `/api/reports?date=YYYY-MM-DD` | Daily, month-to-date and previous-month reports |

## Screenshots
See [`docs/screenshots`](docs/screenshots).

## Notes

### Assumptions
- **"Today" is the server's local date.** Dates are stored as SQL `DATE` (not timestamps) to avoid timezone shifts.
- **Max 4 per day vs. one per slot:** with 4 slots these rules overlap, so a 5th reading would always also be a duplicate slot. The API checks the daily limit first so the user sees "You can add only 4 readings per day."
- **Monthly report** = the full calendar month before the selected date (e.g. 15 Oct → 1–30 Sep).
- **Validation runs in both places:** the React form gives instant feedback and the API is the source of truth. Database constraints (`CHECK`, `UNIQUE`) are a final safety net.
- Password minimum length is 6 characters (not specified in the brief).
- Login sessions last 1 day; the token is kept in `localStorage` for simplicity.

### Bonus done
- Pagination on `GET /readings` (`?page=1&limit=20`)

### What I'd improve with more time
- A separate test database (and CI running the tests on each push)
- Frontend tests with React Testing Library
- A monthly line chart (Recharts)
- Docker Compose for one-command setup
- Store the token in an httpOnly cookie instead of `localStorage`
- A migration tool instead of a single `schema.sql`
- Per-user time zones for the "future date" rule