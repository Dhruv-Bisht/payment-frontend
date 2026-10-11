import { money, shortKey, when } from './format';

describe('format', () => {
  it('formats rupees with Indian digit grouping', () => {
    expect(money(1234567.5)).toContain('12,34,567.50');
  });

  it('parses LocalDateTime strings with microsecond precision', () => {
    expect(when('2026-10-11T10:15:30.123456')).not.toBe('');
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(when(undefined)).toBe('');
    expect(when('not a date')).toBe('');
  });

  it('shortens long keys but leaves short ones alone', () => {
    expect(shortKey('123e4567-e89b-12d3-a456-426614174000')).toBe('123e4567…4000');
    expect(shortKey('abc')).toBe('abc');
  });
});

import { bytes, duration } from './format';

describe('bytes and duration', () => {
  it('formats byte sizes', () => {
    expect(bytes(512)).toBe('512 B');
    expect(bytes(1536)).toBe('1.5 KB');
    expect(bytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
  it('formats uptime', () => {
    expect(duration(45)).toBe('45s');
    expect(duration(125)).toBe('2m 5s');
    expect(duration(7500)).toBe('2h 5m');
  });
});
