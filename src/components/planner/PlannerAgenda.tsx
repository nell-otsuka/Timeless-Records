import { DayHeading } from '@/components/ui/DayHeading';
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

/** The planner one day at a time, like the tickets agenda. */
export function PlannerAgenda({ days, busy, onPlan, onUnplan, onBook, onDelete }: PlannerAgendaProps) {
  return (
    <div className="space-y-12">
      {days.map(({ key, weekday, day, month, relative, entries }) => (
        <section key={key} aria-label={`${weekday} ${day} ${month}`}>
          <DayHeading weekday={weekday} day={day} month={month} relative={relative} />
          <ul className="space-y-4">
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
