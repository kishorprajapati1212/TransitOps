import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reports as repApi } from '../api';
import {
  Card, StatCard, Spinner, Alert, Icon, Button, Badge, Table, PageHeader, EmptyState, SectionTitle,
} from '../components/ui';
import { VEHICLE_STATUS_COLORS, ROLE_LABELS } from '../constants';

export default function Reports() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-6">
      <PageHeader
        icon="chart"
        title="Reports & Analytics"
        subtitle="Operational cost, fuel efficiency, utilization and compliance"
        action={<Button onClick={() => repApi.exportCsv()}><Icon name="download" className="h-4 w-4" /> Export CSV</Button>}
      />

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

      <Card className="p-5">
        <SectionTitle title="Per-vehicle analytics" subtitle="Cost, efficiency and ROI for every vehicle" icon="truck" />
        <Table columns={vehColumns} rows={vehicles} empty={<EmptyState title="No vehicle data" desc="Add trips, fuel and expenses to populate analytics." />} />
      </Card>

      <Card className="p-5">
        <SectionTitle title="Expiring licenses (next 30 days)" subtitle="Compliance watchlist for the Safety Officer" icon="shield" />
        <Table columns={licColumns} rows={licenses} empty={<EmptyState icon="check" title="All clear" desc="No licenses expiring in the next 30 days." />} />
      </Card>
    </div>
  );
}
