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
        'rounded-full border px-[7px] py-[3px] font-mono text-[9px] tracking-[0.12em] uppercase',
        emphasized ? 'border-pink bg-pink text-white' : 'border-pink-soft text-pink',
      )}
    >
      {label}
    </span>
  );
}
