import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getUser, clearSession, getErrorMessage } from '../api';
import { todayISO, formatDate, slotLabel } from '../utils';
import ReadingForm from '../components/ReadingForm';
import ReportCard from '../components/ReportCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [readings, setReadings] = useState([]);
  const [report, setReport] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [readingsRes, reportRes] = await Promise.all([
        api.get('/readings', { params: { date: selectedDate } }),
        api.get('/reports', { params: { date: selectedDate } }),
      ]);
      setReadings(readingsRes.data.readings);
      setReport(reportRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSaved(saved) {
    setEditing(null);
    if (saved.reading_date !== selectedDate) setSelectedDate(saved.reading_date);
    else loadData();
  }

  async function handleDelete(reading) {
    if (!window.confirm(`Delete the ${slotLabel(reading.slot)} reading?`)) return;
    try {
      await api.delete(`/readings/${reading.id}`);
      if (editing?.id === reading.id) setEditing(null);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="container">
      <header className="topbar">
        <h1>Sweety</h1>
        <div>
          <span className="muted">Hi, {user?.name}</span>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="card">
        <label>
          Selected date
          <input
            type="date"
            value={selectedDate}
            max={todayISO()}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          />
        </label>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="card">
        <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>
        <ReadingForm
          key={editing ? `edit-${editing.id}` : `new-${selectedDate}`}
          reading={editing}
          defaultDate={selectedDate}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      </section>

      <section className="card">
        <h2>Readings on {formatDate(selectedDate)}</h2>
        {readings.length === 0 ? (
          <p className="empty">No readings for this date yet.</p>
        ) : (
          <ul className="reading-list">
            {readings.map((r) => (
              <li key={r.id}>
                <span>{slotLabel(r.slot)}</span>
                <strong>{r.value} mg/dl</strong>
                <span className="actions">
                  <button className="secondary" onClick={() => setEditing(r)}>Edit</button>
                  <button className="danger" onClick={() => handleDelete(r)}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {report && (
        <section className="reports">
          <ReportCard title="Daily" stats={report.daily} />
          <ReportCard title="Month to date" stats={report.monthToDate} />
          <ReportCard title="Previous month" stats={report.monthly} />
        </section>
      )}
    </div>
  );
}