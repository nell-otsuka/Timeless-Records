interface EmptyPanelProps {
  eyebrow: string;
  title: string;
  hint: string;
}

/**
 * The right-hand panel when nothing is selected: the same tilted, wire-framed cover as a real selection,
 * but a blank white poster with a pink question mark. Hidden on small screens, where a real panel stacks above
 * the list instead.
 */
export function EmptyPanel({ eyebrow, title, hint }: EmptyPanelProps) {
  return (
    <aside
      aria-label={title}
      className="order-first hidden w-full lg:sticky lg:top-5 lg:order-last lg:block lg:w-[430px] lg:shrink-0 xl:w-[500px]"
    >
      <p className="text-[13px] font-medium tracking-caps">{eyebrow}</p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row">
        <div className="grid size-[290px] shrink-0 place-items-center [perspective:900px]">
          <div className="relative size-[236px] transform-3d [transform:rotateY(-22deg)_rotateX(4deg)_rotateZ(-1.5deg)]">
            <div className="absolute -inset-[10px_-14px_-10px_-6px] border border-wire [transform:translateZ(-26px)]" />
            <div className="absolute inset-0 grid place-items-center bg-white shadow-[0_18px_30px_rgb(120_40_80/0.18)]">
              <span aria-hidden className="font-wide text-[168px] leading-none text-pink">
                ?
              </span>
            </div>
            <div className="absolute -inset-1 border border-wire/70 [transform:translateZ(18px)]" />
          </div>
        </div>
        <p className="font-mono text-xs leading-[1.55] font-light tracking-[0.16em] text-muted lowercase">{hint}</p>
      </div>

      <h2 className="font-wide text-outline mt-3.5 text-[40px] leading-none tracking-[-0.02em]">{title}</h2>
    </aside>
  );
}
