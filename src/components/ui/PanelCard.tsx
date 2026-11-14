import type { ReactNode } from 'react';
import { SHARDS, Shard } from './Shard';

interface PanelCardProps {
  /** The black tab on the top edge, e.g. "your ticket". */
  label: string;
  /** Round buttons in the top-right corner. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * The side panel's card, as in the poster: a cream sheet leaning back in a black edge that is heavy along the bottom,
 * and a black label tab pinned on its top-left corner.
 */
export function PanelCard({ label, actions, children }: PanelCardProps) {
  return (
    <div className="relative pt-[14px]">
      <Shard shape={SHARDS.panel} edge="bg-ink" fill="bg-card">
        <div className="relative min-h-[340px] pt-[64px] pr-[14%] pb-[62px] pl-[34px]">
          {actions && <div className="absolute top-[46px] right-[11%] z-10 flex gap-[15px]">{actions}</div>}
          {children}
        </div>
      </Shard>

      <span className="absolute -top-[4px] -left-[12px] z-10 block [filter:drop-shadow(2px_2px_0_#fff)]">
        <span className="block -rotate-[3.5deg] bg-ink py-[11px] pr-[42px] pl-[20px] text-[27px] leading-none font-extrabold tracking-[-0.015em] text-white [clip-path:polygon(0_10%,93%_0,100%_100%,2%_94%)]">
          {label}
        </span>
      </span>
    </div>
  );
}
