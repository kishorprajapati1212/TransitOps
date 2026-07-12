import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboard as dashApi, maintenance as maintApi } from '../api';
import {
  Card, StatCard, Spinner, Alert, Icon, Button, Badge, Timeline, ProgressBar, SectionTitle, PageHeader,
} from '../components/ui';
import { WORKFLOW_STEPS, ROLE_FLOW, GET_STARTED_CHECKS, ROLE_LABELS } from '../constants';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { available: '#10b981', on_trip: '#0ea5e9', in_shop: '#f59e0b', retired: '#64748b' };

const QUICK = {
  fleet_manager: [
    { to: '/vehicles', label: 'Register Vehicle', icon: 'truck' },
    { to: '/drivers', label: 'Add Driver', icon: 'user' },
    { to: '/trips', label: 'New Trip', icon: 'route' },
    { to: '/maintenance', label: 'Log Maintenance', icon: 'wrench' },
  ],
  driver: [
    { to: '/trips', label: 'New Trip', icon: 'route' },
    { to: '/vehicles', label: 'View Fleet', icon: 'truck' },
  ],
  safety_officer: [
    { to: '/drivers', label: 'Driver Compliance', icon: 'user' },
    { to: '/reports', label: 'Reports', icon: 'chart' },
  ],
  financial_analyst: [
    { to: '/fuel', label: 'Fuel Log', icon: 'fuel' },
    { to: '/expenses', label: 'Add Expense', icon: 'receipt' },
    { to: '/reports', label: 'Reports', icon: 'chart' },
  ],
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashApi.get(), maintApi.list()])
      .then(([d, m]) => {
        setKpis({ ...d.kpis, totalMaintenance: (m.maintenance || []).length });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-indigo-500" /></div>;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!kpis) return null;

  const role = user?.role;
  const quick = QUICK[role] || QUICK.fleet_manager;
  const flow = ROLE_FLOW[role] || [];

  const checks = GET_STARTED_CHECKS.map((c) => ({ ...c, done: c.needed(kpis) }));
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const allDone = doneCount === checks.length;

  const vehiclePie = [
    { name: 'Available', value: kpis.availableVehicles, key: 'available' },
    { name: 'On Trip', value: kpis.activeVehicles, key: 'on_trip' },
    { name: 'In Shop', value: kpis.vehiclesInMaintenance, key: 'in_shop' },
    { name: 'Retired', value: kpis.retiredVehicles, key: 'retired' },
  ];
  const tripBar = [
    { name: 'Active', value: kpis.activeTrips },
    { name: 'Pending', value: kpis.pendingTrips },
    { name: 'Completed', value: kpis.completedTrips },
    { name: 'Cancelled', value: kpis.cancelledTrips },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="grid"
        title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={`${ROLE_LABELS[role] || role} · here is your fleet at a glance`}
        action={
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <Button key={q.to} variant="secondary" size="sm" onClick={() => navigate(q.to)}>
                <Icon name={q.icon} className="h-4 w-4" /> {q.label}
              </Button>
            ))}
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Active Vehicles" value={kpis.activeVehicles} icon="truck" accent="sky" sub={`${kpis.totalVehicles} total`} />
        <StatCard label="Available Vehicles" value={kpis.availableVehicles} icon="check" accent="emerald" />
        <StatCard label="In Maintenance" value={kpis.vehiclesInMaintenance} icon="wrench" accent="amber" />
        <StatCard label="Active Trips" value={kpis.activeTrips} icon="route" accent="indigo" sub={`${kpis.pendingTrips} pending`} />
        <StatCard label="Completed Trips" value={kpis.completedTrips} icon="flag" accent="violet" />
        <StatCard label="Drivers On Duty" value={kpis.driversOnDuty} icon="user" accent="emerald" sub={`${kpis.totalDrivers} total`} />
        <StatCard label="Fleet Utilization" value={`${kpis.fleetUtilizationPct}%`} icon="gauge" accent="indigo" sub="on-trip / total" />
        <StatCard label="Suspended Drivers" value={kpis.suspendedDrivers} icon="alert" accent="rose" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="Vehicle Status" subtitle="Live distribution across the fleet" icon="truck" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={vehiclePie} dataKey="value" nameKey="name" outerRadius={90} label={(e) => `${e.name}: ${e.value}`}>
                {vehiclePie.map((d) => <Cell key={d.key} fill={COLORS[d.key]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Trips by Status" subtitle="Draft → Dispatched → Completed" icon="route" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tripBar}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Getting started + workflow */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle
            title={allDone ? 'Setup complete' : 'Getting Started'}
            subtitle={`${doneCount} of ${checks.length} done`}
            icon="sparkles"
            action={<span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{pct}%</span>}
          />
          <ProgressBar value={pct} className="mb-4" />
          <ul className="space-y-3">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.done ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  <Icon name={c.done ? 'check' : 'x'} className="h-4 w-4" />
                </span>
                <span className={c.done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}>{c.label}</span>
              </li>
            ))}
          </ul>
          {!allDone && (
            <Button className="mt-4" size="sm" onClick={() => navigate(quick[0].to)}>
              <Icon name="plus" className="h-4 w-4" /> Start with {quick[0].label}
            </Button>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle title="How it works" subtitle="The automated delivery workflow" icon="route" />
          <Timeline steps={WORKFLOW_STEPS} />
        </Card>
      </div>

      {/* Role flow guidance */}
      {flow.length > 0 && (
        <Card className="p-5">
          <SectionTitle title={`Your ${ROLE_LABELS[role] || 'role'} workflow`} subtitle="Where to go and what to do" icon="map" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((f, i) => (
              <button
                key={f.to + i}
                onClick={() => navigate(f.to)}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{f.label}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{f.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
