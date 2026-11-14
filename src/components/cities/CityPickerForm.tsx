import { EmptyState } from '@/components/movies/EmptyState';
import { Button } from '@/components/ui/Button';
import { CheckRow } from '@/components/ui/CheckRow';
import { Field } from '@/components/ui/Field';
import { FormActions } from '@/components/ui/FormActions';
import { useCityPicker } from '@/hooks/useCityPicker';
import type { City } from '@/types/movie';

interface CityPickerFormProps {
  cities: City[];
  selectedIds: number[];
  onSave: (cityIds: number[]) => Promise<void>;
  onCancel: () => void;
}

export function CityPickerForm({ cities, selectedIds, onSave, onCancel }: CityPickerFormProps) {
  const picker = useCityPicker(cities, selectedIds, onSave);

  return (
    <form onSubmit={picker.save} className="space-y-4">
      <Field
        label="search"
        type="search"
        placeholder="e.g. rouen"
        value={picker.query}
        onChange={(event) => picker.setQuery(event.target.value)}
        disabled={picker.saving}
        autoFocus
      />

      {cities.length === 0 ? (
        <EmptyState title="no cities yet" hint="they appear after the first sync of a movie." />
      ) : picker.visible.length === 0 ? (
        <EmptyState title="no city matches" />
      ) : (
        <ul className="scrollbar-pink max-h-[220px] overflow-auto pr-2">
          {picker.visible.map((city) => (
            <li key={city.id}>
              <CheckRow
                label={city.name}
                checked={picker.ids.includes(city.id)}
                onChange={() => picker.toggle(city.id)}
                disabled={picker.saving}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="text-[14px] leading-relaxed text-muted italic">
        {picker.ids.length === 0
          ? 'none selected: every city is scraped (up to 30 per movie).'
          : `${picker.ids.length} selected. applies to all your movies.`}{' '}
        saving refreshes the screenings.
      </p>

      {picker.error && (
        <p role="alert" className="text-[13px] font-semibold text-pink-deep italic">
          {picker.error}
        </p>
      )}

      <FormActions
        leading={
          <Button variant="ghost" onClick={picker.clear} disabled={picker.saving || picker.ids.length === 0}>
            clear
          </Button>
        }
      >
        <Button variant="ghost" onClick={onCancel} disabled={picker.saving}>
          cancel
        </Button>
        <Button type="submit" disabled={picker.saving} className="disabled:opacity-60">
          {picker.saving ? 'saving…' : 'save'}
        </Button>
      </FormActions>
    </form>
  );
}
