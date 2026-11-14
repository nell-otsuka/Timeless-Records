import { SearchIcon } from '@/components/ui/icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the field. */
  label: string;
  placeholder: string;
}

export function SearchBar({ value, onChange, label, placeholder }: SearchBarProps) {
  return (
    <label className="flex h-[45px] w-full max-w-[385px] items-center rounded-full bg-[#fdf7f2] pr-4 pl-6 shadow-[0_2px_8px_rgb(226_67_127/0.1)] ring-1 ring-pink-line/70 focus-within:ring-pink-soft">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] font-medium tracking-[0.24em] text-pink outline-none placeholder:text-[#e9779f]"
      />
      <SearchIcon className="size-7 shrink-0 text-pink" />
    </label>
  );
}
