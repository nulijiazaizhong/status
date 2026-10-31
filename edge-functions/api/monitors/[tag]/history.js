import { withCache } from '../../../lib/cache.js';
import { errorResponse, json, methodNotAllowed } from '../../../lib/http.js';
import { getPageAndMonitors, kenerGet, KenerError } from '../../../lib/kener.js';
import { calculateUptimeCounts, dayKey } from '../../../lib/status.js';

export async function onRequestGet(context) {
  try {
    const days = Number(new URL(context.request.url).searchParams.get('days') || 30);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      return json({ error: { code: 'INVALID_DAYS', message: '历史范围必须是 1 至 30 天。' } }, 400);
    }
    const { monitors } = await getPageAndMonitors(context.env);
    const monitor = monitors.find((item) => item.tag === context.params.tag);
    if (!monitor) return json({ error: { code: 'NOT_FOUND', message: '未找到该服务。' } }, 404);
    return await withCache(context, days === 1 ? 300 : 3600, 7 * 86400, async () => {
      const timezone = context.env.STATUS_TIMEZONE || 'Asia/Shanghai';
      const endpoint = '/dashboard-apis/monitor-bars';
      const response = await kenerGet(context.env, `${endpoint}?tags=${encodeURIComponent(monitor.tag)}&days=${days}`, '');
      const bar = response?.data?.[monitor.tag];
      if (!bar || !Array.isArray(bar.uptimeData)) {
        throw new KenerError('Kener 历史数据不完整', 502, 'UPSTREAM_INVALID_RESPONSE', endpoint);
      }
      const settings = monitor.monitor_settings_json || {};
      const history = bar.uptimeData.slice(-days).map((day) => {
        const counts = {
          up: day.countOfUp || 0,
          down: day.countOfDown || 0,
          degraded: day.countOfDegraded || 0,
          maintenance: day.countOfMaintenance || 0,
        };
        return {
          date: dayKey(day.ts, timezone),
          status: counts.down > 0 ? 'DOWN' : counts.degraded > 0 ? 'DEGRADED' : counts.maintenance > 0 ? 'MAINTENANCE' : counts.up > 0 ? 'UP' : 'NO_DATA',
          uptime: calculateUptimeCounts(counts, settings),
          averageLatency: Number.isFinite(day.avgLatency) ? Math.round(day.avgLatency) : null,
        };
      });
      const uptime = Number(bar.uptime);
      return {
        generatedAt: Math.floor(Date.now() / 1000),
        stale: false,
        tag: monitor.tag,
        days,
        uptime: Number.isFinite(uptime) ? Math.round(uptime * 100) / 100 : null,
        history,
      };
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function onRequest() {
  return methodNotAllowed();
}
