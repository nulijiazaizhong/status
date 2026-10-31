import { withCache } from '../../lib/cache.js';
import { errorResponse, json, methodNotAllowed } from '../../lib/http.js';
import { getPageAndMonitors, kenerGet, KenerError, publicIncident } from '../../lib/kener.js';

export async function onRequestGet(context) {
  if (!/^\d+$/.test(context.params.id || '')) {
    return json({ error: { code: 'INVALID_ID', message: '事故编号无效。' } }, 400);
  }
  try {
    return await withCache(context, 300, 7 * 86400, async () => {
      const [{ monitors }, incidentResponse, commentsResponse] = await Promise.all([
        getPageAndMonitors(context.env),
        kenerGet(context.env, `/incidents/${context.params.id}`),
        kenerGet(context.env, `/incidents/${context.params.id}/comments`),
      ]);
      const incident = incidentResponse?.incident;
      if (!incident) throw new KenerError('Incident not found', 404, 'NOT_FOUND');
      const tags = new Set(monitors.map((monitor) => monitor.tag));
      if (!(incident.monitors || []).some((monitor) => tags.has(monitor.monitor_tag))) {
        throw new KenerError('Incident not found', 404, 'NOT_FOUND');
      }
      return {
        generatedAt: Math.floor(Date.now() / 1000),
        stale: false,
        incident: publicIncident(incident, new Map(monitors.map((monitor) => [monitor.tag, monitor]))),
        comments: (commentsResponse?.comments || []).map((comment) => ({
          id: comment.id,
          state: comment.state,
          comment: comment.comment,
          timestamp: comment.timestamp,
        })).sort((a, b) => b.timestamp - a.timestamp),
      };
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function onRequest() {
  return methodNotAllowed();
}
