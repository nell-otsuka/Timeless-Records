import type { ReactNode } from 'react';
import { useAppTabs } from '@/hooks/useAppTabs';
import { Header } from './Header';
import { Hero, type HeroContent } from './Hero';
import { HeroArt } from './HeroArt';
import { PageContainer } from './PageContainer';

interface PageFrameProps {
  hero: HeroContent;
  /** Search, add button… shown on the right of the header. */
  actions: ReactNode;
  children: ReactNode;
}

/** What every tab shares: the artwork, the header with the tabs, the big title, and the content gutters. */
export function PageFrame({ hero, actions, children }: PageFrameProps) {
  const tabs = useAppTabs();

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <HeroArt />
      <Header tabs={tabs}>{actions}</Header>
      <Hero {...hero} />
      <PageContainer className="pb-20">{children}</PageContainer>
    </div>
  );
}
