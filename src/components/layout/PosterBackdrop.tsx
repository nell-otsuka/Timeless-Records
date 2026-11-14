import posterArt from '@/assets/poster-art.webp';

const PINK = '#ef3181';
const INK = '#0a0608';
const CREAM = '#f7ede5';

/**
 * The poster behind the page, drawn in the reference's own coordinates (1716 × 916) and pinned to the window, so it
 * stays put while the page scrolls: the dotted pink edges, the pink "V", the cut-out artwork, and the shards in the
 * bottom corners. The header band, the title, the cards and the buttons are real elements on top of it.
 */
export function PosterBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1716 916"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none fixed inset-0 z-0 hidden size-full lg:block"
    >
      <defs>
        <pattern id="poster-dots" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <circle cx="3.5" cy="3.5" r="2" fill="#f27bb0" />
        </pattern>
        <pattern id="poster-dots-fine" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <circle cx="2.5" cy="2.5" r="1.1" fill="#f59ac1" />
        </pattern>
        <pattern id="poster-dots-dark" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
          <circle cx="4" cy="4" r="2.4" fill="#c4206a" opacity="0.55" />
        </pattern>
        <clipPath id="poster-art-cut">
          <polygon points="872,0 1716,0 1716,560 1080,664 1080,330 872,322" />
        </clipPath>
      </defs>

      <rect width="1716" height="916" fill={CREAM} />

      {/* left edge: dotted pink, the star, and a pink chevron */}
      <polygon points="0,92 112,96 80,330 44,560 0,600" fill="#fde4ec" />
      <polygon points="0,92 112,96 80,330 44,560 0,600" fill="url(#poster-dots)" />
      <polygon points="0,384 92,578 0,664" fill={PINK} />
      <polygon points="0,452 58,570 0,622" fill={CREAM} />
      <polygon points="0,452 58,570 54,574 0,470" fill={INK} opacity="0.8" />

      {/* the cream shard under the header, dotted, and the pink sliver above it */}
      <polygon points="690,74 1002,8 1012,300 905,322" fill="#fbe6ee" />
      <polygon points="690,74 1002,8 1012,300 905,322" fill="url(#poster-dots-fine)" />
      <polygon points="808,54 1004,0 1010,10 822,62" fill={PINK} />

      {/* the pink V */}
      <polygon points="700,86 784,72 896,300 862,318" fill="#f0609f" />
      <polygon points="700,86 784,72 896,300 862,318" fill="url(#poster-dots-dark)" />
      <polygon points="902,268 958,238 878,330 862,318" fill="#f0609f" />

      {/* the artwork: a cut-out, so the cream shows between the strands; kept clear of the title and the panel's foot */}
      <g clipPath="url(#poster-art-cut)">
        <image href={posterArt} x="658" y="-115" width="1260" height="840" preserveAspectRatio="xMidYMid slice" />
      </g>

      {/* dotted fade above the bottom-right corner */}
      <polygon points="1392,640 1716,452 1716,650 1470,730" fill="url(#poster-dots)" />
      {/* bottom-right: pink, then a black blade */}
      <polygon points="1050,916 1716,612 1716,916" fill={PINK} />
      <polygon points="1050,916 1716,612 1716,916" fill="url(#poster-dots-dark)" />
      <polygon points="1218,916 1716,726 1716,752 1296,916" fill={INK} />

      {/* bottom-left: dots, a black sliver and a pink blade */}
      <polygon points="0,742 124,770 100,900 0,912" fill="url(#poster-dots)" />
      <polygon points="0,904 476,860 476,866 0,916" fill={INK} />
      <polygon points="330,916 872,848 872,872 560,916" fill={PINK} />
    </svg>
  );
}
