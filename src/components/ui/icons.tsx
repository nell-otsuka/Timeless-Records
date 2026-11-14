import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', 'aria-hidden': true };

export const SearchIcon = (props: IconProps) => (
  <svg viewBox="0 0 28 28" strokeWidth={2.4} {...base} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <line x1="18.5" y1="18.5" x2="25" y2="25" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg viewBox="0 0 12 12" strokeWidth={1.8} {...base} {...props}>
    <path d="M6 1v10M1 6h10" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg viewBox="0 0 10 10" strokeWidth={1.6} {...base} {...props}>
    <path d="M1 1l8 8M9 1l-8 8" />
  </svg>
);

export const ArrowIcon = (props: IconProps) => (
  <svg viewBox="0 0 9 9" strokeWidth={1.8} strokeLinejoin="round" {...base} {...props}>
    <path d="M3 1l3.5 3.5L3 8" />
  </svg>
);

export const PencilIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.5} strokeLinejoin="round" {...base} {...props}>
    <path d="M2.5 13.5l.7-3.1L11 2.6a1.3 1.3 0 011.8 0l.6.6a1.3 1.3 0 010 1.8L5.6 12.8l-3.1.7z" />
  </svg>
);

export const TicketIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.4} strokeLinejoin="round" {...base} {...props}>
    <path d="M2 5.5A1.5 1.5 0 013.5 4h9A1.5 1.5 0 0114 5.5V7a1.5 1.5 0 000 2.5v1A1.5 1.5 0 0112.5 12h-9A1.5 1.5 0 012 10.5v-1A1.5 1.5 0 002 7V5.5z" />
    <path d="M10 4.5v7" strokeDasharray="1.2 1.6" />
  </svg>
);

export const WarningIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.5} strokeLinejoin="round" {...base} {...props}>
    <path d="M8 2.3l6 10.5H2L8 2.3zM8 6.6v3M8 11.3v.1" />
  </svg>
);

export const PinIcon =(props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.5} strokeLinejoin="round" {...base} {...props}>
    <path d="M8 14.5s4.5-4.2 4.5-8A4.5 4.5 0 0 0 3.5 6.5c0 3.8 4.5 8 4.5 8z" />
    <circle cx="8" cy="6.5" r="1.6" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.5} strokeLinejoin="round" {...base} {...props}>
    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.6 9h6.8L12 4M6.8 6.5v4M9.2 6.5v4" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg viewBox="0 0 12 12" strokeWidth={2} strokeLinejoin="round" {...base} {...props}>
    <path d="M2.5 6.3l2.4 2.4 4.6-5" />
  </svg>
);

export const RefreshIcon =(props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.7} strokeLinejoin="round" {...base} {...props}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.97M13.5 2.5v3h-3" />
  </svg>
);

export const ChevronIcon =(props: IconProps) => (
  <svg viewBox="0 0 20 22" strokeWidth={3} {...base} strokeLinecap="square" {...props}>
    <polyline points="3,4 16,11 3,18" />
  </svg>
);

export const ListIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.8} {...base} {...props}>
    <path d="M5.5 3.5H14M5.5 8H14M5.5 12.5H14" />
    <path d="M2 3.5h.01M2 8h.01M2 12.5h.01" strokeWidth={2.4} />
  </svg>
);

export const GridIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.8} strokeLinejoin="round" {...base} {...props}>
    <rect x="2" y="2" width="5" height="5" />
    <rect x="9" y="2" width="5" height="5" />
    <rect x="2" y="9" width="5" height="5" />
    <rect x="9" y="9" width="5" height="5" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.6} strokeLinejoin="round" {...base} {...props}>
    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.6} strokeLinejoin="round" {...base} {...props}>
    <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <path d="M2.5 13.5l11-11" />
  </svg>
);

/** Four looped corners, the "qr code" mark of the poster. */
export const QrIcon = (props: IconProps) => (
  <svg viewBox="0 0 16 16" strokeWidth={1.6} strokeLinejoin="round" {...base} {...props}>
    <path d="M5.5 5.5V3.5a2 2 0 1 0-2 2h2zM10.5 5.5V3.5a2 2 0 1 1 2 2h-2zM5.5 10.5v2a2 2 0 1 1-2-2h2zM10.5 10.5v2a2 2 0 1 0 2-2h-2z" />
    <rect x="5.5" y="5.5" width="5" height="5" />
  </svg>
);
