import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { trips as tripApi, vehicles as vehApi, drivers as drvApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Alert, Icon, Spinner, PageHeader, EmptyState,
} from '../components/ui';
import { TRIP_STATUSES, TRIP_STATUS_COLORS } from '../constants';

export default function Trips() {
  const { user } = useAuth();
  const canManage = ['fleet_manager', 'driver'].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '' });

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeForm, setCompleteForm] = useState({ final_odometer: '', fuel_consumed: '', revenue: '' });
  const [completing, setCompleting] = useState(false);

  const load = (f = filters) => {
    setLoading(true);
    tripApi
      .list(f)
      .then((d) => { setRows(d.trips); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const apply = (patch) => { const nf = { ...filters, ...patch }; setFilters(nf); load(nf); };

  const openCreate = async () => {
    setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
    setSaving(false);
    try {
      const [v, d] = await Promise.all([vehApi.list({ status: 'available' }), drvApi.list({ status: 'available' })]);
      setVehicles(v.vehicles); setDrivers(d.drivers);
      setCreateOpen(true);
    } catch (e) { setError(e.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await tripApi.create({ ...form, cargo_weight: Number(form.cargo_weight), planned_distance: Number(form.planned_distance) });
      setCreateOpen(false); setMsg('Trip created (draft)'); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const dispatch = async (t) => {
    if (!window.confirm(`Dispatch trip ${t.trip_code}? Vehicle & driver will go On Trip.`)) return;
    try { await tripApi.dispatch(t.id); setMsg('Trip dispatched — vehicle & driver are now On Trip'); load(); }
    catch (err) { setError(err.message); }
  };

  const openComplete = (t) => { setCompleteTarget(t); setCompleteForm({ final_odometer: '', fuel_consumed: '', revenue: '' }); setCompleteOpen(true); };
  const complete = async (e) => {
    e.preventDefault(); setCompleting(true); setError('');
    try {
      await tripApi.complete(completeTarget.id, {
        final_odometer: Number(completeForm.final_odometer),
        fuel_consumed: completeForm.fuel_consumed ? Number(completeForm.fuel_consumed) : undefined,
        revenue: completeForm.revenue ? Number(completeForm.revenue) : undefined,
      });
      setCompleteOpen(false); setMsg('Trip completed — vehicle & driver are now Available'); load();
    } catch (err) { setError(err.message); }
    finally { setCompleting(false); }
  };

  const cancel = async (t) => {
    if (!window.confirm(`Cancel trip ${t.trip_code}?`)) return;
    try { await tripApi.cancel(t.id); setMsg('Trip cancelled — vehicle & driver restored to Available'); load(); }
    catch (err) { setError(err.message); }
  };

  const columns = [
    { key: 'trip_code', label: 'Trip Code' },
    { key: 'route', label: 'Route', render: (r) => (<span>{r.source} <span className="text-slate-400">→</span> {r.destination}</span>) },
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || <span className="text-slate-400">—</span> },
    { key: 'driver_name', label: 'Driver', render: (r) => r.driver_name || <span className="text-slate-400">—</span> },
    { key: 'cargo_weight', label: 'Cargo (kg)', render: (r) => Number(r.cargo_weight).toLocaleString() },
    { key: 'status', label: 'Status', render: (r) => <Badge color={TRIP_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
    ...(canManage ? [{
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {r.status === 'draft' && (<Button size="sm" onClick={() => dispatch(r)}><Icon name="route" className="h-4 w-4" /> Dispatch</Button>)}
          {r.status === 'dispatched' && (<Button size="sm" onClick={() => openComplete(r)}><Icon name="check" className="h-4 w-4" /> Complete</Button>)}
          {(r.status === 'draft' || r.status === 'dispatched') && (<Button size="sm" variant="outline" onClick={() => cancel(r)}>Cancel</Button>)}
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        icon="route"
        title="Trips"
        subtitle="Create, dispatch and complete trips — status changes are automatic"
        action={canManage && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> New Trip</Button>}
      />
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Status">
          <select className={inputCls} value={filters.status} onChange={(e) => apply({ status: e.target.value })}>
            <option value="">All</option>
            {TRIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Search">
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Trip code / route" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && apply({ search: e.target.value })} />
            <Button variant="secondary" onClick={() => apply({ search: filters.search })}><Icon name="search" className="h-4 w-4" /></Button>
          </div>
        </Field>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div>
      ) : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No trips yet" desc="Create a draft trip and dispatch it to move a vehicle On Trip." action={canManage && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> New Trip</Button>} />} />
      )}

      <Modal
        open={createOpen} onClose={() => setCreateOpen(false)} title="New Trip"
        subtitle="Pick an available vehicle & driver, then dispatch"
        footer={<>
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : 'Create'}</Button>
        </>}
      >
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source"><input className={inputCls} required placeholder="Ahmedabad" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
            <Field label="Destination"><input className={inputCls} required placeholder="Surat" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
          </div>
          <Field label="Vehicle (available only)">
            <select className={inputCls} required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number} — {v.name} ({v.max_load_capacity}kg)</option>))}
            </select>
          </Field>
          <Field label="Driver (available only)">
            <select className={inputCls} required value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
              <option value="">Select driver</option>
              {drivers.map((d) => (<option key={d.id} value={d.id}>{d.name} ({d.license_number})</option>))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo Weight (kg)"><input className={inputCls} type="number" min="0" required placeholder="450" value={form.cargo_weight} onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} /></Field>
            <Field label="Planned Distance (km)"><input className={inputCls} type="number" min="0" required placeholder="120" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} /></Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={completeOpen} onClose={() => setCompleteOpen(false)}
        title={`Complete Trip ${completeTarget?.trip_code || ''}`}
        subtitle="Final odometer & fuel update the vehicle and reports"
        footer={<>
          <Button variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</Button>
          <Button onClick={complete} disabled={completing}>{completing ? <Spinner className="h-4 w-4" /> : 'Complete'}</Button>
        </>}
      >
        <form onSubmit={complete} className="space-y-3">
          <Field label="Final Odometer"><input className={inputCls} type="number" min="0" required value={completeForm.final_odometer} onChange={(e) => setCompleteForm({ ...completeForm, final_odometer: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fuel Consumed (L)"><input className={inputCls} type="number" min="0" value={completeForm.fuel_consumed} onChange={(e) => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })} /></Field>
            <Field label="Revenue"><input className={inputCls} type="number" min="0" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} /></Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
