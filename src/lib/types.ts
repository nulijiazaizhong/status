export type ServiceStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE' | 'NO_DATA';
export type SummaryStatus = 'OPERATIONAL' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE' | 'DEGRADED' | 'MAINTENANCE' | 'EMPTY';

export interface PublicMonitor {
  tag: string;
  name: string;
  description: string | null;
  category: string;
  status: ServiceStatus;
  averageLatency: number | null;
  uptime: number | null;
  updatedAt: number | null;
  dataError?: string | null;
}

export interface AffectedMonitor {
  tag: string;
  name: string;
  impact?: string;
}

export interface Incident {
  id: number;
  title: string;
  state: string;
  startedAt: number;
  endedAt: number | null;
  url: string;
  monitors: AffectedMonitor[];
  latestUpdate?: { state: string; comment: string; timestamp: number } | null;
}

export interface Maintenance {
  id: number;
  title: string;
  description: string | null;
  status: 'SCHEDULED' | 'READY' | 'ONGOING';
  startedAt: number;
  endedAt: number;
  url: string;
  monitors: AffectedMonitor[];
}

export interface StatusData {
  generatedAt: number;
  stale: boolean;
  timezone: string;
  page: { title: string; header: string; subheader: string | null; logo: string | null };
  summary: { status: SummaryStatus; operational: number; total: number };
  monitors: PublicMonitor[];
  incidents: Incident[];
  maintenances: Maintenance[];
  warnings?: Array<{ code: string; endpoint: string }>;
}

export interface HistoryDay {
  date: string;
  status: ServiceStatus;
  uptime: number | null;
  averageLatency: number | null;
}

export interface HistoryData {
  generatedAt: number;
  stale: boolean;
  tag: string;
  days: number;
  uptime: number | null;
  history: HistoryDay[];
}

export interface IncidentComment {
  id: number;
  state: string;
  comment: string;
  timestamp: number;
}

export interface IncidentDetail {
  generatedAt: number;
  stale: boolean;
  incident: Incident;
  comments: IncidentComment[];
}
