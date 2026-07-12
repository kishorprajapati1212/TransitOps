import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Card, Button, Icon, PageHeader, SectionTitle, Badge, ConfirmDialog,
} from '../components/ui';
import { ROLE_LABELS } from '../constants';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const role = user?.role;

  return (
    <div className="space-y-6">
      <PageHeader
        icon="settings"
        title="Settings"
        subtitle="Manage your profile, preferences and application settings"
      />

      {/* Profile section */}
      <Card className="p-6">
        <SectionTitle title="Profile" subtitle="Your account information" icon="user" />
        <div className="mt-4 flex items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-2xl font-bold text-white shadow-md">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">{user?.name || 'Unknown'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || '—'}</p>
            <Badge color="indigo" className="mt-1">{ROLE_LABELS[role] || role}</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ['Full Name', user?.name || '—', 'user'],
            ['Email', user?.email || '—', 'mail'],
            ['Role', ROLE_LABELS[role] || role, 'shield'],
            ['User ID', user?.id || '—', 'lock'],
          ].map(([label, value, icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Icon name={icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`mt-0.5 text-sm font-semibold text-slate-700 dark:text-slate-200 ${label === 'User ID' ? 'truncate font-mono text-xs' : ''}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <SectionTitle title="Appearance" subtitle="Customize the look and feel" icon="sun" />
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs text-slate-400">Switch between light and dark theme</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </Card>

      {/* Application Info */}
      <Card className="p-6">
        <SectionTitle title="Application" subtitle="TransitOps platform details" icon="info" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Version', 'v1.0.0', 'bolt'],
            ['Platform', 'TransitOps', 'truck'],
            ['Build', 'Production', 'sparkles'],
            ['Auth', 'JWT + RBAC', 'lock'],
          ].map(([label, value, icon]) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                <Icon name={icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sign Out */}
      <Card className="border-rose-200 p-6 dark:border-rose-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Sign out</h3>
            <p className="mt-0.5 text-xs text-rose-500 dark:text-rose-400">End your current session</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmLogout(true)}>
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title="Sign Out?"
        message="You will be redirected to the login page. Any unsaved changes will be lost."
        confirmText="Sign out"
        confirmVariant="danger"
        icon="logout"
      />
    </div>
  );
}
