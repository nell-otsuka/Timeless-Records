import { CoverImage } from '@/components/movies/CoverImage';

interface CoverCaseProps {
  src?: string;
  title: string;
}

/** A poster pasted on the panel: a black border, a touch off straight. */
export function CoverCase({ src, title }: CoverCaseProps) {
  return (
    <div className="w-[196px] shrink-0 rotate-[1.2deg] border-[3px] border-ink bg-ink">
      <CoverImage src={src} title={title} className="aspect-[9/10] w-full" initialsClassName="text-5xl" />
    </div>
  );
}
