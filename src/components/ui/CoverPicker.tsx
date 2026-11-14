import { useId } from 'react';
import { COVER_TYPES } from '@/lib/covers';
import { useCoverPicker } from '@/hooks/useCoverPicker';
import { PosterFrame } from './PosterFrame';

interface CoverPickerProps {
  /** The poster to show: the chosen one, or what the form falls back to. */
  src?: string;
  title: string;
  /** Called with the URL of the freshly uploaded poster. */
  onChange: (url: string) => void;
  /** Removes the poster. Shown only when there is a chosen one to remove. */
  onClear?: () => void;
  disabled?: boolean;
}

const PILL =
  'rounded-full px-3.5 py-1.5 text-[10px] font-bold tracking-[0.2em] text-cream ring-1 ring-cream/80 transition-colors hover:bg-cream hover:text-pink';

/** A poster with a way to change it: used on the pink side of the dialogs. */
export function CoverPicker({ src, title, onChange, onClear, disabled }: CoverPickerProps) {
  const id = useId();
  const picker = useCoverPicker(onChange);

  return (
    <div className="flex flex-col gap-3">
      <PosterFrame src={src} title={title}>
        {picker.uploading && (
          <span role="status" className="absolute inset-0 grid place-items-center bg-pink/70 text-[10px] font-bold tracking-[0.22em] text-cream">
            uploading…
          </span>
        )}
      </PosterFrame>

      <div className="flex items-center gap-2">
        <label htmlFor={id} className={`${PILL} cursor-pointer has-[:focus-visible]:ring-2 ${disabled || picker.uploading ? 'pointer-events-none opacity-60' : ''}`}>
          {src ? 'change cover' : 'add a cover'}
          <input
            id={id}
            type="file"
            accept={COVER_TYPES.join(',')}
            className="sr-only"
            disabled={disabled || picker.uploading}
            onChange={(event) => {
              void picker.choose(event.target.files?.[0] ?? null);
              event.target.value = ''; // choosing the same file again must still fire
            }}
          />
        </label>
        {onClear && (
          <button type="button" onClick={onClear} disabled={disabled} className={`${PILL} disabled:opacity-60`}>
            remove
          </button>
        )}
      </div>

      {picker.error && (
        <p role="alert" className="max-w-[230px] text-[10px] font-semibold tracking-[0.14em] text-cream">
          {picker.error}
        </p>
      )}
    </div>
  );
}
