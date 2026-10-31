import { json } from './http.js';

const memoryCache = new Map();

function cacheRequest(request, suffix) {
  const url = new URL(request.url);
  url.searchParams.set('__status_cache', suffix);
  return new Request(url, { method: 'GET' });
}

async function readCache(request, suffix) {
  if (globalThis.caches?.default) return globalThis.caches.default.match(cacheRequest(request, suffix));
  const entry = memoryCache.get(cacheRequest(request, suffix).url);
  if (!entry || entry.expiresAt <= Date.now()) return undefined;
  return new Response(entry.body, { status: 200, headers: entry.headers });
}

async function writeCache(request, suffix, response, seconds) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, max-age=0, s-maxage=${seconds}`);
  const stored = new Response(await response.clone().arrayBuffer(), { status: 200, headers });
  if (globalThis.caches?.default) {
    await globalThis.caches.default.put(cacheRequest(request, suffix), stored);
    return;
  }
  memoryCache.set(cacheRequest(request, suffix).url, {
    body: await stored.clone().text(),
    headers: Object.fromEntries(stored.headers),
    expiresAt: Date.now() + seconds * 1000,
  });
}

export async function withCache(context, ttl, staleTtl, producer) {
  const fresh = await readCache(context.request, 'fresh');
  if (fresh) return fresh;
  try {
    const data = await producer();
    const response = json(data, 200, ttl);
    await writeCache(context.request, 'fresh', response, ttl);
    await writeCache(context.request, 'stale', response, staleTtl);
    return response;
  } catch (error) {
    const stale = await readCache(context.request, 'stale');
    if (stale) {
      const data = await stale.json();
      return json({ ...data, stale: true }, 200);
    }
    throw error;
  }
}

export function clearMemoryCache() {
  memoryCache.clear();
}
