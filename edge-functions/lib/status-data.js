import { getPageAndMonitors, kenerGet, KenerError, mapLimit, publicIncident, publicMonitor } from './kener.js';
import { averageLatency, calculateUptime, overallStatus } from './status.js';

const DAY = 86400;

export async function getStatus(env, now = Math.floor(Date.now() / 1000)) {
  const { page, monitors } = await getPageAndMonitors(env);
  const start = now - 90 * DAY;
  const [incidentResponse, maintenanceResponse, eventsResponse, current] = await Promise.all([
    kenerGet(env, `/incidents?start_ts=${start}`),
    kenerGet(env, `/maintenances/events?limit=100&event_start_date_time=${now - DAY}`),
    kenerGet(env, '/dashboard-apis/events-by-month', '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_ts: start, end_ts: now + 90 * DAY }),
    }),
    mapLimit(monitors, 5, async (monitor) => {
      try {
        const response = await kenerGet(env, `/monitors/${encodeURIComponent(monitor.tag)}/data?start_ts=${now - DAY}&end_ts=${now + 60}`);
        const points = Array.isArray(response?.data) ? response.data : [];
        const latest = points.slice().sort((a, b) => b.timestamp - a.timestamp)[0];
        return { monitor, points, latest, dataError: null };
      } catch (error) {
        if (!(error instanceof KenerError)) throw error;
        return { monitor, points: [], latest: null, dataError: error.code };
      }
    }),
  ]);
  const monitorsByTag = new Map(monitors.map((monitor) => [monitor.tag, monitor]));
  const publicMonitors = current.map(({ monitor, points, latest, dataError }) => ({
    ...publicMonitor(monitor),
    status: latest?.status || 'NO_DATA',
    averageLatency: averageLatency(points),
    uptime: calculateUptime(points, monitor.monitor_settings_json || {}),
    updatedAt: latest?.timestamp || null,
    dataError,
  }));
  const baseIncidents = (incidentResponse?.incidents || [])
    .map((incident) => publicIncident(incident, monitorsByTag))
    .sort((a, b) => b.startedAt - a.startedAt);
  const incidents = await mapLimit(baseIncidents, 5, async (incident) => {
    if (incident.state === 'RESOLVED' || incident.endedAt) return incident;
    try {
      const response = await kenerGet(env, `/incidents/${incident.id}/comments`);
      const latest = (response?.comments || []).slice().sort((a, b) => b.timestamp - a.timestamp)[0];
      return { ...incident, latestUpdate: latest ? { state: latest.state, comment: latest.comment, timestamp: latest.timestamp } : null };
    } catch {
      return { ...incident, latestUpdate: null };
    }
  });
  const pageTags = new Set(monitors.map((monitor) => monitor.tag));
  const maintenances = (maintenanceResponse?.events || [])
    .filter((event) => ['SCHEDULED', 'READY', 'ONGOING'].includes(event.event_status))
    .filter((event) => event.maintenance_status === 'ACTIVE' && event.event_end_date_time >= now)
    .filter((event) => (event.monitors || []).some((monitor) => pageTags.has(monitor.monitor_tag)))
    .map((event) => ({
      id: event.event_id,
      title: event.maintenance_title,
      description: event.maintenance_description,
      status: event.event_status,
      startedAt: event.event_start_date_time,
      endedAt: event.event_end_date_time,
      url: event.url,
      monitors: (event.monitors || []).filter((monitor) => pageTags.has(monitor.monitor_tag)).map((monitor) => ({
        tag: monitor.monitor_tag,
        name: monitorsByTag.get(monitor.monitor_tag)?.name || monitor.monitor_tag,
      })),
    }))
    .sort((a, b) => a.startedAt - b.startedAt);
  const maintenanceHistory = (eventsResponse?.maintenances || [])
    .filter((event) => event.status === 'COMPLETED')
    .filter((event) => (event.monitors || []).some((monitor) => pageTags.has(monitor.monitor_tag)))
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      status: 'COMPLETED',
      startedAt: event.start_date_time,
      endedAt: event.end_date_time || event.start_date_time,
      url: null,
      monitors: event.monitors.filter((monitor) => pageTags.has(monitor.monitor_tag)).map((monitor) => ({
        tag: monitor.monitor_tag,
        name: monitor.monitor_name || monitorsByTag.get(monitor.monitor_tag)?.name || monitor.monitor_tag,
      })),
    }))
    .sort((a, b) => b.startedAt - a.startedAt);
  const ongoing = maintenances.filter((event) => event.status === 'ONGOING').length;
  return {
    generatedAt: now,
    stale: false,
    timezone: env.STATUS_TIMEZONE || 'Asia/Shanghai',
    page: {
      title: page.page_title,
      header: page.page_header,
      subheader: page.page_subheader,
      logo: page.page_logo,
    },
    summary: {
      status: overallStatus(publicMonitors, ongoing),
      operational: publicMonitors.filter((monitor) => monitor.status === 'UP').length,
      total: publicMonitors.length,
    },
    monitors: publicMonitors,
    incidents,
    maintenances,
    maintenanceHistory,
    warnings: current.filter((item) => item.dataError).map((item) => ({
      code: item.dataError,
      endpoint: `/monitors/${item.monitor.tag}/data`,
    })),
  };
}
