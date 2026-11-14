import { cn } from '@/lib/cn';

interface TicketStubProps {
  /** On a pink (selected) card the line turns cream. */
  onPink?: boolean;
}

/** The perforation between a ticket's art and its details: a thin dashed line, straight like the rest of the poster style. */
export function TicketStub({ onPink = false }: TicketStubProps) {
  return <span aria-hidden className={cn('w-0 shrink-0 self-stretch border-l border-dashed', onPink ? 'border-cream/60' : 'border-pink-line')} />;
}
