import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedStatus, getHistory, getStatus } from './api';
import type { HistoryData, StatusData } from './types';

const status: StatusData = {
  generatedAt: 1760000000,
  stale: false,
  timezone: 'Asia/Shanghai',
  page: { title: 'Status', header: 'Brand', subheader: null, logo: null },
  summary: { status: 'OPERATIONAL', operational: 1, total: 1 },
  monitors: [],
  incidents: [],
  maintenances: [],
  maintenanceHistory: [],
};

const history: HistoryData = {
  generatedAt: 1760000000,
  stale: false,
  tag: 'api',
  days: 30,
  uptime: 100,
  history: [],
};

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.unstubAllGlobals();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
  });
});

describe('browser cache', () => {
  it('stores successful status responses and reuses fresh cache', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(status)));
    vi.stubGlobal('fetch', fetchMock);
    expect((await getStatus()).summary.status).toBe('OPERATIONAL');
    expect((await getStatus()).summary.status).toBe('OPERATIONAL');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCachedStatus()?.stale).toBe(true);
  });

  it('returns expired status cache when the network fails', async () => {
    storage.set('status-page:status:v1', JSON.stringify({ savedAt: Date.now() - 60_000, data: status }));
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const result = await getStatus();
    expect(result.stale).toBe(true);
    expect(result.summary.operational).toBe(1);
  });

  it('reuses fresh 30 day history without another request', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(history)));
    vi.stubGlobal('fetch', fetchMock);
    await getHistory('api', 30);
    const result = await getHistory('api', 30);
    expect(result.days).toBe(30);
    expect(result.stale).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
