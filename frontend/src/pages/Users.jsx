import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as userApi, drivers as drvApi } from '../api';
import {
  Table, Button, Badge, Modal, Field, inputCls, Icon, Spinner, PageHeader, EmptyState, Toast, ConfirmDialog,
} from '../components/ui';
import { ROLE_LABELS } from '../constants';

const ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];
const ROLE_COLORS = { fleet_manager: 'indigo', driver: 'sky', safety_officer: 'amber', financial_analyst: 'violet' };

export default function Users() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'driver', driver_id: '' });
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: () => {} });

  // Link driver modal
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkDriverId, setLinkDriverId] = useState('');

  const showToast = useCallback((msg, tone = 'success') => setToast({ message: msg, tone }), []);
  const clearToast = useCallback(() => setToast({ message: '', tone: 'success' }), []);

  const load = () => {
    setLoading(true);
    userApi.list().then(d => setRows(d.users)).catch(e => showToast(e.message, 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = async () => {
    setForm({ name: '', email: '', password: '', role: 'driver', driver_id: '' });
    setSaving(false);
    try { const d = await drvApi.list(); setDrivers(d.drivers.filter(dr => !dr.user_id)); setCreateOpen(true); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const create = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await userApi.create(form);
      setCreateOpen(false); showToast('User created'); load();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const remove = (u) => {
    if (u.id === user?.id) { showToast('Cannot delete your own account', 'error'); return; }
    setConfirm({ open: true, title: 'Delete User?', message: `Remove ${u.name} (${u.email})? This cannot be undone.`,
      onConfirm: async () => { try { await userApi.remove(u.id); showToast('User deleted'); load(); } catch (err) { showToast(err.message, 'error'); } }
    });
  };

  const openLink = async (u) => {
    setLinkTarget(u);
    setLinkDriverId(u.driver_id || '');
    try { const d = await drvApi.list(); setDrivers(d.drivers); setLinkOpen(true); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const submitLink = async () => {
    try { await userApi.linkDriver(linkTarget.id, linkDriverId || null); setLinkOpen(false); showToast('Driver linked'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (r) => <Badge color={ROLE_COLORS[r.role] || 'slate'}>{ROLE_LABELS[r.role] || r.role}</Badge> },
    { key: 'driver_link', label: 'Linked Driver', render: (r) => {
      if (r.role !== 'driver') return <span className="text-slate-400">—</span>;
      return r.driver_name ? (
        <Badge color="emerald">{r.driver_name}</Badge>
      ) : (
        <span className="text-amber-500 text-xs font-medium">⚠ Not linked</span>
      );
    }},
    { key: 'actions', label: 'Actions', sticky: true, render: (r) => (
      <div className="flex gap-1.5">
        {r.role === 'driver' && (
          <Button size="xs" variant="outline" onClick={() => openLink(r)} title="Link to driver record">
            <Icon name="user" className="h-3.5 w-3.5" /> Link
          </Button>
        )}
        {r.id !== user?.id && (
          <Button size="xs" variant="ghost" onClick={() => remove(r)} title="Delete user">
            <Icon name="xSmall" className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <Toast message={toast.message} tone={toast.tone} onClose={clearToast} />
      <ConfirmDialog open={confirm.open} onClose={() => setConfirm(c => ({ ...c, open: false }))} onConfirm={confirm.onConfirm} title={confirm.title} message={confirm.message} confirmText="Delete" />

      <PageHeader icon="user" title="User Management" subtitle="Create accounts, assign roles, and link drivers to their login"
        action={<Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add User</Button>} />

      {loading ? <div className="flex h-40 items-center justify-center"><Spinner className="h-7 w-7 text-indigo-500" /></div> : (
        <Table columns={columns} rows={rows} empty={<EmptyState title="No users" desc="Create user accounts for your team." action={<Button onClick={openCreate}><Icon name="plus" className="h-4 w-4" /> Add User</Button>} />} />
      )}

      {/* Create User Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add User" subtitle="Create a login account"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={create} disabled={saving}>{saving ? <Spinner className="h-4 w-4" /> : 'Create'}</Button></>}>
        <form onSubmit={create} className="space-y-3">
          <Field label="Name"><input className={inputCls} required placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} type="email" required placeholder="john@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password" hint="Min 6 characters"><input className={inputCls} type="password" required minLength={6} placeholder="••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <select className={inputCls} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
            </select>
          </Field>
          {form.role === 'driver' && drivers.length > 0 && (
            <Field label="Link to Driver Record (optional)" hint="Connect this login to an existing driver profile">
              <select className={inputCls} value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
                <option value="">— Don't link now —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>)}
              </select>
            </Field>
          )}
        </form>
      </Modal>

      {/* Link Driver Modal */}
      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title={`Link Driver — ${linkTarget?.name || ''}`}
        subtitle="Connect this user account to a driver record"
        footer={<><Button variant="secondary" onClick={() => setLinkOpen(false)}>Cancel</Button><Button onClick={submitLink}>Save Link</Button></>}>
        <Field label="Driver Record">
          <select className={inputCls} value={linkDriverId} onChange={e => setLinkDriverId(e.target.value)}>
            <option value="">— Unlink —</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.license_number} {d.user_id && d.user_id !== linkTarget?.id ? '(linked to another user)' : ''}
              </option>
            ))}
          </select>
        </Field>
      </Modal>
    </div>
  );
}
