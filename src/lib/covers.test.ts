import { describe, expect, it } from 'vitest';
import { MAX_COVER_BYTES, validateCoverFile } from './covers';

describe('validateCoverFile', () => {
  it('accepts png, jpeg and webp up to the limit', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateCoverFile({ type, size: MAX_COVER_BYTES })).toBeNull();
    }
  });

  it('explains what is wrong with anything else', () => {
    expect(validateCoverFile({ type: 'image/gif', size: 10 })).toMatch(/png, jpeg or webp/);
    expect(validateCoverFile({ type: 'image/png', size: 0 })).toMatch(/empty/);
    expect(validateCoverFile({ type: 'image/png', size: MAX_COVER_BYTES + 1 })).toMatch(/too large/);
  });
});
