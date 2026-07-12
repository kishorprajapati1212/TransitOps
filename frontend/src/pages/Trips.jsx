import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { trips as tripApi, vehicles as vehApi, drivers as drvApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Icon, Spinner, PageHeader, EmptyState, Card, Toast, ConfirmDialog, cx,
} from '../components/ui';
import { TRIP_STATUSES, TRIP_STATUS_COLORS } from '../constants';

const STATUS_LABEL = { draft: 'Draft', dispatched: 'Dispatched', completed: 'Completed', cancelled: 'Cancelled' };

export default function Trips() {
  const { user } = useAuth();
  const canManage = ['fleet_manager', 'driver'].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const [filters, setFilters] = useState({ status: '', search: '' });

  /* Activity log */
  const [logs, setLogs] = useState([]);
  const addLog = (action, detail) => {
    setLogs(prev => [{ time: new Date(), action, detail, id: Date.now() }, ...prev].slice(0, 50));
  };

  /* Create */
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);

  /* Edit */
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
  const [editSaving, setEditSaving] = useState(false);

  /* Complete */
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [completeForm, setCompleteForm] = useState({ final_odometer: '', fuel_consumed: '', revenue: '' });
  const [completing, setCompleting] = useState(false);

  /* Detail */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTrip, setDetailTrip] = useState(null);

  /* Confirm dialog (replaces window.confirm) */
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {}, variant: 'danger', icon: 'alert', confirmText: 'Confirm' });
  const askConfirm = (opts) => setConfirm({ open: true, ...opts });
  const closeConfirm = () => setConfirm(c => ({ ...c, open: false }));

  const showToast = useCallback((message, tone = 'success') => setToast({ message, tone }), []);
  const clearToast = useCallback(() => setToast({ message: '', tone: 'success' }), []);

  const load = (f = filters) => {
    setLoading(true);
    tripApi.list(f)
      .then((d) => setRows(d.trips))
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const apply = (patch) => { const nf = { ...filters, ...patch }; setFilters(nf); load(nf); };

  const fetchAvailable = async () => {
    const [v, d] = await Promise.all([vehApi.list({ status: 'available' }), drvApi.list({ status: 'available' })]);
    setVehicles(v.vehicles); setDrivers(d.drivers);
  };

  const openCreate = async () => {
    setForm({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
    setSaving(false);
    try { await fetchAvailable(); setCreateOpen(true); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const create = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await tripApi.create({ ...form, cargo_weight: Number(form.cargo_weight), planned_distance: Number(form.planned_distance) });
      setCreateOpen(false);
      showToast('Trip created as Draft — ready to dispatch');
      addLog('Created', `Trip ${res.trip?.trip_code || ''} — ${form.source} → ${form.destination}`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const openEdit = async (t) => {
    setEditTarget(t);
    setEditForm({ source: t.source, destination: t.destination, vehicle_id: t.vehicle_id, driver_id: t.driver_id, cargo_weight: t.cargo_weight, planned_distance: t.planned_distance });
    setEditSaving(false);
    try { await fetchAvailable(); setEditOpen(true); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const submitEdit = async (e) => {
    e.preventDefault(); setEditSaving(true);
    try {
      await tripApi.update(editTarget.id, { ...editForm, cargo_weight: Number(editForm.cargo_weight), planned_distance: Number(editForm.planned_distance) });
      setEditOpen(false);
      showToast('Trip updated successfully');
      addLog('Updated', `Trip ${editTarget.trip_code}`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setEditSaving(false); }
  };

  const doDispatch = async (t) => {
    try {
      await tripApi.dispatch(t.id);
      showToast('Trip dispatched — vehicle & driver are now On Trip');
      addLog('Dispatched', `${t.trip_code} — ${t.vehicle_registration || 'vehicle'} + ${t.driver_name || 'driver'} are On Trip`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };
  const dispatch = (t) => {
    askConfirm({
      title: 'Dispatch Trip?',
      message: `Dispatch ${t.trip_code}? The vehicle and driver will be marked "On Trip" and won't be available for other trips.`,
      confirmText: 'Dispatch',
      variant: 'primary',
      icon: 'send',
      onConfirm: () => doDispatch(t),
    });
  };

  const openComplete = (t) => { setCompleteTarget(t); setCompleteForm({ final_odometer: '', fuel_consumed: '', revenue: '' }); setCompleteOpen(true); };
  const complete = async (e) => {
    e.preventDefault(); setCompleting(true);
    try {
      await tripApi.complete(completeTarget.id, {
        final_odometer: Number(completeForm.final_odometer),
        fuel_consumed: completeForm.fuel_consumed ? Number(completeForm.fuel_consumed) : undefined,
        revenue: completeForm.revenue ? Number(completeForm.revenue) : undefined,
      });
      setCompleteOpen(false);
      showToast('Trip completed — vehicle & driver are now Available');
      addLog('Completed', `${completeTarget.trip_code} — odometer: ${completeForm.final_odometer} km`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setCompleting(false); }
  };

  const doCancel = async (t) => {
    try {
      await tripApi.cancel(t.id);
      showToast('Trip cancelled — vehicle & driver restored');
      addLog('Cancelled', `${t.trip_code}`);
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };
  const cancel = (t) => {
    askConfirm({
      title: 'Cancel Trip?',
      message: `Cancel ${t.trip_code}? ${t.status === 'dispatched' ? 'The vehicle and driver will be returned to "Available".' : 'This draft trip will be marked as cancelled.'}`,
      confirmText: 'Yes, Cancel Trip',
      variant: 'danger',
      icon: 'alert',
      onConfirm: () => doCancel(t),
    });
  };

  /* Actions renderer */
  const renderActions = (r) => {
    if (r.status === 'draft') {
      return (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(r)} title="Edit"><Icon name="edit" className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="primary" onClick={() => dispatch(r)} title="Dispatch"><Icon name="send" className="h-3.5 w-3.5" /> Dispatch</Button>
          <Button size="sm" variant="danger" onClick={() => cancel(r)} title="Cancel"><Icon name="xSmall" className="h-3.5 w-3.5" /> Cancel</Button>
        </div>
      );
    }
    if (r.status === 'dispatched') {
      return (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="success" onClick={() => openComplete(r)} title="Complete"><Icon name="check" className="h-3.5 w-3.5" /> Complete</Button>
          <Button size="sm" variant="danger" onClick={() => cancel(r)} title="Cancel"><Icon name="xSmall" className="h-3.5 w-3.5" /> Cancel</Button>
        </div>
      );
    }
    if (r.status === 'completed') return <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">✓ Finished</span>;
    if (r.status === 'cancelled') return <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">— Cancelled</span>;
    return <span className="text-xs text-slate-400">—</span>;
  };

  const columns = [
    { key: 'trip_code', label: 'Code', render: (r) => (
      <button onClick={() => { setDetailTrip(r); setDetailOpen(true); }}
        className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline underline-offset-2">
        {r.trip_code}
      </button>
    )},
    { key: 'route', label: 'Route', render: (r) => (
      <span className="text-slate-700 dark:text-slate-300">{r.source} <span className="text-indigo-500 font-bold mx-0.5">→</span> {r.destination}</span>
    )},
    { key: 'vehicle_registration', label: 'Vehicle', render: (r) => r.vehicle_registration || <span className="text-slate-400">—</span> },
    { key: 'driver_name', label: 'Driver', render: (r) => r.driver_name || <span className="text-slate-400">—</span> },
    { key: 'cargo_weight', label: 'Cargo', render: (r) => <span>{Number(r.cargo_weight).toLocaleString()} kg</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge color={TRIP_STATUS_COLORS[r.status] || 'slate'}>{r.status}</Badge> },
    ...(canManage ? [{ key: 'actions', label: 'Actions', sticky: true, render: renderActions }] : []),
  ];

  return (
    <div>
      <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      <ConfirmDialog open={confirm.open} onClose={closeConfirm} onConfirm={confirm.onConfirm}
        title={confirm.title} message={confirm.message} confirmText={confirm.confirmText}
        confirmVariant={confirm.variant} icon={confirm.icon} />

      <PageHeader icon="route" title="Trips" subtitle="Create, dispatch and complete trips — status changes are automatic"
        action={canManage && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> New Trip</Button>} />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Status">
          <select className={inputCls} value={filters.status} onChange={(e) => apply({ status: e.target.value })}>
            <option value="">All</option>
            {TRIP_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>)}
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

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div>
      ) : (
        <Table columns={columns} rows={rows} empty={
          <EmptyState title="No trips yet" desc="Create a draft trip and dispatch it to move a vehicle On Trip."
            action={canManage && <Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> New Trip</Button>} />
        } />
      )}

      {/* Activity Log */}
      {logs.length > 0 && (
        <Card className="mt-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon name="activity" className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Activity Log</h3>
            </div>
            <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">Clear</button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/40">
                <span className={cx('mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0',
                  log.action === 'Created' ? 'bg-indigo-500' : log.action === 'Dispatched' ? 'bg-sky-500' : log.action === 'Completed' ? 'bg-emerald-500' : log.action === 'Cancelled' ? 'bg-rose-500' : 'bg-slate-400'
                )}>
                  {log.action.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200"><span className="font-semibold">{log.action}</span> — {log.detail}</p>
                  <p className="text-[10px] text-slate-400">{log.time.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Create Trip Modal ── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Trip"
        subtitle="Pick an available vehicle & driver, then dispatch"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : 'Create Draft'}</Button></>}>
        <form onSubmit={create} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source"><input className={inputCls} required placeholder="Ahmedabad" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
            <Field label="Destination"><input className={inputCls} required placeholder="Surat" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
          </div>
          <Field label="Vehicle (available only)">
            <select className={inputCls} required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number} — {v.name} ({v.max_load_capacity} kg max)</option>))}
            </select>
          </Field>
          <Field label="Driver (available only)">
            <select className={inputCls} required value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
              <option value="">Select driver</option>
              {drivers.map((d) => (<option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo Weight (kg)" hint={form.vehicle_id ? `Max: ${vehicles.find(v => v.id === form.vehicle_id)?.max_load_capacity || '?'} kg` : ''}>
              <input className={inputCls} type="number" min="0" required placeholder="450" value={form.cargo_weight} onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })} />
            </Field>
            <Field label="Planned Distance (km)"><input className={inputCls} type="number" min="0" required placeholder="120" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} /></Field>
          </div>
        </form>
      </Modal>

      {/* ── Edit Trip Modal ── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}
        title={`Edit Trip ${editTarget?.trip_code || ''}`} subtitle="Update this draft trip before dispatching"
        footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button onClick={submitEdit} disabled={editSaving}>{editSaving ? <Spinner className="h-4 w-4" /> : 'Save'}</Button></>}>
        <form onSubmit={submitEdit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source"><input className={inputCls} required value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} /></Field>
            <Field label="Destination"><input className={inputCls} required value={editForm.destination} onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })} /></Field>
          </div>
          <Field label="Vehicle">
            <select className={inputCls} required value={editForm.vehicle_id} onChange={(e) => setEditForm({ ...editForm, vehicle_id: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.registration_number} — {v.name} ({v.max_load_capacity} kg max)</option>))}
              {editTarget && !vehicles.find(v => v.id === editTarget.vehicle_id) && (
                <option value={editTarget.vehicle_id}>{editTarget.vehicle_registration} (current)</option>)}
            </select>
          </Field>
          <Field label="Driver">
            <select className={inputCls} required value={editForm.driver_id} onChange={(e) => setEditForm({ ...editForm, driver_id: e.target.value })}>
              <option value="">Select driver</option>
              {drivers.map((d) => (<option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>))}
              {editTarget && !drivers.find(d => d.id === editTarget.driver_id) && (
                <option value={editTarget.driver_id}>{editTarget.driver_name} (current)</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo Weight (kg)"><input className={inputCls} type="number" min="0" required value={editForm.cargo_weight} onChange={(e) => setEditForm({ ...editForm, cargo_weight: e.target.value })} /></Field>
            <Field label="Planned Distance (km)"><input className={inputCls} type="number" min="0" required value={editForm.planned_distance} onChange={(e) => setEditForm({ ...editForm, planned_distance: e.target.value })} /></Field>
          </div>
        </form>
      </Modal>

      {/* ── Complete Trip Modal ── */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)}
        title={`Complete Trip ${completeTarget?.trip_code || ''}`} subtitle="Enter final odometer & fuel to close this trip"
        footer={<><Button variant="secondary" onClick={() => setCompleteOpen(false)}>Cancel</Button>
          <Button variant="success" onClick={complete} disabled={completing}>{completing ? <Spinner className="h-4 w-4" /> : '✓ Mark Complete'}</Button></>}>
        <form onSubmit={complete} className="space-y-3">
          <Field label="Final Odometer (km)"><input className={inputCls} type="number" min="0" required value={completeForm.final_odometer} onChange={(e) => setCompleteForm({ ...completeForm, final_odometer: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fuel Consumed (L)"><input className={inputCls} type="number" min="0" step="0.1" value={completeForm.fuel_consumed} onChange={(e) => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })} /></Field>
            <Field label="Revenue (₹)"><input className={inputCls} type="number" min="0" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} /></Field>
          </div>
        </form>
      </Modal>

      {/* ── Trip Detail Modal ── */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)}
        title={`Trip ${detailTrip?.trip_code || ''}`}
        subtitle={detailTrip ? `${detailTrip.source} → ${detailTrip.destination}` : ''} size="lg"
        footer={detailTrip && canManage && (<>
          {detailTrip.status === 'draft' && <Button size="sm" variant="outline" onClick={() => { setDetailOpen(false); openEdit(detailTrip); }}>Edit</Button>}
          {detailTrip.status === 'draft' && <Button size="sm" variant="success" onClick={() => { setDetailOpen(false); dispatch(detailTrip); }}>Dispatch</Button>}
          {detailTrip.status === 'dispatched' && <Button size="sm" variant="success" onClick={() => { setDetailOpen(false); openComplete(detailTrip); }}>Complete</Button>}
          {(detailTrip.status === 'draft' || detailTrip.status === 'dispatched') && <Button size="sm" variant="danger" onClick={() => { setDetailOpen(false); cancel(detailTrip); }}>Cancel</Button>}
        </>)}>
        {detailTrip && (
          <div className="space-y-5">
            {/* Lifecycle stepper */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Trip Lifecycle</p>
              <div className="flex items-center justify-between">
                {['draft','dispatched','completed'].map((step, i) => {
                  const order = ['draft','dispatched','completed'];
                  const currentIdx = detailTrip.status === 'cancelled' ? -1 : order.indexOf(detailTrip.status);
                  const stepIdx = order.indexOf(step);
                  let state = 'upcoming';
                  if (detailTrip.status === 'cancelled') state = stepIdx === 0 ? 'completed' : 'cancelled';
                  else if (stepIdx < currentIdx) state = 'completed';
                  else if (stepIdx === currentIdx) state = 'current';
                  const circleClass = state === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white'
                    : state === 'current' ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-500/20'
                    : state === 'cancelled' ? 'bg-rose-500 border-rose-500 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400';
                  const lineClass = state === 'completed' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700';
                  const labelClass = state === 'completed' ? 'text-emerald-600 dark:text-emerald-400'
                    : state === 'current' ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : state === 'cancelled' ? 'text-rose-500' : 'text-slate-400';
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${circleClass}`}>
                          {state === 'completed' ? '✓' : state === 'cancelled' ? '✕' : i + 1}
                        </span>
                        <span className={`mt-1.5 text-xs font-medium ${labelClass}`}>
                          {detailTrip.status === 'cancelled' && i === 2 ? 'Cancelled' : STATUS_LABEL[step]}
                        </span>
                      </div>
                      {i < 2 && <div className={`h-0.5 flex-1 mx-2 rounded-full ${lineClass}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[['Source', detailTrip.source], ['Destination', detailTrip.destination],
                ['Vehicle', detailTrip.vehicle_registration || '—'], ['Driver', detailTrip.driver_name || '—'],
                ['Cargo Weight', `${Number(detailTrip.cargo_weight).toLocaleString()} kg`],
                ['Planned Distance', `${Number(detailTrip.planned_distance).toLocaleString()} km`],
                ...(detailTrip.final_odometer ? [['Final Odometer', `${Number(detailTrip.final_odometer).toLocaleString()} km`]] : []),
                ...(detailTrip.fuel_consumed ? [['Fuel Consumed', `${Number(detailTrip.fuel_consumed).toLocaleString()} L`]] : []),
                ...(detailTrip.revenue > 0 ? [['Revenue', `₹${Number(detailTrip.revenue).toLocaleString()}`]] : []),
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
