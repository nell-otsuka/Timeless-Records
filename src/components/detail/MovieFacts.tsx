import type { Fact } from '@/types/view-models';

interface MovieFactsProps {
  facts: Fact[];
}

/** Each fact as in the poster: the label in pink bold italics, the value under it in black, lowercase, ending in a full stop. */
export function MovieFacts({ facts }: MovieFactsProps) {
  return (
    <dl className="max-w-[200px] min-w-0 space-y-[6px] text-[18px] leading-[1.15]">
      {facts.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-[17px] font-bold text-pink-deep italic">{label}</dt>
          <dd className="text-ink lowercase">{value}.</dd>
        </div>
      ))}
    </dl>
  );
}
