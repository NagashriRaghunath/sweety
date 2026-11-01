const { getReportRanges } = require('../src/reportRanges');

describe('getReportRanges', () => {
  test('matches the example in the assignment (15 Oct 2026)', () => {
    expect(getReportRanges('2026-10-15')).toEqual({
      daily: { from: '2026-10-15', to: '2026-10-15' },
      monthToDate: { from: '2026-10-01', to: '2026-10-15' },
      monthly: { from: '2026-09-01', to: '2026-09-30' },
    });
  });

  test('previous month of January is December of the previous year', () => {
    expect(getReportRanges('2026-01-10').monthly).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  test('handles February in a leap year', () => {
    expect(getReportRanges('2028-03-05').monthly).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});