interface PanelTitleProps {
  title: string;
  /** "tomorrow", "in 3 days"… left out when empty. */
  subtitle?: string;
}

/** The big title under the side panel's card, with a pink brush stroke trailing off its last line. */
export function PanelTitle({ title, subtitle }: PanelTitleProps) {
  return (
    <div className="relative -mt-[2px] pl-[2px]">
      <h2 className="font-wide max-w-[370px] text-[41px] leading-[1.02] tracking-[-0.03em] break-words text-ink">{title}</h2>
      <span aria-hidden className="absolute top-[58px] left-[40%] h-[4px] w-[42%] origin-left -rotate-[5deg] bg-pink [clip-path:polygon(0_40%,100%_0,100%_100%,0_70%)]" />
      {subtitle && <p className="mt-[10px] text-[20px] font-semibold text-muted italic">{subtitle}</p>}
    </div>
  );
}
