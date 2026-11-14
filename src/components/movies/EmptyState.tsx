import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  hint?: string;
  /** Optional call to action, e.g. a retry button. */
  children?: ReactNode;
}

export function EmptyState({ title, hint, children }: EmptyStateProps) {
  return (
    <div className="flex-1 px-4 py-16 text-center">
      <p className="text-[13px] font-semibold tracking-caps text-pink-soft">{title}</p>
      {hint && <p className="mt-2 font-mono text-xs tracking-[0.16em] text-muted">{hint}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}
