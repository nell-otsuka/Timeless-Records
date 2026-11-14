import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  solid: 'bg-pink text-white hover:bg-pink-deep',
  ghost: 'text-pink-deep hover:bg-pink-line/60',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
}

export function Button({ variant = 'solid', className, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'rounded-full px-6 py-2.5 text-xs font-bold tracking-label transition-colors',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
