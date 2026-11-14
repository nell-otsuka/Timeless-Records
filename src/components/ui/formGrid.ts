/** Dialog forms sit on a six-column grid, so fields can take a half, a third or two thirds of a row. */
export const FORM_GRID = 'grid grid-cols-6 content-start gap-x-5 gap-y-5';

const SPANS = { 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4', 6: 'col-span-6' } as const;
export type FieldSpan = keyof typeof SPANS;

/** The class that makes a field span that many of the six columns (a whole row by default). */
export const spanClass = (span: FieldSpan = 6) => `${SPANS[span]} max-md:col-span-6`;
