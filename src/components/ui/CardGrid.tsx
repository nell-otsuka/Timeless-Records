import type { ReactNode } from 'react';

/** The responsive card grid shared by both tabs: 2 columns on phones up to 4 on desktop. */
export function CardGrid({ children }: { children: ReactNode }) {
  return <ul className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 xl:grid-cols-4 3xl:gap-8">{children}</ul>;
}
