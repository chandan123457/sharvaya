import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, Mail, MapPin, PenLine, Phone, X } from 'lucide-react';
import { Avatar, StatusBadge } from './ui';
import { compactInr, cn, formatDate, formatExperience, timeAgo } from '../lib/utils';

// A soft wash behind the header, tinted by hiring stage.
const STATUS_WASH = {
  Applied: 'from-stone-100',
  Shortlisted: 'from-sky-50',
  Interviewing: 'from-amber-50',
  Selected: 'from-emerald-50',
  Rejected: 'from-rose-50',
};

function ageFrom(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="eyebrow mb-2">{title}</h3>
      {children}
    </section>
  );
}

function Detail({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-[13px] text-stone-500">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] font-medium break-words text-stone-800">{children}</dd>
    </div>
  );
}

const quickAction =
  'flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white text-[12.5px] font-medium text-stone-700 shadow-hairline ring-1 ring-stone-200 transition hover:text-stone-900 hover:ring-stone-300';

export default function CandidateDrawer({ candidate, onClose }) {
  useEffect(() => {
    if (!candidate) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [candidate, onClose]);

  if (!candidate) return null;
  const c = candidate;
  const age = ageFrom(c.date_of_birth);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(c.email);
      toast.success('Email copied to clipboard');
    } catch {
      toast.error('Could not copy email');
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${c.full_name} profile`}>
      <div className="animate-fade-in absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-white shadow-float sm:inset-y-2 sm:right-2 sm:rounded-2xl sm:ring-1 sm:ring-stone-900/5">
        {/* Header */}
        <div className={cn('relative bg-gradient-to-b to-white px-6 pt-4 pb-5', STATUS_WASH[c.status])}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-stone-400">CAND-{String(c.id).padStart(4, '0')}</span>
            <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-2xl bg-white p-1 shadow-hairline ring-1 ring-stone-200/70">
              <Avatar name={c.full_name} size="xl" shape="square" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-[30px] leading-[1.05] text-stone-900">{c.full_name}</h2>
              <p className="mt-1 truncate text-[13.5px] text-stone-600">{c.position_applied}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-stone-500">
            <StatusBadge status={c.status} variant="pill" />
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-stone-400" />
              {c.city}
            </span>
            <span className="text-stone-300">·</span>
            <span>Added {formatDate(c.created_at, { day: 'numeric', month: 'short' })}</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <a href={`mailto:${c.email}`} className={quickAction}>
              <Mail className="h-3.5 w-3.5 text-stone-500" /> Email
            </a>
            <a href={`tel:+91${c.phone}`} className={quickAction}>
              <Phone className="h-3.5 w-3.5 text-stone-500" /> Call
            </a>
            <button type="button" onClick={copyEmail} className={quickAction}>
              <Copy className="h-3.5 w-3.5 text-stone-500" /> Copy
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-6 pt-2 pb-6">
          <div className="grid grid-cols-3 divide-x divide-stone-100 rounded-xl border border-stone-100">
            {[
              ['Experience', formatExperience(c.experience_years)],
              ['Expected CTC', compactInr(c.expected_salary)],
              ['Age', age ? `${age}` : '—'],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-3.5">
                <p className="text-[11px] text-stone-400">{label}</p>
                <p className="mt-1 text-[16px] font-semibold tracking-tight text-stone-900 tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <Section title="Contact">
            <dl className="divide-y divide-stone-100">
              <Detail label="Email">{c.email}</Detail>
              <Detail label="Phone">
                <span className="tabular-nums">+91 {c.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>
              </Detail>
              <Detail label="City">{c.city}</Detail>
            </dl>
          </Section>

          <Section title="Background">
            <dl className="divide-y divide-stone-100">
              <Detail label="Qualification">{c.qualification}</Detail>
              <Detail label="Applied for">{c.position_applied}</Detail>
              <Detail label="Gender">{c.gender || '—'}</Detail>
              <Detail label="Date of birth">{formatDate(c.date_of_birth)}</Detail>
            </dl>
          </Section>

          <Section title={`Skills${c.skills.length ? ` · ${c.skills.length}` : ''}`}>
            {c.skills.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {c.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-stone-100 px-2 py-1 text-[12px] font-medium text-stone-700 ring-1 ring-stone-200/70 ring-inset"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-stone-400">No skills added</p>
            )}
          </Section>

          {c.notes && (
            <Section title="Recruiter notes">
              <p className="rounded-xl bg-stone-50 px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-line text-stone-700 ring-1 ring-stone-100">
                {c.notes}
              </p>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-6 py-3.5">
          <p className="text-[12px] text-stone-400">Updated {timeAgo(c.updated_at)}</p>
          {!c.is_deleted && (
            <Link to={`/candidates/${c.id}/edit`} className="btn-primary">
              <PenLine className="h-4 w-4" /> Edit profile
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
