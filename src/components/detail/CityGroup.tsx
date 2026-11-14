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
      <h4 className="sticky top-0 z-10 flex items-baseline justify-between bg-cream py-1.5 text-[11px] font-bold tracking-[0.3em] text-pink-deep">
        {city}
        <span className="font-mono text-[10px] font-normal tracking-[0.14em] text-muted">{count}</span>
      </h4>

      {cinemas.map((cinema) => (
        <div key={cinema.id} className="mt-1 mb-3 rounded-[10px] bg-card/70 px-3 pt-2.5 pb-1 ring-1 ring-pink-line/60">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-pink-deep">{cinema.name}</p>
          {cinema.address && <p className="mt-0.5 text-[10px] tracking-[0.12em] text-muted">{cinema.address}</p>}
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
