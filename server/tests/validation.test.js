const { validateReading, todayISO } = require('../src/validation');

const valid = { reading_date: '2026-01-15', slot: 'after_lunch', value: 120 };

describe('validateReading', () => {
  test('accepts a valid reading', () => {
    expect(validateReading(valid)).toBeNull();
  });

  test('requires a value', () => {
    expect(validateReading({ ...valid, value: '' })).toBe('Please enter a glucose value.');
  });

  test.each([39, 601, 120.5, 'abc'])('rejects %p as out of range or not a whole number', (value) => {
    expect(validateReading({ ...valid, value })).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test.each([40, 600])('accepts boundary value %p', (value) => {
    expect(validateReading({ ...valid, value })).toBeNull();
  });

  test('rejects a future date', () => {
    expect(validateReading({ ...valid, reading_date: '2999-01-01' })).toBe('Date cannot be in the future.');
  });

  test("accepts today's date", () => {
    expect(validateReading({ ...valid, reading_date: todayISO() })).toBeNull();
  });

  test('rejects an unknown slot', () => {
    expect(validateReading({ ...valid, slot: 'midnight' })).toBe('Please choose a valid time slot.');
  });
});