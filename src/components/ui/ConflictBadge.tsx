import { cn } from '@/lib/cn';
import type { ConflictModel } from '@/types/view-models';
import { WarningIcon } from './icons';

interface ConflictBadgeProps extends ConflictModel {
  /** Square and edge-to-edge, to sit like a strip along the bottom of a ticket. */
  flat?: boolean;
  className?: string;
}

/** A warning that two screenings overlap: a black strip with a pink warning sign. */
export function ConflictBadge({ text, flat = false, className }: ConflictBadgeProps) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 bg-ink px-3 py-1.5 text-[14px] leading-snug font-semibold text-white italic',
        flat ? '' : '[clip-path:polygon(0_0,100%_0,98%_100%,0_100%)]',
        className,
      )}
    >
      <WarningIcon className="mt-0.5 size-3.5 shrink-0 text-pink" />
      <span>{text}</span>
    </p>
  );
}
