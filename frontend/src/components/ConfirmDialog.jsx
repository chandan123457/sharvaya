import { useEffect } from 'react';
import { Archive } from 'lucide-react';
import { Spinner } from './ui';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <div
        className="animate-fade-in absolute inset-0 bg-stone-900/25 backdrop-blur-[2px]"
        onClick={() => !loading && onCancel()}
      />
      <div className="animate-pop-in relative w-full max-w-[400px] overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-stone-900/5">
        <div className="p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <Archive className="h-[18px] w-[18px]" />
          </div>
          <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-stone-900">{title}</h3>
          <div className="mt-1.5 text-[13.5px] leading-relaxed text-stone-500">{description}</div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 bg-stone-50/70 px-6 py-3.5 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading} autoFocus>
            {loading && <Spinner />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
