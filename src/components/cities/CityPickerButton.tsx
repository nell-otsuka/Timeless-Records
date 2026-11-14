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
      className="hex flex items-center gap-2 bg-ink py-2 pr-6 pl-5 text-[16px] font-bold text-white italic transition-colors [--point:12px] hover:bg-pink-deep"
    >
      <PinIcon className="size-4 text-pink-soft" />
      {label}
    </button>
  );
}
