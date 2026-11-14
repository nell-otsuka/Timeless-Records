import type { ReactNode } from 'react';

interface FormActionsProps {
  /** The main buttons, on the right. */
  children: ReactNode;
  /** An optional secondary action on the left. */
  leading?: ReactNode;
}

/** The buttons of a dialog, below a dashed perforation line like a ticket stub. */
export function FormActions({ children, leading }: FormActionsProps) {
  return (
    <div className="col-span-full mt-2 flex items-center gap-3 border-t border-dashed border-pink-line pt-4">
      {leading}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
