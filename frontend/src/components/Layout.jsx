import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Archive, Menu, Plus, Users, X } from 'lucide-react';
import { candidatesApi } from '../lib/api';
import { cn } from '../lib/utils';
import { Kbd } from './ui';

function LogoMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1c1917" />
      <path d="M9 11.5h14M16 11.5V23" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22.5" cy="21.5" r="2.5" fill="#8b87f0" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark className="h-7 w-7" />
      <div className="leading-none">
        <p className="text-[14px] font-semibold tracking-tight text-stone-900">TalentDesk</p>
        <p className="mt-1 text-[11px] text-stone-500">Hiring workspace</p>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, count, active }) {
  return (
    <NavLink
      to={to}
      className={cn(
        'group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition',
        active
          ? 'bg-white text-stone-900 shadow-hairline ring-1 ring-stone-200/80'
          : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-600')} />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="font-mono text-[11px] text-stone-400 tabular-nums">{count}</span>}
    </NavLink>
  );
}

function Sidebar({ stats, pathname, search }) {
  const archived = new URLSearchParams(search).get('view') === 'archived';
  return (
    <div className="flex h-full flex-col">
      <div className="px-2.5">
        <Brand />
      </div>

      <NavLink
        to="/register"
        className="mt-7 flex h-9 items-center justify-between rounded-lg bg-white px-2.5 text-[13px] font-medium text-stone-800 shadow-hairline ring-1 ring-stone-200/80 transition hover:ring-stone-300"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-stone-500" /> New candidate
        </span>
        <Kbd>N</Kbd>
      </NavLink>

      <p className="eyebrow mt-8 mb-2 px-2.5">Pipeline</p>
      <nav className="space-y-0.5">
        <NavItem
          to="/candidates"
          icon={Users}
          label="Candidates"
          count={stats?.total}
          active={pathname.startsWith('/candidates') && !archived}
        />
        <NavItem
          to="/candidates?view=archived"
          icon={Archive}
          label="Archive"
          count={stats?.archived}
          active={pathname === '/candidates' && archived}
        />
      </nav>

      <div className="mt-auto space-y-2.5 px-2.5 pb-1">
        <p className="eyebrow">Shortcuts</p>
        {[
          ['Search', '/'],
          ['New candidate', 'N'],
          ['Close panel', 'Esc'],
        ].map(([label, key]) => (
          <div key={label} className="flex items-center justify-between text-[12px] text-stone-500">
            {label}
            <Kbd>{key}</Kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const { pathname, search } = useLocation();

  const loadStats = useCallback(() => {
    candidatesApi.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
    window.addEventListener('candidates:changed', loadStats);
    return () => window.removeEventListener('candidates:changed', loadStats);
  }, [loadStats]);

  useEffect(() => setOpen(false), [pathname, search]);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar: sits on the canvas, the page floats beside it */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 px-3 py-5 lg:block">
        <Sidebar stats={stats} pathname={pathname} search={search} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200/80 bg-canvas/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="icon-btn"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="animate-slide-in relative h-full w-72 bg-canvas px-3 py-5 shadow-float">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="icon-btn absolute top-4 right-3"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar stats={stats} pathname={pathname} search={search} />
          </div>
        </div>
      )}

      <div className="lg:py-2 lg:pr-2 lg:pl-60">
        <main className="min-h-[calc(100vh-56px)] bg-white lg:min-h-[calc(100vh-16px)] lg:rounded-2xl lg:border lg:border-stone-200/80 lg:shadow-panel">
          <div className="mx-auto max-w-[1180px] px-4 py-7 sm:px-8 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
