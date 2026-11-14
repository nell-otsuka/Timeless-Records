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
    <li className="border-b-2 border-dashed border-ink/15 px-1 py-2.5 last:border-b-0">
      <div className="grid grid-cols-[52px_64px_1fr] items-center gap-3 sm:grid-cols-[62px_74px_1fr] sm:gap-3.5">
        <div className="text-center leading-[1.1]">
          <small className="block text-[12px] font-bold text-muted italic">{badge.caption}</small>
          <b className="font-wide block text-[28px] leading-none text-pink">{badge.day}</b>
          <small className="block text-[12px] font-bold text-muted italic">{badge.month}</small>
        </div>
        <p className="font-wide text-[22px] text-ink">{time}</p>
        <div className="flex flex-wrap items-center justify-end gap-[5px]">
          {formats.map(({ label, premium }) => (
            <Tag key={label} label={label} emphasized={premium} />
          ))}
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hex flex items-center gap-1 px-3.5 py-[5px] text-[12px] font-bold whitespace-nowrap italic transition-colors [--point:8px] bg-pink text-white hover:bg-pink-deep"
            >
              book ↗
            </a>
          )}
          <button
            type="button"
            onClick={() => onPlan(id)}
            className="hex flex items-center gap-1 px-3.5 py-[5px] text-[12px] font-bold whitespace-nowrap italic transition-colors [--point:8px] bg-white text-ink ring-2 ring-ink ring-inset hover:bg-pink-line"
          >
            plan it
          </button>
          <button
            type="button"
            onClick={() => onBook(id)}
            className="hex flex items-center gap-1 px-3.5 py-[5px] text-[12px] font-bold whitespace-nowrap italic transition-colors [--point:8px] bg-ink text-white hover:bg-pink"
          >
            <TicketIcon className="size-3" />I booked this
          </button>
        </div>
      </div>
      {conflict && <ConflictBadge {...conflict} className="mt-2" />}
    </li>
  );
}
