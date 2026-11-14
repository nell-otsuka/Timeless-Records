import type { ReactNode } from 'react';
import logo from '@/assets/logo.png';
import { APP_NAME } from '@/config/app';
import type { AppTab } from '@/hooks/useAppTabs';
import { PageContainer } from './PageContainer';
import { TabNav } from './TabNav';

interface HeaderProps {
  tabs: AppTab[];
  /** Page-specific actions (search, add button…), shown on the right. */
  children?: ReactNode;
}

export function Header({ tabs, children }: HeaderProps) {
  return (
    <header className="relative z-10 min-h-[101px] py-3">
      {/* soft divider that fades in after the brand and hands over to the artwork */}
      <div className="absolute top-[100px] left-[26%] hidden h-0.5 bg-gradient-to-r from-pink-deep/0 via-pink-deep/10 to-pink-deep/15 right-[min(944px,56vw)] lg:block" />
      <PageContainer className="flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6">
        <img src={logo} alt="" className="h-[76px] w-[82px] shrink-0 -ml-1.5 object-contain" />
        <span className="hidden text-lg font-semibold tracking-brand whitespace-nowrap xl:block">{APP_NAME}</span>
        <TabNav tabs={tabs} />
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">{children}</div>
      </PageContainer>
    </header>
  );
}
