import { useState } from 'react';
import api, { getErrorMessage } from '../api';
import { SLOTS, todayISO, validateReadingForm } from '../utils';

export default function ReadingForm({ reading, defaultDate, onSaved, onCancel }) {
  const isEdit = Boolean(reading);
  const [form, setForm] = useState({
    reading_date: reading?.reading_date ?? defaultDate,
    slot: reading?.slot ?? SLOTS[0].value,
    value: reading ? String(reading.value) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const message = validateReadingForm(form);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setSaving(true);
    try {
      const body = { ...form, value: Number(form.value) };
      const { data } = isEdit
        ? await api.put(`/readings/${reading.id}`, body)
        : await api.post('/readings', body);
      onSaved(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="reading-form" onSubmit={handleSubmit} noValidate>
      <label>
        Date
        <input type="date" name="reading_date" value={form.reading_date} max={todayISO()} onChange={update} />
      </label>
      <label>
        Time slot
        <select name="slot" value={form.slot} onChange={update}>
          {SLOTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label>
        Value (mg/dl)
        <input type="number" name="value" value={form.value} onChange={update} placeholder="e.g. 110" />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add reading'}</button>
        {isEdit && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}