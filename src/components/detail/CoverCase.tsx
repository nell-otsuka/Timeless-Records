import { CoverImage } from '@/components/movies/CoverImage';

interface CoverCaseProps {
  src?: string;
  title: string;
}

/** A tilted 3D cover with thin wireframe outlines; straightens a little on hover. */
export function CoverCase({ src, title }: CoverCaseProps) {
  return (
    <div className="group grid size-[290px] shrink-0 place-items-center [perspective:900px]">
      <div className="relative size-[236px] transition-transform duration-500 transform-3d [transform:rotateY(-22deg)_rotateX(4deg)_rotateZ(-1.5deg)] group-hover:[transform:rotateY(-10deg)_rotateX(2deg)]">
        <div className="absolute -inset-[10px_-14px_-10px_-6px] border border-wire [transform:translateZ(-26px)]" />
        <CoverImage src={src} title={title} className="absolute inset-0 size-full shadow-[0_18px_30px_rgb(120_40_80/0.18)]" />
        <div className="absolute -inset-1 border border-wire/70 [transform:translateZ(18px)]" />
      </div>
    </div>
  );
}
