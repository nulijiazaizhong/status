import { describe, expect, it } from 'vitest';
import { aggregateHistory, calculateUptime, dayKey, dominantStatus, evaluateFormula, overallStatus, recentDayKeys } from './status.js';

const monitors = (...statuses) => statuses.map((status) => ({ status }));

describe('overall status', () => {
  it('distinguishes operational, partial and major outage', () => {
    expect(overallStatus(monitors('UP', 'UP'))).toBe('OPERATIONAL');
    expect(overallStatus(monitors('UP', 'DOWN'))).toBe('PARTIAL_OUTAGE');
    expect(overallStatus(monitors('DOWN', 'DOWN'))).toBe('MAJOR_OUTAGE');
    expect(overallStatus(monitors('UP', 'DEGRADED'))).toBe('DEGRADED');
    expect(overallStatus(monitors('UP'), 1)).toBe('MAINTENANCE');
    expect(overallStatus(monitors('NO_DATA'))).toBe('EMPTY');
    expect(overallStatus([])).toBe('EMPTY');
  });

  it('uses Kener health priority', () => {
    expect(dominantStatus(['UP', 'NO_DATA', 'DEGRADED', 'DOWN'])).toBe('DOWN');
    expect(dominantStatus(['UP', 'MAINTENANCE'])).toBe('MAINTENANCE');
  });
});

describe('uptime', () => {
  it('uses the default formula and excludes NO_DATA', () => {
    const points = [{ status: 'UP' }, { status: 'DOWN' }, { status: 'NO_DATA' }, { status: 'DEGRADED' }, { status: 'MAINTENANCE' }];
    expect(calculateUptime(points)).toBe(75);
  });

  it('supports custom formulas without eval', () => {
    const points = [{ status: 'UP' }, { status: 'UP' }, { status: 'DOWN' }, { status: 'MAINTENANCE' }];
    expect(calculateUptime(points, { uptime_formula_numerator: 'up + maintenance', uptime_formula_denominator: 'up + down + degraded + maintenance' })).toBe(75);
    expect(evaluateFormula('(up + maintenance) * up', { up: 2, maintenance: 1, down: 0, degraded: 0 })).toBe(6);
    expect(() => evaluateFormula('process.exit()', { up: 1 })).toThrow();
  });

  it('handles zero denominator and rounding', () => {
    expect(calculateUptime([])).toBeNull();
    expect(calculateUptime([{ status: 'UP' }, { status: 'UP' }, { status: 'DOWN' }])).toBe(66.67);
  });
});

describe('daily aggregation', () => {
  it('groups UTC seconds into configured timezone days and fills gaps', () => {
    const now = Date.parse('2026-10-31T12:00:00Z');
    const points = [
      { timestamp: Date.parse('2026-10-30T16:30:00Z') / 1000, status: 'UP', latency: 100 },
      { timestamp: Date.parse('2026-10-30T17:30:00Z') / 1000, status: 'DOWN', latency: 300 },
    ];
    const result = aggregateHistory(points, 3, 'Asia/Shanghai', {}, now);
    expect(result).toHaveLength(3);
    expect(result.at(-1)).toMatchObject({ date: '2026-10-31', status: 'DOWN', uptime: 50, averageLatency: 200 });
    expect(result.at(-2)?.status).toBe('NO_DATA');
    expect(recentDayKeys(2, 'Asia/Shanghai', now)).toEqual(['2026-10-30', '2026-10-31']);
    expect(dayKey(points[0].timestamp, 'Asia/Shanghai')).toBe('2026-10-31');
  });
});
