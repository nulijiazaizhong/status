import { withCache } from '../../../lib/cache.js';
import { errorResponse, json, methodNotAllowed } from '../../../lib/http.js';
import { getPageAndMonitors, kenerGet, mapLimit } from '../../../lib/kener.js';
import { aggregateHistory, historyUptime } from '../../../lib/status.js';

export async function onRequestGet(context) {
  try {
    const days = Number(new URL(context.request.url).searchParams.get('days') || 90);
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      return json({ error: { code: 'INVALID_DAYS', message: '历史范围必须是 1 至 90 天。' } }, 400);
    }
    const { monitors } = await getPageAndMonitors(context.env);
    const monitor = monitors.find((item) => item.tag === context.params.tag);
    if (!monitor) return json({ error: { code: 'NOT_FOUND', message: '未找到该服务。' } }, 404);
    return await withCache(context, days === 1 ? 300 : 3600, 7 * 86400, async () => {
      const now = Math.floor(Date.now() / 1000);
      const ranges = [];
      for (let start = now - (days + 1) * 86400; start < now; start += 7 * 86400) {
        ranges.push({ start, end: Math.min(start + 7 * 86400, now) });
      }
      const responses = await mapLimit(ranges, 3, ({ start, end }) => kenerGet(
        context.env,
        `/monitors/${encodeURIComponent(monitor.tag)}/data?start_ts=${start}&end_ts=${end}`,
      ));
      const points = responses.flatMap((response) => Array.isArray(response?.data) ? response.data : []);
      return {
        generatedAt: now,
        stale: false,
        tag: monitor.tag,
        days,
        uptime: historyUptime(points, days, context.env.STATUS_TIMEZONE || 'Asia/Shanghai', monitor.monitor_settings_json || {}, now * 1000),
        history: aggregateHistory(points, days, context.env.STATUS_TIMEZONE || 'Asia/Shanghai', monitor.monitor_settings_json || {}),
      };
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function onRequest() {
  return methodNotAllowed();
}
