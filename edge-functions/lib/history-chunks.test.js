import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet as history } from '../api/monitors/[tag]/history.js';
import { clearMemoryCache } from './cache.js';

const env = { KENER_BASE_URL: 'https://kener.example.com', KENER_API_KEY: 'server-only', KENER_PAGE_PATH: '~home', STATUS_TIMEZONE: 'Asia/Shanghai' };
const monitor = { tag: 'api', name: 'API', description: null, category_name: 'Core', status: 'ACTIVE', is_hidden: 'NO', monitor_settings_json: null };

describe('history request chunking', () => {
  beforeEach(() => { clearMemoryCache(); vi.unstubAllGlobals(); });

  it('requests 90 days in bounded two-day chunks', async () => {
    let dataRequests = 0;
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === '/api/v4/pages/~home') return Response.json({ page: { monitors: [{ monitor_tag: 'api', position: 0 }] } });
      if (path === '/api/v4/monitors') return Response.json({ monitors: [monitor] });
      if (path === '/api/v4/monitors/api/data') {
        dataRequests += 1;
        return Response.json({ data: [] });
      }
      throw new Error(`Unexpected ${path}`);
    }));
    const response = await history({
      request: new Request('https://status.example.com/api/monitors/api/history?days=90'),
      env,
      params: { tag: 'api' },
    });
    expect(response.status).toBe(200);
    expect(dataRequests).toBe(46);
    expect((await response.json()).history).toHaveLength(90);
  });
});
