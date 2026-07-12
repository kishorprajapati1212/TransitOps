import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { vehicles as vehApi } from '../api';
import {
  Card, Table, Button, Badge, Modal, Field, inputCls, Alert, Icon, Spinner, PageHeader, EmptyState,
} from '../components/ui';
import { VEHICLE_STATUSES, VEHICLE_STATUS_COLORS } from '../constants';

const blank = { registration_number: '', name: '', type: '', max_load_capacity: '', odometer: '', acquisition_cost: '', status: 'available', region: '' };

export default function Vehicles() {
  const { user } = useAuth();
  const canEdit = user?.role === 'fleet_manager';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', type: '', region: '' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = (f = filters) => {
    setLoading(true);
    vehApi
      .list(f)
      .then((d) => { setRows(d.vehicles); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const apply = (patch) => { const nf = { ...filters, ...patch }; setFilters(nf); load(nf); };

  const openCreate = () => { setEditing(null); setForm(blank); setMsg(''); setOpen(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      registration_number: v.registration_number, name: v.name, type: v.type,
      max_load_capacity: v.max_load_capacity, odometer: v.odometer, acquisition_cost: v.acquisition_cost,
      status: v.status, region: v.region || '',
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        max_load_capacity: Number(form.max_load_capacity),
        odometer: Number(form.odometer || 0),
        acquisition_cost: Number(form.acquisition_cost || 0),
      };
      if (editing) await vehApi.update(editing.id, payload);
      else await vehApi.create(payload);
      setOpen(false);
      setMsg(editing ? 'Vehicle updated' : 'Vehicle registered');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (v) => {
    if (!window.confirm(`Delete vehicle ${v.registration_number}?`)) return;
    try { await vehApi.remove(v.id); setMsg('Vehicle deleted'); load(); }
    catch (err) { setError(err.message); }
  };

  const columns = [
    { key: 'registration_number', label: 'Registration' },
    { key: 'name', label: 'Name / Model' },
    { key: 'type', label: 'Type' },
    { key: 'max_load_capacity', label: 'Capacity (kg)', render: (r) => Number(r.max_load_capacity).toLocaleString() },
    { key: 'odometer', label: 'Odometer', render: (r) => Number(r.odometer || 0).toLocaleString() + ' km' },
    { key: 'region', label: 'Region', render: (r) => r.region || '—' },
    { key: 'status', label: 'Status', render: (r) => <Badge color={VEHICLE_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
    ...(canEdit ? [{
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Icon name="settings" className="h-4 w-4" /> Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => remove(r)}><Icon name="x" className="h-4 w-4 text-rose-500" /></Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        icon="truck"
        title="Vehicles"
        subtitle="Master registry of your fleet with live status"
        action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Register Vehicle</Button>}
      />
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Search" className="min-w-[200px] flex-1">
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Registration or name" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && apply({ search: e.target.value })} />
            <Button variant="secondary" onClick={() => apply({ search: filters.search })}><Icon name="search" className="h-4 w-4" /></Button>
          </div>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={filters.status} onChange={(e) => apply({ status: e.target.value })}>
            <option value="">All</option>
            {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Region">
          <input className={inputCls} placeholder="e.g. Ahmedabad" value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && apply({ region: e.target.value })} />
        </Field>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div>
      ) : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No vehicles yet" desc="Register your first vehicle to get started." action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Register Vehicle</Button>} />} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Vehicle' : 'Register Vehicle'}
        subtitle={editing ? 'Update fleet details' : 'Add a new vehicle to the registry'}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : (editing ? 'Save' : 'Register')}</Button>
        </>}
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration #" >
              <input className={inputCls} required placeholder="GJ-01-VAN05" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
            </Field>
            <Field label="Name / Model">
              <input className={inputCls} required placeholder="Van-05" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <input className={inputCls} required placeholder="Van / Truck" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </Field>
            <Field label="Region">
              <input className={inputCls} placeholder="Ahmedabad" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Capacity (kg)">
              <input className={inputCls} type="number" min="0" required placeholder="500" value={form.max_load_capacity} onChange={(e) => setForm({ ...form, max_load_capacity: e.target.value })} />
            </Field>
            <Field label="Odometer">
              <input className={inputCls} type="number" min="0" placeholder="0" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </Field>
            <Field label="Cost (₹)">
              <input className={inputCls} type="number" min="0" placeholder="800000" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} />
            </Field>
          </div>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
