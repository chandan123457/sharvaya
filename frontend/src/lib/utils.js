export const STATUSES = ['Applied', 'Shortlisted', 'Interviewing', 'Selected', 'Rejected'];
export const GENDERS = ['Male', 'Female', 'Other'];

// One place for every status colour so the badge, pipeline bar and filters stay in sync.
export const STATUS_META = {
  Applied: { dot: 'bg-stone-400', bar: 'bg-stone-300', text: 'text-stone-600', soft: 'bg-stone-100' },
  Shortlisted: { dot: 'bg-sky-500', bar: 'bg-sky-400', text: 'text-sky-700', soft: 'bg-sky-50' },
  Interviewing: { dot: 'bg-amber-500', bar: 'bg-amber-400', text: 'text-amber-700', soft: 'bg-amber-50' },
  Selected: { dot: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50' },
  Rejected: { dot: 'bg-rose-500', bar: 'bg-rose-400', text: 'text-rose-700', soft: 'bg-rose-50' },
};

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  'bg-[#ebe9fe] text-[#4c44b0]',
  'bg-[#e3f0fb] text-[#1f5f8f]',
  'bg-[#e4f4ec] text-[#22694a]',
  'bg-[#fbefdf] text-[#8a5517]',
  'bg-[#fbe7ea] text-[#9b2f45]',
  'bg-[#e8f3f3] text-[#22605f]',
  'bg-[#f1e8fb] text-[#6b3a99]',
  'bg-[#efede8] text-[#57524a]',
];

export function avatarColor(seed = '') {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function formatDate(value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', opts);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatExperience(years) {
  const n = Number(years) || 0;
  if (n === 0) return 'Fresher';
  return `${n} yr${n === 1 ? '' : 's'}`;
}

export function compactInr(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function timeAgo(value) {
  if (!value) return '—';
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
  const steps = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of steps) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
}

/** Let the shell (sidebar counts) know candidate data changed. */
export function notifyCandidatesChanged() {
  window.dispatchEvent(new Event('candidates:changed'));
}

export function isTypingTarget(el) {
  return el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}
