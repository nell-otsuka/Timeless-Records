import { CloseIcon, PencilIcon, TrashIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { movieFacts } from '@/lib/movies';
import type { MovieEntry } from '@/types/movie';
import type { CityGroupModel } from '@/types/view-models';
import { CoverCase } from './CoverCase';
import { MovieFacts } from './MovieFacts';
import { ScreeningList } from './ScreeningList';

interface DetailPanelProps {
  movie: MovieEntry;
  groups: CityGroupModel[];
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onBook: (screeningId: string) => void;
  onPlan: (screeningId: string) => void;
}

export function DetailPanel({ movie, groups, onClose, onEdit, onRemove, onBook, onPlan }: DetailPanelProps) {
  return (
    <aside
      aria-label={`${movie.title} details`}
      className="relative order-first w-full lg:sticky lg:top-5 lg:order-last lg:w-[430px] lg:shrink-0 xl:w-[500px]"
    >
      <div className="absolute top-0 right-0 flex gap-2">
        <IconButton label="edit movie" variant="outline" size="sm" onClick={onEdit}>
          <PencilIcon className="size-3.5" />
        </IconButton>
        <IconButton label="remove from my list" variant="outline" size="sm" onClick={onRemove}>
          <TrashIcon className="size-3.5" />
        </IconButton>
        <IconButton label="close details" variant="outline" size="sm" onClick={onClose}>
          <CloseIcon className="size-2.5" />
        </IconButton>
      </div>

      <p className="text-[13px] font-medium tracking-caps">_now viewing</p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
        <CoverCase src={movie.coverUrl} title={movie.title} />
        <MovieFacts facts={movieFacts(movie)} />
      </div>

      <h2 className="font-wide mt-3.5 text-[40px] leading-none tracking-[-0.02em] break-words">{movie.title}</h2>

      <ScreeningList groups={groups} onBook={onBook} onPlan={onPlan} />
    </aside>
  );
}
