import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { TicketIcon } from '@/components/ui/icons';
import { Tag } from '@/components/ui/Tag';
import type { ScreeningRowModel } from '@/types/view-models';

interface ScreeningRowProps {
  screening: ScreeningRowModel;
  /** "I booked this": opens the ticket form pre-filled from this screening. */
  onBook: (screeningId: string) => void;
  /** Puts the screening on the planner as a tentative ticket. */
  onPlan: (screeningId: string) => void;
}

export function ScreeningRow({ screening: { id, badge, time, formats, bookingUrl, conflict }, onBook, onPlan }: ScreeningRowProps) {
  return (
    <li className="border-b border-dashed border-pink-line px-1 py-2.5 last:border-b-0">
      <div className="grid grid-cols-[52px_64px_1fr] items-center gap-3 sm:grid-cols-[62px_74px_1fr] sm:gap-3.5">
        <div className="text-center leading-[1.1]">
          <small className="block text-[9px] font-semibold tracking-[0.24em] text-pink-soft">{badge.caption}</small>
          <b className="font-wide block text-2xl">{badge.day}</b>
          <small className="block text-[9px] font-semibold tracking-[0.24em] text-pink-soft">{badge.month}</small>
        </div>
        <p className="font-mono text-lg font-medium tracking-[0.04em] text-pink-deep">{time}</p>
        <div className="flex flex-wrap items-center justify-end gap-[5px]">
          {formats.map(({ label, premium }) => (
            <Tag key={label} label={label} emphasized={premium} />
          ))}
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-pink-line/70 px-2 py-[3px] font-mono text-[9px] tracking-[0.12em] text-pink-deep uppercase transition-colors hover:bg-pink hover:text-white"
            >
              book ↗
            </a>
          )}
          <button
            type="button"
            onClick={() => onPlan(id)}
            className="flex items-center gap-1 rounded-full border border-pink-soft px-2 py-[3px] font-mono text-[9px] tracking-[0.12em] text-pink uppercase transition-colors hover:bg-pink hover:text-white"
          >
            plan it
          </button>
          <button
            type="button"
            onClick={() => onBook(id)}
            className="flex items-center gap-1 rounded-full border border-pink-soft px-2 py-[3px] font-mono text-[9px] tracking-[0.12em] text-pink uppercase transition-colors hover:bg-pink hover:text-white"
          >
            <TicketIcon className="size-3" />I booked this
          </button>
        </div>
      </div>
      {conflict && <ConflictBadge {...conflict} className="mt-2" />}
    </li>
  );
}
