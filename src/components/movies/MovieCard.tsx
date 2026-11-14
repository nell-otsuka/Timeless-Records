import { PosterCard } from '@/components/ui/PosterCard';
import { ArrowIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { screeningCountLabel } from '@/lib/screenings';
import type { MovieEntry } from '@/types/movie';
import { CoverImage } from './CoverImage';

interface MovieCardProps {
  movie: MovieEntry;
  selected: boolean;
  onSelect: (id: string) => void;
}

/** A movie of the watch list, in the same hand-cut frame as the tickets. Selected, the whole card turns pink. */
export function MovieCard({ movie, selected, onSelect }: MovieCardProps) {
  const count = movie.screenings.length;
  const available = count > 0;

  return (
    <PosterCard tone={selected ? 'filled' : 'plain'}>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(movie.id)} className="flex w-full flex-col text-left">
        <div className="aspect-[265/244] overflow-hidden">
          <CoverImage src={movie.coverUrl} title={movie.title} className={cn('size-full', !available && 'opacity-75 grayscale-[0.55]')} />
        </div>

        <div className="flex h-[66px] items-center justify-between gap-3 pr-[46px] pl-4">
          <div className="min-w-0">
            <p className={cn('truncate text-[15px] leading-tight font-semibold tracking-[-0.01em]', selected ? 'text-white' : 'text-ink')}>{movie.title}</p>
            <p
              className={cn(
                'mt-1 flex items-center gap-1.5 text-[12px] whitespace-nowrap italic',
                selected ? 'font-semibold text-white/85' : available ? 'font-bold text-pink' : 'font-medium text-muted',
              )}
            >
              <span
                className={cn('size-[6px] rounded-full', selected ? 'bg-white' : available ? 'bg-pink' : 'bg-muted')}
                aria-hidden
              />
              {screeningCountLabel(count)}
            </p>
          </div>
          <span
            className={cn(
              'grid size-[24px] shrink-0 place-items-center rounded-full',
              selected ? 'bg-white text-pink' : available ? 'bg-pink text-white' : 'bg-muted text-white',
            )}
            aria-hidden
          >
            <ArrowIcon className="size-[11px]" />
          </span>
        </div>
      </button>
    </PosterCard>
  );
}
