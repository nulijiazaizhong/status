import { describe, expect, it } from 'vitest';
import { historyUptime, overallStatus } from './status.js';

describe('history boundaries', () => {
  it('excludes points outside the selected calendar days', () => {
    const now = Date.parse('2026-10-31T12:00:00Z');
    const points = [
      { timestamp: Date.parse('2026-10-29T12:00:00Z') / 1000, status: 'DOWN' },
      { timestamp: Date.parse('2026-10-31T12:00:00Z') / 1000, status: 'UP' },
    ];
    expect(historyUptime(points, 1, 'Asia/Shanghai', {}, now)).toBe(100);
  });

  it('does not hide healthy monitors when only some have no data', () => {
    expect(overallStatus([{ status: 'UP' }, { status: 'NO_DATA' }])).toBe('OPERATIONAL');
  });
});
