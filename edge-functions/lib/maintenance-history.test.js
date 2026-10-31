import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStatus } from './status-data.js';

const env = { KENER_BASE_URL: 'https://kener.example.com', KENER_API_KEY: 'server-only', KENER_PAGE_PATH: '~home' };
const monitor = { tag: 'api', name: 'API', description: null, category_name: 'Core', status: 'ACTIVE', is_hidden: 'NO', monitor_settings_json: null };

describe('maintenance history', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('maps completed dashboard maintenance announcements', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input) => {
      const path = new URL(String(input)).pathname;
      if (path === '/api/v4/pages/~home') return Response.json({ page: { page_title: 'Status', page_header: 'Brand', page_subheader: null, page_logo: null, monitors: [{ monitor_tag: 'api', position: 0 }] } });
      if (path === '/api/v4/monitors') return Response.json({ monitors: [monitor] });
      if (path === '/api/v4/monitors/api/data') return Response.json({ data: [] });
      if (path === '/api/v4/incidents') return Response.json({ incidents: [] });
      if (path === '/api/v4/maintenances/events') return Response.json({ events: [] });
      if (path === '/dashboard-apis/events-by-month') return Response.json({ maintenances: [{
        id: 6,
        title: '第四次维护',
        description: '数据库结构更新',
        start_date_time: 1793260200,
        end_date_time: 1793264040,
        status: 'COMPLETED',
        monitors: [{ monitor_tag: 'api', monitor_name: 'API', monitor_impact: 'MAINTENANCE' }],
      }] });
      throw new Error(`Unexpected ${path}`);
    }));
    const body = await getStatus(env, 1793461200);
    expect(body.maintenances).toEqual([]);
    expect(body.maintenanceHistory).toEqual([{
      id: 6,
      title: '第四次维护',
      description: '数据库结构更新',
      status: 'COMPLETED',
      startedAt: 1793260200,
      endedAt: 1793264040,
      url: null,
      monitors: [{ tag: 'api', name: 'API' }],
    }]);
  });
});
