import { CoverImage } from '@/components/movies/CoverImage';
import { PosterCard, type PosterTone } from '@/components/ui/PosterCard';
import { TicketStub } from '@/components/tickets/TicketStub';
import { Button } from '@/components/ui/Button';
import { CheckIcon, CloseIcon, TrashIcon, WarningIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import type { PlannerEntry } from '@/lib/planner';

interface PlannerCardProps {
  entry: PlannerEntry;
  busy: boolean;
  onPlan: (entry: PlannerEntry) => void;
  onUnplan: (entry: PlannerEntry) => void;
  onBook: (entry: PlannerEntry) => void;
  /** Asks to delete a ticket you hold. */
  onDelete: (entry: PlannerEntry) => void;
}

const toneOf = ({ state, clashes }: PlannerEntry): PosterTone => {
  if (state === 'booked') return 'filled';
  if (state === 'tentative') return 'accent';
  if (clashes.some((clash) => clash.hard)) return 'hard';
  return clashes.length > 0 ? 'soft' : 'plain';
};

/**
 * One screening on the planner. Booked: solid pink. Tentative: pink outline, with a way to drop it or book it.
 * Free: plain, with a way to plan it, clash or not; hatched when it clashes with a ticket you hold, pale when only with one you are considering.
 */
export function PlannerCard({ entry, busy, onPlan, onUnplan, onBook, onDelete }: PlannerCardProps) {
  const { state, title, coverUrl, span, cinemaName, clashes } = entry;
  const booked = state === 'booked';

  return (
    <PosterCard tone={toneOf(entry)}>
      <div className="flex min-h-[92px]">
        <span className="w-[64px] shrink-0 overflow-hidden sm:w-[78px]">
          <CoverImage src={coverUrl} title={title} className="size-full" initialsClassName="text-xl" />
        </span>
        <TicketStub onPink={booked} />

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3 sm:px-5">
          <p className={cn('font-wide text-[22px] leading-none tracking-[-0.02em]', booked ? 'text-cream' : 'text-pink')}>{span}</p>
          <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold tracking-label', booked ? 'text-cream' : 'text-pink-deep')}>
            <span className="truncate">{title}</span>
            {state !== 'free' && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase',
                  booked ? 'bg-cream text-pink' : 'text-pink ring-1 ring-pink',
                )}
              >
                {booked ? 'booked' : 'tentative'}
              </span>
            )}
          </p>
          <p className={cn('truncate text-[10px] font-medium tracking-[0.22em]', booked ? 'text-cream/85' : 'text-pink-soft')}>{cinemaName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2 pr-5">
          {booked && (
            <>
              <button
                type="button"
                aria-label="delete this ticket"
                title="delete this ticket"
                disabled={busy}
                onClick={() => onDelete(entry)}
                className="grid size-8 place-items-center rounded-full text-cream ring-1 ring-cream/70 transition-colors hover:bg-cream hover:text-pink disabled:opacity-60"
              >
                <TrashIcon className="size-3.5" />
              </button>
              <span aria-label="booked" className="grid size-8 place-items-center rounded-full bg-cream text-pink">
                <CheckIcon className="size-3.5" />
              </span>
            </>
          )}
          {state === 'tentative' && (
            <>
              <IconButton label="remove from my plan" variant="outline" size="sm" disabled={busy} onClick={() => onUnplan(entry)}>
                <CloseIcon className="size-2.5" />
              </IconButton>
              <Button disabled={busy} onClick={() => onBook(entry)} className="disabled:opacity-60">
                book
              </Button>
            </>
          )}
          {state === 'free' && (
            <Button variant="ghost" disabled={busy} onClick={() => onPlan(entry)} className="ring-1 ring-pink-soft disabled:opacity-60">
              plan it
            </Button>
          )}
        </div>
      </div>

      {clashes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-dashed border-pink-line px-4 py-2.5 sm:px-5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] text-pink-deep">
            <WarningIcon className="size-3" />
            clashes with
          </span>
          {clashes.map((clash) => (
            <span
              key={clash.title}
              className={cn(
                'rounded-[4px] px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em]',
                clash.hard ? 'bg-pink text-white' : 'bg-cream text-pink-deep ring-1 ring-pink',
              )}
            >
              {clash.title}
            </span>
          ))}
        </div>
      )}
    </PosterCard>
  );
}
