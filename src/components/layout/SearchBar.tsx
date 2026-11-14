import { SearchIcon } from '@/components/ui/icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the field. */
  label: string;
  placeholder: string;
}

/** A white field with pointed ends and a black edge, the poster's search key. */
export function SearchBar({ value, onChange, label, placeholder }: SearchBarProps) {
  return (
    <div className="hex w-full max-w-[330px] bg-ink p-[3px] [--point:16px]">
      <label className="hex flex h-[42px] items-center bg-[#f7f2ee] pr-6 pl-7 [--point:14px]">
        <span className="sr-only">{label}</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold text-ink italic outline-none placeholder:text-[#4a4446]"
        />
        <SearchIcon className="size-[26px] shrink-0 text-ink" />
      </label>
    </div>
  );
}
