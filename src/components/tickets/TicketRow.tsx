import { CoverImage } from '@/components/movies/CoverImage';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { ArrowIcon, TicketIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import type { TicketRowModel } from '@/types/view-models';
import { PosterCard } from '@/components/ui/PosterCard';
import { TicketStub } from './TicketStub';

interface TicketRowProps {
  ticket: TicketRowModel;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * A booked screening: art on the left, a dashed stub, then the time in the display face, the title, and where.
 * A clash shows as a strip along the bottom. Selected, the card is filled pink.
 */
export function TicketRow({ ticket, selected, onSelect }: TicketRowProps) {
  const { id, title, coverUrl, time, cinemaName, details, hasImage, past, tentative, conflicts } = ticket;

  return (
    <PosterCard tone={selected ? 'filled' : 'plain'}>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(id)} className="flex min-h-[108px] w-full text-left">
        <span className="w-[88px] shrink-0 overflow-hidden sm:w-[104px]">
          <CoverImage
            src={coverUrl}
            title={title}
            className={cn('size-full', past && 'opacity-75 grayscale-[0.55]')}
            initialsClassName="text-2xl"
          />
        </span>

        <TicketStub onPink={selected} />

        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3 sm:px-5">
          <span className={cn('font-wide text-[28px] leading-none tracking-[-0.02em]', selected ? 'text-cream' : 'text-pink')}>{time}</span>
          <span className={cn('flex items-center gap-2 text-xs font-bold tracking-label', selected ? 'text-cream' : 'text-pink-deep')}>
            <span className="truncate">{title}</span>
            {tentative && (
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase', selected ? 'bg-cream text-pink' : 'text-pink ring-1 ring-pink')}>
                tentative
              </span>
            )}
          </span>
          <span className={cn('truncate text-[10px] font-medium tracking-[0.22em]', selected ? 'text-cream/85' : 'text-pink-soft')}>
            {cinemaName}
            {details && ` · ${details}`}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-center justify-center gap-2.5 pr-5">
          {hasImage && <TicketIcon className={cn('size-3.5', selected ? 'text-cream/85' : 'text-pink-soft')} aria-label="has a ticket file" />}
          <span aria-hidden className={cn('grid size-[19px] place-items-center rounded-full', selected ? 'bg-cream text-pink' : 'bg-pink text-white')}>
            <ArrowIcon className="size-[9px]" />
          </span>
        </span>
      </button>

      {conflicts.map((conflict) => (
        <ConflictBadge key={conflict.text} {...conflict} flat className="w-full" />
      ))}
    </PosterCard>
  );
}
