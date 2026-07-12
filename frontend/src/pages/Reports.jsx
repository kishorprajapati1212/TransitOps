import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reports as repApi } from '../api';
import {
  Card, StatCard, Spinner, Alert, Icon, Button, Badge, Table, PageHeader, EmptyState, SectionTitle, Tabs,
} from '../components/ui';
import { VEHICLE_STATUS_COLORS, ROLE_LABELS } from '../constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COST_COLORS = ['#f59e0b', '#8b5cf6'];
const ROI_COLORS = { positive: '#10b981', negative: '#ef4444' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {label && <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: p.color || p.fill }} />
          {p.name}: <span className="font-semibold text-slate-700 dark:text-slate-200">
            {typeof p.value === 'number' ? (p.name.includes('km') ? p.value.toLocaleString() : `₹${p.value.toLocaleString()}`) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function Reports() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([repApi.overview(), repApi.vehicleReport(), repApi.expiringLicenses(30)])
      .then(([o, v, l]) => {
        setOverview(o.overview);
        setVehicles(v.report || []);
        setLicenses(l.drivers || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-indigo-500" /></div>;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!overview) return null;

  /* Chart data from vehicles */
  const costBarData = vehicles.slice(0, 10).map(v => ({
    name: v.registration_number,
    'Fuel Cost': v.fuel_cost,
    'Maintenance': v.maintenance_cost,
  }));

  const roiBarData = vehicles.filter(v => v.roi_percent !== 0).slice(0, 10).map(v => ({
    name: v.registration_number,
    ROI: v.roi_percent,
    fill: v.roi_percent >= 0 ? ROI_COLORS.positive : ROI_COLORS.negative,
  }));

  const efficiencyData = vehicles.filter(v => v.fuel_efficiency_km_per_l > 0).slice(0, 10).map(v => ({
    name: v.registration_number,
    'km/L': v.fuel_efficiency_km_per_l,
  }));

  const vehColumns = [
    { key: 'registration_number', label: 'Vehicle' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status', render: (r) => <Badge color={VEHICLE_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
    { key: 'operational_cost', label: 'Op. Cost', render: (r) => `₹${Number(r.operational_cost || 0).toLocaleString()}` },
    { key: 'fuel_liters', label: 'Fuel (L)', render: (r) => Number(r.fuel_liters || 0).toLocaleString() },
    { key: 'distance_covered', label: 'Distance (km)', render: (r) => Number(r.distance_covered || 0).toLocaleString() },
    { key: 'fuel_efficiency_km_per_l', label: 'Km/L', render: (r) => Number(r.fuel_efficiency_km_per_l || 0).toLocaleString() },
    { key: 'revenue', label: 'Revenue', render: (r) => `₹${Number(r.revenue || 0).toLocaleString()}` },
    { key: 'roi_percent', label: 'ROI %', render: (r) => {
      const v = Number(r.roi_percent || 0);
      return <Badge color={v >= 0 ? 'emerald' : 'rose'}>{v}%</Badge>;
    } },
  ];

  const licColumns = [
    { key: 'name', label: 'Driver' },
    { key: 'license_number', label: 'License #' },
    { key: 'license_category', label: 'Category' },
    { key: 'license_expiry_date', label: 'Expiry' },
    { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'suspended' ? 'rose' : 'amber'}>{r.status}</Badge> },
    { key: 'safety_score', label: 'Safety', render: (r) => <Badge color={r.safety_score >= 80 ? 'emerald' : r.safety_score >= 60 ? 'amber' : 'rose'}>{r.safety_score}</Badge> },
  ];

  const reportTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'vehicles', label: 'Vehicles' },
    { key: 'compliance', label: 'Compliance' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon="chart"
        title="Reports & Analytics"
        subtitle="Operational cost, fuel efficiency, utilization and compliance"
        action={<Button onClick={() => repApi.exportCsv()}><Icon name="download" className="h-4 w-4" /> Export CSV</Button>}
      />

      <Tabs tabs={reportTabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            <StatCard label="Fleet Utilization" value={`${overview.fleetUtilizationPct}%`} icon="gauge" accent="indigo" sub={`${overview.activeVehicles} on trip`} />
            <StatCard label="Operational Cost" value={`₹${Number(overview.operationalCost || 0).toLocaleString()}`} icon="currency" accent="rose" sub="fuel + maintenance" />
            <StatCard label="Fuel Cost" value={`₹${Number(overview.totalFuelCost || 0).toLocaleString()}`} icon="fuel" accent="amber" />
            <StatCard label="Maintenance Cost" value={`₹${Number(overview.totalMaintenanceCost || 0).toLocaleString()}`} icon="wrench" accent="violet" />
            <StatCard label="Total Distance" value={`${Number(overview.totalDistance || 0).toLocaleString()} km`} icon="route" accent="sky" />
            <StatCard label="Fuel Efficiency" value={`${Number(overview.fuelEfficiencyKmPerL || 0).toLocaleString()} km/L`} icon="activity" accent="emerald" />
            <StatCard label="Revenue" value={`₹${Number(overview.totalRevenue || 0).toLocaleString()}`} icon="currency" accent="emerald" />
            <StatCard label="Fleet ROI" value={`${overview.roiPercent}%`} icon="trendUp" accent={overview.roiPercent >= 0 ? 'emerald' : 'rose'} sub="vs acquisition cost" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Cost per Vehicle */}
            <Card className="p-5">
              <SectionTitle title="Cost per Vehicle" subtitle="Fuel vs Maintenance breakdown" icon="currency" />
              {costBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costBarData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>} />
                    <Bar dataKey="Fuel Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Maintenance" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-slate-400">No cost data yet</p>
                </div>
              )}
            </Card>

            {/* ROI per Vehicle */}
            <Card className="p-5">
              <SectionTitle title="Vehicle ROI" subtitle="Return on investment per vehicle" icon="trendUp" />
              {roiBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiBarData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ROI" radius={[4, 4, 0, 0]} barSize={30}>
                      {roiBarData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-slate-400">No ROI data yet — complete trips with revenue</p>
                </div>
              )}
            </Card>
          </div>

          {/* Fuel Efficiency Chart */}
          <Card className="p-5">
            <SectionTitle title="Fuel Efficiency" subtitle="Km per litre for each vehicle" icon="activity" />
            {efficiencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={efficiencyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="km/L" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-slate-400">No efficiency data — complete trips with fuel consumed</p>
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'vehicles' && (
        <Card className="p-5">
          <SectionTitle title="Per-vehicle analytics" subtitle="Cost, efficiency and ROI for every vehicle" icon="truck" />
          <Table columns={vehColumns} rows={vehicles} empty={<EmptyState title="No vehicle data" desc="Add trips, fuel and expenses to populate analytics." />} />
        </Card>
      )}

      {tab === 'compliance' && (
        <Card className="p-5">
          <SectionTitle title="Expiring licenses (next 30 days)" subtitle="Compliance watchlist for the Safety Officer" icon="shield" />
          <Table columns={licColumns} rows={licenses} empty={<EmptyState icon="check" title="All clear" desc="No licenses expiring in the next 30 days." />} />
        </Card>
      )}
    </div>
  );
}
