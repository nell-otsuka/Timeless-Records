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
    <section className="mt-6" aria-labelledby="screenings-heading">
      <div className="flex items-baseline justify-between border-b border-pink-line pb-2.5">
        <h3 id="screenings-heading" className="text-xs font-bold tracking-[0.3em] text-pink-deep">
          screenings
        </h3>
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted">
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
