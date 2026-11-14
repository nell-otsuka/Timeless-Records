import type { ReactNode } from 'react';
import { SHARDS, Shard } from './Shard';

/**
 * plain: a screening or ticket. filled: held or selected, solid pink. deep: a darker pink, for the selected one among
 * pink ones. accent: a pink edge instead of black, to tell a selected poster from the others.
 * hard / soft: a clash with something you hold (diagonal hatching) or something you are only considering (a grey edge).
 */
export type PosterTone = 'plain' | 'filled' | 'deep' | 'accent' | 'hard' | 'soft';

const EDGE: Record<PosterTone, string> = {
  plain: 'bg-ink',
  filled: 'bg-ink',
  deep: 'bg-ink',
  accent: 'bg-pink',
  hard: 'bg-ink',
  soft: 'bg-ink/40',
};

const FILL: Record<PosterTone, string> = {
  plain: 'bg-card',
  filled: 'bg-pink text-white',
  deep: 'bg-pink-deep text-white',
  accent: 'bg-card',
  hard: 'stripes-faint bg-card',
  soft: 'bg-card',
};

interface PosterCardProps {
  tone: PosterTone;
  className?: string;
  children: ReactNode;
}

/** Every card of the app in the poster's ticket shape: a thin black edge with a heavy wedge down the right. */
export function PosterCard({ tone, className, children }: PosterCardProps) {
  return (
    <Shard shape={SHARDS.ticket} edge={EDGE[tone]} fill={FILL[tone]} className={className} innerClassName="flex h-full flex-col">
      {children}
    </Shard>
  );
}
