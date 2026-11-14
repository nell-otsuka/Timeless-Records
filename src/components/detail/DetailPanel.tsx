import { CloseIcon, PencilIcon, TrashIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { PanelCard } from '@/components/ui/PanelCard';
import { movieFacts } from '@/lib/movies';
import type { MovieEntry } from '@/types/movie';
import type { CityGroupModel } from '@/types/view-models';
import { CoverCase } from './CoverCase';
import { MovieFacts } from './MovieFacts';
import { PanelTitle } from './PanelTitle';
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
    <aside aria-label={`${movie.title} details`} className="relative order-first w-full lg:sticky lg:top-[var(--panel-top)] lg:order-last lg:w-[37%] lg:shrink-0">
      <PanelCard
        label="now viewing"
        actions={
          <>
            <IconButton label="edit movie" variant="outline" size="sm" onClick={onEdit}>
              <PencilIcon className="size-3.5" />
            </IconButton>
            <IconButton label="remove from my list" variant="outline" size="sm" onClick={onRemove}>
              <TrashIcon className="size-3.5" />
            </IconButton>
            <IconButton label="close details" variant="outline" size="sm" onClick={onClose}>
              <CloseIcon className="size-2.5" />
            </IconButton>
          </>
        }
      >
        <div className="flex items-start gap-[30px]">
          <CoverCase src={movie.coverUrl} title={movie.title} />
          <MovieFacts facts={movieFacts(movie)} />
        </div>
      </PanelCard>

      <PanelTitle title={movie.title} />

      <ScreeningList groups={groups} onBook={onBook} onPlan={onPlan} />
    </aside>
  );
}
