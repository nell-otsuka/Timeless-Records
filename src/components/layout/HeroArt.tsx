import heroArt from '@/assets/hero.png';

/** Decorative artwork pinned to the top-right corner (hidden on small screens). */
export function HeroArt() {
  return (
    <div className="pointer-events-none absolute top-0 right-0 hidden h-[394px] w-[56vw] max-w-[944px] overflow-hidden lg:block">
      <img src={heroArt} alt="" className="size-full object-cover object-left" />
    </div>
  );
}
