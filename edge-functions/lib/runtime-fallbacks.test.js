import { afterEach, describe, expect, it, vi } from 'vitest';
import { withCache } from './cache.js';
import { getConfig } from './kener.js';

const context = () => ({ request: new Request('https://status.example.com/api/status') });

describe('Makers runtime fallbacks', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('serves upstream data when Cache API reads and writes fail', async () => {
    vi.stubGlobal('caches', { default: {
      match: async () => { throw new Error('cache unavailable'); },
      put: async () => { throw new Error('cache unavailable'); },
    } });
    const response = await withCache(context(), 45, 3600, async () => ({ generatedAt: 123, stale: false }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ generatedAt: 123, stale: false });
  });

  it('reports invalid Kener URLs as configuration errors', () => {
    expect(() => getConfig({ KENER_BASE_URL: 'kener.example.com', KENER_API_KEY: 'server-only' })).toThrow(expect.objectContaining({ status: 503, code: 'INVALID_CONFIGURATION' }));
  });
});
