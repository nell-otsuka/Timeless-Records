import type { Fact } from '@/types/view-models';

interface MovieFactsProps {
  facts: Fact[];
}

export function MovieFacts({ facts }: MovieFactsProps) {
  return (
    <dl className="space-y-3.5 font-mono text-xs leading-[1.55] font-light tracking-[0.16em] text-muted lowercase">
      {facts.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className="text-mauve">{value}.</dd>
        </div>
      ))}
    </dl>
  );
}
