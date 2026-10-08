import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, CornerDownLeft } from 'lucide-react';
import { cn } from '../lib/utils';

function Highlight({ text, query }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold text-stone-900">{text.slice(i, i + query.length)}</span>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Free-text input with a themed suggestion list (replaces the native <datalist>,
 * whose popup follows the OS theme and can't be styled).
 */
export default function Combobox({ inputProps, options, value, onChange }) {
  const listId = useId();
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = value.trim();
  const matches = useMemo(() => {
    const q = query.toLowerCase();
    const list = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    // Prefix matches first, then the rest in their original order.
    return [...list].sort((a, b) => Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)));
  }, [options, query]);

  const exact = matches.some((m) => m.toLowerCase() === query.toLowerCase());
  const showList = open && matches.length > 0 && !(exact && matches.length === 1);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (option) => {
    onChange(option);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && showList) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        {...inputProps}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="animate-pop-in absolute inset-x-0 top-[calc(100%+6px)] z-40 max-h-60 overflow-y-auto rounded-xl bg-white p-1 shadow-[0_12px_32px_-8px_rgba(28,25,23,0.22),0_2px_6px_rgba(28,25,23,0.06)] ring-1 ring-stone-200/80"
        >
          <li className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.06em] text-stone-400 uppercase">
            Suggestions
          </li>
          {matches.map((option, i) => {
            const selected = option.toLowerCase() === query.toLowerCase();
            return (
              <li
                key={option}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(option)}
                onMouseMove={() => setActive(i)}
                className={cn(
                  'flex h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-[13.5px] text-stone-600 transition-colors',
                  i === active && 'bg-stone-100 text-stone-900'
                )}
              >
                <span className="truncate">
                  <Highlight text={option} query={query} />
                </span>
                {selected ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-stone-900" />
                ) : (
                  i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
