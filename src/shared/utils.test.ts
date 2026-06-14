import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatFileSize, formatDate, formatDateTime, generateUuid, getCurrentIsoDate } from './utils';

describe('formatFileSize', () => {
  it('returns bytes for sizes under 1 KB', () => {
    expect(formatFileSize(0)).toBe('0 Б');
    expect(formatFileSize(512)).toBe('512 Б');
    expect(formatFileSize(1023)).toBe('1023 Б');
  });

  it('returns kilobytes for sizes between 1 KB and 1 MB', () => {
    expect(formatFileSize(1024)).toBe('1.0 КБ');
    expect(formatFileSize(1536)).toBe('1.5 КБ');
    expect(formatFileSize(1048575)).toBe('1024.0 КБ');
  });

  it('returns megabytes for sizes 1 MB and above', () => {
    expect(formatFileSize(1048576)).toBe('1.0 МБ');
    expect(formatFileSize(5242880)).toBe('5.0 МБ');
  });
});

describe('formatDate', () => {
  it('formats ISO date string to en-US locale', () => {
    const result = formatDate('2026-01-15T10:30:00.000Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('formatDateTime', () => {
  it('formats ISO date string with time to en-US locale', () => {
    const result = formatDateTime('2026-06-14T14:45:00.000Z');
    expect(result).toContain('Jun');
    expect(result).toContain('14');
    expect(result).toContain('2026');
  });
});

describe('generateUuid', () => {
  it('returns a string', () => {
    const uuid = generateUuid();
    expect(typeof uuid).toBe('string');
    expect(uuid.length).toBeGreaterThan(0);
  });

  it('returns different values on each call', () => {
    const uuid1 = generateUuid();
    const uuid2 = generateUuid();
    expect(uuid1).not.toBe(uuid2);
  });
});

describe('getCurrentIsoDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a valid ISO date string', () => {
    const dateStr = getCurrentIsoDate();
    expect(() => new Date(dateStr)).not.toThrow();
    expect(new Date(dateStr).toISOString()).toBe(dateStr);
  });

  it('returns the current time', () => {
    const fixedTime = new Date('2026-03-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(fixedTime);

    expect(getCurrentIsoDate()).toBe('2026-03-20T12:00:00.000Z');
  });
});
