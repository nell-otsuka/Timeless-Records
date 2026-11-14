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

/** The search box and, where something can be added, the round "+" button shown on the right of the header. */
export function HeaderActions({ query, onQueryChange, searchLabel, placeholder, add }: HeaderActionsProps) {
  return (
    <>
      <SearchBar value={query} onChange={onQueryChange} label={searchLabel} placeholder={placeholder} />
      {add && (
        <IconButton label={add.label} onClick={add.onClick} className="shadow-[0_2px_8px_rgb(226_67_127/0.25)]">
          <PlusIcon className="size-4" />
        </IconButton>
      )}
    </>
  );
}
