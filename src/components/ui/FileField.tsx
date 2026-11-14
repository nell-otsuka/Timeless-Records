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
      <label htmlFor={id} className="text-[10px] font-semibold tracking-[0.3em] text-pink-soft">
        {label}
      </label>
      <label
        className={cn(
          'group flex cursor-pointer items-center gap-4 border-b border-dashed pt-1 pb-2.5 transition-colors',
          'has-[:focus-visible]:border-pink hover:border-pink',
          error ? 'border-pink-deep' : 'border-pink-line',
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
        <span className="rounded-full px-3.5 py-1 text-[10px] font-bold tracking-[0.2em] text-pink ring-1 ring-pink transition-colors group-hover:bg-pink group-hover:text-white">
          choose file
        </span>
        <span className="truncate text-[12px] tracking-[0.1em] text-pink-soft">{file ? file.name : 'no file chosen'}</span>
      </label>
      {error ? (
        <p id={messageId} role="alert" className="text-[10px] font-semibold tracking-[0.14em] text-pink-deep">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-[10px] leading-relaxed tracking-[0.14em] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
