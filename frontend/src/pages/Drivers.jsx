import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { drivers as drvApi } from '../api';
import {
  Card, Table, Button, Badge, Modal, Field, inputCls, Alert, Icon, Spinner, PageHeader, EmptyState,
} from '../components/ui';
import { DRIVER_STATUSES, DRIVER_STATUS_COLORS } from '../constants';

const blank = { name: '', license_number: '', license_category: '', license_expiry_date: '', contact_number: '', safety_score: '', status: 'off_duty' };

function isExpired(date) {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toDateString());
}

export default function Drivers() {
  const { user } = useAuth();
  const canEdit = user?.role === 'fleet_manager';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = (f = filters) => {
    setLoading(true);
    drvApi
      .list(f)
      .then((d) => { setRows(d.drivers); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const apply = (patch) => { const nf = { ...filters, ...patch }; setFilters(nf); load(nf); };

  const openCreate = () => { setEditing(null); setForm(blank); setMsg(''); setOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name, license_number: d.license_number, license_category: d.license_category,
      license_expiry_date: (d.license_expiry_date || '').slice(0, 10), contact_number: d.contact_number || '',
      safety_score: d.safety_score, status: d.status,
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, safety_score: Number(form.safety_score || 0) };
      if (editing) await drvApi.update(editing.id, payload);
      else await drvApi.create(payload);
      setOpen(false);
      setMsg(editing ? 'Driver updated' : 'Driver added');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete driver ${d.name}?`)) return;
    try { await drvApi.remove(d.id); setMsg('Driver deleted'); load(); }
    catch (err) { setError(err.message); }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'license_number', label: 'License #' },
    { key: 'license_category', label: 'Category' },
    { key: 'license_expiry_date', label: 'License Expiry', render: (r) => {
      const exp = isExpired(r.license_expiry_date);
      return <span className={exp ? 'font-medium text-rose-500' : ''}>{r.license_expiry_date}{exp && ' (expired)'}</span>;
    } },
    { key: 'safety_score', label: 'Safety', render: (r) => <Badge color={r.safety_score >= 80 ? 'emerald' : r.safety_score >= 60 ? 'amber' : 'rose'}>{r.safety_score}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={DRIVER_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
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
        icon="user"
        title="Drivers"
        subtitle="Driver profiles, licenses and compliance"
        action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Driver</Button>}
      />
      {error && <Alert tone="error" className="mb-4">{error}</Alert>}
      {msg && <Alert tone="success" className="mb-4">{msg}</Alert>}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Search" className="min-w-[220px] flex-1">
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Name or license" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && apply({ search: e.target.value })} />
            <Button variant="secondary" onClick={() => apply({ search: filters.search })}><Icon name="search" className="h-4 w-4" /></Button>
          </div>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={filters.status} onChange={(e) => apply({ status: e.target.value })}>
            <option value="">All</option>
            {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div>
      ) : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No drivers yet" desc="Add drivers with valid licenses." action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Driver</Button>} />} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Driver' : 'Add Driver'}
        subtitle={editing ? 'Update driver profile' : 'Onboard a new driver'}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : (editing ? 'Save' : 'Add')}</Button>
        </>}
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input className={inputCls} required placeholder="Alex" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Contact">
              <input className={inputCls} placeholder="9999900001" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License #">
              <input className={inputCls} required placeholder="DL-1001" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
            </Field>
            <Field label="Category">
              <input className={inputCls} required placeholder="B / C" value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License Expiry">
              <input className={inputCls} type="date" required value={form.license_expiry_date} onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })} />
            </Field>
            <Field label="Safety Score">
              <input className={inputCls} type="number" min="0" max="100" placeholder="90" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} />
            </Field>
          </div>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
