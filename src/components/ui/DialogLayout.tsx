import type { ReactNode } from 'react';
import { APP_NAME } from '@/config/app';
import { CloseIcon } from './icons';
import { IconButton } from './IconButton';

/** The dialog title, set like the page title: the first part filled, the second outlined. */
export interface DialogTitle {
  lead: string;
  accent: string;
}

interface DialogLayoutProps {
  title: DialogTitle;
  /** A short thin line above the form, in the `// like this` style. */
  note: string;
  /** What sits under the title in the pink column: a poster, a picker. */
  aside?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A wide pink sheet with slanted corners: the title and a poster on the pink side, a cream panel with the
 * content on the other. Everything fits without scrolling on a normal screen; on a very short one the sheet scrolls
 * as a whole, with no visible scrollbar.
 */
export function DialogLayout({ title, note, aside, onClose, children }: DialogLayoutProps) {
  return (
    <div className="[filter:drop-shadow(0_26px_40px_rgb(226_67_127/0.34))]">
      <div className="cut-tl-br animate-modal-in scrollbar-none grid max-h-[calc(100dvh-2rem)] overflow-y-auto bg-pink md:grid-cols-[292px_1fr]">
        <aside className="relative flex flex-col gap-5 overflow-hidden px-7 pt-8 pb-16 text-cream md:pb-20">
          <p className="text-[11px] font-medium tracking-caps">_{APP_NAME}</p>
          <h2 className="font-wide text-[44px] leading-[0.84] tracking-[-0.025em]">
            <span className="block">{title.lead}</span>
            <span className="text-outline-cream mt-1 block">{title.accent}</span>
          </h2>
          {aside}
          <span aria-hidden className="stripes absolute bottom-0 left-0 right-4 h-12 text-cream/45 md:h-16" />
        </aside>

        <section className="cut-tl-br [--cut:22px] m-3 flex flex-col bg-card px-7 pt-5 pb-7 md:ml-0">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-[12px] font-light text-pink-soft italic tracking-[0.12em]">// {note}</p>
            <IconButton label="close" variant="outline" size="sm" onClick={onClose}>
              <CloseIcon className="size-2.5" />
            </IconButton>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
