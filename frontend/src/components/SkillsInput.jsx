import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SkillsInput({ id, value, onChange, error }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const parts = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const existing = new Set(value.map((s) => s.toLowerCase()));
    const next = [...value];
    for (const p of parts) {
      if (!existing.has(p.toLowerCase()) && next.length < 20) {
        next.push(p.slice(0, 40));
        existing.add(p.toLowerCase());
      }
    }
    onChange(next);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        'input flex h-auto min-h-10 cursor-text flex-wrap items-center gap-1.5 py-1.5 focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/15',
        error && 'input-error'
      )}
      onClick={() => document.getElementById(id)?.focus()}
    >
      {value.map((s) => (
        <span
          key={s}
          className="animate-pop-in inline-flex h-6 items-center gap-1 rounded-md bg-stone-100 pr-1 pl-2 text-xs font-medium text-stone-700 ring-1 ring-stone-200/70 ring-inset"
        >
          {s}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== s))}
            className="rounded p-0.5 text-stone-400 transition hover:bg-stone-200 hover:text-stone-700"
            aria-label={`Remove ${s}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={value.length ? 'Add another…' : 'React, Node.js, SQL…'}
        className="h-6 min-w-[120px] flex-1 border-0 bg-transparent px-0.5 text-sm outline-none placeholder:text-stone-400"
      />
    </div>
  );
}
