import { beforeEach, describe, expect, it } from 'vitest';
import { clearMemoryCache, withCache } from './cache.js';

const context = () => ({ request: new Request('https://status.example.com/api/status') });

describe('cache fallback', () => {
  beforeEach(clearMemoryCache);

  it('returns fresh data and serves a marked stale snapshot on failure', async () => {
    const first = await withCache(context(), 0, 3600, async () => ({ generatedAt: 123, stale: false }));
    expect(await first.json()).toEqual({ generatedAt: 123, stale: false });
    const stale = await withCache(context(), 0, 3600, async () => { throw new Error('upstream down'); });
    expect(await stale.json()).toEqual({ generatedAt: 123, stale: true });
  });

  it('does not invent service data when no snapshot exists', async () => {
    await expect(withCache(context(), 45, 3600, async () => { throw new Error('upstream down'); })).rejects.toThrow('upstream down');
  });
});
