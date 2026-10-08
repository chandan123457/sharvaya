import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Themed single-select (replaces native <select>, whose open menu follows the OS theme).
 * `placement="top"` opens upward, for controls near the bottom of a card.
 */
export default function Select({ value, options, onChange, label, icon: Icon, placement = 'bottom', align = 'right', size = 'md', className, menuClassName }) {
  const listId = useId();
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIndex);
  const current = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex);
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, selectedIndex]);

  const pick = (option) => {
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key) && !open) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg bg-white text-left text-stone-700 shadow-hairline ring-1 ring-stone-200 transition outline-none hover:ring-stone-300 focus-visible:ring-[3px] focus-visible:ring-brand-500/20',
          size === 'sm' ? 'h-8 pr-2 pl-2.5 text-[12.5px]' : 'h-9 pr-2.5 pl-3 text-[13px]',
          open && 'ring-stone-300'
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-stone-400" />}
        <span className="flex-1 truncate">{current?.label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={cn(
            'animate-pop-in absolute z-40 min-w-full rounded-xl bg-white p-1 shadow-[0_12px_32px_-8px_rgba(28,25,23,0.22),0_2px_6px_rgba(28,25,23,0.06)] ring-1 ring-stone-200/80',
            placement === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
            align === 'left' ? 'left-0' : 'right-0',
            menuClassName
          )}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
                onMouseMove={() => setActive(i)}
                className={cn(
                  'flex h-8 cursor-pointer items-center justify-between gap-4 rounded-lg px-2.5 text-[13px] whitespace-nowrap transition-colors',
                  i === active ? 'bg-stone-100 text-stone-900' : 'text-stone-600',
                  selected && 'font-medium text-stone-900'
                )}
              >
                {o.label}
                {selected && <Check className="h-3.5 w-3.5 text-stone-900" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
