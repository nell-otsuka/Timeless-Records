import { CoverImage } from '@/components/movies/CoverImage';
import { cn } from '@/lib/cn';
import type { TicketTileModel } from '@/types/view-models';
import { PosterCard } from '@/components/ui/PosterCard';

interface TicketGalleryProps {
  tiles: TicketTileModel[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** How many posters per row. */
  columns: number;
}

/** Gallery mode: nothing but the posters, in the same cut-corner frame, heavier on the left and bottom edges. A selected one turns pink. */
export function TicketGallery({ tiles, selectedId, onSelect, columns }: TicketGalleryProps) {
  return (
    <ul className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {tiles.map(({ id, title, coverUrl, past }) => (
        <li key={id}>
          <PosterCard tone={id === selectedId ? 'accent' : 'plain'}>
            <button type="button" aria-label={title} aria-pressed={id === selectedId} onClick={() => onSelect(id)} className="block w-full">
              <CoverImage
                src={coverUrl}
                title={title}
                className={cn('aspect-[2/3] w-full', past && 'opacity-60 grayscale-[0.55]')}
                initialsClassName="text-4xl"
              />
            </button>
          </PosterCard>
        </li>
      ))}
    </ul>
  );
}
