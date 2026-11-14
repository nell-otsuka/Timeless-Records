import { DayHeading } from '@/components/ui/DayHeading';
import type { TicketDayGroup } from '@/types/view-models';
import { TicketRow } from './TicketRow';

interface TicketAgendaProps {
  groups: TicketDayGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Tickets one day at a time: the day's heading, then that day's tickets. */
export function TicketAgenda({ groups, selectedId, onSelect }: TicketAgendaProps) {
  return (
    <div className="space-y-12">
      {groups.map(({ key, weekday, day, month, relative, rows }) => (
        <section key={key} aria-label={`${weekday} ${day} ${month}`}>
          <DayHeading weekday={weekday} day={day} month={month} relative={relative} />
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.id}>
                <TicketRow ticket={row} selected={row.id === selectedId} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
