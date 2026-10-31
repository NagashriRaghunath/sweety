const SLOTS = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

const MAX_READINGS_PER_DAY = 4;

// Today's date as 'YYYY-MM-DD' in the server's local timezone
function todayISO() {
  return new Date().toLocaleDateString('en-CA');
}

function isValidISODate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

// Returns an error message, or null if the input is valid.
// (The "one per slot" and "max 4 per day" rules need the database, so they live in the route.)
function validateReading({ reading_date, slot, value }) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Please enter a glucose value.';
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 40 || number > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  if (!SLOTS[slot]) {
    return 'Please choose a valid time slot.';
  }
  if (!reading_date || !isValidISODate(reading_date)) {
    return 'Please enter a valid date.';
  }
  if (reading_date > todayISO()) {
    return 'Date cannot be in the future.';
  }
  return null;
}

module.exports = { SLOTS, MAX_READINGS_PER_DAY, todayISO, isValidISODate, validateReading };