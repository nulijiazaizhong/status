import type { ServiceStatus, SummaryStatus } from './types';

export const serviceStatus = {
  UP: { label: '运行正常', color: '#34D399' },
  DOWN: { label: '服务异常', color: '#FB7185' },
  DEGRADED: { label: '性能下降', color: '#FBBF24' },
  MAINTENANCE: { label: '维护中', color: '#38BDF8' },
  NO_DATA: { label: '暂无数据', color: '#6B7280' },
} satisfies Record<ServiceStatus, { label: string; color: string }>;

export const summaryStatus: Record<SummaryStatus, { title: string; description: string }> = {
  OPERATIONAL: { title: '所有系统运行正常', description: '各项核心服务均可用，监控数据持续更新。' },
  PARTIAL_OUTAGE: { title: '部分服务出现异常', description: '部分服务受到影响，其余服务仍在正常运行。' },
  MAJOR_OUTAGE: { title: '大面积服务异常', description: '多项核心服务受到影响，工程团队正在处理。' },
  DEGRADED: { title: '部分服务性能下降', description: '服务仍然可用，但部分请求可能比平时更慢。' },
  MAINTENANCE: { title: '系统维护进行中', description: '部分服务正在维护，具体影响范围请查看维护通知。' },
  EMPTY: { title: '暂无状态数据', description: '监控尚未产生可用数据，请稍后再次查看。' },
};

export const incidentStates: Record<string, string> = {
  INVESTIGATING: '调查中',
  IDENTIFIED: '已定位',
  MONITORING: '观察中',
  RESOLVED: '已解决',
};

export const maintenanceStates = {
  SCHEDULED: '已计划',
  READY: '即将开始',
  ONGOING: '维护中',
  COMPLETED: '已完成',
};

export function isOngoing(incident: { state: string; endedAt: number | null }) {
  return incident.state !== 'RESOLVED' && incident.endedAt === null;
}
