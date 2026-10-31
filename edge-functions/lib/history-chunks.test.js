import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet as history } from '../api/monitors/[tag]/history.js';
import { clearMemoryCache } from './cache.js';

const env = { KENER_BASE_URL: 'https://kener.example.com', KENER_API_KEY: 'server-only', KENER_PAGE_PATH: '~home', STATUS_TIMEZONE: 'Asia/Shanghai' };
const monitor = { tag: 'api', name: 'API', description: null, category_name: 'Core', status: 'ACTIVE', is_hidden: 'NO', monitor_settings_json: null };

describe('history dashboard aggregation', () => {
  beforeEach(() => { clearMemoryCache(); vi.unstubAllGlobals(); });

  it('uses one monitor-bars request for 30 daily aggregates', async () => {
    let dashboardRequests = 0;
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === '/api/v4/pages/~home') return Response.json({ page: { monitors: [{ monitor_tag: 'api', position: 0 }] } });
      if (path === '/api/v4/monitors') return Response.json({ monitors: [monitor] });
      if (path === '/dashboard-apis/monitor-bars') {
        dashboardRequests += 1;
        return Response.json({ data: { api: {
          uptime: '99.8912',
          uptimeData: Array.from({ length: 30 }, (_, index) => ({ ts: 1760000000 + index * 86400, countOfUp: 1440, countOfDown: 0, countOfDegraded: 0, countOfMaintenance: 0, avgLatency: 120 })),
        } } });
      }
      throw new Error(`Unexpected ${path}`);
    }));
    const response = await history({
      request: new Request('https://status.example.com/api/monitors/api/history?days=30'),
      env,
      params: { tag: 'api' },
    });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(dashboardRequests).toBe(1);
    expect(body.history).toHaveLength(30);
    expect(body.history[0]).toMatchObject({ status: 'UP', uptime: 100, averageLatency: 120 });
    expect(body.uptime).toBe(99.89);
    expect(body).not.toHaveProperty('data');
  });
});
