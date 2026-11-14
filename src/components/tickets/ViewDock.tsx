import type { ReactNode } from 'react';
import { EyeIcon, EyeOffIcon, GridIcon, ListIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

export type TicketsView = 'list' | 'gallery';

interface ViewDockProps {
  view: TicketsView;
  onViewChange: (view: TicketsView) => void;
  tentativeShown: boolean;
  onToggleTentative: () => void;
  /** Posters per row in gallery mode: shown on a key that adds one more each press. */
  columns: number;
  onCycleColumns: () => void;
}

interface KeyProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** One key of the dock: white icon, or a white tile with a black icon while it is on. */
function Key({ label, active, onClick, children }: KeyProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn('grid size-[42px] place-items-center rounded-[5px] transition-colors', active ? 'bg-[#f2ece6] text-ink' : 'text-white hover:bg-white/15')}
    >
      {children}
    </button>
  );
}

/**
 * The tickets page's controls, the poster's HUD: a black plate with a pointed left end, fixed to the bottom-right
 * corner, with a dashed rule under it. Show or hide the tentative tickets, list or gallery, and in gallery mode how
 * many posters per row.
 */
export function ViewDock({ view, onViewChange, tentativeShown, onToggleTentative, columns, onCycleColumns }: ViewDockProps) {
  return (
    <div role="toolbar" aria-label="view options" className="fixed right-5 bottom-5 z-40 sm:right-[26px] sm:bottom-[26px]">
      <div className="bg-ink [clip-path:polygon(0_52%,14%_4%,100%_0,95%_96%,6%_100%)]">
        <div className="flex items-center gap-[18px] py-[14px] pr-[30px] pl-[50px]">
          <Key label={tentativeShown ? 'hide tentative tickets' : 'show tentative tickets'} active={tentativeShown} onClick={onToggleTentative}>
            {tentativeShown ? <EyeIcon className="size-[22px]" /> : <EyeOffIcon className="size-[22px]" />}
          </Key>
          <Key label="list" active={view === 'list'} onClick={() => onViewChange('list')}>
            <ListIcon className="size-[22px]" />
          </Key>
          <Key label="gallery" active={view === 'gallery'} onClick={() => onViewChange('gallery')}>
            <GridIcon className="size-[22px]" />
          </Key>
          {view === 'gallery' && (
            <Key label={`${columns} posters per row, press for more`} active={false} onClick={onCycleColumns}>
              <span className="font-wide text-[20px] leading-none">{columns}</span>
            </Key>
          )}
        </div>
      </div>
      <span aria-hidden className="mt-[3px] ml-[34px] block h-[4px] w-[46%] bg-ink [background-image:repeating-linear-gradient(90deg,#fff_0_6px,transparent_6px_11px)] [background-size:44px_2px] [background-position:6px_1px] bg-no-repeat" />
    </div>
  );
}
