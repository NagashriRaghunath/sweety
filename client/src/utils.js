export const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const slotLabel = (value) => SLOTS.find((s) => s.value === value)?.label ?? value;

export function todayISO() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
}

export function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function formatRange(from, to) {
  if (from === to) return formatDate(from);
  const start = new Date(`${from}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${start} – ${formatDate(to)}`;
}

// Same rules and messages as the server, so users get instant feedback.
// The server still checks everything (and also checks duplicate slots / max 4 per day).
export function validateReadingForm({ reading_date, value }) {
  if (String(value).trim() === '') return 'Please enter a glucose value.';
  const number = Number(value);
  if (!Number.isInteger(number) || number < 40 || number > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  if (!reading_date) return 'Please choose a date.';
  if (reading_date > todayISO()) return 'Date cannot be in the future.';
  return null;
}