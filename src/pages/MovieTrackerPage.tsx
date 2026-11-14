import { CityPickerButton } from '@/components/cities/CityPickerButton';
import { CityPickerModal } from '@/components/cities/CityPickerModal';
import { DetailPanel } from '@/components/detail/DetailPanel';
import { EmptyPanel } from '@/components/detail/EmptyPanel';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { PageFrame } from '@/components/layout/PageFrame';
import type { HeroContent } from '@/components/layout/Hero';
import { AddMovieModal } from '@/components/movies/AddMovieModal';
import { EditMovieModal } from '@/components/movies/EditMovieModal';
import { EmptyState } from '@/components/movies/EmptyState';
import { MovieGrid } from '@/components/movies/MovieGrid';
import { SyncBar } from '@/components/movies/SyncBar';
import { TicketFormModal } from '@/components/tickets/TicketFormModal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PosterFrame } from '@/components/ui/PosterFrame';
import { useMovieTracker } from '@/hooks/useMovieTracker';

const HERO: HeroContent = { lines: ['watch', 'movies'] };

export function MovieTrackerPage() {
  const tracker = useMovieTracker();
  const { selected, booking } = tracker;

  return (
    <PageFrame
      hero={HERO}
      actions={
        <HeaderActions
          query={tracker.search.query}
          onQueryChange={tracker.search.onChange}
          searchLabel="search movies"
          placeholder="search movies..."
          add={{ label: 'add a movie', onClick: tracker.add.modal.open }}
        />
      }
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CityPickerButton label={tracker.cities.label} onClick={tracker.cities.modal.open} />
        <SyncBar sync={tracker.sync.label} onRefresh={tracker.sync.refresh} />
      </div>

      <main className="flex flex-col items-start gap-6 lg:flex-row lg:gap-9">
        {tracker.status === 'error' ? (
          <EmptyState title="we couldn't load your movies" hint="check your connection, then try again.">
            <Button onClick={tracker.reload}>try again</Button>
          </EmptyState>
        ) : (
          <MovieGrid movies={tracker.movies} selectedId={selected?.id ?? null} onSelect={tracker.select} />
        )}
        {selected ? (
          <DetailPanel
            movie={selected}
            groups={tracker.groups}
            onClose={tracker.clearSelection}
            onEdit={tracker.edit.modal.open}
            onRemove={tracker.remove.modal.open}
            onBook={booking.book}
            onPlan={booking.plan}
          />
        ) : (
          <EmptyPanel eyebrow="_now viewing" title="pick a movie" hint="choose a movie to see where it's playing, city by city." />
        )}
      </main>

      <AddMovieModal open={tracker.add.modal.isOpen} onClose={tracker.add.modal.close} onSubmit={tracker.add.submit} />
      <EditMovieModal open={tracker.edit.modal.isOpen} movie={selected} onSubmit={tracker.edit.submit} onClose={tracker.edit.modal.close} />
      <CityPickerModal
        open={tracker.cities.modal.isOpen}
        cities={tracker.cities.options}
        selectedIds={tracker.cities.selectedIds}
        onSave={tracker.cities.save}
        onClose={tracker.cities.modal.close}
      />
      <TicketFormModal
        open={booking.editor.modal.isOpen}
        editing={booking.editor.editing}
        initial={booking.editor.initial}
        {...booking.catalog}
        onSubmit={booking.editor.submit}
        onClose={booking.editor.modal.close}
      />
      <ConfirmDialog
        open={tracker.remove.modal.isOpen}
        title={{ lead: 'remove', accent: 'movie' }}
        message={`remove "${selected?.title ?? 'this movie'}" and its screenings from your list?`}
        confirmLabel="remove"
        aside={
          selected && <PosterFrame src={selected.coverUrl} title={selected.title} />
        }
        onConfirm={tracker.remove.confirm}
        onClose={tracker.remove.modal.close}
      />
    </PageFrame>
  );
}
