import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * plain: a screening or ticket. filled: selected or held, solid pink. accent: chosen, full-strength pink outline.
 * deep: a darker pink outline, to tell a selected poster from the others.
 * hard / soft: a clash with something you hold (diagonal hatching) or something you are only considering (paler line).
 */
export type PosterTone = 'plain' | 'filled' | 'accent' | 'deep' | 'hard' | 'soft';

const FRAME: Record<PosterTone, string> = {
  plain: 'bg-pink-soft hover:bg-pink',
  filled: 'bg-pink',
  accent: 'bg-pink',
  deep: 'bg-pink-deep',
  hard: 'bg-pink-soft',
  soft: 'bg-pink-line',
};

const INNER: Record<PosterTone, string> = {
  plain: 'bg-card',
  filled: 'bg-pink text-cream',
  accent: 'bg-card',
  deep: 'bg-card',
  hard: 'stripes-faint bg-card',
  soft: 'bg-card',
};

interface PosterCardProps {
  tone: PosterTone;
  className?: string;
  children: ReactNode;
}

/** The frame of a ticket, cut like the poster layouts: slanted top-left and bottom-right corners, a 2px line, no glow. */
export function PosterCard({ tone, className, children }: PosterCardProps) {
  return (
    <div className={cn('cut-tl-br [--cut:19px] p-[2px] transition-colors duration-200', FRAME[tone], className)}>
      <div className={cn('cut-tl-br flex h-full flex-col [--cut:17px]', INNER[tone])}>{children}</div>
    </div>
  );
}
