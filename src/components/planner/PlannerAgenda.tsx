import type { PlannerDay, PlannerEntry } from '@/lib/planner';
import { PlannerCard } from './PlannerCard';

interface PlannerAgendaProps {
  days: PlannerDay[];
  busy: boolean;
  onPlan: (entry: PlannerEntry) => void;
  onUnplan: (entry: PlannerEntry) => void;
  onBook: (entry: PlannerEntry) => void;
  onDelete: (entry: PlannerEntry) => void;
}

/** The planner one day at a time, like the tickets agenda: a big date numeral, a hairline, then that day's screenings. */
export function PlannerAgenda({ days, busy, onPlan, onUnplan, onBook, onDelete }: PlannerAgendaProps) {
  return (
    <div className="space-y-10">
      {days.map(({ key, weekday, day, month, relative, entries }) => (
        <section key={key} aria-label={`${weekday} ${day} ${month}`}>
          <header className="mb-4 flex items-end gap-4">
            <span className="font-wide text-[56px] leading-[0.8] tracking-[-0.025em] text-pink">{day}</span>
            <span className="pb-0.5 text-[10px] leading-[1.7] font-semibold tracking-[0.3em]">
              <span className="block text-pink-deep">{weekday}</span>
              <span className="block text-pink-soft">{month}</span>
            </span>
            <span aria-hidden className="mb-1.5 h-px flex-1 bg-gradient-to-r from-pink-line to-transparent" />
            <span className="pb-0.5 text-[10px] tracking-[0.3em] text-muted">{relative}</span>
          </header>

          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.key}>
                <PlannerCard entry={entry} busy={busy} onPlan={onPlan} onUnplan={onUnplan} onBook={onBook} onDelete={onDelete} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
