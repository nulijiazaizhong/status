const DEFAULT_TIMEOUT_MS = 6500;

export class KenerError extends Error {
  constructor(message, status = 502, code = 'UPSTREAM_ERROR') {
    super(message);
    this.name = 'KenerError';
    this.status = status;
    this.code = code;
  }
}

export function getConfig(env) {
  const baseUrl = env.KENER_BASE_URL?.replace(/\/$/, '');
  const apiKey = env.KENER_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new KenerError('状态数据服务尚未完成配置', 503, 'NOT_CONFIGURED');
  }
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new KenerError('Kener 地址格式无效', 503, 'INVALID_CONFIGURATION');
  }
  const local = ['localhost', '127.0.0.1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) {
    throw new KenerError('Kener 必须使用公网 HTTPS 地址', 503, 'INVALID_CONFIGURATION');
  }
  return {
    baseUrl,
    apiKey,
    pagePath: env.KENER_PAGE_PATH || '~home',
    timezone: env.STATUS_TIMEZONE || 'Asia/Shanghai',
  };
}

export async function kenerGet(env, path) {
  const config = getConfig(env);
  let response;
  try {
    response = await fetch(`${config.baseUrl}/api/v4${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${config.apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
    throw new KenerError(timedOut ? 'Kener 请求超时' : '无法连接 Kener', timedOut ? 504 : 502);
  }
  if (!response.ok) {
    const status = response.status === 429 || response.status >= 500 ? 502 : response.status === 401 ? 503 : 502;
    throw new KenerError(`Kener 返回 ${response.status}`, status, response.status === 401 ? 'UPSTREAM_UNAUTHORIZED' : 'UPSTREAM_ERROR');
  }
  try {
    return await response.json();
  } catch {
    throw new KenerError('Kener 返回了无效数据');
  }
}

export async function getPageAndMonitors(env) {
  const config = getConfig(env);
  const [pageResponse, monitorResponse] = await Promise.all([
    kenerGet(env, `/pages/${encodeURIComponent(config.pagePath)}`),
    kenerGet(env, '/monitors?status=ACTIVE&is_hidden=NO'),
  ]);
  const page = pageResponse?.page;
  if (!page || !Array.isArray(page.monitors)) throw new KenerError('Kener Page 数据不完整');
  const byTag = new Map((monitorResponse?.monitors || []).map((monitor) => [monitor.tag, monitor]));
  const monitors = page.monitors
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => byTag.get(item.monitor_tag))
    .filter((monitor) => monitor && monitor.status === 'ACTIVE' && monitor.is_hidden === 'NO');
  return { config, page, monitors };
}

export async function mapLimit(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await callback(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function publicMonitor(monitor) {
  return {
    tag: monitor.tag,
    name: monitor.name,
    description: monitor.description || null,
    category: monitor.category_name || '核心服务',
  };
}

export function publicIncident(incident, monitorsByTag) {
  return {
    id: incident.id,
    title: incident.title,
    state: incident.state,
    startedAt: incident.start_date_time,
    endedAt: incident.end_date_time || null,
    url: incident.url,
    monitors: (incident.monitors || []).map((item) => ({
      tag: item.monitor_tag,
      name: monitorsByTag.get(item.monitor_tag)?.name || item.monitor_tag,
      impact: item.impact,
    })),
  };
}
