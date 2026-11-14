import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  /** pink disc in a white ring and a black ring, like the "+" of the poster */
  solid: 'bg-pink text-white ring-2 ring-white outline-2 outline-ink hover:bg-pink-deep',
  /** white disc with a black ring and a pink icon */
  outline: 'bg-white text-pink-deep ring-2 ring-ink hover:bg-pink hover:text-white',
} as const;

const SIZES = {
  sm: 'size-[34px]',
  md: 'size-[44px]',
} as const;

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — required because the button has no visible text. */
  label: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function IconButton({ label, variant = 'solid', size = 'md', className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn('grid shrink-0 place-items-center rounded-full transition-colors', VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
