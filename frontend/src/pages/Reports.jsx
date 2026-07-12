import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { reports as repApi } from '../api';
import {
  Card, StatCard, Spinner, Alert, Icon, Button, Badge, Table, PageHeader, EmptyState, SectionTitle, Tabs,
} from '../components/ui';
import { VEHICLE_STATUS_COLORS } from '../constants';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, Legend,
} from 'recharts';

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

/** Generate a printable PDF report in a new window */
function exportPdf(overview, vehicles) {
  const now = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const rows = vehicles.map(v => `
    <tr>
      <td>${v.registration_number}</td><td>${v.name}</td><td>${v.type}</td>
      <td>${v.status}</td><td>₹${Number(v.operational_cost||0).toLocaleString()}</td>
      <td>${Number(v.fuel_liters||0).toLocaleString()} L</td>
      <td>${Number(v.distance_covered||0).toLocaleString()} km</td>
      <td>${Number(v.fuel_efficiency_km_per_l||0)} km/L</td>
      <td>₹${Number(v.revenue||0).toLocaleString()}</td>
      <td>${v.roi_percent}%</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><title>TransitOps Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;color:#1e293b;padding:40px;font-size:12px}
  h1{font-size:22px;color:#4f46e5;margin-bottom:4px}
  .sub{color:#64748b;font-size:13px;margin-bottom:24px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
  .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px}
  .kpi .label{font-size:10px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px}
  .kpi .value{font-size:20px;font-weight:700;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}
  td{padding:8px 10px;border-bottom:1px solid #f1f5f9}
  tr:nth-child(even){background:#f8fafc}
  .footer{margin-top:24px;text-align:center;color:#94a3b8;font-size:10px}
  @media print{body{padding:20px}@page{margin:15mm}}
</style></head><body>
  <h1>TransitOps — Fleet Analytics Report</h1>
  <p class="sub">Generated on ${now}</p>
  <div class="kpis">
    <div class="kpi"><div class="label">Fleet Utilization</div><div class="value">${overview.fleetUtilizationPct}%</div></div>
    <div class="kpi"><div class="label">Operational Cost</div><div class="value">₹${Number(overview.operationalCost||0).toLocaleString()}</div></div>
    <div class="kpi"><div class="label">Revenue</div><div class="value">₹${Number(overview.totalRevenue||0).toLocaleString()}</div></div>
    <div class="kpi"><div class="label">Fleet ROI</div><div class="value">${overview.roiPercent}%</div></div>
    <div class="kpi"><div class="label">Fuel Cost</div><div class="value">₹${Number(overview.totalFuelCost||0).toLocaleString()}</div></div>
    <div class="kpi"><div class="label">Maintenance Cost</div><div class="value">₹${Number(overview.totalMaintenanceCost||0).toLocaleString()}</div></div>
    <div class="kpi"><div class="label">Total Distance</div><div class="value">${Number(overview.totalDistance||0).toLocaleString()} km</div></div>
    <div class="kpi"><div class="label">Fuel Efficiency</div><div class="value">${overview.fuelEfficiencyKmPerL} km/L</div></div>
  </div>
  <h2 style="font-size:16px;margin-bottom:8px">Per-Vehicle Analytics</h2>
  <table><thead><tr>
    <th>Vehicle</th><th>Name</th><th>Type</th><th>Status</th><th>Op.Cost</th>
    <th>Fuel</th><th>Distance</th><th>Efficiency</th><th>Revenue</th><th>ROI</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <p class="footer">TransitOps — Smart Transport Operations Platform © 2026</p>
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

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
      .then(([o, v, l]) => { setOverview(o.overview); setVehicles(v.report || []); setLicenses(l.drivers || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8 text-indigo-500" /></div>;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!overview) return null;

  const costBarData = vehicles.slice(0, 10).map(v => ({ name: v.registration_number, 'Fuel Cost': v.fuel_cost, 'Maintenance': v.maintenance_cost }));
  const roiBarData = vehicles.filter(v => v.roi_percent !== 0).slice(0, 10).map(v => ({ name: v.registration_number, ROI: v.roi_percent, fill: v.roi_percent >= 0 ? '#10b981' : '#ef4444' }));
  const efficiencyData = vehicles.filter(v => v.fuel_efficiency_km_per_l > 0).slice(0, 10).map(v => ({ name: v.registration_number, 'km/L': v.fuel_efficiency_km_per_l }));

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
    { key: 'roi_percent', label: 'ROI %', render: (r) => { const v = Number(r.roi_percent || 0); return <Badge color={v >= 0 ? 'emerald' : 'rose'}>{v}%</Badge>; } },
  ];

  const licColumns = [
    { key: 'name', label: 'Driver' },
    { key: 'license_number', label: 'License #' },
    { key: 'license_category', label: 'Category' },
    { key: 'license_expiry_date', label: 'Expiry' },
    { key: 'status', label: 'Status', render: (r) => <Badge color={r.status === 'suspended' ? 'rose' : 'amber'}>{r.status}</Badge> },
    { key: 'safety_score', label: 'Safety', render: (r) => <Badge color={r.safety_score >= 80 ? 'emerald' : r.safety_score >= 60 ? 'amber' : 'rose'}>{r.safety_score}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon="chart" title="Reports & Analytics" subtitle="Operational cost, fuel efficiency, utilization and compliance"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => repApi.exportCsv()}><Icon name="download" className="h-4 w-4" /> CSV</Button>
            <Button onClick={() => exportPdf(overview, vehicles)}><Icon name="download" className="h-4 w-4" /> PDF Report</Button>
          </div>
        }
      />

      <Tabs tabs={[{ key: 'overview', label: 'Overview' }, { key: 'vehicles', label: 'Vehicles' }, { key: 'compliance', label: 'Compliance' }]} active={tab} onChange={setTab} />

      {tab === 'overview' && (<>
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <SectionTitle title="Cost per Vehicle" subtitle="Fuel vs Maintenance" icon="currency" />
            {costBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costBarData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span className="text-xs text-slate-600 dark:text-slate-300">{v}</span>} />
                  <Bar dataKey="Fuel Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Maintenance" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex h-[300px] items-center justify-center"><p className="text-sm text-slate-400">No cost data yet</p></div>}
          </Card>

          <Card className="p-5">
            <SectionTitle title="Vehicle ROI" subtitle="Return on investment" icon="trendUp" />
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
            ) : <div className="flex h-[300px] items-center justify-center"><p className="text-sm text-slate-400">No ROI data yet</p></div>}
          </Card>
        </div>

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
          ) : <div className="flex h-[280px] items-center justify-center"><p className="text-sm text-slate-400">No efficiency data yet</p></div>}
        </Card>
      </>)}

      {tab === 'vehicles' && (
        <Card className="p-5">
          <SectionTitle title="Per-vehicle analytics" subtitle="Cost, efficiency and ROI for every vehicle" icon="truck" />
          <Table columns={vehColumns} rows={vehicles} empty={<EmptyState title="No vehicle data" desc="Add trips, fuel and expenses to populate analytics." />} />
        </Card>
      )}

      {tab === 'compliance' && (
        <Card className="p-5">
          <SectionTitle title="Expiring licenses (next 30 days)" subtitle="Compliance watchlist" icon="shield" />
          <Table columns={licColumns} rows={licenses} empty={<EmptyState icon="check" title="All clear" desc="No licenses expiring in the next 30 days." />} />
        </Card>
      )}
    </div>
  );
}
