import { PageContainer } from './PageContainer';

export interface HeroContent {
  /** The two big words: the first filled, the second outlined. */
  lines: [string, string];
}

export function Hero({ lines: [first, second] }: HeroContent) {
  return (
    <section className="relative z-10 py-10 lg:flex lg:min-h-[325px] lg:items-center">
      {/* the artwork is 394px tall from the top of the page, 101px of it behind the header: the title must clear it, plus a little air below */}
      <PageContainer className="w-full">
        <h1 className="font-wide text-[64px] leading-[0.8] tracking-[-0.025em] sm:text-[80px] lg:text-[96px]">
          <span className="block">{first}</span>
          <span className="text-outline mt-1 block">{second}</span>
        </h1>
      </PageContainer>
    </section>
  );
}
