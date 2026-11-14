import type { ReactNode } from 'react';
import { useAppTabs } from '@/hooks/useAppTabs';
import { Header } from './Header';
import { Hero, type HeroContent } from './Hero';
import { PageContainer } from './PageContainer';
import { PosterBackdrop } from './PosterBackdrop';

interface PageFrameProps {
  hero: HeroContent;
  /** Search, add button… shown on the right of the header. */
  actions: ReactNode;
  children: ReactNode;
}

/** What every tab shares: the poster behind, the header with the tabs, the big title, and the gutters. */
export function PageFrame({ hero, actions, children }: PageFrameProps) {
  const tabs = useAppTabs();

  return (
    // --panel-top: where the side panel starts under the title; it sticks there, so it never moves on scroll
    <div className="relative min-h-screen overflow-x-clip [--panel-top:308px]">
      <PosterBackdrop />
      <Header tabs={tabs}>{actions}</Header>
      <Hero {...hero} />
      <PageContainer className="relative z-10 pb-28">{children}</PageContainer>
    </div>
  );
}
