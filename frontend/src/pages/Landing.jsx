import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { WORKFLOW_STEPS, ROLE_INFO, ROLE_LABELS } from '../constants';
import { Icon, Button, Timeline, cx, Badge, RoleBadge } from '../components/ui';

const FEATURES = [
  { icon: 'truck', title: 'Vehicle Registry', desc: 'Master list of vehicles with capacity, odometer, cost and live status (Available / On Trip / In Shop / Retired).' },
  { icon: 'user', title: 'Driver Management', desc: 'Profiles with license validity, category, safety score and compliance status.' },
  { icon: 'route', title: 'Trip Lifecycle', desc: 'Draft → Dispatched → Completed → Cancelled with automatic status transitions.' },
  { icon: 'wrench', title: 'Maintenance', desc: 'Log service records; vehicles auto-move to In Shop and hide from dispatch.' },
  { icon: 'fuel', title: 'Fuel & Expenses', desc: 'Track fuel, tolls and costs; operational cost is computed per vehicle automatically.' },
  { icon: 'chart', title: 'Reports & ROI', desc: 'Fuel efficiency, fleet utilization, operational cost and vehicle ROI with CSV export.' },
];

const RULES = [
  'Vehicle registration number is unique',
  'Retired / In-Shop vehicles are blocked from dispatch',
  'Expired-license / suspended drivers cannot be assigned',
  'On-Trip vehicles & drivers cannot be double-booked',
  'Cargo weight is validated against vehicle capacity',
  'Dispatch → On Trip, Complete/Cancel → Available (auto)',
];

export default function Landing() {
  const { theme, toggle } = useTheme();
  const { user, token } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
              <Icon name="truck" className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">TransitOps</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
            </button>
            {token ? (
              <Link to="/dashboard">
                <Button size="sm">Go to app</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute -left-20 top-40 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-slate-900/60 dark:text-indigo-300">
            <Icon name="bolt" className="h-4 w-4" /> 8-hour hackathon-ready transport platform
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Smart Transport <span className="brand-gradient bg-clip-text text-transparent">Operations Platform</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Digitize your fleet end-to-end — vehicles, drivers, dispatch, maintenance and expenses — with real-time
            operational insight and business rules enforced automatically.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg">
                <Icon name="arrow" className="h-5 w-5" /> Get started
              </Button>
            </Link>
            <a href="#workflow">
              <Button size="lg" variant="outline">
                <Icon name="route" className="h-5 w-5" /> See how it works
              </Button>
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['4', 'User roles (RBAC)'],
              ['9', 'Step automated workflow'],
              ['10', 'Business rules enforced'],
              ['100%', 'Raw SQL, no ORM'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-5 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{v}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Everything your fleet needs</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">One platform, from the first vehicle registration to the final ROI report.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon name={f.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow timeline */}
      <section id="workflow" className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 grid gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon name="route" className="h-4 w-4" /> Example workflow
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">How a delivery flows through TransitOps</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">
                From registering <strong>Van-05</strong> to closing the books in Reports — every status change is automatic
                and every business rule is enforced server-side.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge color="emerald">auto status</Badge>
                <Badge color="sky">capacity check</Badge>
                <Badge color="amber">maintenance</Badge>
                <Badge color="violet">analytics</Badge>
              </div>
            </div>
            <div className="card p-6">
              <Timeline steps={WORKFLOW_STEPS} />
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Built for every role</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Role-Based Access Control keeps each team focused on what they own.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ROLE_INFO).map(([key, info]) => (
            <div key={key} className="card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl brand-gradient text-white shadow-sm">
                  <Icon name="shield" className="h-6 w-6" />
                </span>
                <RoleBadge role={key} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">{info.label}</h3>
              <p className="mt-1.5 flex-1 text-sm text-slate-500 dark:text-slate-400">{info.blurb}</p>
              <ul className="mt-4 space-y-2">
                {info.can.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Icon name="check" className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Business rules */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="card grid gap-8 p-8 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <Icon name="shield" className="h-4 w-4" /> Server-enforced
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Business rules you can trust</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Nothing slips through. The backend validates every write with raw parameterized SQL — no ORM, fully auditable.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {RULES.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Icon name="check" className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA / footer */}
      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">Ready to run your fleet?</p>
          <Link to="/login">
            <Button size="lg">
              <Icon name="arrow" className="h-5 w-5" /> Open the app
            </Button>
          </Link>
          <p className="text-xs text-slate-400">
            Demo logins — admin@transitops.io · driver@transitops.io · safety@transitops.io · finance@transitops.io &nbsp;·&nbsp; password: <span className="font-medium">password123</span>
          </p>
          <p className="text-xs text-slate-400">© 2024 TransitOps — Hackathon Edition</p>
        </div>
      </footer>
    </div>
  );
}
