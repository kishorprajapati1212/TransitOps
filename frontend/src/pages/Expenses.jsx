import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenses as expApi, vehicles as vehApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Icon, Spinner, PageHeader, EmptyState, Toast, ConfirmDialog,
} from '../components/ui';

const CATEGORIES = ['toll', 'maintenance', 'fuel', 'insurance', 'misc'];
const blank = { vehicle_id: '', category: 'toll', description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10) };

export default function Expenses() {
  const { user } = useAuth();
  const canEdit = ['fleet_manager', 'financial_analyst'].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const showToast = useCallback((message, tone = 'success') => setToast({ message, tone }), []);
  const clearToast = useCallback(() => setToast({ message: '', tone: 'success' }), []);

  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState({ open: false, onConfirm: () => {} });

  const load = () => {
    setLoading(true);
    expApi
      .list()
      .then((d) => { setRows(d.expenses); })
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCreate = async () => {
    setForm(blank); setSaving(false);
    try { const v = await vehApi.list(); setVehicles(v.vehicles); setOpen(true); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await expApi.create({
        ...form,
        amount: Number(form.amount || 0),
        vehicle_id: form.vehicle_id || undefined,
      });
      setOpen(false); showToast('✅ Expense added'); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (x) => {
    setConfirmDel({ open: true, onConfirm: async () => {
      try { await expApi.remove(x.id); showToast('Expense deleted'); load(); }
      catch (err) { showToast(err.message, 'error'); }
    }});
  };

  const columns = [
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || <span className="text-slate-400">—</span> },
    { key: 'category', label: 'Category', render: (r) => <Badge color="violet">{r.category}</Badge> },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', render: (r) => `₹${Number(r.amount || 0).toLocaleString()}` },
    { key: 'expense_date', label: 'Date' },
    ...(canEdit ? [{
      key: 'actions', label: 'Actions',
      render: (r) => (<Button size="sm" variant="ghost" onClick={() => remove(r)}><Icon name="x" className="h-4 w-4 text-rose-500" /></Button>),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        icon="receipt"
        title="Expenses"
        subtitle="Tolls, maintenance and other spend — all rolled into operational cost"
        action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Expense</Button>}
      />

      <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      <ConfirmDialog open={confirmDel.open} onClose={() => setConfirmDel(c => ({ ...c, open: false }))} onConfirm={confirmDel.onConfirm} title="Delete?" message="This cannot be undone." confirmText="Delete" />

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div>
      ) : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No expenses yet" desc="Log a toll or maintenance cost to track operational spend." action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Expense</Button>} />} />
      )}

      <Modal
        open={open} onClose={() => setOpen(false)} title="Add Expense" subtitle="Categorize the spend"
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : 'Add'}</Button>
        </>}
      >
        <form onSubmit={submit} className="space-y-3">
          <Field label="Vehicle (optional)">
            <select className={inputCls} value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">No vehicle</option>
              {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (₹)"><input className={inputCls} type="number" min="0" required placeholder="600" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          </div>
          <Field label="Description"><input className={inputCls} placeholder="Expressway toll" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Date"><input className={inputCls} type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
