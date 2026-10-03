import { useId } from 'react';
import type { ReactNode } from 'react';

export const fieldClasses =
  'w-full rounded-md border border-line bg-white px-3 py-2 text-ink placeholder:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea';

export function useFieldIds(id: string | undefined, error?: string, hint?: string) {
  const reactId = useId();
  const field = id ?? `f${reactId.replace(/:/g, '')}`;
  const errorId = `${field}-error`;
  const hintId = `${field}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;
  return { field, errorId, hintId, describedBy };
}

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  ids: ReturnType<typeof useFieldIds>;
  children: ReactNode;
};

export function Field({ label, error, hint, ids, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={ids.field} className="text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && <p id={ids.hintId} className="text-sm text-ink-500">{hint}</p>}
      {error && <p id={ids.errorId} role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
