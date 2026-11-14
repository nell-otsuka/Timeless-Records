import { HeaderActions } from '@/components/layout/HeaderActions';
import type { HeroContent } from '@/components/layout/Hero';
import { PageFrame } from '@/components/layout/PageFrame';
import { EmptyState } from '@/components/movies/EmptyState';
import { PlannerAgenda } from '@/components/planner/PlannerAgenda';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PosterFrame } from '@/components/ui/PosterFrame';
import { cn } from '@/lib/cn';
import { usePlannerPage } from '@/hooks/usePlannerPage';

const HERO: HeroContent = { lines: ['your', 'planner'] };

export function PlannerPage() {
  const page = usePlannerPage();
  const { summary, hideClashes } = page;

  return (
    <PageFrame
      hero={HERO}
      actions={<HeaderActions query={page.search.query} onQueryChange={page.search.onChange} searchLabel="search the planner" placeholder="search screenings..." />}
    >
      {page.status === 'error' ? (
        <EmptyState title="we couldn't load your planner" hint="check your connection, then try again.">
          <Button onClick={page.reload}>try again</Button>
        </EmptyState>
      ) : (
        <div className="max-w-[900px]">
          <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[16px] font-semibold text-muted italic">
              {summary.booked} booked · {summary.tentative} tentative · {summary.free} to choose from
            </p>
            <button
              type="button"
              aria-pressed={hideClashes.value}
              onClick={hideClashes.toggle}
              className={cn(
                'hex px-6 py-2 text-[15px] font-bold italic transition-colors [--point:12px]',
                hideClashes.value ? 'bg-pink text-white' : 'bg-ink text-white hover:bg-pink-deep',
              )}
            >
              hide clashes
            </button>
          </div>

          {page.error && (
            <p role="alert" className="mb-6 text-[13px] font-semibold text-pink-deep italic">
              {page.error}
            </p>
          )}

          {page.days.length > 0 ? (
            <PlannerAgenda days={page.days} busy={page.busy} onPlan={page.plan} onUnplan={page.unplan} onBook={page.book} onDelete={page.remove.ask} />
          ) : (
            <EmptyState
              title={page.hasEntries ? 'nothing matches' : 'nothing to plan yet'}
              hint={page.hasEntries ? 'try another title, or show the clashes again.' : 'add movies in the finder: their screenings show up here, next to your tickets.'}
            />
          )}
        </div>
      )}
      <ConfirmDialog
        open={page.remove.modal.isOpen}
        title={{ lead: 'delete', accent: 'ticket' }}
        message={`delete your ticket for "${page.remove.target?.title ?? 'this movie'}"? the file you attached is deleted too.`}
        confirmLabel="delete"
        aside={page.remove.target && <PosterFrame src={page.remove.target.coverUrl} title={page.remove.target.title} />}
        onConfirm={page.remove.confirm}
        onClose={page.remove.modal.close}
      />
    </PageFrame>
  );
}
