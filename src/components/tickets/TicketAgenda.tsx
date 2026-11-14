import type { TicketDayGroup } from '@/types/view-models';
import { TicketRow } from './TicketRow';

interface TicketAgendaProps {
  groups: TicketDayGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Tickets one day at a time: a big date numeral in the display face, a hairline, then that day's tickets. */
export function TicketAgenda({ groups, selectedId, onSelect }: TicketAgendaProps) {
  return (
    <div className="space-y-10">
      {groups.map(({ key, weekday, day, month, relative, rows }) => (
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
