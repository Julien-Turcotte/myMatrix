import { describe, it, expect } from 'vitest';
import { getUserColor, formatTimestamp } from '../utils/colors';

const USER_COLORS = [
  '#89b4fa', '#a6e3a1', '#fab387', '#f38ba8', '#cba6f7',
  '#f9e2af', '#94e2d5', '#89dceb', '#b4befe', '#eba0ac',
];

describe('getUserColor', () => {
  it('returns a string from the color palette', () => {
    const color = getUserColor('@alice:matrix.org');
    expect(USER_COLORS).toContain(color);
  });

  it('returns a consistent color for the same input', () => {
    const a = getUserColor('@bob:example.com');
    const b = getUserColor('@bob:example.com');
    expect(a).toBe(b);
  });

  it('returns different colors for different user IDs (general case)', () => {
    const colors = new Set(
      ['@alice:a.io', '@bob:b.io', '@charlie:c.io', '@dave:d.io'].map(getUserColor)
    );
    expect(colors.size).toBeGreaterThan(1);
  });

  it('handles an empty string without throwing', () => {
    expect(() => getUserColor('')).not.toThrow();
    expect(USER_COLORS).toContain(getUserColor(''));
  });

  it('handles a single character', () => {
    const color = getUserColor('x');
    expect(USER_COLORS).toContain(color);
  });

  it('always returns one of the 10 palette colors', () => {
    const ids = [
      '@alice:matrix.org', '@bob:homeserver.net', '@carol:example.com',
      '@dave:server.io', '@eve:chat.xyz', 'short', 'a'.repeat(100),
    ];
    ids.forEach(id => {
      expect(USER_COLORS).toContain(getUserColor(id));
    });
  });
});

describe('formatTimestamp', () => {
  it('formats a timestamp as HH:MM', () => {
    // Build a timestamp for a known local time using Date
    const d = new Date();
    d.setHours(9, 5, 0, 0);
    const result = formatTimestamp(d.getTime());
    expect(result).toBe('09:05');
  });

  it('pads single-digit hours and minutes with zeros', () => {
    const d = new Date();
    d.setHours(3, 7, 0, 0);
    expect(formatTimestamp(d.getTime())).toBe('03:07');
  });

  it('handles midnight (00:00)', () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    expect(formatTimestamp(d.getTime())).toBe('00:00');
  });

  it('handles end of day (23:59)', () => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    expect(formatTimestamp(d.getTime())).toBe('23:59');
  });

  it('returns a string in HH:MM format', () => {
    expect(formatTimestamp(Date.now())).toMatch(/^\d{2}:\d{2}$/);
  });
});
