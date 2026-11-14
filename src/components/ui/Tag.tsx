import { cn } from '@/lib/cn';

interface TagProps {
  label: string;
  /** Filled style, used for special formats like IMAX or 4DX. */
  emphasized?: boolean;
}

export function Tag({ label, emphasized = false }: TagProps) {
  return (
    <span
      className={cn(
        'border-2 px-[6px] py-[1px] text-[11px] font-bold uppercase',
        emphasized ? 'border-ink bg-ink text-white' : 'border-ink text-ink',
      )}
    >
      {label}
    </span>
  );
}
