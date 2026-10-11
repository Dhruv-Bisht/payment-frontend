import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Field } from '../../components/ui';
import { useAuth } from './AuthProvider';

export default function LoginPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, notice } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  const set = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const email = form.email.trim();
      if (registering) await api.register({ name: form.name.trim(), email, password: form.password });
      const res = await api.login({ email, password: form.password });
      signIn({ token: res.token, email: res.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-card">
        <p className="brand"><Link to="/" className="plain-link">Payment Platform</Link></p>
        <h1>{registering ? 'Create your account' : 'Sign in'}</h1>
        <p className="muted">
          {registering ? 'Your wallet is set up automatically.' : 'Welcome back to your wallet.'}
        </p>
        {notice && <p className="notice bad" role="alert">{notice}</p>}
        <form onSubmit={submit}>
          {registering && <Field label="Name" value={form.name} onChange={set('name')} autoComplete="name" required />}
          <Field label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete={registering ? 'new-password' : 'current-password'}
            hint={registering ? 'At least 8 characters.' : undefined}
            required
          />
          <Button type="submit" loading={busy} className="block">
            {registering ? 'Create account' : 'Sign in'}
          </Button>
          {error && <p className="notice bad" role="alert">{error}</p>}
        </form>
        <p className="muted small switch">
          {registering ? 'Already have an account?' : 'New here?'}{' '}
          <Link className="link" to={registering ? '/login' : '/register'}>
            {registering ? 'Sign in' : 'Create an account'}
          </Link>
          {' '}
          <Link className="link" to="/">Back to home</Link>
        </p>
      </div>
    </main>
  );
}
