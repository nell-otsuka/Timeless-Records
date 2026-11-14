import { PanelCard } from '@/components/ui/PanelCard';
import { PanelTitle } from './PanelTitle';

interface EmptyPanelProps {
  eyebrow: string;
  title: string;
  hint: string;
}

/**
 * The right-hand panel when nothing is selected: the same card as a real selection, holding a blank white poster
 * with a pink question mark. Hidden on small screens, where a real panel stacks above the list instead.
 */
export function EmptyPanel({ eyebrow, title, hint }: EmptyPanelProps) {
  return (
    <aside aria-label={title} className="order-first hidden w-full lg:sticky lg:top-[var(--panel-top)] lg:order-last lg:block lg:w-[37%] lg:shrink-0">
      <PanelCard label={eyebrow.replace(/^_/, '')}>
        <div className="flex items-center gap-[30px]">
          <div className="grid aspect-[9/10] w-[196px] shrink-0 rotate-[1.2deg] place-items-center border-[3px] border-ink bg-white">
            <span aria-hidden className="font-wide text-[150px] leading-none text-pink">
              ?
            </span>
          </div>
          <p className="text-[18px] leading-snug text-ink">{hint}</p>
        </div>
      </PanelCard>

      <PanelTitle title={title} />
    </aside>
  );
}
