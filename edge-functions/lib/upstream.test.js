import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet as status } from '../api/status.js';
import { clearMemoryCache } from './cache.js';

const env = { KENER_BASE_URL: 'https://kener.example.com', KENER_API_KEY: 'server-only', KENER_PAGE_PATH: 'public' };
const context = () => ({ request: new Request('https://status.example.com/api/status'), env, params: {} });

describe('upstream failures', () => {
  beforeEach(() => { clearMemoryCache(); vi.unstubAllGlobals(); });

  it.each([404, 429, 500])('maps Kener %s to a data source error', async (code) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: code })));
    const response = await status(context());
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe('UPSTREAM_ERROR');
  });

  it('distinguishes timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('timeout', 'TimeoutError'); }));
    const response = await status(context());
    expect(response.status).toBe(504);
  });

  it('supports a normal page path and empty monitor list', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const url = new URL(String(input));
      const path = url.pathname;
      const body = path === '/api/v4/pages/public' ? { page: { page_title: 'Public', page_header: 'Brand', page_subheader: null, page_logo: null, monitors: [] } }
        : path === '/api/v4/monitors' ? { monitors: [] }
        : path === '/api/v4/incidents' ? { incidents: [] }
        : { events: [] };
      return new Response(JSON.stringify(body));
    }));
    const response = await status(context());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.summary).toEqual({ status: 'EMPTY', operational: 0, total: 0 });
  });
});
