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

/** One key of the dock: lit cream while it is on. */
function Key({ label, active, onClick, children }: KeyProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn('cut-tl-br grid size-10 place-items-center transition-colors [--cut:8px]', active ? 'bg-cream text-pink' : 'text-cream hover:bg-cream/20')}
    >
      {children}
    </button>
  );
}

/**
 * The tickets page's controls, one game-HUD plate fixed to the bottom-right corner: show or hide the tentative tickets,
 * then list or gallery. Set like the dialogs: pink, slanted corners, a hatched strip along the bottom, cream keys.
 */
export function ViewDock({ view, onViewChange, tentativeShown, onToggleTentative, columns, onCycleColumns }: ViewDockProps) {
  return (
    <div role="toolbar" aria-label="view options" className="cut-tl-br fixed right-5 bottom-5 z-40 bg-pink text-cream [--cut:16px] sm:right-8 sm:bottom-8">
      <span aria-hidden className="stripes absolute inset-x-0 bottom-0 h-2 text-cream/45" />
      <div className="relative flex items-center gap-1.5 px-3 pt-2 pb-3.5">
        <Key label={tentativeShown ? 'hide tentative tickets' : 'show tentative tickets'} active={tentativeShown} onClick={onToggleTentative}>
          {tentativeShown ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />}
        </Key>
        <span aria-hidden className="mx-1 h-6 w-px bg-cream/40" />
        <Key label="list" active={view === 'list'} onClick={() => onViewChange('list')}>
          <ListIcon className="size-5" />
        </Key>
        <Key label="gallery" active={view === 'gallery'} onClick={() => onViewChange('gallery')}>
          <GridIcon className="size-5" />
        </Key>
        {view === 'gallery' && (
          <>
            <span aria-hidden className="mx-1 h-6 w-px bg-cream/40" />
            <Key label={`${columns} posters per row, press for more`} active={false} onClick={onCycleColumns}>
              <span className="font-wide text-[18px] leading-none">{columns}</span>
            </Key>
          </>
        )}
      </div>
    </div>
  );
}
