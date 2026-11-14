import { CoverImage } from '@/components/movies/CoverImage';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { ArrowIcon, TicketIcon } from '@/components/ui/icons';
import { PosterCard } from '@/components/ui/PosterCard';
import { cn } from '@/lib/cn';
import type { TicketRowModel } from '@/types/view-models';

interface TicketRowProps {
  ticket: TicketRowModel;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * A booked screening: the poster on black at the left, the time in pink, the title in black, where in grey.
 * A clash shows as a strip along the bottom. Selected, the card is filled pink.
 */
export function TicketRow({ ticket, selected, onSelect }: TicketRowProps) {
  const { id, title, coverUrl, time, cinemaName, details, hasImage, past, tentative, conflicts } = ticket;

  return (
    <PosterCard tone={selected ? 'filled' : 'plain'}>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(id)} className="flex min-h-[130px] w-full text-left">
        <span className="w-[138px] shrink-0 self-stretch bg-ink py-[4px] pr-[7px] pl-[5px]">
          <CoverImage src={coverUrl} title={title} className={cn('size-full min-h-[122px]', past && 'opacity-75 grayscale-[0.55]')} initialsClassName="text-3xl" />
        </span>

        <span className="flex min-w-0 flex-1 flex-col justify-center gap-[5px] py-3 pr-3 pl-[18px]">
          <span className={cn('font-wide text-[31px] leading-none tracking-[-0.02em]', selected ? 'text-white' : 'text-pink')}>{time}</span>
          <span className={cn('flex items-center gap-2 text-[20px] leading-tight font-semibold', selected ? 'text-white' : 'text-ink')}>
            <span className="truncate">{title}</span>
            {tentative && (
              <span className={cn('shrink-0 px-2 py-0.5 text-[11px] font-bold tracking-[0.08em] uppercase', selected ? 'bg-white text-pink' : 'bg-ink text-white')}>
                tentative
              </span>
            )}
          </span>
          <span className={cn('truncate text-[17px] font-medium italic', selected ? 'text-white/85' : 'text-muted')}>
            {cinemaName}
            {details && ` · ${details}`}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-center justify-center gap-3 pr-[52px]">
          {hasImage && <TicketIcon className={cn('size-[17px]', selected ? 'text-white/85' : 'text-muted')} aria-label="has a ticket file" />}
          <span aria-hidden className={cn('grid size-[25px] place-items-center rounded-full', selected ? 'bg-white text-pink' : 'bg-pink text-white')}>
            <ArrowIcon className="size-[11px]" />
          </span>
        </span>
      </button>

      {conflicts.map((conflict) => (
        <ConflictBadge key={conflict.text} {...conflict} flat className="w-full" />
      ))}
    </PosterCard>
  );
}
