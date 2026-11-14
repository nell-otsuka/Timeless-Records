export const COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

/** Checks a chosen poster before uploading it, with a message the user can act on. */
export const validateCoverFile = (file: { type: string; size: number }): string | null => {
  if (!COVER_TYPES.includes(file.type)) return 'use a png, jpeg or webp image';
  if (file.size === 0) return 'that image is empty';
  if (file.size > MAX_COVER_BYTES) return 'that image is too large (5 MB max)';
  return null;
};
