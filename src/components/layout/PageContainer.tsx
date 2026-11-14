import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Shared gutters so the header and the content always line up. On wide screens the content starts where the poster's
 * does (6% in) and runs almost to the right edge, where the panel sits.
 */
export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1716px] px-5 sm:px-8 lg:pr-[2.3%] lg:pl-[6.1%]', className)} {...props} />;
}
