import { PageContainer } from './PageContainer';

export interface HeroContent {
  /** The two words of the title, stacked: the first white, the second pink. */
  lines: [string, string];
}

/** A torn paper plate behind a word: black pieces and white sheets glued on top of each other, a little off. */
interface Plate {
  /** How far the plate reaches past the letters. */
  insetClassName: string;
  /** The pieces from the bottom up, each a clip-path shape; the white ones peek out as thin paper edges. */
  layers: { tone: 'ink' | 'paper'; shape: string }[];
}

const FIRST_PLATE: Plate = {
  insetClassName: '-top-[10px] -right-[26px] -bottom-[12px] -left-[22px] -rotate-[1.5deg]',
  layers: [
    { tone: 'paper', shape: 'polygon(8px 26%, 62% 16%, 64% 8px, calc(100% - 2px) 8px, calc(100% - 7px) 100%, 0 100%)' },
    { tone: 'ink', shape: 'polygon(0 20%, 61% 10%, 62% 3px, calc(100% - 6px) 3px, calc(100% - 13px) calc(100% - 5px), 3px calc(100% - 7px))' },
  ],
};

const SECOND_PLATE: Plate = {
  insetClassName: '-top-[12px] -right-[18px] -bottom-[10px] -left-[22px]',
  layers: [
    { tone: 'ink', shape: 'polygon(36% 14%, 40% 6%, 100% 0, calc(100% - 4px) 30%, 40% 34%)' },
    { tone: 'paper', shape: 'polygon(6px 40%, 38% 33%, 40% 26%, calc(100% - 4px) 18%, calc(100% - 11px) 100%, 0 100%)' },
    { tone: 'ink', shape: 'polygon(0 34%, 38% 27%, 39% 20%, calc(100% - 10px) 11%, calc(100% - 18px) calc(100% - 8px), 2% calc(100% - 4px))' },
    { tone: 'ink', shape: 'polygon(54% calc(100% - 12px), 93% calc(100% - 22px), 92% calc(100% - 4px), 56% 100%)' },
  ],
};

interface WordProps {
  text: string;
  /** Colour of the letters, and where the word sits against the other. */
  className: string;
  plate: Plate;
}

/**
 * One word of the title cut out of a magazine: heavy italic letters on a torn black plate glued over white paper. The letters sit above every plate, so the tail of the first word's "y" crosses the second word's plate.
 */
function Word({ text, className, plate }: WordProps) {
  return (
    <span className="relative block w-fit">
      <span aria-hidden className={`absolute block [filter:drop-shadow(0_3px_2px_rgb(10_6_8/0.35))] ${plate.insetClassName}`}>
        {plate.layers.map(({ tone, shape }) => (
          <span key={shape} className={`absolute inset-0 ${tone === 'ink' ? 'bg-ink' : 'bg-white'}`} style={{ clipPath: shape }} />
        ))}
      </span>
      <span className={`font-poster relative z-10 block pr-[0.06em] text-[104px] leading-[0.82] font-black tracking-[-0.04em] [font-stretch:114%] italic ${className}`}>{text}</span>
    </span>
  );
}

/**
 * The page title as cut-out lettering: the first word white, the second pink, each on its own torn black plate, the
 * first plate tipped further than the second, the block tipped up to the right.
 */
export function Hero({ lines: [first, second] }: HeroContent) {
  return (
    <section className="relative z-10 pt-8 pb-6 lg:h-[208px] lg:p-0">
      <PageContainer className="relative h-full">
        <h1 className="origin-bottom-left -rotate-[8.5deg] lg:absolute lg:top-[44px] lg:left-[calc(6.1%+82px)]">
          <Word text={first} className="-rotate-[1.5deg] text-white" plate={FIRST_PLATE} />
          <Word text={second} className="-mt-[2px] ml-[18px] text-pink" plate={SECOND_PLATE} />
        </h1>
      </PageContainer>
    </section>
  );
}
