import { RefreshIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import type { SyncLabel } from '@/types/view-models';

interface SyncBarProps {
  sync: SyncLabel;
  onRefresh: () => void;
}

/** Shows when screenings were last updated and lets the user refresh them manually. */
export function SyncBar({ sync, onRefresh }: SyncBarProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <p
        aria-live="polite"
        title={sync.issues.join('\n') || undefined}
        className="truncate font-mono text-[11px] tracking-[0.14em] text-muted"
      >
        {sync.text}
      </p>
      <IconButton label="refresh screenings" variant="outline" size="sm" disabled={sync.running} onClick={onRefresh}>
        <RefreshIcon className={cn('size-3.5', sync.running && 'animate-spin')} />
      </IconButton>
    </div>
  );
}
