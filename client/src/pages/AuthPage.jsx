import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { saveSession, getErrorMessage } from '../api';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await api.post(`/auth/${isRegister ? 'register' : 'login'}`, body);
      saveSession(data);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Sweety</h1>
        <p className="muted">{isRegister ? 'Create your account' : 'Log in to track your glucose'}</p>

        {isRegister && (
          <label>
            Name
            <input name="name" value={form.name} onChange={update} />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={update} />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={update} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Sign up' : 'Log in'}
        </button>

        <p className="muted">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </form>
    </main>
  );
}