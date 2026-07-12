import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Field, inputCls, Alert, Icon, Spinner } from '../components/ui';

const DEMO = [
  { role: 'Fleet Manager', email: 'admin@transitops.io' },
  { role: 'Driver', email: 'driver@transitops.io' },
  { role: 'Safety Officer', email: 'safety@transitops.io' },
  { role: 'Financial Analyst', email: 'finance@transitops.io' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@transitops.io');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(u.role === 'driver' ? '/trips' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const quickLogin = (mail) => {
    setEmail(mail);
    setPassword('password123');
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand / value panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-indigo-700 p-12 text-white lg:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon name="truck" className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">TransitOps</span>
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Icon name="bolt" className="h-4 w-4" /> Smart Transport Operations Platform
          </span>
          <h2 className="mt-5 text-4xl font-bold leading-tight">Run your fleet from a single cockpit.</h2>
          <p className="mt-4 max-w-md text-white/75">
            Digitize vehicles, drivers, dispatch, maintenance and expenses — with real-time operational insight and
            business rules enforced automatically.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3"><Icon name="check" className="h-5 w-5 text-emerald-300" /> Role-based access for managers, drivers & analysts</li>
            <li className="flex items-center gap-3"><Icon name="check" className="h-5 w-5 text-emerald-300" /> Automatic status transitions & capacity checks</li>
            <li className="flex items-center gap-3"><Icon name="check" className="h-5 w-5 text-emerald-300" /> Dashboards, analytics & CSV export</li>
          </ul>
        </div>

        <p className="relative text-xs text-white/50">© 2025 TransitOps — All rights reserved</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 dark:bg-slate-950 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white">
              <Icon name="truck" className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 dark:text-white">TransitOps</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your operations workspace</p>

          {error && <Alert tone="error" className="mt-4">{error}</Alert>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Email">
              <input className={inputCls} type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <input className={inputCls} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Spinner className="h-4 w-4" /> : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => quickLogin(d.email)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
                >
                  <span className="block font-semibold text-slate-700 dark:text-slate-200">{d.role}</span>
                  <span className="block truncate text-slate-400">{d.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              All demo passwords are <span className="font-medium text-slate-500 dark:text-slate-300">password123</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            New here? <Link to="/" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">See the product overview</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
