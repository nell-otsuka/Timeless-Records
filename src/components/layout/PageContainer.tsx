import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Shared horizontal gutters so the header and the content always line up. */
export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto w-full max-w-[1672px] px-5 sm:px-8 3xl:px-[117px]', className)}
      {...props}
    />
  );
}
