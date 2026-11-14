import { CoverImage } from '@/components/movies/CoverImage';
import { Button } from '@/components/ui/Button';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { TicketIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import type { NextUpModel } from '@/types/view-models';
import { PosterCard } from '@/components/ui/PosterCard';
import { TicketStub } from './TicketStub';

interface NextUpTicketProps {
  next: NextUpModel;
  selected: boolean;
  onSelect: (id: string) => void;
  onShowFile: (id: string) => void;
}

/**
 * The ticket you will use next, large above the agenda. Same type as the page title:
 * the movie in the filled display face, the time outlined. Selected, the card is filled pink.
 */
export function NextUpTicket({ next: { row, countdown, when }, selected, onSelect, onShowFile }: NextUpTicketProps) {
  const { id, title, coverUrl, time, cinemaName, details, hasImage, conflicts } = row;

  return (
    <PosterCard tone={selected ? 'filled' : 'plain'} className="mb-12">
      <button type="button" aria-pressed={selected} onClick={() => onSelect(id)} className="flex min-h-[184px] w-full text-left">
        <span className="w-[112px] shrink-0 overflow-hidden sm:w-[164px]">
          <CoverImage src={coverUrl} title={title} className="size-full" initialsClassName="text-4xl" />
        </span>

        <TicketStub onPink={selected} />

        <span className="flex min-w-0 flex-1 flex-col justify-between gap-4 px-5 py-5 sm:px-8">
          <span className={cn('text-[11px] font-medium tracking-caps', selected ? 'text-cream' : 'text-pink')}>_next up · {countdown}</span>

          <span className="block">
            <span className={cn('font-wide line-clamp-2 block text-[24px] leading-[0.98] tracking-[-0.02em] sm:text-[34px]', selected ? 'text-cream' : 'text-pink')}>
              {title}
            </span>
            <span className={cn('font-wide mt-1 block text-[44px] leading-none tracking-[-0.025em] sm:text-[64px]', selected ? 'text-outline-cream' : 'text-outline')}>
              {time}
            </span>
          </span>

          <span className={cn('block text-[10px] leading-relaxed tracking-[0.22em]', selected ? 'text-cream/85' : 'text-pink-soft')}>
            {when} · {cinemaName}
            {details && ` · ${details}`}
          </span>
        </span>
      </button>

      {hasImage && (
        <div className={cn('flex items-center justify-between gap-4 border-t border-dashed px-5 py-3 sm:px-8', selected ? 'border-cream/60' : 'border-pink-line')}>
          <span className={cn('text-[10px] tracking-[0.22em]', selected ? 'text-cream/85' : 'text-pink-soft')}>your qr code is ready</span>
          <Button onClick={() => onShowFile(id)} className={cn('flex items-center gap-2', selected && 'bg-cream text-pink hover:bg-white')}>
            <TicketIcon className="size-3.5" />
            show ticket
          </Button>
        </div>
      )}

      {conflicts.map((conflict) => (
        <ConflictBadge key={conflict.text} {...conflict} flat className="w-full" />
      ))}
    </PosterCard>
  );
}
