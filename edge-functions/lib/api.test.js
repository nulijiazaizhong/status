import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet as history } from '../api/monitors/[tag]/history.js';
import { onRequestGet as status } from '../api/status.js';
import { clearMemoryCache } from './cache.js';

const env = { KENER_BASE_URL: 'https://kener.example.com', KENER_API_KEY: 'top-secret', KENER_PAGE_PATH: '~home', STATUS_TIMEZONE: 'Asia/Shanghai' };
const monitor = { tag: 'api', name: 'API', description: null, category_name: 'Core', status: 'ACTIVE', is_hidden: 'NO', type_data: { password: 'do-not-forward' }, monitor_settings_json: null };

function payload(path) {
  if (path === '/pages/~home') return { page: { page_title: 'Status', page_header: 'Brand', page_subheader: null, page_logo: null, monitors: [{ monitor_tag: 'api', position: 0 }, { monitor_tag: 'other', position: 1 }] } };
  if (path.startsWith('/monitors?')) return { monitors: [monitor] };
  if (path.startsWith('/monitors/api/data')) return { data: [{ monitor_tag: 'api', timestamp: 1760000000, status: 'UP', latency: 120, type: 'REAL' }] };
  if (path.startsWith('/incidents?')) return { incidents: [] };
  if (path.startsWith('/maintenances/events')) return { events: [] };
  throw new Error(`Unexpected path ${path}`);
}

function mockFetch() {
  return vi.fn(async (input) => {
    const url = new URL(String(input));
    return new Response(JSON.stringify(payload(url.pathname.replace('/api/v4', '') + url.search)), { status: 200 });
  });
}

function context(path = '/api/status') {
  return { request: new Request(`https://status.example.com${path}`), env, params: {}, waitUntil: () => {} };
}

describe('public API', () => {
  beforeEach(() => { clearMemoryCache(); vi.unstubAllGlobals(); });

  it('intersects page monitors and trims sensitive fields', async () => {
    const fetchMock = mockFetch();
    vi.stubGlobal('fetch', fetchMock);
    const response = await status(context());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.monitors).toHaveLength(1);
    expect(body.summary.status).toBe('OPERATIONAL');
    expect(JSON.stringify(body)).not.toContain('type_data');
    expect(JSON.stringify(body)).not.toContain('top-secret');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/pages/~home'), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer top-secret' }) }));
  });

  it('rejects tags outside the current page and invalid ranges', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const invalid = await history({ ...context('/api/monitors/other/history?days=90'), params: { tag: 'other' } });
    expect(invalid.status).toBe(404);
    const range = await history({ ...context('/api/monitors/api/history?days=91'), params: { tag: 'api' } });
    expect(range.status).toBe(400);
  });

  it('returns daily history only', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const response = await history({ ...context('/api/monitors/api/history?days=1'), params: { tag: 'api' } });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.history).toHaveLength(1);
    expect(body.history[0]).toHaveProperty('uptime');
    expect(body).not.toHaveProperty('data');
  });

  it('does not translate upstream authentication failure into service outage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    const response = await status(context());
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error.code).toBe('UPSTREAM_UNAUTHORIZED');
    expect(body.monitors).toBeUndefined();
  });
});
