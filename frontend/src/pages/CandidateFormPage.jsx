import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { candidatesApi } from '../lib/api';
import { GENDERS, STATUSES, STATUS_META, cn, formatExperience, notifyCandidatesChanged } from '../lib/utils';
import { Avatar, Kbd, Skeleton, Spinner, StatusBadge } from '../components/ui';
import SkillsInput from '../components/SkillsInput';
import Combobox from '../components/Combobox';

const EMPTY = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  city: '',
  qualification: '',
  experience_years: '',
  position_applied: '',
  skills: [],
  expected_salary: '',
  status: 'Applied',
  notes: '',
};

const QUALIFICATIONS = [
  'B.Tech Computer Science',
  'B.Tech Information Technology',
  'B.E. Electronics',
  'B.Sc',
  'BCA',
  'B.Com',
  'BBA',
  'B.Des',
  'M.Tech',
  'MCA',
  'M.Sc',
  'MBA',
  'Diploma',
  'Ph.D',
];
const POSITIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'DevOps Engineer',
  'QA Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Product Designer',
  'ML Engineer',
  'Mobile Developer',
  'HR Executive',
];

const SECTIONS = [
  {
    id: 'personal',
    title: 'Personal details',
    description: 'Who the candidate is and how to reach them.',
    fields: ['full_name', 'email', 'phone', 'date_of_birth', 'gender', 'city'],
    required: ['full_name', 'email', 'phone', 'city'],
  },
  {
    id: 'professional',
    title: 'Professional background',
    description: 'Education, experience and the role they want.',
    fields: ['qualification', 'experience_years', 'position_applied', 'expected_salary', 'skills'],
    required: ['qualification', 'experience_years', 'position_applied'],
  },
  {
    id: 'application',
    title: 'Application',
    description: 'Where they stand in your process.',
    fields: ['status', 'notes'],
    required: ['status'],
  },
];

function ageFrom(dob) {
  return (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000);
}

function validate(f) {
  const e = {};
  const name = f.full_name.trim();
  if (!name) e.full_name = 'Full name is required';
  else if (name.length < 2) e.full_name = 'Full name must be at least 2 characters';
  else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) e.full_name = "Use only letters, spaces and . ' -";

  if (!f.email.trim()) e.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address';

  if (!f.phone.trim()) e.phone = 'Mobile number is required';
  else if (!/^[6-9]\d{9}$/.test(f.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number';

  if (f.date_of_birth) {
    const age = ageFrom(f.date_of_birth);
    if (Number.isNaN(age) || age < 18 || age > 70) e.date_of_birth = 'Candidate must be between 18 and 70 years old';
  }

  if (f.city.trim().length < 2) e.city = 'City is required';
  if (f.qualification.trim().length < 2) e.qualification = 'Qualification is required';
  if (f.position_applied.trim().length < 2) e.position_applied = 'Position is required';

  if (f.experience_years === '') e.experience_years = 'Experience is required — use 0 for freshers';
  else if (Number(f.experience_years) < 0 || Number(f.experience_years) > 50)
    e.experience_years = 'Enter experience between 0 and 50 years';

  if (f.expected_salary !== '' && Number(f.expected_salary) < 0) e.expected_salary = 'Salary cannot be negative';
  if (f.notes.length > 1000) e.notes = 'Notes can be at most 1000 characters';
  return e;
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const filled = (v) => (Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== '');

/* ------------------------------------------------------------------ */
/* Field primitives                                                    */
/* ------------------------------------------------------------------ */

const REQUIRED_FIELDS = new Set(SECTIONS.flatMap((s) => s.required));

function Field({ label, htmlFor, error, className, children }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-stone-800">
          {label}
          {REQUIRED_FIELDS.has(htmlFor) && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      </div>
      {children}
      {error && (
        <p className="animate-fade-in mt-1.5 text-[12px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Affix({ prefix, suffix, children }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[13px] text-stone-400">
          {prefix}
        </span>
      )}
      {children}
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[13px] text-stone-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Segmented({ id, value, options, onChange }) {
  return (
    <div id={id} role="radiogroup" className="grid h-10 auto-cols-fr grid-flow-col rounded-lg bg-stone-100 p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md text-[13px] font-medium transition',
              active ? 'bg-white text-stone-900 shadow-hairline ring-1 ring-stone-200/70' : 'text-stone-500 hover:text-stone-800'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({ index, section, done, children }) {
  return (
    <section id={`section-${section.id}`} className="card scroll-mt-8">
      <header className="flex items-start gap-4 border-b border-stone-100 px-6 py-5">
        <span className="mt-0.5 font-mono text-[11px] text-stone-400">0{index + 1}</span>
        <div className="flex-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900">{section.title}</h2>
          <p className="mt-0.5 text-[13px] text-stone-500">{section.description}</p>
        </div>
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full transition',
            done ? 'bg-emerald-500 text-white' : 'ring-1 ring-stone-200'
          )}
        >
          {done && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </header>
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 px-6 py-6 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CandidateFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setTouched({});
    setServerErrors({});
    setSubmitted(false);
    setLoadError('');
    if (!isEdit) {
      setForm(EMPTY);
      setInitial(EMPTY);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    candidatesApi
      .get(id)
      .then((c) => {
        if (cancelled) return;
        if (c.is_deleted) {
          setLoadError('This candidate is in the archive. Restore them first to make changes.');
          return;
        }
        const next = {
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? EMPTY[k]])),
          experience_years: String(c.experience_years ?? ''),
          expected_salary: c.expected_salary === null ? '' : String(c.expected_salary),
        };
        setForm(next);
        setInitial(next);
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const clientErrors = useMemo(() => validate(form), [form]);
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty || saving) return;
    const onBeforeUnload = (e) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, saving]);

  // Cmd/Ctrl + Enter submits from anywhere in the form.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sectionValid = (s) => s.required.every((k) => filled(form[k])) && s.fields.every((k) => !clientErrors[k]);
  // The last step only reads as done once everything before it is complete.
  const sectionDone = (s) =>
    s.id === 'application' ? SECTIONS.every(sectionValid) : sectionValid(s);
  const allFields = SECTIONS.flatMap((s) => s.fields);
  const completeness = Math.round((allFields.filter((k) => filled(form[k]) && !clientErrors[k]).length / allFields.length) * 100);

  const errorFor = (name) => serverErrors[name] || ((touched[name] || submitted) && clientErrors[name]) || '';

  const set = useCallback(
    (name) => (e) => {
      const value = e?.target ? e.target.value : e;
      setForm((f) => ({ ...f, [name]: value }));
      setServerErrors((prev) => {
        if (!prev[name]) return prev;
        const { [name]: _removed, ...rest } = prev;
        return rest;
      });
    },
    []
  );

  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));

  const inputProps = (name, extra = '') => ({
    id: name,
    name,
    value: form[name],
    onChange: set(name),
    onBlur: blur(name),
    className: cn('input', extra, errorFor(name) && 'input-error'),
    'aria-invalid': Boolean(errorFor(name)),
    'aria-required': REQUIRED_FIELDS.has(name),
  });

  const focusField = (name) => {
    const el = document.getElementById(name);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSubmitted(true);
    const firstError = allFields.find((k) => clientErrors[k]);
    if (firstError) {
      toast.error('A few fields need attention');
      focusField(firstError);
      return;
    }

    const payload = {
      ...form,
      full_name: form.full_name.trim().replace(/\s+/g, ' '),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      qualification: form.qualification.trim(),
      position_applied: form.position_applied.trim(),
      experience_years: Number(form.experience_years),
      expected_salary: form.expected_salary === '' ? null : Number(form.expected_salary),
    };

    setSaving(true);
    try {
      const saved = isEdit ? await candidatesApi.update(id, payload) : await candidatesApi.create(payload);
      toast.success(isEdit ? 'Changes saved' : `${saved.full_name} registered`, {
        description: `${saved.position_applied} · ${saved.status}`,
      });
      notifyCandidatesChanged();
      navigate('/candidates');
    } catch (err) {
      setServerErrors(err.fields || {});
      toast.error(err.message);
      const first = Object.keys(err.fields || {})[0];
      if (first) focusField(first);
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="mx-auto mt-16 max-w-sm text-center">
        <h1 className="font-display text-[34px] leading-tight text-stone-900">Can’t edit this one</h1>
        <p className="mt-2 text-[14px] text-stone-500">{loadError}</p>
        <Link to="/candidates" className="btn-primary mt-6">
          Back to candidates
        </Link>
      </div>
    );
  }

  const previewName = form.full_name.trim();

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* Header */}
      <header className="animate-rise mb-10">
        <p className="text-[13px] text-stone-500">
          <Link to="/candidates" className="transition hover:text-stone-900">
            Candidates
          </Link>
          <span className="mx-1 text-stone-300">/</span>
          <span className="text-stone-700">{isEdit ? 'Edit' : 'New'}</span>
        </p>
        <h1 className="mt-2 font-display text-[44px] leading-[1] text-stone-900">
          {isEdit ? (
            <>
              Edit <em>{initial.full_name.split(' ')[0] || 'candidate'}</em>
            </>
          ) : (
            <>
              Register a <em>candidate</em>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-stone-500">
          {isEdit
            ? 'Update their details below. Changes apply as soon as you save.'
            : 'Three short sections. Most people finish in under a minute.'}{' '}
          <span className="whitespace-nowrap text-stone-400">
            Fields marked <span className="text-red-500">*</span> are required.
          </span>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[210px_minmax(0,1fr)] xl:gap-14">
        {/* Progress rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-10 space-y-8">
            <div>
              <div className="flex items-baseline justify-between">
                <p className="eyebrow">Completeness</p>
                <p className="font-mono text-[12px] text-stone-600 tabular-nums">{completeness}%</p>
              </div>
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-stone-900 transition-[width] duration-500 ease-out"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <ol className="relative space-y-1">
              <span className="absolute top-4 bottom-4 left-[13px] w-px bg-stone-200" aria-hidden="true" />
              {SECTIONS.map((s, i) => {
                const done = sectionDone(s);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                      className="group relative flex w-full items-center gap-3 rounded-lg py-1.5 text-left"
                    >
                      <span
                        className={cn(
                          'relative z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition',
                          done
                            ? 'bg-stone-900 text-white'
                            : 'bg-white font-mono text-stone-500 ring-1 ring-stone-200 group-hover:ring-stone-400'
                        )}
                      >
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          'text-[13px] transition',
                          done ? 'text-stone-500' : 'font-medium text-stone-800 group-hover:text-stone-900'
                        )}
                      >
                        {s.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Live preview */}
            <div>
              <p className="eyebrow mb-2.5">Preview</p>
              <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-hairline">
                <div className="flex items-center gap-3">
                  <Avatar name={previewName || '?'} size="lg" />
                  <div className="min-w-0">
                    <p className={cn('truncate text-[14px] font-medium', previewName ? 'text-stone-900' : 'text-stone-300')}>
                      {previewName || 'Full name'}
                    </p>
                    <p className="truncate text-[12px] text-stone-500">{form.position_applied || 'Role'}</p>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-3">
                  <StatusBadge status={form.status} />
                  <span className="text-[12px] text-stone-400">
                    {form.experience_years === '' ? '—' : formatExperience(form.experience_years)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="min-w-0 space-y-6">
          {loading ? (
            <div className="card space-y-5 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <>
              <SectionCard index={0} section={SECTIONS[0]} done={sectionDone(SECTIONS[0])}>
                <Field label="Full name" htmlFor="full_name" error={errorFor('full_name')} className="sm:col-span-2">
                  <input {...inputProps('full_name')} placeholder="Aarav Sharma" autoComplete="name" autoFocus={!isEdit} />
                </Field>
                <Field label="Email" htmlFor="email" error={errorFor('email')}>
                  <input {...inputProps('email')} type="email" placeholder="aarav@example.com" autoComplete="email" />
                </Field>
                <Field label="Mobile number" htmlFor="phone" error={errorFor('phone')}>
                  <Affix prefix="+91">
                    <input
                      {...inputProps('phone', 'pl-11 tabular-nums')}
                      onChange={(e) => set('phone')(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric"
                      placeholder="98765 43210"
                      autoComplete="tel-national"
                    />
                  </Affix>
                </Field>
                <Field label="Date of birth" htmlFor="date_of_birth" error={errorFor('date_of_birth')}>
                  <input {...inputProps('date_of_birth')} type="date" max={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="Gender" htmlFor="gender" error={errorFor('gender')}>
                  <Segmented
                    id="gender"
                    value={form.gender}
                    onChange={set('gender')}
                    options={[...GENDERS.map((g) => ({ label: g, value: g })), { label: 'Skip', value: '' }]}
                  />
                </Field>
                <Field label="City" htmlFor="city" error={errorFor('city')} className="sm:col-span-2">
                  <input {...inputProps('city')} placeholder="Bengaluru" autoComplete="address-level2" />
                </Field>
              </SectionCard>

              <SectionCard index={1} section={SECTIONS[1]} done={sectionDone(SECTIONS[1])}>
                <Field label="Highest qualification" htmlFor="qualification" error={errorFor('qualification')}>
                  <Combobox
                    inputProps={{ ...inputProps('qualification'), placeholder: 'B.Tech, Computer Science' }}
                    options={QUALIFICATIONS}
                    value={form.qualification}
                    onChange={set('qualification')}
                  />
                </Field>
                <Field label="Experience" htmlFor="experience_years" error={errorFor('experience_years')}>
                  <Affix suffix="years">
                    <input
                      {...inputProps('experience_years', 'pr-14 tabular-nums')}
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="0 for freshers"
                    />
                  </Affix>
                </Field>
                <Field label="Position applied for" htmlFor="position_applied" error={errorFor('position_applied')}>
                  <Combobox
                    inputProps={{ ...inputProps('position_applied'), placeholder: 'Frontend Developer' }}
                    options={POSITIONS}
                    value={form.position_applied}
                    onChange={set('position_applied')}
                  />
                </Field>
                <Field label="Expected salary" htmlFor="expected_salary" error={errorFor('expected_salary')}>
                  <Affix prefix="₹" suffix="per year">
                    <input
                      {...inputProps('expected_salary', 'pr-20 pl-7 tabular-nums')}
                      type="number"
                      min="0"
                      step="10000"
                      inputMode="numeric"
                      placeholder="12,00,000"
                    />
                  </Affix>
                </Field>
                <Field label="Skills" htmlFor="skills" error={errorFor('skills')} className="sm:col-span-2">
                  <SkillsInput id="skills" value={form.skills} onChange={set('skills')} error={errorFor('skills')} />
                </Field>
              </SectionCard>

              <SectionCard index={2} section={SECTIONS[2]} done={sectionDone(SECTIONS[2])}>
                <Field label="Stage" htmlFor="status" error={errorFor('status')} className="sm:col-span-2">
                  <div id="status" role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {STATUSES.map((s) => {
                      const active = form.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => set('status')(s)}
                          className={cn(
                            'flex h-10 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition',
                            active
                              ? 'bg-white text-stone-900 shadow-hairline ring-2 ring-stone-900'
                              : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:text-stone-900 hover:ring-stone-300'
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[s].dot)} />
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Recruiter notes" htmlFor="notes" error={errorFor('notes')} className="sm:col-span-2">
                  <div className="relative">
                    <textarea
                      {...inputProps('notes', 'h-auto resize-none py-2.5 pb-7 leading-relaxed')}
                      rows={4}
                      placeholder="Notice period, interview feedback, availability…"
                    />
                    <span className="pointer-events-none absolute right-3 bottom-2 font-mono text-[11px] text-stone-400 tabular-nums">
                      {form.notes.length}/1000
                    </span>
                  </div>
                </Field>
              </SectionCard>
            </>
          )}

          {/* Floating action bar */}
          <div className="sticky bottom-4 z-20 pt-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-900 py-2 pr-2 pl-4 text-white shadow-float ring-1 ring-white/10">
              <p className="flex min-w-0 items-center gap-2 text-[13px] text-white/70">
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full transition',
                    dirty ? 'bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]' : 'bg-white/30'
                  )}
                />
                <span className="truncate">
                  {dirty ? 'Unsaved changes' : isEdit ? 'No changes yet' : 'Start filling in the details'}
                </span>
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  to="/candidates"
                  className="flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || loading || (isEdit && !dirty)}
                  className="flex h-8 items-center gap-2 rounded-lg bg-white px-3.5 text-[13px] font-semibold text-stone-900 transition hover:bg-stone-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving && <Spinner className="h-3.5 w-3.5" />}
                  {isEdit ? 'Save changes' : 'Register candidate'}
                  <Kbd className="hidden border-stone-200 sm:inline-flex">{IS_MAC ? '⌘ ↵' : 'Ctrl ↵'}</Kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
