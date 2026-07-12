import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fuel as fuelApi, vehicles as vehApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Alert, Icon, Spinner, PageHeader, EmptyState,
} from '../components/ui';

const blank = { vehicle_id: '', liters: '', cost: '', log_date: new Date().toISOString().slice(0, 10) };

export default function Fuel() {
  const { user } = useAuth();
  const canEdit = ['fleet_manager', 'financial_analyst'].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fuelApi
      .list()
      .then((d) => { setRows(d.fuelLogs); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCreate = async () => {
    setForm(blank); setSaving(false);
    try { const v = await vehApi.list(); setVehicles(v.vehicles); setOpen(true); }
    catch (e) { setError(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await fuelApi.create({ ...form, liters: Number(form.liters), cost: Number(form.cost || 0) });
      setOpen(false); setMsg('Fuel log added'); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (f) => {
    if (!window.confirm('Delete this fuel log?')) return;
    try { await fuelApi.remove(f.id); setMsg('Fuel log deleted'); load(); }
    catch (err) { setError(err.message); }
  };

  const columns = [
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || r.vehicle_id },
    { key: 'liters', label: 'Liters', render: (r) => `${Number(r.liters).toLocaleString()} L` },
    { key: 'cost', label: 'Cost', render: (r) => `₹${Number(r.cost || 0).toLocaleString()}` },
    { key: 'log_date', label: 'Date' },
    ...(canEdit ? [{
      key: 'actions', label: 'Actions',
      render: (r) => (<Button size="sm" variant="ghost" onClick={() => remove(r)}><Icon name="x" className="h-4 w-4 text-rose-500" /></Button>),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        icon="fuel"
        title="Fuel Logs"
        subtitle="Record fuel fills — feeds efficiency and cost analytics"
        action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Fuel Log</Button>}
      />
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div>
      ) : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No fuel logs" desc="Add a fuel fill to track consumption and cost." action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Fuel Log</Button>} />} />
      )}

      <Modal
        open={open} onClose={() => setOpen(false)} title="Add Fuel Log" subtitle="Link it to a vehicle"
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : 'Add'}</Button>
        </>}
      >
        <form onSubmit={submit} className="space-y-3">
          <Field label="Vehicle">
            <select className={inputCls} required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Liters"><input className={inputCls} type="number" min="0" step="0.1" required placeholder="35" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} /></Field>
            <Field label="Cost (₹)"><input className={inputCls} type="number" min="0" placeholder="3500" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
          </div>
          <Field label="Date"><input className={inputCls} type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
