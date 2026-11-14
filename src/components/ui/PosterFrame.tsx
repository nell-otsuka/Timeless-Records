import type { ReactNode } from 'react';
import { CoverImage } from '@/components/movies/CoverImage';

interface PosterFrameProps {
  src?: string;
  title: string;
  /** Laid over the poster, e.g. an "uploading" veil. */
  children?: ReactNode;
}

/** A poster on the pink side of a dialog: the cover, or a white sheet with a pink question mark when there is none. */
export function PosterFrame({ src, title, children }: PosterFrameProps) {
  return (
    <div className="relative h-[190px] w-[142px] shrink-0 overflow-hidden bg-white shadow-[0_14px_26px_rgb(120_40_80/0.28)] ring-1 ring-cream/70">
      {src ? (
        <CoverImage src={src} title={title || 'poster'} className="size-full" initialsClassName="text-3xl" />
      ) : (
        <span aria-hidden className="font-wide grid size-full place-items-center text-[110px] leading-none text-pink">
          ?
        </span>
      )}
      {children}
    </div>
  );
}
