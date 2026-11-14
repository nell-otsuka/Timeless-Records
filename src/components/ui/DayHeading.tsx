interface DayHeadingProps {
  weekday: string;
  day: string;
  month: string;
  /** "today", "in 3 days"… */
  relative: string;
}

/**
 * One day of an agenda, as in the poster: a big pink italic numeral, the weekday and month stacked in black, a black
 * brush stroke under them running into a hairline, and how far away the day is at the right.
 */
export function DayHeading({ weekday, day, month, relative }: DayHeadingProps) {
  return (
    <header className="relative mb-[10px] -ml-[40px] flex items-end pr-[24px] pb-[10px]">
      <span className="font-wide text-[72px] leading-[0.78] tracking-[-0.04em] text-pink">{day}</span>
      <span className="mb-[2px] ml-[12px] text-[19px] leading-[1.02] font-extrabold italic">
        <span className="block">{weekday}</span>
        <span className="block">{month}</span>
      </span>
      <span className="mb-[2px] ml-auto text-[18px] font-extrabold italic">{relative}</span>
      <span aria-hidden className="absolute -bottom-[2px] -left-[6px] h-[11px] w-[190px] bg-ink [clip-path:polygon(0_40%,100%_0,100%_25%,6%_100%)]" />
      <span aria-hidden className="absolute right-0 -bottom-[1px] left-[176px] h-[2px] origin-left rotate-[0.25deg] bg-ink" />
    </header>
  );
}
