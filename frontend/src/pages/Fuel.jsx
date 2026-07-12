import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { fuel as fuelApi, expenses as expApi, vehicles as vehApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Icon, Spinner, PageHeader, EmptyState, Toast, ConfirmDialog, Tabs, Card,
} from '../components/ui';

const CATEGORIES = ['toll', 'maintenance', 'insurance', 'misc'];

export default function FuelAndExpenses() {
  const { user } = useAuth();
  const canEdit = ['fleet_manager', 'financial_analyst'].includes(user?.role);
  const [tab, setTab] = useState('fuel');
  const [fuelRows, setFuelRows] = useState([]);
  const [expRows, setExpRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const [vehicles, setVehicles] = useState([]);

  // Fuel form
  const [fuelOpen, setFuelOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', liters: '', cost: '', log_date: new Date().toISOString().slice(0, 10) });
  const [fuelSaving, setFuelSaving] = useState(false);

  // Expense form
  const [expOpen, setExpOpen] = useState(false);
  const [expForm, setExpForm] = useState({ vehicle_id: '', category: 'toll', description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10) });
  const [expSaving, setExpSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, onConfirm: () => {} });

  const showToast = useCallback((msg, tone = 'success') => setToast({ message: msg, tone }), []);
  const clearToast = useCallback(() => setToast({ message: '', tone: 'success' }), []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([fuelApi.list(), expApi.list()])
      .then(([f, e]) => { setFuelRows(f.fuelLogs || []); setExpRows(e.expenses || []); })
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  const fetchVehicles = async () => {
    try { const v = await vehApi.list(); setVehicles(v.vehicles); }
    catch (e) { showToast(e.message, 'error'); }
  };

  // ── Fuel CRUD ──
  const openFuel = async () => {
    setFuelForm({ vehicle_id: '', liters: '', cost: '', log_date: new Date().toISOString().slice(0, 10) });
    await fetchVehicles(); setFuelOpen(true);
  };
  const submitFuel = async (e) => {
    e.preventDefault(); setFuelSaving(true);
    try {
      await fuelApi.create({ ...fuelForm, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost || 0) });
      setFuelOpen(false); showToast('Fuel log added'); loadAll();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setFuelSaving(false); }
  };
  const removeFuel = (f) => {
    setConfirm({ open: true, onConfirm: async () => {
      try { await fuelApi.remove(f.id); showToast('Fuel log deleted'); loadAll(); }
      catch (err) { showToast(err.message, 'error'); }
    }});
  };

  // ── Expense CRUD ──
  const openExp = async () => {
    setExpForm({ vehicle_id: '', category: 'toll', description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10) });
    await fetchVehicles(); setExpOpen(true);
  };
  const submitExp = async (e) => {
    e.preventDefault(); setExpSaving(true);
    try {
      await expApi.create({ ...expForm, amount: Number(expForm.amount || 0), vehicle_id: expForm.vehicle_id || undefined });
      setExpOpen(false); showToast('Expense added'); loadAll();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setExpSaving(false); }
  };
  const removeExp = (x) => {
    setConfirm({ open: true, onConfirm: async () => {
      try { await expApi.remove(x.id); showToast('Expense deleted'); loadAll(); }
      catch (err) { showToast(err.message, 'error'); }
    }});
  };

  const fuelCols = [
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || <span className="text-slate-400">—</span> },
    { key: 'liters', label: 'Liters', render: (r) => `${Number(r.liters).toLocaleString()} L` },
    { key: 'cost', label: 'Cost', render: (r) => `₹${Number(r.cost || 0).toLocaleString()}` },
    { key: 'log_date', label: 'Date', render: (r) => formatDate(r.log_date) },
    ...(canEdit ? [{ key: 'actions', label: '', render: (r) => <Button size="xs" variant="ghost" onClick={() => removeFuel(r)}><Icon name="xSmall" className="h-3.5 w-3.5 text-rose-500" /></Button> }] : []),
  ];

  const expCols = [
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || <span className="text-slate-400">—</span> },
    { key: 'category', label: 'Category', render: (r) => <Badge color="violet">{r.category}</Badge> },
    { key: 'description', label: 'Description', render: (r) => r.description || <span className="text-slate-400">—</span> },
    { key: 'amount', label: 'Amount', render: (r) => `₹${Number(r.amount || 0).toLocaleString()}` },
    { key: 'expense_date', label: 'Date', render: (r) => formatDate(r.expense_date) },
    ...(canEdit ? [{ key: 'actions', label: '', render: (r) => <Button size="xs" variant="ghost" onClick={() => removeExp(r)}><Icon name="xSmall" className="h-3.5 w-3.5 text-rose-500" /></Button> }] : []),
  ];

  return (
    <div>
      <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))} onConfirm={confirm.onConfirm} title="Delete?" message="This cannot be undone." confirmText="Delete" />

      <PageHeader icon="fuel" title="Fuel & Expenses" subtitle="Track fuel consumption and operational expenses per vehicle"
        action={canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={openExp}><Icon name="plus" className="h-4 w-4" /> Expense</Button>
            <Button onClick={openFuel}><Icon name="plus" className="h-4 w-4" /> Fuel Log</Button>
          </div>
        )}
      />

      <div className="mb-4 flex items-center justify-between">
        <Tabs tabs={[{ key: 'fuel', label: `Fuel Logs (${fuelRows.length})` }, { key: 'expenses', label: `Expenses (${expRows.length})` }]} active={tab} onChange={setTab} />
      </div>

      {loading ? <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div> : (
        tab === 'fuel' ? (
          <Table columns={fuelCols} rows={fuelRows} empty={<EmptyState title="No fuel logs" desc="Add fuel fills to track consumption and cost."
            action={canEdit && <Button onClick={openFuel}><Icon name="plus" className="h-4 w-4" /> Add Fuel Log</Button>} />} />
        ) : (
          <Table columns={expCols} rows={expRows} empty={<EmptyState title="No expenses" desc="Log tolls, insurance or misc costs."
            action={canEdit && <Button onClick={openExp}><Icon name="plus" className="h-4 w-4" /> Add Expense</Button>} />} />
        )
      )}

      {/* Fuel Modal */}
      <Modal open={fuelOpen} onClose={() => setFuelOpen(false)} title="Add Fuel Log" subtitle="Record a fuel fill for a vehicle"
        footer={<><Button variant="secondary" onClick={() => setFuelOpen(false)}>Cancel</Button><Button onClick={submitFuel} disabled={fuelSaving}>{fuelSaving ? <Spinner className="h-4 w-4" /> : 'Add'}</Button></>}>
        <form onSubmit={submitFuel} className="space-y-3">
          <Field label="Vehicle">
            <select className={inputCls} required value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Liters"><input className={inputCls} type="number" min="0.1" step="0.1" required placeholder="35" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} /></Field>
            <Field label="Cost (₹)"><input className={inputCls} type="number" min="0" required placeholder="3500" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} /></Field>
          </div>
          <Field label="Date"><input className={inputCls} type="date" value={fuelForm.log_date} onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })} /></Field>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Add Expense" subtitle="Log a toll, insurance or other cost"
        footer={<><Button variant="secondary" onClick={() => setExpOpen(false)}>Cancel</Button><Button onClick={submitExp} disabled={expSaving}>{expSaving ? <Spinner className="h-4 w-4" /> : 'Add'}</Button></>}>
        <form onSubmit={submitExp} className="space-y-3">
          <Field label="Vehicle (optional)">
            <select className={inputCls} value={expForm.vehicle_id} onChange={(e) => setExpForm({ ...expForm, vehicle_id: e.target.value })}>
              <option value="">No vehicle</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number} — {v.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={inputCls} value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (₹)"><input className={inputCls} type="number" min="0" required placeholder="600" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} /></Field>
          </div>
          <Field label="Description"><input className={inputCls} placeholder="Expressway toll" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} /></Field>
          <Field label="Date"><input className={inputCls} type="date" value={expForm.expense_date} onChange={(e) => setExpForm({ ...expForm, expense_date: e.target.value })} /></Field>
        </form>
      </Modal>
    </div>
  );
}
