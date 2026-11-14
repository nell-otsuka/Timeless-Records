import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  solid: 'bg-pink text-white hover:bg-pink-deep',
  outline: 'border border-pink-line bg-card text-pink hover:bg-pink hover:text-white',
} as const;

const SIZES = {
  sm: 'size-[30px]',
  md: 'size-[45px]',
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
      className={cn(
        'grid shrink-0 place-items-center rounded-full transition-colors',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
