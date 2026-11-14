type ClassValue = string | false | null | undefined;

/** Joins class names, ignoring falsy values. */
export const cn = (...values: ClassValue[]): string => values.filter(Boolean).join(' ');
