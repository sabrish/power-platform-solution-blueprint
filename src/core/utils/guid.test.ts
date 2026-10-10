import { describe, expect, it } from 'vitest';
import { normalizeBatch, normalizeGuid } from './guid.js';

describe('normalizeGuid', () => {
  it('lowercases and strips braces', () => {
    expect(normalizeGuid('{A1B2C3D4-0000-1111-2222-333344445555}')).toBe(
      'a1b2c3d4-0000-1111-2222-333344445555'
    );
  });

  it('leaves an already-normalised GUID unchanged', () => {
    expect(normalizeGuid('a1b2c3d4-0000-1111-2222-333344445555')).toBe(
      'a1b2c3d4-0000-1111-2222-333344445555'
    );
  });
});

describe('normalizeBatch', () => {
  it('normalises every entry', () => {
    expect(normalizeBatch(['{AA}', 'BB'])).toEqual(['aa', 'bb']);
  });
});
