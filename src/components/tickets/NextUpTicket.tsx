import { CoverImage } from '@/components/movies/CoverImage';
import { Button } from '@/components/ui/Button';
import { ConflictBadge } from '@/components/ui/ConflictBadge';
import { ArrowIcon, QrIcon, TicketIcon } from '@/components/ui/icons';
import { SHARDS, Shard } from '@/components/ui/Shard';
import type { NextUpModel } from '@/types/view-models';

interface NextUpTicketProps {
  next: NextUpModel;
  selected: boolean;
  onSelect: (id: string) => void;
  onShowFile: (id: string) => void;
}

/** The dark brush ring printed across the pink, as in the poster. */
function BrushRing() {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute top-[6%] right-[3%] h-[86%] text-pink-deep opacity-70">
      <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="26" strokeDasharray="330 40 60 60" />
      <path d="M40 150 C 70 120, 120 90, 190 60" fill="none" stroke="currentColor" strokeWidth="18" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/**
 * The ticket you will use next, large above the agenda: a pink card cut on a slant in a heavy black edge, the poster on
 * black at the left, the movie in white and the time outlined. Selecting it opens it in the panel.
 */
export function NextUpTicket({ next: { row, countdown, when }, selected, onSelect, onShowFile }: NextUpTicketProps) {
  const { id, title, coverUrl, time, cinemaName, details, hasImage, conflicts } = row;

  return (
    <div className="mb-[43px]">
      <Shard shape={SHARDS.hero} edge="bg-ink" fill="bg-pink">
        <div className="relative h-[284px]">
          <BrushRing />
          <button type="button" aria-pressed={selected} aria-label={`${title}, ${time}`} onClick={() => onSelect(id)} className="absolute inset-0" />

          <div className="pointer-events-none absolute inset-y-0 left-0 w-[245px] bg-ink">
            <div className="absolute top-[42px] right-[6px] bottom-[28px] left-[22px] overflow-hidden">
              <CoverImage src={coverUrl} title={title} className="size-full" initialsClassName="text-5xl" />
            </div>
          </div>

          <div className="pointer-events-none relative ml-[262px] flex h-full flex-col pt-[52px] pr-[70px] text-white">
            <p className="text-[15px] leading-none font-bold tracking-[0.12em] uppercase">next up · {countdown}</p>
            <p className="mt-[12px] truncate text-[37px] leading-none font-extrabold tracking-[-0.02em]">{title}</p>
            <p className="text-outline-cream mt-[4px] text-[70px] leading-[0.9] font-black tracking-[-0.03em]">{time}</p>
            <p className="mt-[12px] truncate text-[15.5px] font-medium">
              {when} · {cinemaName}
              {details && ` · ${details}`}
            </p>
          </div>

          {hasImage && (
            <>
              <span className="pointer-events-none absolute bottom-[12px] left-[20px] flex items-center gap-2 bg-ink py-[8px] pr-10 pl-3 text-[15px] font-semibold text-white italic [clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]">
                <QrIcon className="size-[18px]" />
                your qr code is ready
              </span>
              <Button variant="dark" onClick={() => onShowFile(id)} className="absolute right-[34px] bottom-[14px]">
                <TicketIcon className="size-[18px]" />
                show ticket
                <ArrowIcon className="ml-1 size-3 text-white/60" />
              </Button>
            </>
          )}
        </div>
      </Shard>

      {conflicts.map((conflict) => (
        <ConflictBadge key={conflict.text} {...conflict} className="mt-2" />
      ))}
    </div>
  );
}
