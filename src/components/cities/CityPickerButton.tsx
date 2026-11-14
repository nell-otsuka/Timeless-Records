import { PinIcon } from '@/components/ui/icons';

interface CityPickerButtonProps {
  label: string;
  onClick: () => void;
}

/** Toolbar button showing the current city selection; opens the picker. */
export function CityPickerButton({ label, onClick }: CityPickerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`cities: ${label}. change`}
      className="flex items-center gap-2 rounded-full border border-pink-line bg-card px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-pink-deep transition-colors hover:border-pink-soft"
    >
      <PinIcon className="size-3.5 text-pink" />
      {label}
    </button>
  );
}
