import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FileFieldProps {
  label: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function FileField({ label, accept, file, onChange, error, hint, disabled, className }: FileFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-pink-deep italic">
        {label}
      </label>
      <label
        className={cn(
          'group flex cursor-pointer items-center gap-4 border-b-2 border-dashed pt-1 pb-2.5 transition-colors',
          'has-[:focus-visible]:border-pink hover:border-pink',
          error ? 'border-pink-deep' : 'border-ink/25',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-describedby={error || hint ? messageId : undefined}
          className="sr-only"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <span className="hex bg-ink px-4 py-1.5 text-[13px] font-bold whitespace-nowrap text-white italic transition-colors [--point:9px] group-hover:bg-pink">
          choose file
        </span>
        <span className="truncate text-[14px] text-muted italic">{file ? file.name : 'no file chosen'}</span>
      </label>
      {error ? (
        <p id={messageId} role="alert" className="text-[13px] font-semibold text-pink-deep italic">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-[13px] leading-relaxed text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
