import { EmptyPanel } from '@/components/detail/EmptyPanel';
import { HeaderActions } from '@/components/layout/HeaderActions';
import { PageFrame } from '@/components/layout/PageFrame';
import type { HeroContent } from '@/components/layout/Hero';
import { EmptyState } from '@/components/movies/EmptyState';
import { NextUpTicket } from '@/components/tickets/NextUpTicket';
import { PastTickets } from '@/components/tickets/PastTickets';
import { TicketAgenda } from '@/components/tickets/TicketAgenda';
import { TicketFileModal } from '@/components/tickets/TicketFileModal';
import { TicketFormModal } from '@/components/tickets/TicketFormModal';
import { TicketGallery } from '@/components/tickets/TicketGallery';
import { ViewDock } from '@/components/tickets/ViewDock';
import { TicketPanel } from '@/components/tickets/TicketPanel';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PosterFrame } from '@/components/ui/PosterFrame';
import { useTicketsPage } from '@/hooks/useTicketsPage';

const HERO: HeroContent = { lines: ['my', 'tickets'] };

export function TicketsPage() {
  const page = useTicketsPage();
  const { selected, panel, nextUp, editor } = page;
  const selectedId = selected?.id ?? null;
  const hasUpcoming = Boolean(nextUp) || page.groups.length > 0;

  return (
    <PageFrame
      hero={HERO}
      actions={
        <HeaderActions
          query={page.search.query}
          onQueryChange={page.search.onChange}
          searchLabel="search tickets"
          placeholder="search tickets..."
          add={{ label: 'add a ticket', onClick: () => editor.openNew() }}
        />
      }
    >
      {page.status === 'error' ? (
        <EmptyState title="we couldn't load your tickets" hint="check your connection, then try again.">
          <Button onClick={page.reload}>try again</Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-9">
          <div className="w-full min-w-0 flex-1">
            {page.view.value === 'gallery' ? (
              page.tiles.length > 0 ? (
                <TicketGallery tiles={page.tiles} selectedId={selectedId} onSelect={page.select} columns={page.columns.value} />
              ) : (
                <EmptyState title={page.searching ? 'no ticket matches' : 'no tickets yet'} hint="add a booking with the + button, or from a screening in the finder." />
              )
            ) : (
              <>
            {nextUp && <NextUpTicket next={nextUp} selected={nextUp.row.id === selectedId} onSelect={page.select} onShowFile={page.showFileFor} />}

            {page.groups.length > 0 && <TicketAgenda groups={page.groups} selectedId={selectedId} onSelect={page.select} />}

            {!hasUpcoming && (
              <EmptyState
                title={page.searching ? 'no ticket matches' : page.hasTickets ? 'nothing coming up' : 'no tickets yet'}
                hint={page.searching ? 'try another title or cinema.' : 'add a booking with the + button, or from a screening in the finder.'}
              >
                {!page.searching && <Button onClick={() => editor.openNew()}>add a ticket</Button>}
              </EmptyState>
            )}

            <PastTickets groups={page.pastGroups} selectedId={selectedId} onSelect={page.select} />
              </>
            )}
          </div>

          {selected && panel ? (
            <TicketPanel
              ticket={selected}
              facts={panel.facts}
              conflicts={panel.conflicts}
              countdown={panel.countdown}
              onClose={page.clearSelection}
              onEdit={() => editor.openEdit(selected)}
              onRemove={page.remove.modal.open}
              onShowFile={page.fileModal.open}
            />
          ) : (
            <EmptyPanel eyebrow="_your ticket" title="pick a ticket" hint="choose a ticket to see its seats, details and qr code." />
          )}
        </div>
      )}

      <ViewDock
        view={page.view.value}
        onViewChange={page.view.set}
        tentativeShown={page.tentative.shown}
        onToggleTentative={page.tentative.toggle}
        columns={page.columns.value}
        onCycleColumns={page.columns.cycle}
      />

      <TicketFormModal
        open={editor.modal.isOpen}
        editing={editor.editing}
        initial={editor.initial}
        {...page.catalog}
        onSubmit={editor.submit}
        onClose={editor.modal.close}
      />
      <TicketFileModal open={page.fileModal.isOpen} ticket={selected} onClose={page.fileModal.close} />
      <ConfirmDialog
        open={page.remove.modal.isOpen}
        title={{ lead: 'delete', accent: 'ticket' }}
        message={`delete your ticket for "${selected?.title ?? 'this movie'}"? the file you attached is deleted too.`}
        confirmLabel="delete"
        aside={
          selected && <PosterFrame src={selected.coverUrl} title={selected.title} />
        }
        onConfirm={page.remove.confirm}
        onClose={page.remove.modal.close}
      />
    </PageFrame>
  );
}
