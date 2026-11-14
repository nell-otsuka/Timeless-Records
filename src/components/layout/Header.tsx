import type { ReactNode } from 'react';
import logo from '@/assets/logo.png';
import { APP_NAME } from '@/config/app';
import type { AppTab } from '@/hooks/useAppTabs';
import { TabNav } from './TabNav';

interface HeaderProps {
  tabs: AppTab[];
  /** Page-specific actions (search, add button…), shown on the right. */
  children?: ReactNode;
}

/**
 * A black band cut on a slant holds the brand and the tabs, tipped up like the title: the band grows with what it
 * holds, so the slant always starts past the last tab. A pink corner and a pink rule sit under it. On small screens
 * the band becomes a plain black bar.
 */
export function Header({ tabs, children }: HeaderProps) {
  return (
    <header className="relative z-20 bg-ink lg:h-[100px] lg:bg-transparent">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 sm:px-8 lg:h-full lg:flex-nowrap lg:p-0">
        <div className="relative flex items-center lg:h-[104px] lg:bg-ink lg:pr-[150px] lg:pl-[6.1%] lg:[clip-path:polygon(0_0,100%_0,calc(100%-110px)_74%,10%_96%,0_100%)]">
          <div className="flex items-center gap-x-6 lg:-mt-3 lg:-rotate-[2.5deg]">
            <div className="flex items-center gap-4">
              <img src={logo} alt="" className="h-[50px] w-[66px] shrink-0 object-contain" />
              <span className="hidden text-[25px] leading-none font-extrabold tracking-[-0.02em] whitespace-nowrap text-white italic xl:block">{APP_NAME}</span>
            </div>
            <TabNav tabs={tabs} />
          </div>
        </div>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end lg:-mt-6 lg:pr-[2.3%]">{children}</div>
      </div>

      <div aria-hidden className="absolute top-0 left-0 hidden h-[64px] w-[44px] bg-pink [clip-path:polygon(0_0,100%_0,0_100%)] lg:block" />
      <div aria-hidden className="absolute top-[99px] left-[58px] hidden h-[4px] w-[min(760px,44%)] origin-left -rotate-[1.5deg] bg-pink lg:block" />
    </header>
  );
}
