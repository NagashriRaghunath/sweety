const pad = (n) => String(n).padStart(2, '0');

// Given 'YYYY-MM-DD', returns the three date ranges the reports need.
function getReportRanges(selectedDate) {
  const [year, month] = selectedDate.split('-').map(Number);

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  // Day 0 of the current month = last day of the previous month
  const prevMonthLastDay = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  return {
    daily: { from: selectedDate, to: selectedDate },
    monthToDate: { from: `${year}-${pad(month)}-01`, to: selectedDate },
    monthly: {
      from: `${prevYear}-${pad(prevMonth)}-01`,
      to: `${prevYear}-${pad(prevMonth)}-${pad(prevMonthLastDay)}`,
    },
  };
}

module.exports = { getReportRanges };