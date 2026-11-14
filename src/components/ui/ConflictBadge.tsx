import { cn } from '@/lib/cn';
import type { ConflictModel } from '@/types/view-models';
import { WarningIcon } from './icons';

interface ConflictBadgeProps extends ConflictModel {
  /** Square and edge-to-edge, to sit like a strip along the bottom of a ticket. */
  flat?: boolean;
  className?: string;
}

/** A warning that two screenings overlap, in the app's own pink. */
export function ConflictBadge({ text, flat = false, className }: ConflictBadgeProps) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 bg-pink px-3 py-1.5 text-[10px] leading-snug font-semibold tracking-[0.18em] text-white',
        flat ? 'rounded-none' : 'rounded-[7px]',
        className,
      )}
    >
      <WarningIcon className="mt-px size-3 shrink-0" />
      <span>{text}</span>
    </p>
  );
}
