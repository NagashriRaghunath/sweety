import { formatRange, slotLabel } from '../utils';

export default function ReportCard({ title, stats }) {
  return (
    <div className="card report">
      <h3>{title}</h3>
      <p className="muted">{formatRange(stats.from, stats.to)}</p>

      {stats.count === 0 ? (
        <p className="empty">No readings in this period yet. Add one to see your stats here.</p>
      ) : (
        <>
          <dl className="stats">
            <div><dt>Highest</dt><dd>{stats.highest}</dd></div>
            <div><dt>Lowest</dt><dd>{stats.lowest}</dd></div>
            <div><dt>Average</dt><dd>{stats.average.toFixed(1)}</dd></div>
            <div><dt>Readings</dt><dd>{stats.count}</dd></div>
          </dl>
          {stats.readings && (
            <ul className="report-readings">
              {stats.readings.map((r) => (
                <li key={r.id}><span>{slotLabel(r.slot)}</span><span>{r.value} mg/dl</span></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}