import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { maintenance as maintApi, vehicles as vehApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Icon, Spinner, PageHeader, EmptyState, Toast, ConfirmDialog,
} from '../components/ui';
import { MAINTENANCE_STATUSES, MAINTENANCE_STATUS_COLORS } from '../constants';

const blank = { vehicle_id: '', type: '', description: '', cost: '' };

export default function Maintenance() {
  const { user } = useAuth();
  const canEdit = user?.role === 'fleet_manager';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const [filters, setFilters] = useState({ status: '' });
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {}, confirmText: 'Confirm', variant: 'danger', icon: 'alert' });

  const showToast = useCallback((msg, tone = 'success') => setToast({ message: msg, tone }), []);
  const clearToast = useCallback(() => setToast({ message: '', tone: 'success' }), []);

  const load = (f = filters) => {
    setLoading(true);
    maintApi.list(f).then((d) => setRows(d.maintenance)).catch((e) => showToast(e.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const apply = (patch) => { const nf = { ...filters, ...patch }; setFilters(nf); load(nf); };

  const openCreate = async () => {
    setForm(blank); setSaving(false);
    try { const v = await vehApi.list(); setVehicles(v.vehicles); setOpen(true); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await maintApi.create({ ...form, cost: Number(form.cost || 0) }); setOpen(false); showToast('Maintenance logged — vehicle moved to In Shop'); load(); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const closeMaint = (m) => {
    setConfirm({ open: true, title: 'Close Maintenance?', message: `Close maintenance for ${m.vehicle_registration}? Vehicle returns to Available.`,
      confirmText: 'Close', variant: 'success', icon: 'check',
      onConfirm: async () => { try { await maintApi.close(m.id); showToast('Maintenance closed — vehicle restored'); load(); } catch (err) { showToast(err.message, 'error'); } }
    });
  };

  const remove = (m) => {
    setConfirm({ open: true, title: 'Delete Record?', message: 'Delete this maintenance record? This cannot be undone.',
      confirmText: 'Delete', variant: 'danger', icon: 'alert',
      onConfirm: async () => { try { await maintApi.remove(m.id); showToast('Record deleted'); load(); } catch (err) { showToast(err.message, 'error'); } }
    });
  };

  const columns = [
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || <span className="text-slate-400">{r.vehicle_id}</span> },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description', render: (r) => r.description || <span className="text-slate-400">—</span> },
    { key: 'cost', label: 'Cost', render: (r) => `₹${Number(r.cost || 0).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <Badge color={MAINTENANCE_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
    ...(canEdit ? [{ key: 'actions', label: 'Actions', sticky: true, render: (r) => (
      <div className="flex gap-1.5">
        {r.status === 'open' && <Button size="xs" variant="success" onClick={() => closeMaint(r)}><Icon name="check" className="h-3.5 w-3.5" /> Close</Button>}
        <Button size="xs" variant="ghost" onClick={() => remove(r)}><Icon name="xSmall" className="h-3.5 w-3.5 text-rose-500" /></Button>
      </div>
    )}] : []),
  ];

  return (
    <div>
      <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))} onConfirm={confirm.onConfirm}
        title={confirm.title} message={confirm.message} confirmText={confirm.confirmText} confirmVariant={confirm.variant} icon={confirm.icon} />

      <PageHeader icon="wrench" title="Maintenance" subtitle="Service logs move vehicles to In Shop automatically"
        action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Log Maintenance</Button>} />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Status"><select className={inputCls} value={filters.status} onChange={(e) => apply({ status: e.target.value })}>
          <option value="">All</option>{MAINTENANCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select></Field>
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div> : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No maintenance records" desc="Log service to see a vehicle move to In Shop."
          action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Log Maintenance</Button>} />} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Maintenance" subtitle="The vehicle will switch to In Shop"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : 'Log'}</Button></>}>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Vehicle"><select className={inputCls} required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
            <option value="">Select vehicle</option>{vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number} — {v.name} ({v.status})</option>))}
          </select></Field>
          <Field label="Type"><input className={inputCls} required placeholder="Oil Change" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>
          <Field label="Description"><input className={inputCls} placeholder="Regular service" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Cost (₹)"><input className={inputCls} type="number" min="0" placeholder="2000" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
