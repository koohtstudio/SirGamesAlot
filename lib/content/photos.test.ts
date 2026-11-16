import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PHOTO_KEYS, getPhoto } from './photos';

const publicDir = path.resolve(__dirname, '../../public');

describe('photo registry', () => {
  it('has a real file, alt text and matching metadata for every photo', () => {
    for (const key of PHOTO_KEYS) {
      const p = getPhoto(key);
      const file = path.join(publicDir, p.src);
      expect(existsSync(file), `${key}: ${p.src} is missing`).toBe(true);
      expect(statSync(file).size, `${key} is empty`).toBeGreaterThan(1000);
      expect(p.alt.trim().length, `${key} needs alt text`).toBeGreaterThan(15);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
      expect(p.blur.startsWith('data:image/jpeg;base64,')).toBe(true);
      expect(p.dominant).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it('has an og image sized for link previews', () => {
    expect(existsSync(path.join(publicDir, 'images/og.jpg'))).toBe(true);
  });
});
