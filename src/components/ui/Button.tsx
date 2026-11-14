import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  /** pink key with pointed ends and a hard black shadow */
  solid: { shadow: '[filter:drop-shadow(3px_3px_0_#0a0608)]', key: 'hex bg-pink text-white group-hover:bg-pink-deep' },
  /** black key with a white edge, for use on pink */
  dark: { shadow: '[filter:drop-shadow(2px_2px_0_#fff)]', key: 'hex bg-ink text-white group-hover:bg-pink-deep' },
  ghost: { shadow: '', key: 'text-ink group-hover:text-pink' },
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
}

/**
 * The poster's keys: pointed ends, bold italic lettering. The shadow sits on a wrapper, because a clip-path would
 * clip a shadow drawn on the key itself.
 */
export function Button({ variant = 'solid', className, children, ...props }: ButtonProps) {
  const { shadow, key } = VARIANTS[variant];
  return (
    <button type="button" className={cn('group inline-block text-left disabled:opacity-60', className)} {...props}>
      <span className={cn('block', shadow)}>
        <span className={cn('flex items-center gap-2.5 px-8 py-[9px] text-[19px] font-bold whitespace-nowrap italic transition-colors [--point:15px]', key)}>
          {children}
        </span>
      </span>
    </button>
  );
}
