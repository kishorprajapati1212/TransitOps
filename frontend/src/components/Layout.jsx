import { useState } from 'react';
import { NavLink, useNavigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NAV_ITEMS, NAV_BY_ROLE, ROLE_LABELS } from '../constants';
import { Icon, cx, RoleBadge, Button } from './ui';

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const role = user?.role;
  const items = NAV_ITEMS.filter((i) => (NAV_BY_ROLE[role] || []).includes(i.key));

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <Link to="/" className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Icon name="truck" className="h-6 w-6" />
        </span>
        <div>
          <p className="text-base font-bold tracking-tight text-white">TransitOps</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Operations</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          <Icon name="home" className="h-5 w-5" />
          Main Home
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-slate-800 px-3 py-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 font-semibold text-white">
            {(user?.name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <RoleBadge role={role} />
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            <Icon name="logout" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Desktop sidebar — solid, professional (no gradient) */}
      <aside className="hidden w-64 flex-shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon name="grid" className="h-4 w-4 text-indigo-500" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              title="Toggle theme"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
            </button>
            <Link
              to="/"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 sm:block dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Main Home
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
