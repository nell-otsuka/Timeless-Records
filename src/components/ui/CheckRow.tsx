import type { InputHTMLAttributes, ReactNode } from 'react';
import { CheckIcon } from './icons';

interface CheckRowProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

/** A list row you tick: the name in tracked type, a round pink check at the end, hairlines between rows. */
export function CheckRow({ label, ...props }: CheckRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-pink-line/70 py-3 text-[12px] font-bold tracking-label text-pink-deep transition-colors last:border-b-0 hover:text-pink has-[:checked]:text-pink">
      {label}
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="grid size-[19px] shrink-0 place-items-center rounded-full text-white ring-1 ring-pink-soft transition-colors peer-checked:bg-pink peer-checked:ring-pink peer-focus-visible:ring-2 peer-focus-visible:ring-pink peer-checked:[&_svg]:opacity-100">
        <CheckIcon className="size-2.5 opacity-0" />
      </span>
    </label>
  );
}
