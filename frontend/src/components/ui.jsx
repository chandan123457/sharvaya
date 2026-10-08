import { Loader2 } from 'lucide-react';
import { STATUS_META, avatarColor, cn, initials } from '../lib/utils';

/** Dot + label. `variant="pill"` adds a soft background for use on busy surfaces. */
export function StatusBadge({ status, variant = 'dot' }) {
  const meta = STATUS_META[status] || STATUS_META.Applied;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap',
        variant === 'pill' ? cn('rounded-full px-2.5 py-0.5 ring-1 ring-black/5 ring-inset', meta.soft, meta.text) : 'text-stone-700'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {status}
    </span>
  );
}

export function Avatar({ name, size = 'md', shape = 'circle' }) {
  const sizes = {
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-11 w-11 text-sm',
    xl: 'h-16 w-16 text-xl',
  };
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold tracking-tight ring-1 ring-black/5 ring-inset',
        shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
        sizes[size],
        avatarColor(name)
      )}
    >
      {initials(name) || '?'}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-stone-200/60', className)} />;
}

export function Kbd({ children, className }) {
  return <kbd className={cn('kbd', className)}>{children}</kbd>;
}
