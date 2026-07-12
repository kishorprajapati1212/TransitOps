import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboard as dashApi, maintenance as maintApi, reports as repApi, activity as actApi } from '../api';
import {
  Card, StatCard, Spinner, Alert, Icon, Button, Badge, Timeline, ProgressBar, SectionTitle, PageHeader,
} from '../components/ui';
import { WORKFLOW_STEPS, ROLE_FLOW, GET_STARTED_CHECKS, ROLE_LABELS } from '../constants';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, RadialBarChart, RadialBar, AreaChart, Area, CartesianGrid, LineChart, Line,
} from 'recharts';

/* ── Colours ── */
const VEHICLE_COLORS = {
  Available: '#10b981',
  'On Trip': '#0ea5e9',
  'In Shop': '#f59e0b',
  Retired: '#64748b',
};
const TRIP_COLORS = {
  Active: '#6366f1',
  Pending: '#f59e0b',
  Completed: '#10b981',
  Cancelled: '#ef4444',
};
const DRIVER_COLORS = {
  Available: '#10b981',
  'On Trip': '#0ea5e9',
  'Off Duty': '#64748b',
  Suspended: '#ef4444',
};

/* Custom tooltip styling for both themes */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {label && <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}: <span className="font-semibold text-slate-700 dark:text-slate-200">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
};

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

/* Custom label for pie charts */
const renderCustomLabel = ({ name, value, percent }) => {
  if (value === 0) return null;
  return `${name} (${value})`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'fleet_manager';

  useEffect(() => {
    const fetches = [dashApi.get(), maintApi.list(), repApi.overview().catch(() => null)];
    if (isAdmin) fetches.push(actApi.recent(15).catch(() => ({ logs: [] })));

    Promise.all(fetches)
      .then(([d, m, o, a]) => {
        setKpis({ ...d.kpis, totalMaintenance: (m.maintenance || []).length });
        if (o?.overview) setOverview(o.overview);
        if (a?.logs) setActivityLogs(a.logs);
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

  /* ── Chart data ── */
  const vehiclePie = [
    { name: 'Available', value: kpis.availableVehicles },
    { name: 'On Trip', value: kpis.activeVehicles },
    { name: 'In Shop', value: kpis.vehiclesInMaintenance },
    { name: 'Retired', value: kpis.retiredVehicles || 0 },
  ].filter(d => d.value > 0);

  const tripBar = [
    { name: 'Active', value: kpis.activeTrips, fill: TRIP_COLORS.Active },
    { name: 'Pending', value: kpis.pendingTrips, fill: TRIP_COLORS.Pending },
    { name: 'Completed', value: kpis.completedTrips, fill: TRIP_COLORS.Completed },
    { name: 'Cancelled', value: kpis.cancelledTrips, fill: TRIP_COLORS.Cancelled },
  ];

  const driverPie = [
    { name: 'Available', value: kpis.availableDrivers || 0 },
    { name: 'On Trip', value: kpis.driversOnDuty },
    { name: 'Off Duty', value: Math.max(0, (kpis.totalDrivers || 0) - (kpis.availableDrivers || 0) - kpis.driversOnDuty - (kpis.suspendedDrivers || 0)) },
    { name: 'Suspended', value: kpis.suspendedDrivers },
  ].filter(d => d.value > 0);

  const utilizationGauge = [
    { name: 'Utilization', value: kpis.fleetUtilizationPct, fill: '#6366f1' },
  ];

  /* Cost breakdown for financial view */
  const costData = overview ? [
    { name: 'Fuel', value: overview.totalFuelCost || 0 },
    { name: 'Maintenance', value: overview.totalMaintenanceCost || 0 },
  ].filter(d => d.value > 0) : [];

  const COST_COLORS = ['#f59e0b', '#8b5cf6'];

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

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Vehicle Status Donut */}
        <Card className="p-5">
          <SectionTitle title="Vehicle Status" subtitle="Live distribution across the fleet" icon="truck" />
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vehiclePie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                label={renderCustomLabel}
                labelLine={true}
              >
                {vehiclePie.map((d) => <Cell key={d.name} fill={VEHICLE_COLORS[d.name]} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Trips by Status - Improved Bar Chart */}
        <Card className="p-5">
          <SectionTitle title="Trips by Status" subtitle="Draft → Dispatched → Completed" icon="route" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tripBar} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                {tripBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Driver Status Donut */}
        <Card className="p-5">
          <SectionTitle title="Driver Status" subtitle="Availability breakdown" icon="user" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={driverPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
                labelLine={true}
              >
                {driverPie.map((d) => <Cell key={d.name} fill={DRIVER_COLORS[d.name]} strokeWidth={0} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Fleet Utilization Gauge */}
        <Card className="p-5">
          <SectionTitle title="Fleet Utilization" subtitle="Percentage of fleet on trip" icon="gauge" />
          <div className="flex flex-col items-center justify-center h-[260px]">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={16}
                data={utilizationGauge}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  background={{ fill: 'rgba(148,163,184,0.15)' }}
                  dataKey="value"
                  cornerRadius={10}
                  fill="#6366f1"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-20 text-center">
              <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{kpis.fleetUtilizationPct}%</p>
              <p className="text-xs text-slate-400 mt-1">{kpis.activeVehicles} of {kpis.totalVehicles} vehicles on trip</p>
            </div>
          </div>
        </Card>

        {/* Cost Breakdown (if overview data is available) */}
        <Card className="p-5">
          <SectionTitle title="Cost Breakdown" subtitle="Fuel vs Maintenance spend" icon="currency" />
          {costData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={costData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                  labelLine={true}
                >
                  {costData.map((d, i) => <Cell key={d.name} fill={COST_COLORS[i]} strokeWidth={0} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[260px] items-center justify-center">
              <p className="text-sm text-slate-400 dark:text-slate-500">No cost data yet — add fuel logs & maintenance</p>
            </div>
          )}
        </Card>
      </div>

      {/* Summary Stats Row (Financial) */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                <Icon name="fuel" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">Total Fuel Cost</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">₹{Number(overview.totalFuelCost || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                <Icon name="wrench" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">Maintenance Cost</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">₹{Number(overview.totalMaintenanceCost || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                <Icon name="currency" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">Total Revenue</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">₹{Number(overview.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${overview.roiPercent >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300'}`}>
                <Icon name="trendUp" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">Fleet ROI</p>
                <p className={`text-lg font-bold ${overview.roiPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {overview.roiPercent}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

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
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${c.done ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
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

      {/* Activity Log — Fleet Manager only */}
      {isAdmin && activityLogs.length > 0 && (
        <Card className="p-5">
          <SectionTitle title="Recent Activity" subtitle="Latest actions across the platform" icon="activity" />
          <div className="max-h-64 overflow-y-auto space-y-2">
            {activityLogs.map((log) => {
              const colors = { Created: 'bg-indigo-500', Registered: 'bg-indigo-500', Updated: 'bg-amber-500', Dispatched: 'bg-sky-500', Completed: 'bg-emerald-500', Cancelled: 'bg-rose-500', Deleted: 'bg-rose-500' };
              return (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0 ${colors[log.action] || 'bg-slate-400'}`}>
                    {log.action.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">{log.user_name}</span>
                      <span className="text-slate-400 mx-1">·</span>
                      <span className="font-medium">{log.action}</span> {log.entity}
                      {log.detail && <span className="text-slate-400"> — {log.detail}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

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
