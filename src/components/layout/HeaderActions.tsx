import { PlusIcon } from '@/components/ui/icons';
import { IconButton } from '@/components/ui/IconButton';
import { SearchBar } from './SearchBar';

interface HeaderActionsProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchLabel: string;
  placeholder: string;
  /** The round "+" button. Left out on tabs where nothing is added by hand. */
  add?: { label: string; onClick: () => void };
}

/** The search field and the round "+" on one black plate cut on a slant, at the top right. */
export function HeaderActions({ query, onQueryChange, searchLabel, placeholder, add }: HeaderActionsProps) {
  return (
    <div className="relative flex w-full max-w-[460px] items-center justify-end gap-4 py-2 pr-2 pl-3">
      <span aria-hidden className="absolute inset-0 -right-3 hidden bg-ink [clip-path:polygon(0_52%,14px_6%,100%_0,97%_100%,12px_90%)] lg:block" />
      <div className="relative flex-1">
        <SearchBar value={query} onChange={onQueryChange} label={searchLabel} placeholder={placeholder} />
      </div>
      {add && (
        <IconButton label={add.label} onClick={add.onClick} className="relative">
          <PlusIcon className="size-[18px]" />
        </IconButton>
      )}
    </div>
  );
}
