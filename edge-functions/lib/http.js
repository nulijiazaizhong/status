import { KenerError } from './kener.js';

export function json(data, status = 200, cacheSeconds = 0) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheSeconds ? `public, max-age=0, s-maxage=${cacheSeconds}` : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function errorResponse(error) {
  if (error instanceof KenerError) {
    return json({ error: { code: error.code, endpoint: error.endpoint, message: '暂时无法获取最新状态，请稍后重试。' } }, error.status);
  }
  return json({ error: { code: 'INTERNAL_ERROR', message: '状态服务暂时不可用，请稍后重试。' } }, 500);
}

export function methodNotAllowed() {
  return json({ error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET 请求。' } }, 405);
}
