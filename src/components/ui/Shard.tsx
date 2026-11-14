import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Two outlines of the same hand-cut shape: the black edge, and the coloured inside a few pixels within it. */
export interface ShardShape {
  outer: string;
  inner: string;
}

/**
 * The shapes of the poster, traced from the reference. Px offsets keep the edge widths constant at any size; the
 * heavy edges are on the right and along the bottom, like paper cut with scissors and pasted on.
 */
export const SHARDS = {
  /** A ticket or a card: thin top and left, a black wedge down the right, a thin bottom. */
  ticket: {
    outer: 'polygon(0 0, 100% 5px, calc(100% - 28px) calc(100% - 3px), 4px 100%)',
    inner: 'polygon(3px 2px, calc(100% - 15px) 7px, calc(100% - 38px) calc(100% - 6px), 6px calc(100% - 3px))',
  },
  /** The next-up ticket: rises towards the right, with a heavy bottom and right edge. */
  hero: {
    outer: 'polygon(4.7% 13%, 97.4% 0.7%, 100% 98.6%, 0 100%)',
    inner: 'polygon(calc(4.7% + 7px) calc(13% + 5px), calc(97.4% - 16px) calc(0.7% + 11px), calc(100% - 22px) calc(98.6% - 16px), 18px calc(100% - 12px))',
  },
  /** The side panel: leans back to the right and narrows towards the bottom. */
  panel: {
    outer: 'polygon(0.4% 0, 100% 7.7%, 88% 100%, 4% 88.6%)',
    inner: 'polygon(calc(0.4% + 3px) 3px, calc(100% - 7px) calc(7.7% + 4px), calc(88% - 4px) calc(100% - 12px), calc(4% + 3px) calc(88.6% - 3px))',
  },
} satisfies Record<string, ShardShape>;

interface ShardProps {
  shape: ShardShape;
  /** Colour of the edge, e.g. "bg-ink". */
  edge: string;
  /** Colour of the inside, e.g. "bg-cream". */
  fill: string;
  className?: string;
  innerClassName?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** A card in one of the poster's shapes. The inside clips its content, so a cover at the edge gets the black edge too. */
export function Shard({ shape, edge, fill, className, innerClassName, style, children }: ShardProps) {
  return (
    <div className={cn('relative', className)} style={style}>
      <div aria-hidden className={cn('absolute inset-0 transition-colors', edge)} style={{ clipPath: shape.outer }} />
      <div className={cn('relative transition-colors', fill, innerClassName)} style={{ clipPath: shape.inner }}>
        {children}
      </div>
    </div>
  );
}
