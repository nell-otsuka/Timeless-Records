import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** A form field set like the rest of the type: a tiny tracked label over a hairline, no box. */
export function Field({ label, error, hint, className, ...props }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-[10px] font-semibold tracking-[0.3em] text-pink-soft">
        {label}
        {props.required && <span className="text-pink"> *</span>}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          'h-9 border-b bg-transparent px-0 text-[14px] font-semibold tracking-[0.08em] text-pink-deep outline-none',
          'transition-[border-color,box-shadow] duration-200 disabled:opacity-60',
          'placeholder:font-medium placeholder:text-pink-soft/60',
          // the focus line thickens inside the box-shadow, so nothing shifts
          'focus:border-pink focus:shadow-[0_1px_0_0_var(--color-pink)]',
          error ? 'border-pink-deep' : 'border-pink-line',
        )}
        {...props}
      />
      {error ? (
        <p id={messageId} role="alert" className="text-[10px] font-semibold tracking-[0.14em] text-pink-deep">
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="text-[10px] tracking-[0.14em] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
