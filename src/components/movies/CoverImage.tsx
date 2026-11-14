import { useState } from 'react';
import { cn } from '@/lib/cn';
import { getInitials } from '@/lib/movies';

interface CoverImageProps {
  src?: string;
  title: string;
  className?: string;
  /** Size of the initials shown when there is no cover. */
  initialsClassName?: string;
}

/** Movie cover that falls back to a tinted initials tile when missing or broken. */
export function CoverImage({ src, title, className, initialsClassName = 'text-5xl' }: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string>();

  if (!src || failedSrc === src) {
    return (
      <div
        className={cn(
          'grid place-items-center bg-gradient-to-br from-pink-line via-pink-soft to-pink font-wide text-white/90',
          initialsClassName,
          className,
        )}
        role="img"
        aria-label={`${title} (no cover)`}
      >
        {getInitials(title)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={cn('object-cover object-top', className)}
    />
  );
}
