import { describe, expect, it, vi } from 'vitest';
import { getStatus } from './status-data.js';

const env = { KENER_BASE_URL: 'https://kener.example.com', KENER_API_KEY: 'server-only', KENER_PAGE_PATH: '~home', STATUS_TIMEZONE: 'Asia/Shanghai' };
const monitor = (tag) => ({ tag, name: tag, description: null, category_name: 'Core', status: 'ACTIVE', is_hidden: 'NO', monitor_settings_json: null });

describe('partial monitor failures', () => {
  it('keeps healthy monitor data visible and reports the failed monitor', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === '/api/v4/pages/~home') return Response.json({ page: { page_title: 'Status', page_header: 'Brand', page_subheader: null, page_logo: null, monitors: [{ monitor_tag: 'api', position: 0 }, { monitor_tag: 'beijing', position: 1 }] } });
      if (path === '/api/v4/monitors') return Response.json({ monitors: [monitor('api'), monitor('beijing')] });
      if (path === '/api/v4/monitors/api/data') return Response.json({ data: [{ monitor_tag: 'api', timestamp: 1760000000, status: 'UP', latency: 100 }] });
      if (path === '/api/v4/monitors/beijing/data') return new Response('not-json', { status: 200 });
      if (path === '/api/v4/incidents') return Response.json({ incidents: [] });
      if (path === '/api/v4/maintenances/events') return Response.json({ events: [] });
      throw new Error(`Unexpected ${path}`);
    }));
    const body = await getStatus(env, 1760000100);
    expect(body.monitors).toHaveLength(2);
    expect(body.monitors[0]).toMatchObject({ tag: 'api', status: 'UP', dataError: null });
    expect(body.monitors[1]).toMatchObject({ tag: 'beijing', status: 'NO_DATA', dataError: 'UPSTREAM_INVALID_RESPONSE' });
    expect(body.warnings).toEqual([{ code: 'UPSTREAM_INVALID_RESPONSE', endpoint: '/monitors/beijing/data' }]);
    expect(JSON.stringify(body)).not.toContain('server-only');
    vi.unstubAllGlobals();
  });
});
