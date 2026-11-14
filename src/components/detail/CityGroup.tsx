import type { CityGroupModel } from '@/types/view-models';
import { ScreeningRow } from './ScreeningRow';

interface CityGroupProps {
  group: CityGroupModel;
  onBook: (screeningId: string) => void;
  onPlan: (screeningId: string) => void;
}

/** One city: a heading, then each cinema with its screenings. */
export function CityGroup({ group: { city, count, cinemas }, onBook, onPlan }: CityGroupProps) {
  return (
    <section aria-label={city} className="mt-4 first:mt-0">
      <h4 className="sticky top-0 z-10 flex items-baseline justify-between bg-cream py-1.5 text-[17px] font-extrabold text-pink italic">
        {city}
        <span className="text-[14px] font-semibold text-muted">{count}</span>
      </h4>

      {cinemas.map((cinema) => (
        <div key={cinema.id} className="mt-1 mb-3 border-2 border-r-[6px] border-b-[4px] border-ink bg-card px-3 pt-2.5 pb-1">
          <p className="text-[16px] font-bold text-ink">{cinema.name}</p>
          {cinema.address && <p className="mt-0.5 text-[13px] text-muted italic">{cinema.address}</p>}
          <ul className="mt-1">
            {cinema.screenings.map((screening) => (
              <ScreeningRow key={screening.id} screening={screening} onBook={onBook} onPlan={onPlan} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
