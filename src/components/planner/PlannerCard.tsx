import { CoverImage } from '@/components/movies/CoverImage';
import { Button } from '@/components/ui/Button';
import { CheckIcon, CloseIcon, TrashIcon, WarningIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { PosterCard, type PosterTone } from '@/components/ui/PosterCard';
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
 * One screening on the planner, in the same card as a ticket. Booked: solid pink. Tentative: a pink edge, with a way to
 * drop it or book it. Free: plain, with a way to plan it; hatched when it clashes with a ticket you hold, a grey edge
 * when only with one you are considering.
 */
export function PlannerCard({ entry, busy, onPlan, onUnplan, onBook, onDelete }: PlannerCardProps) {
  const { state, title, coverUrl, span, cinemaName, clashes } = entry;
  const booked = state === 'booked';

  return (
    <PosterCard tone={toneOf(entry)}>
      <div className="flex min-h-[112px]">
        <span className="w-[104px] shrink-0 self-stretch bg-ink py-[4px] pr-[7px] pl-[5px]">
          <CoverImage src={coverUrl} title={title} className="size-full min-h-[104px]" initialsClassName="text-2xl" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[4px] py-3 pr-3 pl-[18px]">
          <p className={cn('font-wide text-[27px] leading-none tracking-[-0.02em]', booked ? 'text-white' : 'text-pink')}>{span}</p>
          <p className={cn('flex items-center gap-2 text-[19px] leading-tight font-semibold', booked ? 'text-white' : 'text-ink')}>
            <span className="truncate">{title}</span>
            {state !== 'free' && (
              <span className={cn('shrink-0 px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase', booked ? 'bg-white text-pink' : 'bg-pink text-white')}>
                {booked ? 'booked' : 'tentative'}
              </span>
            )}
          </p>
          <p className={cn('truncate text-[16px] font-medium italic', booked ? 'text-white/85' : 'text-muted')}>{cinemaName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3 pr-[50px]">
          {booked && (
            <>
              <IconButton label="delete this ticket" variant="outline" size="sm" disabled={busy} onClick={() => onDelete(entry)}>
                <TrashIcon className="size-3.5" />
              </IconButton>
              <span aria-label="booked" className="grid size-[34px] place-items-center rounded-full bg-white text-pink ring-2 ring-ink">
                <CheckIcon className="size-3.5" />
              </span>
            </>
          )}
          {state === 'tentative' && (
            <>
              <IconButton label="remove from my plan" variant="outline" size="sm" disabled={busy} onClick={() => onUnplan(entry)}>
                <CloseIcon className="size-2.5" />
              </IconButton>
              <Button disabled={busy} onClick={() => onBook(entry)}>
                book
              </Button>
            </>
          )}
          {state === 'free' && (
            <Button variant="dark" disabled={busy} onClick={() => onPlan(entry)}>
              plan it
            </Button>
          )}
        </div>
      </div>

      {clashes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/25 py-2.5 pr-[50px] pl-[18px]">
          <span className="flex items-center gap-1.5 text-[14px] font-bold text-pink-deep italic">
            <WarningIcon className="size-3.5" />
            clashes with
          </span>
          {clashes.map((clash) => (
            <span key={clash.title} className={cn('px-2 py-0.5 text-[13px] font-semibold', clash.hard ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-ink')}>
              {clash.title}
            </span>
          ))}
        </div>
      )}
    </PosterCard>
  );
}
