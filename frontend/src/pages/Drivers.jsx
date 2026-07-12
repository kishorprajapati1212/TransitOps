import { useEffect, useState, useCallback } from 'react';
import { formatDate } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { drivers as drvApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Icon, Spinner, PageHeader, EmptyState, Toast, ConfirmDialog,
} from '../components/ui';
import { DRIVER_STATUSES, DRIVER_STATUS_COLORS } from '../constants';

const blank = { name: '', license_number: '', license_category: '', license_expiry_date: '', contact_number: '', safety_score: '', status: 'off_duty' };

function isExpired(date) {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toDateString());
}

export default function Drivers() {
  const { user } = useAuth();
  const isFleetManager = user?.role === 'fleet_manager';
  const isSafetyOfficer = user?.role === 'safety_officer';
  const canEdit = isFleetManager;
  const canCompliance = isFleetManager || isSafetyOfficer;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const [filters, setFilters] = useState({ search: '', status: '' });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Compliance modal (Safety Officer)
  const [compOpen, setCompOpen] = useState(false);
  const [compTarget, setCompTarget] = useState(null);
  const [compForm, setCompForm] = useState({ status: '', safety_score: '' });
  const [compSaving, setCompSaving] = useState(false);

  const [confirmDel, setConfirmDel] = useState({ open: false, onConfirm: () => {} });

  const showToast = useCallback((msg, tone = 'success') => setToast({ message: msg, tone }), []);
  const clearToast = useCallback(() => setToast({ message: '', tone: 'success' }), []);

  const load = (f = filters) => {
    setLoading(true);
    drvApi.list(f).then((d) => setRows(d.drivers)).catch((e) => showToast(e.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const apply = (patch) => { const nf = { ...filters, ...patch }; setFilters(nf); load(nf); };

  // ── Fleet Manager CRUD ──
  const openCreate = () => { setEditing(null); setForm(blank); setFormErrors({}); setOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, license_number: d.license_number, license_category: d.license_category,
      license_expiry_date: (d.license_expiry_date || '').slice(0, 10), contact_number: d.contact_number || '',
      safety_score: d.safety_score, status: d.status });
    setFormErrors({}); setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.contact_number && !/^\d{10}$/.test(form.contact_number)) {
      setFormErrors({ contact_number: 'Must be exactly 10 digits' }); return;
    }
    setFormErrors({}); setSaving(true);
    try {
      const payload = { ...form, safety_score: Number(form.safety_score || 0) };
      if (editing) await drvApi.update(editing.id, payload); else await drvApi.create(payload);
      setOpen(false); showToast(editing ? 'Driver updated' : 'Driver added'); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const remove = (d) => {
    setConfirmDel({ open: true, onConfirm: async () => {
      try { await drvApi.remove(d.id); showToast('Driver deleted'); load(); }
      catch (err) { showToast(err.message, 'error'); }
    }});
  };

  // ── Safety Officer compliance ──
  const openCompliance = (d) => {
    setCompTarget(d);
    setCompForm({ status: d.status, safety_score: d.safety_score });
    setCompOpen(true);
  };

  const submitCompliance = async (e) => {
    e.preventDefault(); setCompSaving(true);
    try {
      await drvApi.updateCompliance(compTarget.id, {
        status: compForm.status,
        safety_score: Number(compForm.safety_score),
      });
      setCompOpen(false); showToast(`Compliance updated for ${compTarget.name}`); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setCompSaving(false); }
  };

  const suspend = (d) => {
    setConfirmDel({ open: false, onConfirm: () => {} }); // reuse confirm state pattern
    // Direct suspend via compliance endpoint
    const doSuspend = async () => {
      try { await drvApi.updateCompliance(d.id, { status: 'suspended' }); showToast(`${d.name} suspended`); load(); }
      catch (err) { showToast(err.message, 'error'); }
    };
    if (d.status === 'suspended') {
      // Reinstate
      (async () => {
        try { await drvApi.updateCompliance(d.id, { status: 'available' }); showToast(`${d.name} reinstated to available`); load(); }
        catch (err) { showToast(err.message, 'error'); }
      })();
    } else {
      doSuspend();
    }
  };

  // ── Columns ──
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'contact_number', label: 'Contact', render: (r) => r.contact_number || <span className="text-slate-400">—</span> },
    { key: 'license_number', label: 'License #' },
    { key: 'license_expiry_date', label: 'Expiry', render: (r) => {
      const exp = isExpired(r.license_expiry_date);
      return <span className={exp ? 'font-medium text-rose-500' : ''}>{formatDate(r.license_expiry_date)}{exp && ' ⚠️'}</span>;
    }},
    { key: 'safety_score', label: 'Safety', render: (r) => <Badge color={r.safety_score >= 80 ? 'emerald' : r.safety_score >= 60 ? 'amber' : 'rose'}>{r.safety_score}</Badge> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={DRIVER_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
    ...((canEdit || canCompliance) ? [{
      key: 'actions', label: 'Actions', sticky: true,
      render: (r) => (
        <div className="flex gap-1.5 flex-wrap">
          {/* Fleet Manager — full edit + delete */}
          {canEdit && <Button size="xs" variant="outline" onClick={() => openEdit(r)} title="Edit"><Icon name="edit" className="h-3.5 w-3.5" /></Button>}
          {canEdit && <Button size="xs" variant="ghost" onClick={() => remove(r)} title="Delete"><Icon name="xSmall" className="h-3.5 w-3.5 text-rose-500" /></Button>}

          {/* Safety Officer — compliance actions */}
          {canCompliance && (
            <>
              <Button size="xs" variant="outline" onClick={() => openCompliance(r)} title="Update compliance">
                <Icon name="shield" className="h-3.5 w-3.5" /> Score
              </Button>
              {r.status !== 'on_trip' && (
                <Button size="xs" variant={r.status === 'suspended' ? 'success' : 'warning'} onClick={() => suspend(r)}
                  title={r.status === 'suspended' ? 'Reinstate driver' : 'Suspend driver'}>
                  {r.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                </Button>
              )}
            </>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      <ConfirmDialog open={confirmDel.open} onClose={() => setConfirmDel(c => ({ ...c, open: false }))} onConfirm={confirmDel.onConfirm} title="Delete Driver?" message="This cannot be undone." confirmText="Delete" />

      <PageHeader icon="user" title="Drivers"
        subtitle={isSafetyOfficer ? 'Monitor compliance, suspend drivers, update safety scores' : 'Driver profiles, licenses and compliance'}
        action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Driver</Button>}
      />

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

      {loading ? <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div> : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No drivers yet" desc="Add drivers with valid licenses."
          action={canEdit && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add Driver</Button>} />} />
      )}

      {/* Fleet Manager — full edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Driver' : 'Add Driver'} subtitle={editing ? 'Update driver profile' : 'Onboard a new driver'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : (editing ? 'Save' : 'Add')}</Button></>}>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><input className={inputCls} required placeholder="Alex" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Contact (10 digits)" error={formErrors.contact_number}>
              <input className={inputCls} placeholder="9999900001" maxLength={10} value={form.contact_number}
                onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, contact_number: val }); if (formErrors.contact_number && val.length === 10) setFormErrors({}); }} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License #"><input className={inputCls} required placeholder="DL-1001" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} /></Field>
            <Field label="Category"><input className={inputCls} required placeholder="B / C" value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License Expiry"><input className={inputCls} type="date" required value={form.license_expiry_date} onChange={(e) => setForm({ ...form, license_expiry_date: e.target.value })} /></Field>
            <Field label="Safety Score (0-100)"><input className={inputCls} type="number" min="0" max="100" placeholder="90" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} /></Field>
          </div>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </form>
      </Modal>

      {/* Safety Officer — compliance modal */}
      <Modal open={compOpen} onClose={() => setCompOpen(false)} title={`Compliance — ${compTarget?.name || ''}`}
        subtitle="Update driver status or safety score"
        footer={<><Button variant="secondary" onClick={() => setCompOpen(false)}>Cancel</Button><Button onClick={submitCompliance} disabled={compSaving}>{compSaving ? <Spinner className="h-4 w-4" /> : 'Update'}</Button></>}>
        <form onSubmit={submitCompliance} className="space-y-3">
          <Field label="Status">
            <select className={inputCls} value={compForm.status} onChange={(e) => setCompForm({ ...compForm, status: e.target.value })}>
              {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Safety Score (0-100)">
            <input className={inputCls} type="number" min="0" max="100" value={compForm.safety_score} onChange={(e) => setCompForm({ ...compForm, safety_score: e.target.value })} />
          </Field>
          {compTarget && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="text-xs text-slate-400">License: {compTarget.license_number} · Category: {compTarget.license_category}</p>
              <p className="text-xs text-slate-400">Expiry: {formatDate(compTarget.license_expiry_date)}{isExpired(compTarget.license_expiry_date) ? ' ⚠️ EXPIRED' : ''}</p>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
