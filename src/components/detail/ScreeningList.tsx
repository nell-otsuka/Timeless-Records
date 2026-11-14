import { EmptyState } from '@/components/movies/EmptyState';
import { screeningCountLabel } from '@/lib/screenings';
import type { CityGroupModel } from '@/types/view-models';
import { CityGroup } from './CityGroup';

interface ScreeningListProps {
  groups: CityGroupModel[];
  onBook: (screeningId: string) => void;
  onPlan: (screeningId: string) => void;
}

export function ScreeningList({ groups, onBook, onPlan }: ScreeningListProps) {
  const total = groups.reduce((sum, group) => sum + group.count, 0);

  return (
    <section className="mt-8" aria-labelledby="screenings-heading">
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
        <h3 id="screenings-heading" className="text-[20px] font-extrabold text-ink italic">
          screenings
        </h3>
        <span className="text-[15px] font-semibold text-muted italic">
          {screeningCountLabel(total)}
          {groups.length > 1 && ` · ${groups.length} cities`}
        </span>
      </div>

      {groups.length === 0 ? (
        <EmptyState title="nothing yet" hint="no screenings found. check back soon, or adjust your cities." />
      ) : (
        <div className="scrollbar-pink mt-3 max-h-[min(380px,42vh)] overflow-auto pr-1.5">
          {groups.map((group) => (
            <CityGroup key={group.city} group={group} onBook={onBook} onPlan={onPlan} />
          ))}
        </div>
      )}
    </section>
  );
}
