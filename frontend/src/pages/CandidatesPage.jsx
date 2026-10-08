import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Inbox,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { candidatesApi } from '../lib/api';
import { useDebounce } from '../lib/useDebounce';
import {
  STATUSES,
  STATUS_META,
  cn,
  formatDate,
  formatDateTime,
  formatExperience,
  isTypingTarget,
  notifyCandidatesChanged,
  timeAgo,
} from '../lib/utils';
import { Avatar, Kbd, Skeleton, Spinner, StatusBadge } from '../components/ui';
import ConfirmDialog from '../components/ConfirmDialog';
import Select from '../components/Select';
import CandidateDrawer from '../components/CandidateDrawer';

const SORT_OPTIONS = [
  { value: 'created:desc', label: 'Newest first' },
  { value: 'created:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name, A → Z' },
  { value: 'name:desc', label: 'Name, Z → A' },
  { value: 'experience:desc', label: 'Most experienced' },
  { value: 'experience:asc', label: 'Least experienced' },
];

const PAGE_SIZES = [10, 25, 50];

// On devices with a mouse, row actions fade in on hover; touch devices always see them.
const HOVER_REVEAL =
  '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100';

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function Overview({ stats, activeStatus, onStatus }) {
  const total = stats?.total ?? 0;
  const inPipeline = (stats?.shortlisted ?? 0) + (stats?.interviewing ?? 0);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const metrics = [
    { label: 'Active candidates', value: total, foot: `${stats?.this_week ?? 0} added this week` },
    { label: 'In pipeline', value: inPipeline, foot: `${pct(inPipeline)}% of active` },
    { label: 'Selected', value: stats?.selected ?? 0, foot: `${pct(stats?.selected ?? 0)}% selection rate` },
    { label: 'Archived', value: stats?.archived ?? 0, foot: 'Hidden, never deleted' },
  ];

  return (
    <section className="card animate-rise overflow-hidden [animation-delay:60ms]">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={cn(
              'px-5 py-5 sm:px-6',
              i % 2 === 1 && 'border-l border-stone-100',
              i >= 2 && 'border-t border-stone-100 lg:border-t-0',
              i === 2 && 'lg:border-l'
            )}
          >
            <p className="text-[12.5px] text-stone-500">{m.label}</p>
            {stats ? (
              <p className="mt-2 text-[30px] leading-none font-semibold tracking-[-0.03em] text-stone-900 tabular-nums">
                {m.value}
              </p>
            ) : (
              <Skeleton className="mt-2 h-[30px] w-12" />
            )}
            <p className="mt-2.5 text-[12px] text-stone-400">{m.foot}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-100 px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Pipeline</p>
          {activeStatus ? (
            <button
              type="button"
              onClick={() => onStatus('')}
              className="flex items-center gap-1 text-[12px] font-medium text-stone-500 transition hover:text-stone-900"
            >
              <X className="h-3 w-3" /> Clear filter
            </button>
          ) : (
            <p className="hidden text-[12px] text-stone-400 sm:block">Select a stage to filter</p>
          )}
        </div>

        <div className="flex h-2 w-full gap-[3px] overflow-hidden rounded-full">
          {total === 0 ? (
            <div className="h-full w-full rounded-full bg-stone-100" />
          ) : (
            STATUSES.map((s) => {
              const n = stats?.[s.toLowerCase()] ?? 0;
              if (!n) return null;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatus(activeStatus === s ? '' : s)}
                  style={{ flexGrow: n }}
                  className={cn(
                    'h-full basis-0 rounded-full transition-opacity duration-200',
                    STATUS_META[s].bar,
                    activeStatus && activeStatus !== s && 'opacity-25'
                  )}
                  aria-label={`Filter by ${s}`}
                  title={`${s}: ${n}`}
                />
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-1 gap-y-1">
          {STATUSES.map((s) => {
            const n = stats?.[s.toLowerCase()] ?? 0;
            const active = activeStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatus(active ? '' : s)}
                aria-pressed={active}
                className={cn(
                  'flex h-7 items-center gap-2 rounded-md px-2 text-[12.5px] transition',
                  active
                    ? 'bg-stone-900 text-white'
                    : cn('hover:bg-stone-100', activeStatus ? 'text-stone-400' : 'text-stone-600')
                )}
              >
                <span className={cn('h-2 w-2 rounded-[3px]', STATUS_META[s].bar)} />
                {s}
                <span className={cn('font-mono text-[11px] tabular-nums', active ? 'text-white/60' : 'text-stone-400')}>
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ archived, filtered, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="relative h-16 w-20">
        <div className="absolute inset-x-3 top-0 h-12 -rotate-6 rounded-xl border border-stone-200 bg-stone-50" />
        <div className="absolute inset-x-1 top-2 flex h-12 items-center justify-center rounded-xl border border-stone-200 bg-white shadow-hairline">
          {filtered ? <Search className="h-5 w-5 text-stone-400" /> : <Inbox className="h-5 w-5 text-stone-400" />}
        </div>
      </div>
      <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-stone-900">
        {filtered ? 'No matches' : archived ? 'The archive is empty' : 'No candidates yet'}
      </h3>
      <p className="mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-stone-500">
        {filtered
          ? 'Nothing fits these filters. Try a broader search or clear them.'
          : archived
            ? 'Candidates you remove from the list land here. Nothing is ever erased from the database.'
            : 'Register your first candidate to start building the pipeline.'}
      </p>
      {filtered ? (
        <button type="button" className="btn-secondary mt-6" onClick={onClear}>
          Clear filters
        </button>
      ) : (
        !archived && (
          <Link to="/register" className="btn-primary mt-6">
            <Plus className="h-4 w-4" /> New candidate
          </Link>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function toCsv(rows) {
  const cols = [
    ['ID', 'id'],
    ['Full name', 'full_name'],
    ['Email', 'email'],
    ['Phone', 'phone'],
    ['City', 'city'],
    ['Position', 'position_applied'],
    ['Qualification', 'qualification'],
    ['Experience (yrs)', 'experience_years'],
    ['Expected salary', 'expected_salary'],
    ['Skills', (r) => r.skills.join('; ')],
    ['Status', 'status'],
    ['Registered', (r) => formatDate(r.created_at)],
  ];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    cols.map(([h]) => esc(h)).join(','),
    ...rows.map((r) => cols.map(([, k]) => esc(typeof k === 'function' ? k(r) : r[k])).join(',')),
  ].join('\n');
}

export default function CandidatesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const searchRef = useRef(null);

  const view = params.get('view') === 'archived' ? 'archived' : 'active';
  const status = params.get('status') || '';
  const sortKey = params.get('sort') || 'created:desc';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = PAGE_SIZES.includes(Number(params.get('limit'))) ? Number(params.get('limit')) : 10;
  const archived = view === 'archived';

  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebounce(search.trim(), 300);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const updateParams = useCallback(
    (patch, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === '' || v === null || v === undefined) next.delete(k);
            else next.set(k, String(v));
          }
          if (resetPage && !('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Keep the URL in sync with the debounced search box.
  useEffect(() => {
    if ((params.get('q') || '') !== debouncedSearch) updateParams({ q: debouncedSearch });
  }, [debouncedSearch, params, updateParams]);

  const listParams = useCallback(() => {
    const [sort, order] = sortKey.split(':');
    return { view, status, search: params.get('q') || '', sort, order };
  }, [view, status, sortKey, params]);

  const loadStats = useCallback(() => {
    candidatesApi.stats().then(setStats).catch(() => {});
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await candidatesApi.list({ ...listParams(), page, limit });
      setRows(res.data);
      setPagination(res.pagination);
      if (page > res.pagination.totalPages) updateParams({ page: res.pagination.totalPages }, false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [listParams, page, limit, updateParams]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshAll = () => {
    loadRows();
    loadStats();
    notifyCandidatesChanged();
  };

  // Keyboard: "/" focuses search, "N" starts a new registration.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || selected || toDelete) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/register');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, selected, toDelete]);

  const handleRestore = async (candidate) => {
    setRestoringId(candidate.id);
    try {
      await candidatesApi.restore(candidate.id);
      toast.success(`${candidate.full_name} is back in the list`);
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const candidate = toDelete;
    setDeleting(true);
    try {
      await candidatesApi.remove(candidate.id);
      setToDelete(null);
      toast(`${candidate.full_name} removed`, {
        description: 'Moved to the archive. The record is still in the database.',
        action: { label: 'Undo', onClick: () => handleRestore(candidate) },
        duration: 7000,
      });
      refreshAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const all = [];
      for (let p = 1; ; p++) {
        const res = await candidatesApi.list({ ...listParams(), page: p, limit: 100 });
        all.push(...res.data);
        if (p >= res.pagination.totalPages) break;
      }
      const blob = new Blob([toCsv(all)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `candidates-${archived ? 'archived-' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Exported ${all.length} candidate${all.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const filtered = Boolean(params.get('q') || status);
  const clearFilters = () => {
    setSearch('');
    updateParams({ q: '', status: '' });
  };

  const from = pagination.total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, pagination.total);
  const showSkeleton = loading && rows.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="animate-rise flex flex-col gap-5 pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] text-stone-500">
            Workspace <span className="mx-1 text-stone-300">/</span>
            <span className="text-stone-700">{archived ? 'Archive' : 'Candidates'}</span>
          </p>
          <h1 className="mt-2 font-display text-[44px] leading-[1] tracking-[-0.01em] text-stone-900">
            {archived ? (
              <>
                The <em>archive</em>
              </>
            ) : (
              <>
                Candidates<span className="text-brand-400">.</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-stone-500">
            {archived
              ? 'Removed from the list, kept in the database. Restore anyone with a single click.'
              : 'Every registration in one place. Search, review and move people through your pipeline.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={handleExport} disabled={exporting || !pagination.total}>
            {exporting ? <Spinner /> : <Download className="h-4 w-4 text-stone-500" />}
            Export
          </button>
          <Link to="/register" className="btn-primary">
            <Plus className="h-4 w-4" /> New candidate
            <Kbd className="ml-1 hidden border-white/15 bg-white/10 text-white/70 shadow-none sm:inline-flex">N</Kbd>
          </Link>
        </div>
      </header>

      {!archived && <Overview stats={stats} activeStatus={status} onStatus={(s) => updateParams({ status: s })} />}

      {/* Data card */}
      <section className="card animate-rise overflow-hidden [animation-delay:120ms]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-stone-100 px-4 py-3.5 sm:px-5 lg:flex-row lg:items-center">
          <div className="inline-flex shrink-0 self-start rounded-lg bg-stone-100 p-0.5" role="tablist">
            {[
              { key: 'active', label: 'Active', count: stats?.total },
              { key: 'archived', label: 'Archive', count: stats?.archived },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={view === t.key}
                onClick={() => updateParams({ view: t.key === 'active' ? '' : t.key, status: '' })}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition',
                  view === t.key ? 'bg-white text-stone-900 shadow-hairline ring-1 ring-stone-200/60' : 'text-stone-500 hover:text-stone-800'
                )}
              >
                {t.label}
                <span className="font-mono text-[11px] text-stone-400 tabular-nums">{t.count ?? '–'}</span>
              </button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearch('');
                  e.currentTarget.blur();
                }
              }}
              placeholder="Search name, email, phone, city, role or skill"
              className="input h-9 pr-10 pl-9"
              aria-label="Search candidates"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">/</Kbd>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status && (
              <button
                type="button"
                onClick={() => updateParams({ status: '' })}
                className="flex h-9 items-center gap-2 rounded-lg bg-stone-900 px-3 text-[13px] font-medium text-white transition hover:bg-stone-800"
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[status].dot)} />
                {status}
                <X className="h-3.5 w-3.5 text-white/60" />
              </button>
            )}
            <Select
              label="Sort candidates"
              icon={ArrowUpDown}
              value={sortKey}
              options={SORT_OPTIONS}
              onChange={(v) => updateParams({ sort: v === 'created:desc' ? '' : v })}
              className="flex-1 lg:w-48 lg:flex-none"
              menuClassName="w-52"
            />
          </div>
        </div>

        {/* Body */}
        {error ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <p className="text-[15px] font-semibold text-stone-900">Couldn’t load candidates</p>
            <p className="mt-1 text-[13.5px] text-stone-500">{error}</p>
            <button type="button" className="btn-secondary mt-5" onClick={refreshAll}>
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : !loading && rows.length === 0 ? (
          <EmptyState archived={archived} filtered={filtered} onClear={clearFilters} />
        ) : (
          <>
            {/* Desktop table: scrolls inside the card, header stays pinned */}
            <div className="hidden max-h-[min(600px,calc(100vh-260px))] min-h-[300px] overflow-auto overscroll-contain md:block">
              <table className="w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:h-10 [&>th]:border-b [&>th]:border-stone-100 [&>th]:bg-white/95 [&>th]:px-4 [&>th]:text-[12px] [&>th]:font-medium [&>th]:text-stone-400 [&>th]:backdrop-blur">
                    <th className="!pl-5">Candidate</th>
                    <th>Role</th>
                    <th className="hidden xl:table-cell">Experience</th>
                    <th className="hidden xl:table-cell">Location</th>
                    <th>Status</th>
                    <th className="hidden xl:table-cell">{archived ? 'Removed' : 'Added'}</th>
                    <th className="right-0 z-20 w-px !pr-5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="[&>tr:last-child>td]:border-0 [&>tr>td]:border-b [&>tr>td]:border-stone-100">
                  {showSkeleton
                    ? Array.from({ length: 7 }).map((_, i) => (
                        <tr key={i}>
                          <td className="h-[60px] px-5" colSpan={7}>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-2.5 w-56" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    : rows.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelected(c)}
                          className={cn('group cursor-pointer transition-colors', loading && 'opacity-50')}
                        >
                          <td className="h-[60px] py-2.5 pr-4 pl-5 group-hover:bg-stone-50/80">
                            <div className="flex items-center gap-3">
                              <Avatar name={c.full_name} />
                              <div className="max-w-[230px] min-w-0">
                                <p className="truncate text-[14px] font-medium tracking-[-0.005em] text-stone-900">
                                  {c.full_name}
                                </p>
                                <p className="truncate text-[12.5px] text-stone-500">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[200px] px-4 group-hover:bg-stone-50/80">
                            <p className="truncate text-[13.5px] text-stone-800" title={c.position_applied}>
                              {c.position_applied}
                            </p>
                            <p className="truncate text-[12px] text-stone-400" title={c.qualification}>
                              {c.qualification}
                            </p>
                          </td>
                          <td className="hidden px-4 text-[13px] whitespace-nowrap text-stone-600 tabular-nums group-hover:bg-stone-50/80 xl:table-cell">
                            {formatExperience(c.experience_years)}
                          </td>
                          <td className="hidden px-4 text-[13px] whitespace-nowrap text-stone-600 group-hover:bg-stone-50/80 xl:table-cell">
                            {c.city}
                          </td>
                          <td className="px-4 group-hover:bg-stone-50/80">
                            <StatusBadge status={c.status} />
                          </td>
                          <td
                            className="hidden px-4 text-[13px] whitespace-nowrap text-stone-500 tabular-nums group-hover:bg-stone-50/80 xl:table-cell"
                            title={formatDateTime(archived ? c.deleted_at : c.created_at)}
                          >
                            {timeAgo(archived ? c.deleted_at : c.created_at)}
                          </td>
                          <td
                            className="sticky right-0 bg-white py-2.5 pr-5 pl-2 group-hover:bg-stone-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={cn('flex items-center justify-end gap-0.5 transition-opacity', !archived && HOVER_REVEAL)}>
                              {archived ? (
                                <button
                                  type="button"
                                  className="btn-secondary h-8 px-3"
                                  onClick={() => handleRestore(c)}
                                  disabled={restoringId === c.id}
                                >
                                  {restoringId === c.id ? <Spinner className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                  Restore
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    title="View"
                                    aria-label={`View ${c.full_name}`}
                                    onClick={() => setSelected(c)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    title="Edit"
                                    aria-label={`Edit ${c.full_name}`}
                                    onClick={() => navigate(`/candidates/${c.id}/edit`)}
                                  >
                                    <PenLine className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-btn hover:bg-red-50 hover:text-red-600"
                                    title="Delete"
                                    aria-label={`Delete ${c.full_name}`}
                                    onClick={() => setToDelete(c)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="max-h-[70vh] divide-y divide-stone-100 overflow-y-auto overscroll-contain md:hidden">
              {showSkeleton
                ? Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-4">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-2.5 w-2/3" />
                      </div>
                    </li>
                  ))
                : rows.map((c) => (
                    <li key={c.id} className={cn('px-4 py-4', loading && 'opacity-50')}>
                      <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setSelected(c)}>
                        <Avatar name={c.full_name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[15px] font-medium text-stone-900">{c.full_name}</p>
                            <ArrowRight className="h-4 w-4 shrink-0 text-stone-300" />
                          </div>
                          <p className="truncate text-[13px] text-stone-600">{c.position_applied}</p>
                          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-stone-500">
                            <StatusBadge status={c.status} />
                            <span className="text-stone-300">·</span>
                            <span className="truncate">
                              {c.city} · {formatExperience(c.experience_years)}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="mt-3 flex gap-2 pl-14">
                        {archived ? (
                          <button
                            type="button"
                            className="btn-secondary h-8 flex-1"
                            onClick={() => handleRestore(c)}
                            disabled={restoringId === c.id}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </button>
                        ) : (
                          <>
                            <Link to={`/candidates/${c.id}/edit`} className="btn-secondary h-8 flex-1">
                              <PenLine className="h-3.5 w-3.5" /> Edit
                            </Link>
                            <button
                              type="button"
                              className="btn-secondary h-8 flex-1 text-red-600 hover:text-red-700"
                              onClick={() => setToDelete(c)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
            </ul>

            {/* Footer */}
            <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-[12.5px] text-stone-500">
                <span className="font-medium text-stone-800 tabular-nums">
                  {from}–{to}
                </span>{' '}
                of <span className="font-medium text-stone-800 tabular-nums">{pagination.total}</span>{' '}
                {archived ? 'archived' : 'candidates'}
              </p>
              <div className="flex items-center gap-3">
                <Select
                  label="Rows per page"
                  size="sm"
                  placement="top"
                  align="left"
                  value={limit}
                  options={PAGE_SIZES.map((n) => ({ value: n, label: `${n} per page` }))}
                  onChange={(v) => updateParams({ limit: v === 10 ? '' : v })}
                  className="w-[120px]"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn-secondary h-8 w-8 px-0"
                    disabled={page <= 1 || loading}
                    onClick={() => updateParams({ page: page - 1 }, false)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[52px] text-center font-mono text-[12px] text-stone-500 tabular-nums">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary h-8 w-8 px-0"
                    disabled={page >= pagination.totalPages || loading}
                    onClick={() => updateParams({ page: page + 1 }, false)}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <CandidateDrawer candidate={selected} onClose={() => setSelected(null)} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Remove ${toDelete?.full_name ?? 'candidate'}?`}
        description="They’ll disappear from the candidate list but stay safely in the database. You can restore them from the archive at any time."
        confirmLabel="Remove from list"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
