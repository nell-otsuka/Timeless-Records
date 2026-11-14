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

/** A movie of the watch list, in the same cut-corner frame as the tickets. Selected, the whole card turns pink. */
export function MovieCard({ movie, selected, onSelect }: MovieCardProps) {
  const count = movie.screenings.length;
  const available = count > 0;

  return (
    <PosterCard tone={selected ? 'filled' : 'plain'}>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(movie.id)} className="flex w-full flex-col text-left">
        <div className="aspect-[265/244] overflow-hidden">
          <CoverImage src={movie.coverUrl} title={movie.title} className={cn('size-full', !available && 'opacity-75 grayscale-[0.55]')} />
        </div>

        <div className="flex h-[57px] items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className={cn('truncate text-xs font-bold tracking-label', selected ? 'text-cream' : 'text-pink-deep')}>{movie.title}</p>
            <p
              className={cn(
                'mt-0.5 flex items-center gap-1.5 text-[10px] tracking-[0.22em]',
                selected ? 'font-semibold text-cream/85' : available ? 'font-semibold text-pink' : 'font-medium text-muted',
              )}
            >
              <span
                className={cn('size-[5px] rounded-full', selected ? 'bg-cream' : available ? 'bg-pink' : 'bg-muted')}
                aria-hidden
              />
              {screeningCountLabel(count)}
            </p>
          </div>
          <span
            className={cn(
              'grid size-[19px] shrink-0 place-items-center rounded-full',
              selected ? 'bg-cream text-pink' : available ? 'bg-pink text-white' : 'bg-muted text-white',
            )}
            aria-hidden
          >
            <ArrowIcon className="size-[9px]" />
          </span>
        </div>
      </button>
    </PosterCard>
  );
}
